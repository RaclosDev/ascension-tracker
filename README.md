# Ascension Tracker

Aplicación web de entrenamiento y nutrición, desarrollada como proyecto personal full-stack. Permite registrar sesiones, consultar progresos y llevar un diario de alimentación. Interfaz en español y soporte de instalación como PWA.

[Aplicación](https://ascension.raclos.es) · [CI](https://github.com/RaclosDev/ascension-tracker/actions) · [Seguridad](SECURITY.md)

![CI](https://github.com/RaclosDev/ascension-tracker/actions/workflows/ci.yml/badge.svg)

## Qué puedes probar

- Entrenamientos con series, variantes de ejercicio, plantillas e historial.
- Diario nutricional, alimentos guardados, recetas y búsqueda en catálogos externos.
- Evolución de peso y pasos, objetivos y calculadoras.
- Asistencia nutricional con Gemini y notificaciones de descanso, cuando sus servicios están configurados.

El acceso utiliza Google. Las estimaciones generadas por IA requieren revisión del usuario.

## Capturas

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Panel de progreso" width="32%">
  <img src="docs/screenshots/workout.png" alt="Registro de entrenamiento" width="32%">
  <img src="docs/screenshots/nutrition.png" alt="Diario nutricional" width="32%">
</p>

## Arquitectura

| Capa | Implementación |
| --- | --- |
| Interfaz | React 19, TypeScript, Vite y Tailwind CSS |
| Datos del cliente | TanStack Query para consultas; Zustand e IndexedDB para estado de entrenamiento |
| API | Java 17 y Spring Boot 4.1 |
| Persistencia | PostgreSQL, JPA y migraciones Flyway |
| Autenticación | Identidad Google validada en backend, JWT y refresh token en cookie HttpOnly |
| Integraciones | Gemini, OpenFoodFacts, FatSecret y Web Push |

El backend organiza controladores, servicios, repositorios y DTOs. Las migraciones viven en `backend/src/main/resources/db/migration` y son la fuente de verdad del esquema.

Decisiones y límites relevantes:

- `Persistable` evita determinadas consultas previas a insertar entidades con identificador asignado. Las consultas de lectura y sus relaciones requieren su propia estrategia de carga.
- El rate limiting en memoria limita solicitudes por instancia; un despliegue con varias réplicas necesitaría coordinación de límites.
- La persistencia local protege el estado del entrenamiento, pero no supone que todas las operaciones de la aplicación funcionen sin conexión.
- Los E2E usan respuestas de API simuladas. Complementan las pruebas de integración del backend, no verifican las integraciones externas reales.

## Ejecutar con Docker Compose

Requisitos: Git, Docker con Compose y un cliente OAuth de Google configurado para el origen local.

```bash
git clone https://github.com/RaclosDev/ascension-tracker.git
cd ascension-tracker
cp .env.example .env
# Completar las variables antes de continuar.
docker compose up --build
```

En PowerShell, usa `Copy-Item .env.example .env`.

Configura `POSTGRES_PASSWORD`, `JWT_SECRET` (al menos 32 bytes), `APP_PII_SALT`, `GOOGLE_CLIENT_ID` y `VITE_GOOGLE_CLIENT_ID`. Ambos identificadores de Google corresponden al mismo cliente. Registra `http://localhost:3000` como origen autorizado. Mantén `VITE_API_URL` vacío para usar el proxy del frontend.

Las claves de Gemini, FatSecret y VAPID habilitan sus respectivas funciones. Sustituye los valores de ejemplo por credenciales válidas; si no usas una integración, deja sus campos vacíos. No subas `.env` al repositorio.

Abre [localhost:3000](http://localhost:3000). Nginx sirve la interfaz y redirige `/api/` al backend. El contenedor backend no publica el puerto 8080 en el host. PostgreSQL solo publica su puerto en la interfaz local.

Compose es una configuración de desarrollo local. Un despliegue público requiere HTTPS y configuración de secretos, cookies, orígenes y proxies adecuada a su infraestructura.

## Desarrollo sin contenedores de aplicación

Necesitas Java 17, Node.js 22 y PostgreSQL 16. Configura las variables del backend en su proceso: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `APP_PII_SALT` y `GOOGLE_CLIENT_ID`. Spring no carga automáticamente el `.env` de Compose.

```bash
cd backend
./mvnw spring-boot:run
```

En Windows usa `mvnw.cmd`. En otra terminal:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

El `.env` del frontend contiene el origen del backend en `VITE_API_URL` (por ejemplo, `http://localhost:8080`, sin `/api`) y el identificador público de Google. Autoriza también `http://localhost:5173` en Google para este flujo.

## Verificación

```bash
cd backend
./mvnw -B verify
```

Los tests de integración requieren Docker para Testcontainers.

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
npx playwright test --config playwright.production.config.ts
```

Los umbrales y presupuestos están en [CONSTRAINTS.md](CONSTRAINTS.md). Las revisiones y sus limitaciones están en [docs/audits](docs/audits). Los checks de GitHub deben consultarse para conocer el estado de una revisión concreta.

El endpoint `/api/version` conserva el identificador de arranque en `version` y añade `commit`. Configura `APP_BUILD_COMMIT` en el despliegue o habilita `HEROKU_SLUG_COMMIT`; si falta, devuelve `unknown`.

## Licencia

[MIT](LICENSE). Proyecto de [RaclosDev](https://github.com/RaclosDev).
