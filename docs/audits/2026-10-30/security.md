# Auditoría de seguridad: Ascension Tracker

- Commit auditado: `331033d` (main, "build(backend): migrate to Spring Boot 4.1.2 (#139)").
- Alcance: `backend/` (Spring Boot 4.1.2, Spring Security 7, spring-web 7.0.10, Tomcat 11.0.27), `frontend/` (React + Vite, Vercel), CI, historial de git, despliegue en producción (solo peticiones de lectura y una petición de refresh con cookie inventada).
- Auditoría de solo lectura: no se ha modificado ningún fichero versionado. Se generaron `backend/target/` y `frontend/node_modules/`, ambos ignorados por git.

## Modelo de amenazas (resumen)

- Actores: usuario anónimo, cualquier usuario con una cuenta de Google (el alta es libre), atacante con un token robado, contenido de terceros (OpenFoodFacts, FatSecret, Gemini).
- Fronteras de confianza: navegador → Vercel (`/api` reescrito) → router de Heroku → Spring; Spring → Google (verificación de ID token), Gemini, FatSecret, OpenFoodFacts y servicios Web Push; salida del modelo → BD y DOM.
- Activos: datos de salud y nutrición (PII sensible), refresh token (cookie HttpOnly), `JWT_SECRET`, claves VAPID, cuota de pago de Gemini.

## Comprobaciones de herramientas

| Herramienta | Resultado |
|---|---|
| `npm ci --ignore-scripts` + `npm audit --omit=dev` (frontend) | `found 0 vulnerabilities` (el árbol completo, con dependencias de desarrollo, tiene 4 de severidad baja) |
| `aquasec/trivy:0.66.0 fs --severity CRITICAL,HIGH --ignore-unfixed --ignorefile .trivyignore backend` | `pom.xml: 0`, con el aviso `[pom] Dependency version cannot be determined. Child dependencies will not be found.` (cobertura parcial, ver hallazgo 12) |
| Trivy `rootfs` sobre el jar compilado (`backend/target/ascension-api-1.0.0.jar`, mismas opciones) | `ascension-api-1.0.0.jar: 0` |
| Búsqueda de secretos en `git log --all -p` (patrones AIza, GOCSPX, claves PEM, ghp_, AKIA, URLs postgres con contraseña, asignaciones `*_SECRET=`/`*_KEY=`) | Solo aparecen los valores de `backend/src/test/resources/application.properties` (hallazgo 4) y marcadores de ejemplo. Nunca se ha versionado ningún `.env`, `.pem`, `.p12` ni `.jks`. |
| Sondeo de producción sin autenticar (`/v3/api-docs`, `/swagger-ui/index.html`, `/actuator/health`, `/api/food-external/search`, `/.well-known/oauth-protected-resource` en Heroku) | Todas las rutas devuelven `401` |
| `POST /api/auth/refresh` con `Origin: https://evil.example` | `403` (la comprobación de Origin funciona en producción); el preflight CORS desde ese origen también devuelve `403` |

---

## Hallazgos

### 1. [Media] El límite de 5 MB para JSON se salta con `Content-Type: application/*+json`

- **Evidencia:**
  - `backend/src/main/java/com/ascension/filter/JsonSizeLimitFilter.java:26`: el límite solo se aplica si `contentType.toLowerCase().contains("application/json")`.
  - El conversor de Jackson de spring-web 7.0.10 acepta también `application/*+json`. Bytecode de `JacksonJsonHttpMessageConverter.<clinit>` (`javap -c`): `DEFAULT_JSON_MIME_TYPES = { MediaType.APPLICATION_JSON, new MediaType("application", "*+json") }`.
  - Ningún controlador declara `consumes`, así que todos los `@RequestBody` aceptan, por ejemplo, `application/x+json` o `application/merge-patch+json`. Con esos tipos el cuerpo se lee sin `LimitedServletInputStream` y Tomcat no pone ningún límite a un POST que no sea de formulario.
  - `/api/auth/login` (`AuthController.java:103-104`, `@RequestBody Map<String,String>`) está en la cadena `permitAll` (`SecurityConfig.java:100-103`), así que el cuerpo se deserializa sin autenticación. Solo lo frena el límite de 20 peticiones por minuto e IP del interceptor.
- **Impacto:** denegación de servicio por agotamiento de memoria del dyno. Con unas pocas IPs basta para enviar cuerpos de cientos de MB contra el host de Heroku directamente (`ascension-backend-7dd8e6190a75.herokuapp.com`, que es público y aparece en la CSP). No se ha reproducido contra producción para no degradar el servicio. La evidencia es estática: el código del filtro más el bytecode del conversor.
- **Corrección:** aplicar el límite a cualquier cuerpo, sea cual sea su `Content-Type`. Envolver siempre el `InputStream` en `POST`/`PUT`/`PATCH` y rechazar con 413 todo `Content-Length` superior al límite. Si se quiere filtrar por tipo, usar `MediaType.parseMediaType(ct)` y comprobar `isCompatibleWith(APPLICATION_JSON) || getSubtype().endsWith("+json")`. Como segunda barrera, declarar `consumes = MediaType.APPLICATION_JSON_VALUE` en los endpoints de escritura. Añadir un test que envíe `application/x+json` de más de 5 MB y espere 413.

### 2. [Baja] La gracia de rotación del refresh token permite reutilizarlo sin límite durante 30 s (`graceUsed` nunca se lee)

- **Evidencia:** `backend/src/main/java/com/ascension/service/RefreshTokenService.java:86-93`. Si un token ya rotado se presenta dentro de `refresh-grace-seconds` (30 s según `application.yml:87`), se pone `setGraceUsed(true)` y se emite **otro token nuevo de la misma familia**. `graceUsed` solo se escribe (`RefreshToken.java:36,78`; `grep graceUsed` no encuentra ninguna lectura). Por eso el mismo token antiguo puede canjearse N veces dentro de la ventana, y cada canje abre una rama válida de la familia.
- **Impacto:** quien robe un refresh token recién rotado (por ejemplo, de un proxy o de un log) obtiene una sesión paralela que la detección de reutilización no ve. La detección solo salta pasados los 30 s.
- **Corrección:** el patrón estándar (Auth0 y Okta, "refresh token rotation with leeway") consiste en guardar el sucesor emitido y devolver **ese mismo** sucesor durante la gracia, sin crear uno nuevo. Como mínimo, si `graceUsed` ya es `true`, revocar la familia. Bajar la gracia a 5-10 s.

### 3. [Baja] Sin caducidad absoluta de la sesión de refresh

- **Evidencia:** `RefreshTokenService.java:35` y `:102`. Cada rotación crea un token con `Instant.now() + 30 días` en la misma familia, y la cookie lleva `maxAge` de 30 días (`AuthController.java:307`). No existe ningún `family_created_at` ni un tope absoluto.
- **Impacto:** una familia robada y usada al menos una vez al mes no caduca nunca.
- **Corrección:** guardar `family_created_at` (en una migración Flyway nueva) y no emitir sucesores más allá de un máximo absoluto, por ejemplo 90 días. Al llegar al tope, pedir un nuevo inicio de sesión con Google.

### 4. [Baja] Par de claves VAPID real y secreto JWT versionados en los recursos de test

- **Evidencia:** `backend/src/test/resources/application.properties:1` (`JWT_SECRET=c8f5e1a3…`, introducido en `af1787b`) y `:4-5` (`VAPID_PUBLIC_KEY=BHMyLLMj…`, `VAPID_PRIVATE_KEY=FtbnxpVolL1s8…`, presentes desde el commit inicial `f19c0cc`). El par VAPID es un par P-256 válido, no un marcador.
- **Impacto:** si producción usa ese mismo par VAPID, cualquiera puede firmar notificaciones push para las suscripciones de la app (aunque necesitaría además los endpoints). El secreto JWT de test pasa el validador de entropía (`SecurityConfig.java:58-76`); si alguien lo copiara a un entorno real, permitiría forjar tokens. No se ha podido comprobar si coincide con producción porque `/api/push/vapid-key` requiere autenticación.
- **Corrección:** comparar con `heroku config:get VAPID_PUBLIC_KEY`. Si coincide, rotar el par (los usuarios tendrán que volver a suscribirse) y considerar comprometido el valor histórico. En los tests, generar las claves en tiempo de ejecución (`Utils.generateKeyPair` o un `@DynamicPropertySource`) y usar un `JWT_SECRET` aleatorio por ejecución. Añadir `gitleaks` (o `trufflehog`) como paso de CI.

### 5. [Baja] DOMPurify con la configuración por defecto sobre la salida del modelo

- **Evidencia:** `frontend/src/components/utilities/AiNutritionChef.tsx:44-70`. Las respuestas de Gemini (`msg.text`, línea 186) se transforman con expresiones regulares a HTML y se insertan con `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(...) }}` sin opciones. La configuración por defecto de DOMPurify 3.4.17 (versión instalada según `package-lock.json:5859`) permite `<a href>`, `<img>`, `<form>`, `<input>`, `<button>` y atributos `style`.
- **Impacto:** no hay ejecución de scripts. Pero una inyección de prompt (por ejemplo, un texto escondido en la foto de una etiqueta) puede pintar enlaces o formularios de phishing dentro de la interfaz de confianza. La CSP (`img-src` y `form-action 'self'`) reduce el riesgo de exfiltración, pero no evita los enlaces.
- **Corrección:** `DOMPurify.sanitize(html, { ALLOWED_TAGS: ['strong', 'em'], ALLOWED_ATTR: [] })` o, mejor, dejar de usar `dangerouslySetInnerHTML` y construir nodos React (`<strong>` y `<em>`) a partir de los tokens de Markdown, o usar `react-markdown` con `skipHtml`.

### 6. [Baja] Inyección en logs y datos sensibles en logs

- **Evidencia:**
  - `AuthController.java:246` y `:349` registran la cabecera `Origin` sin sanear (`log.warn("Forbidden Origin header ...: {}", request.getHeader("Origin"))`). Un CR/LF en la cabecera permite falsificar líneas de log.
  - `PushNotificationService.java:225, 228, 230, 233, 238 y 240` registran la URL completa del endpoint push, que funciona como URL de capacidad.
  - `OpenFoodFactsClient.java:57, 82` y `GeminiApiClient.java:353` registran cuerpos completos de respuestas de terceros.
- **Impacto:** se pueden falsificar o confundir trazas de seguridad, y aumenta lo que queda expuesto si se filtran los logs.
- **Corrección:** usar un encoder JSON estructurado (`logstash-logback-encoder`), que escapa los saltos de línea, o sanear con `replaceAll("[\\r\\n]", "_")` y truncar la cabecera. Registrar solo el host del endpoint push (o un hash) y truncar los cuerpos de terceros (por ejemplo, a 500 caracteres).

### 7. [Baja] Borrado de cuenta sin reautenticación

- **Evidencia:** `AuthController.java:392-404`. `DELETE /api/auth/account` borra todos los datos con solo un access token válido (15 min, `application.yml:85`).
- **Impacto:** un access token robado, por XSS o por un dispositivo desbloqueado, basta para una acción irreversible.
- **Corrección:** exigir en la petición un ID token de Google recién emitido (verificado con `GoogleIdTokenVerifier` y con `iat` de menos de 5 minutos) cuyo `sub` coincida con el `google_sub` guardado, o un paso de confirmación equivalente.

### 8. [Baja] Los mensajes de `IllegalArgumentException` se devuelven tal cual al cliente

- **Evidencia:** `GlobalExceptionHandler.java:88-94` devuelve `ex.getMessage()` de cualquier `IllegalArgumentException`, incluidas las de librerías. Ejemplo: `Base64.getDecoder().decode(...)` en `GeminiAiService.java:70` y `:265` lanza `IllegalArgumentException("Illegal base64 character …")`, que acaba en la respuesta.
- **Impacto:** fuga menor de detalles internos (mensajes del JDK o de librerías, y potencialmente nombres de clase).
- **Corrección:** devolver el mensaje solo en las excepciones propias (`InvalidInputException`) y responder con un texto genérico ("Entrada inválida") para `IllegalArgumentException`, dejando el detalle en el log junto al `trace_id`.

### 9. [Baja] La salida del modelo se persiste sin límite de elementos ni de longitud

- **Evidencia:** `service/ai/AiJsonParser.java:33-47` recorre el array completo que devuelve Gemini y copia `product` sin truncar. Después, `GeminiAiService.java:148-151` guarda cada elemento con `addFoodLog`. En cambio, `/assistant-apply` limita a 50 elementos y 255 caracteres (`AiApplyRequestDTO.java:30,45`). La columna `product` es `varchar(255)` (`V1__init_schema.sql:20`).
- **Impacto:** una respuesta manipulada mediante inyección de prompt (solo afecta a los datos del propio usuario) puede crear cientos de registros hasta agotar la cuota de datos, o fallar con `DataIntegrityViolationException` después de haber pagado la llamada y con escrituras parciales.
- **Corrección:** limitar el array a 50 elementos, truncar `product` a 255 caracteres y validar cada DTO con el mismo `Validator` de Bean Validation que usa `/assistant-apply`. Hacer el guardado en una sola transacción.

### 10. [Baja] Diez cuentas pueden agotar la cuota global de IA

- **Evidencia:** `service/ai/GeminiQuotaService.java:18-21`: 50 consultas por usuario y día, 500 globales, contadores en memoria (`:31`). El alta está abierta a cualquier cuenta de Google.
- **Impacto:** con 10 cuentas gratuitas se deja la IA sin servicio para todos los usuarios durante el resto del día. Además, los contadores se reinician con cada reinicio del dyno.
- **Corrección:** guardar los contadores en la BD (o en Redis), reservar parte de la cuota global para usuarios con antigüedad o actividad, y alertar al llegar al 80 %. Si la app es de uso personal o cerrado, añadir una lista de cuentas permitidas en el login.

### 11. [Baja] CSP: script en línea bloqueado y `style-src 'unsafe-inline'`

- **Evidencia:** `frontend/index.html:24` contiene un `<script>` en línea (precarga del color del tema), y el HTML servido en producción también lo incluye (`grep -n "<script"` en la respuesta de `https://ascension.raclos.es/` → línea 24). La CSP servida (`script-src 'self' https://accounts.google.com`, sin hash ni nonce) lo bloquea. `style-src` incluye `'unsafe-inline'` (`scripts/csp-policy.json`).
- **Impacto:** el script no se ejecuta en producción (fallo funcional, con parpadeo del tema), lo que invita a relajar la CSP con `'unsafe-inline'`. Además, `'unsafe-inline'` en estilos facilita la inyección de CSS si algún día aparece una inyección de HTML.
- **Corrección:** mover el script a `/public/theme-init.js` (igual que `pwa-recovery.js`) o añadir su `'sha256-…'` en `csp-policy.json`. Medir si `'unsafe-inline'` en estilos sigue siendo necesario (atributos `style` de React y el botón de Google Identity Services) y, si es posible, pasar a hashes o nonces o a `style-src-attr`. Opcional: añadir `require-trusted-types-for 'script'` y `Cross-Origin-Opener-Policy: same-origin-allow-popups`.

### 12. [Baja] El escaneo Trivy `fs` del backend en CI tiene cobertura incompleta

- **Evidencia:** `.github/workflows/ci.yml:86-95` (`scan-type: fs`, `scan-ref: backend`). La ejecución local con la misma versión e idénticas opciones muestra `WARN [pom] Dependency version cannot be determined. Child dependencies will not be found.`. En modo `fs`, Trivy analiza `pom.xml` pero no los `.jar`. El escaneo de la imagen (`:102-110`) solo se ejecuta si cambian los ficheros de imagen.
- **Impacto:** una CVE en una dependencia transitiva puede pasar el CI cuando el Dockerfile no cambia.
- **Corrección:** escanear el artefacto compilado (`trivy rootfs backend/target` después de `mvn verify`) o generar un SBOM con `cyclonedx-maven-plugin` y ejecutar `trivy sbom`. Hoy el jar sale limpio (0 vulnerabilidades CRITICAL/HIGH).

### 13. [Baja] La conexión a Postgres en producción no fuerza TLS

- **Evidencia:** `backend/src/main/resources/application-prod.yml:7`: `jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}` sin `sslmode`. Por defecto, pgjdbc usa `prefer`: cifra si el servidor lo ofrece, pero no exige TLS ni verifica el certificado.
- **Impacto:** si la ruta hasta la BD lo permite, es posible un ataque de degradación o MITM.
- **Corrección:** añadir `?sslmode=require` (lo que recomienda Heroku Postgres) o `sslmode=verify-full&sslrootcert=…` si el proveedor publica su CA.

### 14. [Baja] La cookie de refresh usa `SameSite=Lax` cuando `Strict` es viable

- **Evidencia:** respuesta de producción a `POST /api/auth/refresh` con una cookie inventada: `Set-Cookie: refreshToken=; Path=/api/auth; …; Secure; HttpOnly; SameSite=Lax`. El frontend llama a `/api` en su mismo origen a través de la reescritura de Vercel (`frontend/vercel.json`, `src/api/client.ts:4-7`).
- **Impacto:** bajo, porque `/refresh` y `/logout` validan Origin/Referer (`AuthController.java:203-222`, verificado: `Origin: https://evil.example` → 403). `Strict` añade defensa en profundidad.
- **Corrección:** `COOKIE_SAME_SITE=Strict` en Heroku (el flujo es same-origin y no depende de navegaciones entre sitios).

---

## Alertas CodeQL abiertas (`gh api …/code-scanning/alerts?state=open`)

| # | Regla | Ubicación | Veredicto |
|---|---|---|---|
| 5 | `java/spring-disabled-csrf-protection` | `SecurityConfig.java:133` (cadena `/api/**`) | **Falso positivo.** La cadena es un resource server sin estado (`SessionCreationPolicy.STATELESS`, línea 134) que autentica solo con `Authorization: Bearer`. El navegador no adjunta esa cabecera en una petición entre sitios, y la cookie de refresh tiene `Path=/api/auth`, así que no llega a estas rutas. |
| 4 | `java/spring-disabled-csrf-protection` | `SecurityConfig.java:119` (cadena `/.well-known/**`) | **Falso positivo.** La cadena aplica `denyAll()` (línea 121): no hay ninguna operación que pueda falsificarse. |
| 2 | `java/spring-disabled-csrf-protection` | `SecurityConfig.java:102` (cadena `/api/auth/login, refresh, logout, config`) | **Riesgo real mitigado.** `/refresh` y `/logout` sí usan una cookie, así que el CSRF aplica. Lo cubren: comprobación de Origin con Referer como respaldo contra una lista permitida (`AuthController.java:203-222`, rechaza si no hay ninguna de las dos cabeceras), `SameSite=Lax`, y que `/refresh` devuelve el token en el cuerpo, que un origen ajeno no puede leer por CORS. `/login` exige JSON, lo que fuerza un preflight CORS, y un ID token de Google. Verificado en producción: Origin ajeno → 403. Recomendación: descartar como "Won't fix" con este texto: *"CSRF de Spring desactivado a propósito: /refresh y /logout validan Origin/Referer contra CORS_ALLOWED_ORIGINS (AuthController#isOriginAllowed); la cookie es HttpOnly, Secure, SameSite=Lax con Path=/api/auth; /login requiere application/json (preflight) y un ID token de Google. Cubierto por tests de AuthController."* Como alternativa estándar, Spring Security 7 permite `csrf(csrf -> csrf.spa())` con cookie y cabecera `X-XSRF-TOKEN` solo en esta cadena, pero no aporta mucho frente a la comprobación de Origin actual. |
| 1 | `java/xss` | `FoodExternalController.java:33-35` (`/barcode`) | **Falso positivo en la práctica, pero conviene arreglarlo.** La respuesta se sirve con `Content-Type: application/json` y `X-Content-Type-Options: nosniff`, el endpoint exige Bearer (no se puede provocar con una navegación), `code` debe cumplir `^\d{6,14}$` (`OpenFoodFactsClient.java:73`) y la CSP de la API es `default-src 'self'`. Aun así, `searchBarcode` reenvía el cuerpo de OpenFoodFacts **sin parsear** (`OpenFoodFactsClient.java:88`). Esta es la ruta contaminada que ve CodeQL, y la cabecera puesta como texto (`.header("Content-Type", …)`) no la reconoce como sanitizador. Corrección: parsear con `objectMapper.readTree(response.getBody())`, devolver `ResponseEntity<JsonNode>` y declarar `@GetMapping(value = "/barcode", produces = MediaType.APPLICATION_JSON_VALUE)` o `.contentType(MediaType.APPLICATION_JSON)`. Así se valida el JSON y la alerta se cierra sola. Si se prefiere no tocar el código, texto para descartarla: *"False positive: respuesta application/json con nosniff, endpoint con autenticación Bearer, parámetro validado con ^\d{6,14}$; no se renderiza como HTML."* |

## Riesgos no confirmados (requieren datos de producción)

- **Clave del rate limit por IP detrás de Vercel:** `RateLimitInterceptor.java:137-148` usa `request.getRemoteAddr()` para login y refresh. Con `internal-proxies` limitado a rangos privados (`application.yml:54`), la petición llega por Vercel → router de Heroku, y es posible que la IP resuelta sea la de salida de Vercel. En ese caso, todos los usuarios compartirían un mismo cubo de 20 o 30 peticiones por minuto (DoS del login) y el límite no frenaría a un atacante individual. Para confirmarlo, registrar temporalmente `getRemoteAddr()` y `X-Forwarded-For` en una petición real. Si se confirma, usar la IP de cliente que añade Vercel (`x-real-ip` o `x-vercel-forwarded-for`), aceptándola solo si llega por Vercel. Una forma es exigir un secreto compartido en una cabecera que Vercel añada en la reescritura.

## Lo que ya está bien

- El ID token de Google se verifica con `GoogleIdTokenVerifier` (firma, `iss`, `exp` y `aud` = client id; `GoogleAuthConfig.java:33-35`), se exige `email_verified` y el `sub` queda ligado al email, con detección de direcciones recicladas (`AuthController.java:127-166`).
- El JWT es HS256 con algoritmo fijo (`NimbusJwtDecoder.withSecretKey`), se valida emisor y tiempos, la revocación funciona por `tokens_valid_after` con una caché de 30 s, el secreto se comprueba al arrancar (longitud, marcadores y entropía) y el access token dura 15 minutos.
- Los refresh tokens son aleatorios (UUIDv4 con SecureRandom), se guardan **hasheados** (SHA-256), rotan con bloqueo pesimista (`findByTokenForUpdate`), se revoca la familia completa al detectar reutilización fuera de gracia, y la cookie es `HttpOnly; Secure; Path=/api/auth` (verificado en producción).
- El access token del frontend vive solo en memoria y se eliminan las copias antiguas guardadas en Web Storage. El logout limpia caches, IndexedDB y `localStorage`.
- No hay IDOR: todos los endpoints con id usan `findByIdAndUserEmail` o `deleteByIdAndUserEmail` con el email sacado del JWT, y las altas e importaciones generan UUIDs en el servidor.
- No hay inyección SQL: todo va parametrizado. El único SQL concatenado (`UserOwnedTables.java:49`) usa nombres de tabla constantes.
- Contra SSRF: lista permitida de hosts de push (`PushController.java:89-90`), URLs externas fijas, barcode validado por regex y query codificada con `URLEncoder`. La clave de Gemini va en la cabecera `x-goog-api-key`, no en la URL.
- Validación de imágenes por *magic bytes* (`GeminiAiService.validateAndGetMimeType`), límites de multipart, cuotas de datos por usuario y por restauración, y protección de restauración vacía (`confirmEmpty`).
- La entrada que va al prompt se sanea (`NutritionPromptBuilder.sanitizeUserInput`) y se delimita con `<user_data>`. El modelo no tiene herramientas y su salida solo alcanza los datos del propio usuario.
- La CSP es la misma en Spring, Vercel y nginx (generada desde `scripts/csp-policy.json`), con `frame-ancestors 'none'`, `object-src 'none'`, HSTS, nosniff y Permissions-Policy.
- La CORS usa una lista explícita con credenciales, y `*` está prohibido en el perfil prod (`AppEnvValidator.java:67-68`).
- Swagger, actuator y `/.well-known` devuelven 401 en producción.
- Los emails se seudonimizan en los logs con HMAC (`PiiMasker`).
- Las respuestas de error son genéricas y llevan `trace_id`.
- La imagen Docker corre como usuario no root, Postgres en compose solo escucha en `127.0.0.1`, y CI tiene `permissions: contents: read`, acciones fijadas por SHA, no usa `pull_request_target` y ejecuta Trivy y CodeQL.
- `npm audit --omit=dev`: 0 vulnerabilidades. Trivy sobre el jar: 0 CRITICAL/HIGH.
