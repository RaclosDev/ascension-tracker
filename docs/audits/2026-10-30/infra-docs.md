# Auditoría de CI/CD, infraestructura, higiene del repositorio y documentación

Repositorio `RaclosDev/ascension-tracker`, `main` en `331033d` (Spring Boot 4.1.2, #139). Fecha: 30-oct-2026. Auditoría de solo lectura: no se ha cambiado ningún fichero versionado ni se ha hecho ningún commit (`git status` limpio; `npm ci` y `npm run build` se ejecutaron en `frontend/` y solo generan `node_modules/` y `dist/`, ambos ignorados).

Skills aplicadas: github-actions-review, docker-review, ci-cd-and-automation, shipping-and-launch, documentation-and-adrs.

## Método y límites

- Lectura de `ci.yml`, `codeql.yml`, `dependabot.yml`, Dockerfiles, `docker-compose.yml`, `.dockerignore`, `Procfile`, `system.properties`, `vercel.json`, `nginx.conf`, `application*.yml`, `.husky/`, `.gitignore`, `.git/info/exclude`, `README.md`, `SECURITY.md`, `CONSTRAINTS.md`, `docs/`, `anti-slop/`.
- Prueba del script de detección de cambios con 23 listas de ficheros: `scratchpad/audit2/cd-test.sh` (ruta completa al final).
- `gh api .../branches/main/protection`, `.../rulesets`, `.../deployments` (+ statuses), `.../environments`, `gh run list`, `gh run view 41027542236`.
- `curl` de solo lectura (GET) a `https://ascension.raclos.es/api/version` y al host de Heroku.
- `node scripts/generate-csp.js --check` (CSP sincronizada hoy: OK).
- `npm run build` para medir bundles y precache.
- **No verificable desde aquí:** no hay CLI de Heroku instalada ni acceso al panel de Vercel. Config vars de Heroku (`PROJECT_PATH`, `SPRING_PROFILES_ACTIVE`, versión de Postgres, add-ons, log drains, preboot) y ajustes de Vercel (versión de Node, protección de previews) quedan como "a verificar".

---

## Hallazgos

### 1. [Alta] Heroku (y Vercel) despliegan `main` sin esperar a que pase el CI

- **Evidencia:** deployments de GitHub frente a la ejecución del CI en `main`:
  - `331033d` (migración a Spring Boot 4): deployment `ascension-backend` creado 08:36:19Z, estado `success` 08:37:22Z. El CI de ese push (`41027542236`) empezó 08:36:05Z y terminó 08:39:39Z. Backend en producción **2 min 17 s antes** de que acabase "Backend CI" (que termina 08:39:38Z).
  - `1fdb2f7`: Heroku `success` 08:27:25Z; CI `41026400953` terminó 08:29:27Z. Vercel `Production` creado 08:26:32Z, también antes.
  - El ruleset "Proteger Main" está `enforcement: disabled` y ningún environment (`ascension-backend`, `Production`) tiene reglas de protección (`protection_rules: 0`).
- **Impacto:** un fallo que solo aparece en `main` (p. ej. PR mergeada sin rebase, `strict: false`) llega a producción aunque el CI de `main` falle. La migración a un framework mayor salió a producción sin esa red.
- **Arreglo:** activar "Wait for CI to pass before deploy" en la integración GitHub de Heroku (Deploy → Automatic deploys). Mejor aún, desplegar desde Actions: un job `deploy-backend` con `needs: [backend]`, `if: github.ref == 'refs/heads/main' && needs.changes.outputs.backend == 'true'`, `environment: production` y la Platform API de Heroku (o `git push heroku`), y desactivar el auto-deploy. En Vercel: desactivar el auto-deploy de producción (`git.deploymentEnabled.main: false` en `vercel.json`) y promover con `vercel deploy --prebuilt --prod` desde un job que dependa de "Frontend CI", o al menos usar la Deployment Protection "Require checks".
- **Esfuerzo:** S (activar "Wait for CI"), M (deploy desde Actions).

### 2. [Alta] La detección de cambios falla abierta: si "Detect changes" falla, los checks obligatorios cuentan como superados

- **Evidencia:** protección de `main`: `contexts: ["Backend CI","Frontend CI","Analyze (java-kotlin)","Analyze (javascript-typescript)"]`; "Detect changes" no es obligatorio. `backend` y `frontend` tienen `needs: changes` (`ci.yml:69,115`). Si `changes` falla (p. ej. `git diff` con un SHA base inaccesible, `ci.yml:53`, ejecutado con `bash -e`), los dos jobs quedan `skipped`, y GitHub trata un job omitido como superado a efectos de check obligatorio (el propio comentario de `ci.yml:23-24` lo reconoce). Resultado: PR mergeable con cero verificación.
- **Impacto:** puerta de calidad que se abre justo cuando algo va mal.
- **Arreglo (estándar):** job agregador "CI OK" con `if: always()` y `needs: [changes, backend, frontend]` que falle si algún resultado es `failure` o `cancelled` (patrón `re-actors/alls-green` o un script con `contains(needs.*.result, 'failure')`), y hacer **ese** job el único check obligatorio. Alternativa: añadir "Detect changes" a los obligatorios.
- **Esfuerzo:** S.

### 3. [Alta] No hay health check real, smoke test post-deploy ni plan de rollback

- **Evidencia:** no existe Actuator (`pom.xml` no lo incluye; `GET /actuator/health` en Heroku devuelve 401). El único endpoint público es `/api/version` (`VersionController.java`), que devuelve el **instante de arranque** (`System.currentTimeMillis()`), no la versión ni el commit. Ningún workflow comprueba producción tras el deploy. No hay runbook de rollback. Las migraciones Flyway son solo hacia delante (`V1`–`V28`, `FlywayConfig.java` llama a `migrate()` al arrancar), así que `heroku releases:rollback` tras una migración que cambia el esquema (p. ej. `V28__cascade_user_email_updates.sql`) deja código viejo contra esquema nuevo.
- **Impacto:** un deploy roto se descubre por los usuarios; el rollback se improvisa.
- **Arreglo:** (a) `spring-boot-starter-actuator` con solo `health` (liveness/readiness) expuesto y `management.endpoint.health.probes.enabled=true`; (b) `/api/version` que devuelva `HEROKU_SLUG_COMMIT` (Dyno Metadata) o `git.properties` (`git-commit-id-maven-plugin`) y `build-info`; (c) job post-deploy que haga `curl --retry` a `https://ascension.raclos.es/api/version` y compare el SHA, y a `/actuator/health`; (d) `docs/runbooks/rollback.md`: Vercel "Instant Rollback", `heroku releases:rollback vNN`, regla expand/contract para migraciones (toda migración compatible con la versión anterior del código) y backup previo con `heroku pg:backups:capture`.
- **Esfuerzo:** M.

### 4. [Media] El rate limiting por IP probablemente usa la IP de salida de Vercel, y el backend es accesible sin pasar por Vercel

- **Evidencia:** el login, refresh y auth se limitan por `request.getRemoteAddr()` (`RateLimitInterceptor.java:140,148`), resuelta por `RemoteIpValve` con `internal-proxies` solo de rangos privados (`application.yml:54`). La cadena real es navegador → Vercel (rewrite, `vercel.json:53-56`) → router de Heroku → dyno. La respuesta de `https://ascension.raclos.es/api/version` lleva `Server: Vercel` y `Via: 1.1 heroku-router`, lo que confirma el salto. El router de Heroku añade a `X-Forwarded-For` la IP pública que le conecta (la de Vercel), que no es "interna", así que el valve se detiene ahí. Además el host `ascension-backend-7dd8e6190a75.herokuapp.com` responde 200 directamente y sigue en `connect-src` de la CSP. `README.md:81` recomienda fijar `TOMCAT_INTERNAL_PROXIES=.*`, lo que permitiría falsear la IP enviando `X-Forwarded-For` directamente a Heroku.
- **Impacto:** todos los usuarios que salen por el mismo nodo de Vercel comparten el cubo de 20 logins/min; un atacante puede saltarse Vercel. **Verificar** con un log temporal de `getRemoteAddr()` en producción.
- **Arreglo:** usar la cabecera que Vercel garantiza (`x-vercel-forwarded-for` o `x-real-ip`) solo si viene con un secreto compartido (cabecera `x-ingress-secret` añadida en el rewrite vía Vercel Edge Middleware), y rechazar en el backend las peticiones a `/api/**` sin ese secreto, de modo que Heroku solo acepte tráfico de Vercel. Quitar el host de Heroku de `connect-src` en `scripts/csp-policy.json`. Corregir `README.md:81`.
- **Esfuerzo:** M.

### 5. [Media] Huecos en la detección de cambios (probado con listas de ficheros)

- **Evidencia:** resultado de `cd-test.sh` (réplica exacta de `ci.yml:53-65` para `pull_request`):

  | Ficheros cambiados | backend | frontend | images | Qué se ejecuta de verdad |
  |---|---|---|---|---|
  | `README.md` | false | false | false | nada (correcto) |
  | `backend/src/.../X.java` | true | false | false | backend sin build de imagen |
  | `frontend/src/App.tsx` | false | true | false | frontend sin build de imagen |
  | `backend/pom.xml` | true | false | true | backend + imagen (correcto) |
  | `docker-compose.yml` | false | false | **true** | **nada**: los pasos de imagen viven dentro de jobs omitidos |
  | `scripts/csp-policy.json`, `scripts/generate-csp.js` | false | false | false | nada; `check:csp` no se ejecuta en ningún sitio |
  | `package.json`, `package-lock.json` (raíz), `.husky/*` | false | false | false | nada |
  | `.github/workflows/codeql.yml`, `.github/dependabot.yml` | false | false | false | nada (solo CodeQL) |
  | `.trivyignore`, `.github/workflows/ci.yml` | true | true | true | todo (correcto) |
  | `backend/Procfile`, `backend/system.properties` | true | false | false | backend (bien, pero nada valida el Procfile) |
  | `frontend/vercel.json` | false | true | false | frontend (bien, pero nada valida el JSON ni la CSP) |
  | `docs/backend/pom.xml` | false | false | false | nada (anclas `^` correctas) |

  Además, en PR la imagen solo se construye si cambian ficheros de Docker: un cambio en `backend/src` que rompa el `docker build` (p. ej. un recurso nuevo) solo se detecta en `main` tras el merge. Y en push a `main` la diferencia es contra `github.event.before`, válido mientras no haya force-push (prohibido por la protección).
- **Impacto:** cambios de infraestructura (compose, CSP, hooks) se mergean sin ninguna verificación.
- **Arreglo:** sacar los builds de imagen a un job `images` propio (`if: needs.changes.outputs.images == 'true'`) que ejecute también `docker compose config -q`; añadir un filtro `infra` (`^(scripts/|package(-lock)?\.json|docker-compose\.yml)`) que ejecute `npm run check:csp`. Sustituir el script por `dorny/paths-filter` fijado por SHA, que ya resuelve bases de PR/push y es más legible.
- **Esfuerzo:** S–M.

### 6. [Media] Lo que el CI no comprueba

- **Evidencia y huecos:**
  - **Arranque del backend con perfil `prod`:** la imagen se construye (`ci.yml:97-100`) pero nunca se arranca; los tests usan el perfil por defecto con Testcontainers. Nada prueba que el JAR arranque con `application-prod.yml` (que, por cierto, define la URL con `PGHOST/PGPORT/...`, `application-prod.yml:7-10`) ni que `AppEnvValidator`/`SecurityConfig.validateSecret` acepten la configuración.
  - **Migraciones contra una BD tipo producción:** Testcontainers aplica `V1..V28` sobre una BD vacía `postgres:16-alpine` (`TestcontainersConfiguration.java:14`). No se prueban contra un volcado anonimizado ni contra la versión mayor de Heroku Postgres (no verificada).
  - **E2E contra el build de producción:** Playwright arranca `npm run dev` (`playwright.config.ts:74-78`), no `vite preview` del `dist/` ya construido, así que el service worker, el precache y el code splitting de producción no se prueban. Solo Chromium de escritorio, aunque la app es una PWA móvil.
  - **Rendimiento:** no hay Lighthouse CI ni medición de LCP/CLS/INP; los presupuestos de `CONSTRAINTS.md:28-30` no se miden.
  - **Presupuesto de bundle/precache:** ninguno se comprueba. Medido hoy: `index-*.js` 214,6 kB (69,2 kB gzip), CSS 159,7 kB (25,4 kB gzip), precache 1470 KiB en 40 entradas, el **96 %** del presupuesto de 1,5 MB.
  - **Compose:** nunca se ejecuta `docker compose config` ni `up`.
  - **Cobertura backend:** no hay JaCoCo (`pom.xml` no lo incluye); solo el frontend tiene suelo de cobertura.
- **Arreglo:** job `smoke` que arranque el JAR con `SPRING_PROFILES_ACTIVE=prod` contra un `services: postgres` y haga `curl --retry 10 /api/version`; `size-limit` o un script sobre `dist/` con los presupuestos de `CONSTRAINTS.md`, más el tamaño del precache que imprime `vite-plugin-pwa`; `treosh/lighthouse-ci-action` con `budget.json` sobre `vite preview`; `webServer.command: 'npm run preview'` en CI y un proyecto `Pixel 7`; JaCoCo con `check` y un suelo inicial medido.
- **Esfuerzo:** M.

### 7. [Media] Las previews de Vercel hablan con la API y la BD de producción

- **Evidencia:** `vercel.json:53-56` reescribe `/api/:match*` a Heroku producción sin distinguir entorno; existen deployments `Preview` (p. ej. `9dd8d3a`, 08:23:46Z, `vercel[bot]`).
- **Impacto:** código no revisado de una PR se ejecuta en un dominio `*.vercel.app` contra datos reales. Hoy el refresh fallará por la comprobación de `Origin` (`README.md:90`), pero el login y cualquier escritura con JWT no.
- **Arreglo:** un backend de staging (Heroku app + Postgres `essential-0`) y Vercel Edge Middleware que reescriba según `VERCEL_ENV`; o, como mínimo, activar Vercel Deployment Protection en previews y documentarlo.
- **Esfuerzo:** S (protección) / M (staging).

### 8. [Media] Cada push a `main` reinicia el backend, aunque no cambie, y resetea los contadores en memoria

- **Evidencia:** `232088e` solo cambia `.github/workflows/codeql.yml` (1 fichero) y generó un deployment `ascension-backend` (`7433963485`). Las cuotas de Gemini (`GeminiQuotaService.java:31-34`, `ConcurrentHashMap`/`AtomicInteger`), los cubos de rate limit (Caffeine) y la caché `foodSearch` viven en memoria.
- **Impacto:** el límite global diario de Gemini (500) y los límites por usuario se reinician con cada merge y con el ciclo diario de dynos: el control de coste es más débil de lo que parece. Con más de un dyno, todos los límites se multiplican.
- **Arreglo:** con el deploy desde Actions (hallazgo 1), desplegar el backend solo si `changes.outputs.backend == 'true'`; persistir la cuota diaria de Gemini en Postgres (una fila por día y usuario) y documentar el supuesto de un solo dyno en un ADR.
- **Esfuerzo:** S (filtro) / M (cuota persistente).

### 9. [Media] Variables de entorno: el código lee unas 70 y se documentan unas 16

- **Evidencia (lo que lee el código):**
  - Documentadas en `.env.example`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `FRONTEND_PORT`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `GEMINI_API_KEY`, `CORS_ALLOWED_ORIGINS`, `COOKIE_SAME_SITE`, `APP_PII_SALT`, `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`. El README añade `TOMCAT_INTERNAL_PROXIES`, `JWT_EXPIRATION_MS` y `QUOTA_MAX_*`.
  - **Sin documentar:** `SPRING_PROFILES_ACTIVE` (y su efecto: desactiva Swagger, cambia la fuente del datasource, bloquea `flyway.repair`); `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` (solo en compose); `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` (`application-prod.yml:7-10`); `PORT`; `SPRING_FLYWAY_BASELINE_ON_MIGRATE`; `APP_FLYWAY_REPAIR` (`FlywayConfig.java:17`); `COOKIE_SECURE`; `REFRESH_GRACE_SECONDS`; 12 `RATE_LIMIT_*` (`LOGIN`, `REFRESH`, `LOGOUT`, `IMPORT`, `RESTORE`, `EXPORT`, `USER_WRITE`, `USER`, `AI`, `FOOD_EXTERNAL`, `PUSH`, `GENERAL`); `PUSH_HTTP_TIMEOUT_SEC`, `PUSH_TIMER_POLL_DELAY_MS`; `FATSECRET_`, `GEMINI_` y `GOOGLE_` + `MAX_ATTEMPTS`, `INITIAL_BACKOFF_MS`, `CONNECT_TIMEOUT_MS`, `READ_TIMEOUT_MS` (12); `GEMINI_MODEL`; `APP_GEMINI_FALLBACK_MODELS`, `APP_GEMINI_QUOTA_USER_DAILY_LIMIT`, `APP_GEMINI_QUOTA_GLOBAL_DAILY_LIMIT`, `APP_GEMINI_CIRCUIT_CONSECUTIVE_FAILURES_THRESHOLD`, `APP_GEMINI_CIRCUIT_COOLDOWN_MS`; `JAVA_OPTS` (`Procfile`); `PROJECT_PATH` (subdir buildpack de Heroku, fuera del repo); `CI` (Playwright y `DisabledIfDockerUnavailable`).
  - **Incoherencias:** `COOKIE_SAME_SITE` está en `.env.example:33`, pero `docker-compose.yml:43-56` no lo pasa al backend; el buildpack JVM de Heroku exporta `SPRING_DATASOURCE_*` a partir de `DATABASE_URL`, lo que hace que las `PG*` de `application-prod.yml` sean código muerto o una segunda fuente de verdad (**verificar** las config vars). `frontend/.env.example:2` pone `VITE_API_URL=http://localhost:8080`, que se salta el proxy `/api` de Vite (`vite.config.ts:40-45`) y no reproduce la topología same-origin de producción.
- **Arreglo:** `docs/configuration.md` con una tabla (variable, obligatoria, valor por defecto, entorno: local/compose/Heroku/Vercel, secreto sí/no). Eliminar el bloque `datasource` de `application-prod.yml` y confiar en `SPRING_DATASOURCE_*`. Pasar `COOKIE_SAME_SITE`/`COOKIE_SECURE` en compose. `VITE_API_URL=` vacío en `frontend/.env.example`. Opcional: `@ConfigurationProperties` con `@Validated` para que la lista sea código.
- **Esfuerzo:** M.

### 10. [Media] Sin versionado, releases ni changelog

- **Evidencia:** `git tag` vacío, `gh release list` vacío, `package.json` y `pom.xml` fijos en `1.0.0`, no hay `CHANGELOG.md`. Los commits sí siguen Conventional Commits (`git log`).
- **Impacto:** no hay forma de saber qué versión corre en producción ni de volver a "la última buena" por nombre.
- **Arreglo:** `release-please` (Google), que ya entiende Conventional Commits: abre una PR de release, crea tags `vX.Y.Z` y un `CHANGELOG.md`, y sube la versión en `package.json`/`pom.xml`. Exponer esa versión en `/api/version` (hallazgo 3).
- **Esfuerzo:** S.

### 11. [Media] Observabilidad mínima: sin seguimiento de errores, sin uptime y sin retención de logs documentada

- **Evidencia:** el frontend solo hace `console.error` en `ErrorBoundary.componentDidCatch` (`ErrorBoundary.tsx:34-36`); no hay Sentry, OpenTelemetry ni Micrometer (`git grep` sin resultados en `pom.xml`/`package.json`); el backend escribe a stdout (Logplex de Heroku retiene unas 1500 líneas si no hay drain, **verificar** add-ons); no hay monitor de uptime ni alertas.
- **Arreglo:** Sentry (plan gratuito) en front (`@sentry/react` con source maps subidos en el build) y back (`sentry-spring-boot-starter-jakarta`), con el `PiiMasker` existente como `beforeSend`; un log drain (Papertrail/Better Stack) y un monitor de uptime sobre `/actuator/health/readiness` con alerta por correo; logs JSON (`logging.structured.format.console=ecs`, disponible desde Spring Boot 3.4) con un ID de petición en MDC.
- **Esfuerzo:** M.

### 12. [Media] Protección de rama débil para el flujo que exige `CLAUDE.md`

- **Evidencia:** `enforce_admins: false`, `strict: false`, `required_approving_review_count: 0`, ruleset "Proteger Main" deshabilitado. `CLAUDE.md` (local) dice "Nunca push a `main`", pero el único mantenedor es admin y se salta la protección.
- **Impacto:** la regla depende de la disciplina, no de la plataforma; con `strict: false` una PR verde contra un `main` antiguo puede romper `main` (y hoy eso se despliega, hallazgo 1).
- **Arreglo:** activar `enforce_admins` (o el ruleset sin bypass para admins) y `strict: true`, o usar merge queue. Mantener 0 aprobaciones si se trabaja en solitario.
- **Esfuerzo:** S.

### 13. [Media] `CONSTRAINTS.md` no coincide con la realidad y casi nada se hace cumplir

- **Evidencia:** test count `293+` (real: 318 backend, 167 unitarios y 75 E2E en frontend); los presupuestos de bundle/CWV no se comprueban (hallazgo 6) y su "estado inicial" está obsoleto; la regla de 500 líneas no tiene regla `max-lines` en `eslint.config.js` y 15 ficheros la superan (`history.tsx` 793, `FoodSearchModal.tsx` 777, `active-workout.tsx` 775...); la verificación `git grep 'eslint-disable' frontend/src` devuelve 1 (en un test, `lazyWithRetry.test.tsx:86`), así que no sirve tal cual; "0 warnings críticos" con `mvn compile -q` no se comprueba (no hay `-Werror`). Lista exacta en la sección de documentación.
- **Arreglo:** cada fila con un comando que el CI ejecute: `max-lines` con `warn` y un ratchet, `size-limit`, Lighthouse CI, `-Xlint:all -Werror` progresivo, conteo de tests impreso en el resumen del job (`$GITHUB_STEP_SUMMARY`).
- **Esfuerzo:** M.

### 14. [Baja] Trabajo duplicado, caché y robustez del workflow

- **Evidencia:**
  - El JAR se compila dos veces en el job de backend: `./mvnw -B verify` (71 s) y `docker build` (67 s), que vuelve a descargar dependencias con `mvn dependency:go-offline` sin caché de BuildKit (`backend/Dockerfile:5`).
  - En un acierto de caché, Playwright se salta `npx playwright install --with-deps` (`ci.yml:151-154`), y con él las dependencias del sistema; hoy funciona porque `ubuntu-latest` las trae, pero se romperá al cambiar la imagen del runner.
  - Ningún job tiene `timeout-minutes` (por defecto, 360 min).
  - El reporter de Playwright es `html` y no se sube como artefacto en un fallo.
  - `codeql.yml` no tiene `concurrency` y se ejecuta completo (incluido autobuild Maven) en PRs que solo tocan documentación.
- **Arreglo:** `docker/build-push-action` con `cache-from/cache-to: type=gha` y `load: true`, o un `--mount=type=cache,target=/root/.m2` en el Dockerfile; `npx playwright install-deps chromium` cuando hay acierto de caché (o la imagen `mcr.microsoft.com/playwright:v1.64.1-noble`); `timeout-minutes: 15/20`; `actions/upload-artifact` (por SHA) con `if: failure()` para `playwright-report/`; el mismo bloque `concurrency` en `codeql.yml`.
- **Esfuerzo:** S.

### 15. [Baja] Imágenes Docker: deriva de Maven, healthcheck sin `start-period` y builds no reproducibles

- **Evidencia:** `backend/Dockerfile:2` usa `maven:3.9-...` mientras el wrapper usa Maven 3.10.0 (`maven-wrapper.properties:3`), que es lo que usan CI y Heroku; `HEALTHCHECK` sin `--start-period` ni `--retries` (`backend/Dockerfile:22-23`), con arranque JVM + Flyway; `apk upgrade` (`backend/Dockerfile:12`, `frontend/Dockerfile:16`) hace que el mismo digest produzca imágenes distintas cada vez. Lo bueno: multi-stage, digests fijados, usuario no root (`spring`, uid 101 en nginx), `.dockerignore` excluye `.env*` y `.git`.
- **Arreglo:** construir con `./mvnw` dentro de la imagen (copiar `.mvn/` y `mvnw`) o fijar `maven:3.10`; `HEALTHCHECK --start-period=60s --retries=3`; mantener `apk upgrade`, pero documentar que Dependabot y el escaneo semanal de Trivy son la vía principal de parches.
- **Esfuerzo:** S.

### 16. [Baja] `docker-compose.yml` para self-hosting

- **Evidencia:** `postgres:16-alpine` sin digest y fuera de Dependabot (no hay ecosistema `docker-compose` en `dependabot.yml`); `frontend.depends_on: - backend` sin `condition: service_healthy` (`docker-compose.yml:69-70`); el frontend no tiene healthcheck; `POSTGRES_USER`/`POSTGRES_DB` sin `:?required`; todos los servicios en la red por defecto (el frontend puede llegar a Postgres); el backend no expone puerto (bien), pero el README promete Swagger en `:8080`.
- **Arreglo:** fijar el digest de Postgres y añadir `package-ecosystem: "docker-compose"` en Dependabot; `depends_on: backend: condition: service_healthy`; healthcheck `wget -qO- http://localhost:8080/` en el frontend; redes `frontend`/`backend` separadas; `:?required` en todas las variables obligatorias.
- **Esfuerzo:** S.

### 17. [Baja] La imagen de frontend del CI se construye con una URL de API incorrecta

- **Evidencia:** `ci.yml:163` pasa `--build-arg VITE_API_URL=/api`; `client.ts:4-7` construye `baseURL = \`${baseUrl}/api\``, es decir `/api/api`, y `App.tsx:201` pide `/api/api/auth/config`. Compose usa `""` por defecto (correcto). La imagen escaneada no es la que se usaría.
- **Arreglo:** `--build-arg VITE_API_URL=` (vacío) y, de paso, un `docker run` con `curl` de `/` en el job de imágenes.
- **Esfuerzo:** S.

### 18. [Baja] Cabeceras y caché en nginx: comentario contradictorio y estáticos sin hash cacheados un año

- **Evidencia:** `security-headers.conf:6` dice que las respuestas de `/api/` no se tocan, pero `nginx.conf:34` incluye las cabeceras en `location ^~ /api/`. `nginx.conf:43-47` marca `public, immutable` con `expires 1y` cualquier `.js|.png|.jpg`, incluidos ficheros de `public/` sin hash (`pwa-recovery.js`, `login-bg.jpg`, iconos). Vercel lo hace bien (solo `/assets/`, `vercel.json:43-49`).
- **Arreglo:** restringir la caché inmutable a `location ^~ /assets/` y corregir el comentario (o quitar el `include` de `/api/`).
- **Esfuerzo:** S.

### 19. [Baja] Hooks de Husky lentos y duplicados con el CI

- **Evidencia:** `.husky/pre-push` ejecuta en cada push `./mvnw test-compile test` (318 tests con Testcontainers; 71 s en CI con `verify`) y `lint + typecheck + vitest + build` del frontend (unos 30 s en CI), es decir 2–3 min en local aunque el push solo toque documentación, y duplica "Backend CI" y "Frontend CI" salvo E2E y Trivy. Sin Docker local, `DisabledIfDockerUnavailable` omite en silencio los tests de integración, así que el hook pasa sin haberlos ejecutado. `.husky/pre-commit` ejecuta `mvnw clean compile` (borra `target/` en cada commit con cambios en `backend/`) y `tsc --noEmit` de todo el proyecto. `pre-commit` está en modo `100644` y `pre-push` en `100755` (Husky 9 los invoca con `sh`, funciona igual, pero es incoherente). `npm run test -- --run` pasa `--run` dos veces.
- **Arreglo:** pre-commit: solo `lint-staged` (+ comprobación de mojibake); pre-push: solo las partes con cambios (`git diff --name-only @{u}..`) y sin `clean`; dejar el resto al CI, que ya es obligatorio.
- **Esfuerzo:** S.

### 20. [Baja] Higiene del repositorio: ficheros locales, obsoletos o mal codificados

- **Evidencia:**
  - `HOOKS.md`, `ANTIGRAVITY_HOOKS.md`, `MCP_RECOMMENDATIONS.md` **no** están en `.gitignore`: los excluye `.git/info/exclude` (local, no se comparte). Es intencionado (notas genéricas del agente), pero `HOOKS.md` describe un pre-commit (`npm run build`, `./mvnw clean package`) que no coincide con `.husky/`.
  - `ROADMAP.md` sí está en `.gitignore:21` y está obsoleto: la restauración desde JSON figura como pendiente, pero existe `POST /api/user/restore` (`UserDataExportController.java:46`) y `frontend/tests/backup-restore.spec.ts`.
  - **`CLAUDE.md` también está en `.git/info/exclude`**: las reglas del proyecto (no hacer push a `main`, umbrales de `CONSTRAINTS.md`, comandos de verificación) no viajan con el repo, y los worktrees de agentes no las tienen.
  - `docker-compose.override.yml` (local, ignorado) monta `./seed_local.py`, que no existe en la raíz: `docker compose up` crea un directorio con ese nombre y el seeder falla.
  - `.editorconfig` está en **UTF-16 LE con CRLF** (`file .editorconfig`; git lo trata como binario, `i/-text`): los parsers de EditorConfig esperan UTF-8, así que sus reglas (incluida `end_of_line = lf`) probablemente se ignoran.
  - No hay `.gitattributes` (`backend/mvnw.cmd` es CRLF, el resto LF).
  - No hay `.nvmrc` ni `engines` en `frontend/package.json`: Vercel usa la versión de Node configurada en su panel, no necesariamente la 22 del CI.
- **Arreglo:** versionar `CLAUDE.md` (o `AGENTS.md`) sin datos personales; borrar o actualizar `HOOKS.md` y `ROADMAP.md`, o moverlos a `docs/`; regenerar `.editorconfig` en UTF-8; `.gitattributes` con `* text=auto eol=lf` y `*.cmd eol=crlf`; `"engines": { "node": "22.x" }` y `.nvmrc`; arreglar o borrar el override.
- **Esfuerzo:** S.

### 21. [Baja] Dependabot: una regla obsoleta y un ecosistema sin cubrir

- **Evidencia:** `dependabot.yml:109-111` ignora majors de `org.springframework.security:*`, pero el `pom.xml` no declara ninguna dependencia de Spring Security con versión propia (la gestiona el parent de Spring Boot 4.1.2, que ya trae Security 7): la regla no hace nada y confunde. Falta el ecosistema `docker-compose`.
- **Arreglo:** quitar la regla; añadir `docker-compose` en `/`; ignorar majors de `org.springframework.boot:spring-boot-starter-parent` si se quiere controlar las migraciones mayores a mano.
- **Esfuerzo:** S.

### 22. [Baja] Java 17 en el runtime de producción

- **Evidencia:** `system.properties:1`, `pom.xml:21`, `ci.yml:78`, imágenes `temurin-17`. Spring Boot 4 admite 17, pero recomienda 21 o 25 (LTS); el soporte público gratuito de 17 en varias distribuciones termina antes que el de 21.
- **Arreglo:** ADR y migración a 21 (o 25) en los cuatro sitios a la vez; las virtual threads (`spring.threads.virtual.enabled`) son el beneficio inmediato.
- **Esfuerzo:** S–M.

---

## Afirmaciones de la documentación desactualizadas o falsas

### README.md

| Línea | Dice | Texto correcto |
|---|---|---|
| 24 | "Experiencia Offline-Ready gestionada por `Workbox` (estrategia NetworkFirst)" | "Service worker propio (`vite-plugin-pwa`, `injectManifest`): precache de la app, `NetworkOnly` para navegaciones y `StaleWhileRevalidate` para recursos en tiempo de ejecución (`frontend/src/sw.ts`)." |
| 25 | "mitigación de ataques DDoS mediante un Rate Limiter en memoria (`Caffeine`)" | "Rate limiting por IP y por usuario en memoria (Bucket4j + Caffeine), por instancia. No protege frente a DDoS." |
| 25 | "erradicación del problema N+1 de Hibernate utilizando la interfaz `Persistable<String>`" | "`Persistable<String>` evita el `SELECT` previo a cada `INSERT`; el N+1 se mitiga con `hibernate.default_batch_fetch_size: 200`." |
| 74 | "18 migraciones controladas (ej. `V18__...`)" | "28 migraciones Flyway (`V1`–`V28`)". |
| 81 | "*Vercel:* ... ajustar `TOMCAT_INTERNAL_PROXIES` ... o fijar `.*`" | "*Vercel:* la API se sirve a través del rewrite `/api/*` de `frontend/vercel.json` hacia Heroku. No uses `.*`: el host de Heroku es público y cualquiera podría falsear `X-Forwarded-For` (ver hallazgo 4)." |
| 90 | (no menciona la ruta de la cookie) | Añadir: "La cookie de refresh es `HttpOnly` con `Path=/api/auth`; el JWT de acceso (15 min) vive solo en memoria." |
| 93 | "Pipeline completo que verifica el build, el linter y los tests en cada PR a `main`. Emplea ... (`actions/cache@v4`) para ... Maven y ... Playwright." | "CI con detección de cambios: los jobs Backend CI y Frontend CI solo se ejecutan si cambia su carpeta (o `ci.yml`/`.trivyignore`). Backend: `./mvnw -B verify` + Trivy. Frontend: `npm audit --omit=dev`, lint, typecheck, Vitest con cobertura mínima, build, Playwright (Chromium) y Trivy de imagen. CodeQL (Java y TS) en cada PR. Caché de Maven vía `setup-java` y de Playwright vía `actions/cache` v6, todas las acciones fijadas por SHA." |
| 94 | "durante el paso de Testing (`mvn test`)" / "(`V1`..`V24`)" | "durante `./mvnw -B verify`" / "(`V1`..`V28`)". |
| 96 | "orquestados con Docker Compose y probados en CI" | "Las imágenes se construyen y escanean con Trivy en CI (en PR solo si cambian ficheros de Docker; siempre en `main` y cada lunes). No se arrancan en CI. Producción no las usa: Vercel y Heroku compilan desde el código." |
| 113 | "Zustand (IndexDB Persist)" | "Zustand (persistencia en IndexedDB con `idb-keyval`)". |
| 122 | "PostgreSQL 16" | "PostgreSQL 16 en local y tests; producción en Heroku Postgres (versión: **verificar** con `heroku pg:info`)". |
| 127 | "JUnit 5 + Mockito" | "JUnit Jupiter 6 (6.0.3, gestionado por Spring Boot 4.1.2) + Mockito". |
| 135 | "Ideal para despliegues locales rápidos o producción." | "Para ejecutar todo en local o en un servidor propio. La producción oficial es Vercel (frontend) + Heroku (backend y Postgres)." |
| 140 | "`cp .env.example .env  # Rellena tus API keys`" | "Obligatorias: `POSTGRES_PASSWORD` y `JWT_SECRET` (compose falla con `:?required`), y un `GOOGLE_CLIENT_ID` real (el backend no arranca con el de ejemplo si no es válido para el login). Gemini, FatSecret y VAPID son opcionales." |
| 141 | "`docker-compose up --build`" | "`docker compose up --build`" (Compose v2). |
| 144 | "**API Swagger:** http://localhost:8080/swagger-ui.html" | Quitar. El backend de compose no publica el puerto 8080 y la imagen arranca con `SPRING_PROFILES_ACTIVE=prod`, que desactiva springdoc. Swagger solo existe en desarrollo manual (perfil por defecto): `http://localhost:8080/swagger-ui.html`. |
| 151 | "`./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`" | No existe `application-dev.yml`. Texto: "`docker compose up -d postgres` y, con `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET` (≥32 bytes) y `GOOGLE_CLIENT_ID` exportadas (Spring no lee `.env`), `./mvnw spring-boot:run`." |
| 157 | "`npm install`" | "`npm ci` (y `npm ci` en la raíz para instalar los hooks de Husky). Deja `VITE_API_URL` vacío: Vite hace proxy de `/api` a `localhost:8080`." |
| — | (no hay sección de despliegue) | Falta: Vercel con root `frontend/` y rewrite `/api`, Heroku `ascension-backend` con subdir buildpack (`PROJECT_PATH=backend`), `Procfile`, `system.properties`, Heroku Postgres, auto-deploy desde `main`. |
| — | (no hay números de tests) | "Backend: 318 tests (JUnit + Testcontainers). Frontend: 167 tests unitarios (Vitest) y 75 E2E (Playwright)." |

### CONSTRAINTS.md

| Línea | Dice | Texto correcto |
|---|---|---|
| 13 | Verificación `git grep 'eslint-disable' frontend/src` → 0 | Devuelve 1 (`frontend/src/test/lazyWithRetry.test.tsx:86`). Usar `git grep -n 'eslint-disable' -- frontend/src ':!frontend/src/test' ':!*.test.*'`. |
| 15 | "0 warnings críticos" con `mvn compile -q` | "`./mvnw -B verify`. No hay control automático de warnings (no hay `-Werror`)." |
| 25 | Estado inicial "~453 KB sin comprimir (~130 KB gzip)" | "Medido el 30-oct-2026: 214,6 kB (69,2 kB gzip). No se comprueba en CI." |
| 26 | "~163 KB sin comprimir (~28 KB gzip)" | "159,7 kB (25,4 kB gzip)". |
| 27 | Precache "> 2.5 MB" | "1470 KiB en 40 entradas (96 % del presupuesto). No se comprueba en CI." |
| 28-30 | LCP/CLS/INP "Controlado" / "Variable" | "Sin medir: no hay Lighthouse CI ni RUM." |
| 36 | "Ningún nuevo componente ... superar las 500 líneas" | Añadir: "15 ficheros ya lo superan (p. ej. `history.tsx` 793). Sin regla ESLint `max-lines` que lo haga cumplir." |
| 39 | "Los 293+ tests unitarios y de integración" | "Los 318 tests del backend (`./mvnw -B verify`)". Añadir: "Frontend: 167 tests unitarios (Vitest) y 75 E2E (Playwright)". |
| 40 | "`tsc --noEmit` obligatoria en cada Pull Request" | "En cada PR que toque `frontend/`, `ci.yml` o `.trivyignore`". |

### SECURITY.md

| Línea | Dice | Texto correcto |
|---|---|---|
| 44 | "Modelos Soportados" | "Versiones soportadas". |
| 52 | Correo `raclosdev@gmail.com` | Confirmar que es el buzón vigente. Añadir el canal estándar: GitHub Private Vulnerability Reporting (Settings → Security). |
| 63 | "Access Token (JWT): Firmado en HMAC-SHA256" | Añadir: "Caduca a los 15 minutos (`JWT_EXPIRATION_MS=900000`)". |
| 64 | "cookie `HttpOnly`, `Secure` y `SameSite`" | "`HttpOnly`, `SameSite=Lax` por defecto y `Path=/api/auth`. `Secure` se activa si la petición llega por HTTPS (`X-Forwarded-Proto`), con `SameSite=None` o con `COOKIE_SECURE=true`; en `http://localhost` no." |
| — | (no lo menciona) | "Rotación del refresh token en cada uso; si se reutiliza uno ya rotado, se revoca toda su familia (`family_id`, V20)." y "En producción el navegador llega a la API a través del rewrite same-origin de Vercel (`/api/*`)." |

### Otros ficheros

| Fichero:línea | Dice | Texto correcto |
|---|---|---|
| `frontend/.env.example:2` | `VITE_API_URL=http://localhost:8080` | `VITE_API_URL=` (vacío, usa el proxy de Vite). |
| `.env.example:33` | `COOKIE_SAME_SITE=Lax` | Correcto, pero compose no lo pasa: añadirlo a `docker-compose.yml` o anotar "solo desarrollo manual/Heroku". |
| `backend/src/main/resources/application-prod.yml:7-10` | datasource con `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD` | Quitar: en Heroku el buildpack exporta `SPRING_DATASOURCE_*` y en compose se pasan explícitamente. |
| `frontend/security-headers.conf:6` | "Las respuestas de /api/ las firma Spring Security, no se tocan aquí" | Falso: `nginx.conf:34` las incluye en `/api/`. Quitar el include o corregir el comentario. |
| `.github/workflows/ci.yml:23-24` | "Un job omitido ... cuenta como superado ... siguen siendo obligatorios" | Cierto, pero oculta el fallo abierto del hallazgo 2. |
| `.github/dependabot.yml:109-111` | ignore de majors de `org.springframework.security:*` | Regla sin efecto con Spring Boot 4: quitarla. |
| `anti-slop/audit-001-2026-10-30-seguimiento.md:33` | "En el backend, 304 tests en verde" | Histórico (correcto el 30-oct antes de #139). Hoy: 318. Añadir una nota, sin reescribir el informe. |
| `anti-slop/audit-001-2026-10-30-seguimiento.md:37` | "`lazyWithRetry.ts` tiene un `eslint-disable`" | Resuelto: `lazyWithRetry.ts` ya no lo tiene; queda uno en `frontend/src/test/lazyWithRetry.test.tsx:86`. |
| `ROADMAP.md` (local, ignorado) | Restauración desde JSON "Próximas Funcionalidades" | Hecho: `POST /api/user/restore` y `tests/backup-restore.spec.ts`. |
| `HOOKS.md` (local, excluido) | pre-commit con `npm run build` y `./mvnw clean package` | Lo real está en `.husky/pre-commit` y `.husky/pre-push` (hallazgo 19). |
| `docs/screenshots/*.png` | Capturas del 13-oct (`83e8ac2`) | Anteriores a la auditoría antislop (#137: KPI, iconos, encabezados): regenerarlas (la suite `mobile-capture.spec.ts` puede hacerlo). |

---

## README objetivo (secciones)

1. **Ascension Tracker**: una frase de qué es y para quién, la URL de producción y los badges (CI, CodeQL, licencia).
2. **Capturas** (actualizadas).
3. **Funcionalidades**: lista breve, sin superlativos.
4. **Arquitectura en un vistazo**: diagrama navegador → Vercel (estáticos + rewrite `/api`) → Heroku (Spring Boot 4.1.2, Java 17) → Heroku Postgres; servicios externos (Google Sign-In, Gemini, FatSecret, OpenFoodFacts, Web Push). Enlace a `docs/architecture.md` y a los ADR.
5. **Stack**: tabla con versiones reales (React 19, Vite 8, TS 5.9, Spring Boot 4.1.2, Spring Framework 7, Hibernate 7.4, Flyway 12, JUnit Jupiter 6, Postgres 16).
6. **Puesta en marcha local**: requisitos (JDK 17, Node 22, Docker); opción A, compose (variables obligatorias, URL); opción B, manual (Postgres en compose, variables exportadas, `./mvnw spring-boot:run`, `npm ci && npm run dev` con proxy). Enlace a `docs/configuration.md`.
7. **Comandos**: tabla con `./mvnw -B verify`, `npm run lint`, `typecheck`, `test`, `test:coverage`, `test:e2e`, `build`, `npm run check:csp`/`sync:csp`.
8. **Tests**: qué hay (318 / 167 / 75) y cómo se ejecutan; Testcontainers necesita Docker.
9. **CI/CD**: qué hace cada job, la detección de cambios, los checks obligatorios y cómo despliega cada plataforma. Enlace a `docs/deployment.md`.
10. **Seguridad**: resumen de 4 líneas (JWT de 15 min en memoria, cookie `HttpOnly` con `Path=/api/auth`, CSP con una sola fuente) y enlace a `SECURITY.md`.
11. **Contribuir**: ramas, Conventional Commits, hooks de Husky, plantilla de PR. Enlace a `CONTRIBUTING.md`.
12. **Licencia**.

## Documentos que faltan

- `docs/architecture.md`: componentes, flujo de autenticación (Google ID token → JWT de 15 min + refresh por cookie), flujo de la PWA y del SW, rewrite de Vercel, límites en memoria y supuesto de un solo dyno.
- `docs/configuration.md`: tabla completa de variables (hallazgo 9).
- `docs/deployment.md`: Vercel (root `frontend/`, `ignoreCommand`, cabeceras, rewrite), Heroku (subdir buildpack + `PROJECT_PATH`, `Procfile`, `system.properties`, Postgres, backups `pg:backups:schedule`), auto-deploy y su relación con el CI, rotación de secretos.
- `docs/runbooks/rollback.md` y `docs/runbooks/incident.md`: rollback en Vercel/Heroku, migraciones expand/contract, restaurar un backup de Postgres, qué mirar primero.
- `CONTRIBUTING.md`: flujo de ramas, checks obligatorios, hooks, cómo ejecutar E2E, regla de no editar migraciones aplicadas.
- `CHANGELOG.md` (generado con release-please).
- `docs/decisions/` (no hay convención previa; usar `docs/decisions/NNNN-titulo.md` con Estado, Fecha, Contexto, Decisión, Alternativas y Consecuencias):
  - 0001 Migración a Spring Boot 4.1 / Spring Framework 7 / Jackson 3 (y por qué se desactivan `fail-on-null-for-primitives` y `fail-on-trailing-tokens`).
  - 0002 JWT de 15 min en memoria + refresh token rotado en cookie `HttpOnly` con `Path=/api/auth` y comprobación de `Origin` (frente a `localStorage` o BFF).
  - 0003 Usuarios identificados por email con FKs `ON UPDATE CASCADE` y `sub` de Google como identidad estable (V21, V28).
  - 0004 API same-origin a través del rewrite de Vercel (frente a CORS directo a Heroku) y sus consecuencias para la IP del cliente.
  - 0005 Rate limiting, cuotas y quota de Gemini en memoria con un solo dyno.
  - 0006 Flyway al arrancar la aplicación (frente a una fase `release` de Heroku) y política de migraciones solo hacia delante.
  - 0007 Una sola fuente para la CSP (`scripts/csp-policy.json` → nginx, Vercel y `SecurityConfig`).
  - 0008 Estrategia del service worker (`injectManifest`, `NetworkOnly` en navegación) y presupuesto de precache.
  - 0009 Producción en Vercel + Heroku y Docker solo para self-hosting.

## Lo que ya está bien (para no tocarlo)

- Todas las acciones fijadas por SHA con comentario de versión; Dependabot de `github-actions` mantiene los SHA.
- `permissions: contents: read` global; CodeQL solo añade `security-events: write` a nivel de job.
- `concurrency` que cancela solo en PR, nunca en `main`.
- Trivy en dependencias Maven y en ambas imágenes, con `.trivyignore` que exige fecha de caducidad; escaneo semanal programado.
- Imágenes base fijadas por digest, multi-stage, no root, `.dockerignore` correctos, Postgres publicado solo en `127.0.0.1`.
- Testcontainers obligatorio en CI (`DisabledIfDockerUnavailable` falla si `CI=true` y no hay Docker).
- Suelo de cobertura del frontend con ratchet documentado.
- CSP con una sola fuente y comprobador (`check:csp` pasa hoy).
- Validación de secretos al arrancar (`SecurityConfig.validateSecret`, `AppEnvValidator`).

---

Script de prueba de la detección de cambios: `C:/Users/raclo/AppData/Local/Temp/claude/C--Users-raclo--gemini-antigravity-scratch-ascension-tracker/286d1d60-b679-4064-9fce-f94b5f542f50/scratchpad/audit2/cd-test.sh`
