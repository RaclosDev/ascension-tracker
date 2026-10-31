# Desarrollo y pruebas

## Requisitos

- Docker con Compose para el entorno completo y para los tests de integración con Testcontainers.
- Java 17 y Node.js 22 si ejecutas backend/frontend fuera de sus contenedores. El repositorio incluye Maven Wrapper.
- Un cliente OAuth de Google de tipo aplicación web. Autoriza el origen del frontend: `http://localhost:3000` con Compose o `http://localhost:5173` con Vite.

## Configuración con Compose

Copia `.env.example` a `.env` y completa los valores obligatorios. Los archivos `.env` están excluidos de Git; los ejemplos no contienen secretos.

| Variable | Uso |
| --- | --- |
| `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` | Credenciales de la base local; configura una contraseña propia |
| `JWT_SECRET` | Firma HS256; al menos 32 bytes |
| `APP_PII_SALT` | Secreto para enmascarar datos personales en logs |
| `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` | Mismo identificador OAuth, validado por backend y utilizado por frontend |
| `VITE_API_URL` | Vacío en Compose para usar el proxy `/api` de Nginx |
| `CORS_ALLOWED_ORIGINS` | Orígenes autorizados, separados por comas; los valores locales están en el ejemplo |
| `GEMINI_API_KEY` | Opcional; habilita las funciones de IA |
| `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET` | Opcionales; configura ambas para utilizar FatSecret |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Opcionales; configura el par de claves y un contacto propio para Web Push |

Puedes generar secretos con `openssl rand -base64 48`. Para VAPID: `npx web-push generate-vapid-keys`. No reutilices el mismo secreto para JWT y enmascarado de logs.

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`. El backend solo es accesible por la red interna de Compose; PostgreSQL publica el puerto configurado en `127.0.0.1`. Los datos permanecen en el volumen `postgres_data` al parar los contenedores.

Las variables `VITE_*` se incorporan al build del frontend: cambiar `.env` requiere reconstruir su imagen. No uses `docker compose down -v` salvo que quieras borrar los datos locales.

## Desarrollo con recarga en caliente

Puedes ejecutar únicamente la base con `docker compose up -d postgres` y lanzar ambos procesos en terminales separadas. Configura las variables siguientes en el entorno del proceso Java o en la configuración de ejecución de tu IDE:

```dotenv
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ascension_db
SPRING_DATASOURCE_USERNAME=ascension
SPRING_DATASOURCE_PASSWORD=<la contraseña de tu base local>
JWT_SECRET=<tu secreto de al menos 32 bytes>
APP_PII_SALT=<tu secreto de enmascarado>
GOOGLE_CLIENT_ID=<tu cliente OAuth>
CORS_ALLOWED_ORIGINS=http://localhost:5173
FATSECRET_CLIENT_ID=
FATSECRET_CLIENT_SECRET=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
GEMINI_API_KEY=
```

Ajusta host, puerto y nombre de base si cambiaste los valores de Compose. **Spring no carga automáticamente el `.env` de la raíz.** Las propiedades de FatSecret y VAPID referencian variables de entorno: defínelas vacías si no utilizas esas integraciones.

```bash
cd backend
./mvnw spring-boot:run
```

En Windows usa `.\mvnw.cmd spring-boot:run`. En otra terminal, desde la raíz:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Configura `VITE_GOOGLE_CLIENT_ID` y `VITE_API_URL=http://localhost:8080` en `frontend/.env`. La URL es el origen del backend, sin añadir `/api`. En PowerShell usa `Copy-Item` para copiar el ejemplo.

Para instalar los hooks del repositorio, ejecuta también `npm ci` desde la raíz. Las dependencias de raíz son herramientas de desarrollo, no dependencias de la aplicación.

## Verificación

Desde `backend/`, con Docker disponible:

```bash
./mvnw -B verify
```

Desde `frontend/`:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run check:csp
npm run build
npm run check:budgets
npx playwright install chromium
npm run test:e2e
npx playwright test --config playwright.production.config.ts
```

En Linux, Playwright puede requerir `npx playwright install --with-deps chromium`. Ejecuta las dos suites Playwright de forma secuencial: comparten el directorio de resultados. La suite `production` comprueba el build local con `vite preview`, no el despliegue público.

Referencia local del 31 de octubre de 2026, anterior a la limpieza documental:

| Comprobación | Resultado |
| --- | --- |
| Maven verify | 411 tests; cero fallos, errores u omitidos |
| Vitest | 297 tests en 66 suites; verdes |
| Cobertura frontend | Statements 42%; branches 32,5%; functions 31,65%; lines 42,46% |
| Playwright | 87 casos Chromium y 2 casos del build en escritorio/móvil |

La ejecución local de Maven usó JDK 21 con compilación objetivo 17; CI está configurada con JDK 17. Estos resultados son una referencia fechada, no una promesa sobre futuros commits. El estado de una revisión publicada debe comprobarse en GitHub Actions. Las APIs externas están simuladas en los E2E; PostgreSQL sí es real en los tests de integración.

## Despliegue y diagnóstico

Compose está preparado para desarrollo local. Para un despliegue público configura HTTPS, secretos, orígenes permitidos y proxies de confianza. El perfil `prod` desactiva Swagger/OpenAPI. La política de cookies depende de HTTPS y de `COOKIE_SAME_SITE`/`COOKIE_SECURE`; revisa [SECURITY.md](../SECURITY.md).

`GET /api/version` devuelve `version` (identificador de arranque) y `commit`. Configura `APP_BUILD_COMMIT` para identificar el código desplegado; también admite `HEROKU_SLUG_COMMIT` y, si ambos faltan, devuelve `unknown`.

Flyway aplica las migraciones al arrancar y Hibernate valida el esquema. No edites migraciones ya aplicadas: añade otra. Los cambios de contratos entre frontend/backend deben desplegarse de forma coordinada.

Problemas frecuentes:

- **OAuth no permite entrar:** comprueba que ambos client IDs coinciden y que Google tiene autorizado exactamente el origen y puerto que utilizas.
- **El backend no arranca con push:** deja ambas claves vacías o configura un par válido; claves ficticias o parciales se rechazan.
- **Falta una variable al iniciar con Maven:** exporta las variables en esa terminal o configúralas en el IDE; el `.env` de Compose no se hereda.
- **No pasan los tests de integración:** comprueba que Docker está ejecutándose y accesible. Una suite con tests omitidos no equivale a la verificación completa.
- **Una integración opcional falla:** comprueba sus credenciales y cuotas; el arranque de la aplicación no valida una llamada real a cada proveedor.
