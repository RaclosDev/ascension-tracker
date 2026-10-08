<p align="center">
  <img src="frontend/public/ascension-title.png" alt="Ascension Tracker" width="480">
</p>

<p align="center">
  <b>Progressive Web App (PWA) Full-Stack de fitness y nutrición con integración profunda de IA (Visión y Texto), temporizadores Push y sincronización biométrica.</b>
</p>

<p align="center">
  <img alt="CI" src="https://github.com/RaclosDev/ascension-tracker/actions/workflows/ci.yml/badge.svg">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg">
  <img alt="Java 17" src="https://img.shields.io/badge/Java-17-orange.svg">
  <img alt="Spring Boot 3.3" src="https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F.svg">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6.svg">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-5A0FC8.svg">
  <img alt="Testcontainers" src="https://img.shields.io/badge/Testing-Testcontainers-2496ED.svg">
</p>

## 🚀 El Proyecto (Elevator Pitch)

**Ascension** no es otro clásico tracker de fitness; es una **Progressive Web App (PWA) de nivel producción** diseñada para resolver el problema del seguimiento físico unificando entrenamientos, nutrición biométrica y asistencia por Inteligencia Artificial en una sola plataforma en la nube.

Desarrollada íntegramente como proyecto de portafolio, la aplicación demuestra un dominio Full-Stack moderno mediante arquitecturas resilientes:
- **Resiliencia Frontend:** Experiencia Offline-Ready gestionada por `Workbox` (estrategia NetworkFirst), sincronización de estado local con `Zustand` + `IndexedDB` y notificaciones **Web Push** nativas.
- **Robustez Backend:** Arquitectura Spring Boot 3.3 con DTOs inyectados vía `MapStruct`, mitigación de ataques DDoS y OOM mediante un Rate Limiter en memoria (`Caffeine`), y erradicación del problema N+1 de Hibernate utilizando la interfaz `Persistable<String>`.
- **IA y APIs Integradas:** Orquestación nativa de la API de **Google Gemini** (Vision y Texto) para actuar como copiloto nutricional, escáner de códigos de barras, y proxy seguro (HMAC-SHA1) contra el catálogo de *FatSecret Platform*.

*(Nota: Interfaz, comentarios, parseo de fechas y locale configurados estrictamente en Español `es-ES`).*

---

## ✨ Funcionalidades Core

### 🏋️ Motor de Entrenamientos
- **Tracking Avanzado:** Registro en tiempo real de series, repeticiones, peso y tipo (calentamiento, dropset, fallo).
- **Temporizador en Segundo Plano:** El Service Worker dispara notificaciones Web Push de "Descanso Terminado" (con vibración rítmica) incluso si el móvil está bloqueado o navegando en otra app.
- **Gestión Visual:** Reordenamiento mediante *Drag & Drop* (`@hello-pangea/dnd`), creación de plantillas personalizadas y mapa de calor interactivo (`react-body-highlighter`) para visualizar el desgaste muscular acumulado.
- **Migración de Datos:** Parseador de CSV integrado (`papaparse`) para importar historiales antiguos desde apps como Hevy.

### 🍎 Nutrición Asistida
- **Buscador Híbrido:** Unifica el catálogo global de OpenFoodFacts y FatSecret en una sola barra de búsqueda veloz.
- **Lector de Código de Barras:** Integración de la cámara del dispositivo (`html5-qrcode`) para encontrar productos al instante.
- **FoodAI (Copiloto):** Sácale una foto a una etiqueta nutricional o al plato de comida; Gemini Vision procesará la imagen, calculará las porciones y las añadirá automáticamente a tus macros del día.
- **Personalización:** Creación de Recetas complejas, Alimentos Guardados y partición dinámica de comidas (Desayuno, Almuerzo, Pre-entreno, etc.).

### 📈 Biometría y Hábito
- **Tracking Diario:** Registro de peso corporal, porcentaje de grasa y recuento de pasos.
- **Dashboard Analítico:** Gráficas vectoriales interactivas (`Recharts`) para el seguimiento de la ingesta calórica semanal y promedios de peso.

---

## 🛠 Arquitectura y Retos Técnicos Superados

Esta aplicación ha sido refactorizada repetidamente para cumplir con los estándares de revisión de código *Senior*:

1. **Optimización de Base de Datos (JPA + Flyway):**
   - 16 migraciones controladas para inyectar índices compuestos estratégicos en PostgreSQL, asegurando búsquedas en `O(log N)` en tablas de alto volumen.
   - Entidades UUID mapeadas con `Persistable<String>` y una flag `@Transient isNew` para evitar los costosos `SELECT` previos al `INSERT` masivo de Hibernate.

2. **Seguridad y Rate Limiting:**
   - La API pública está protegida por un interceptor de `Caffeine` (Límite de peticiones/minuto por IP) configurado con un límite estricto de tamaño (`maximumSize(10_000)`) para prevenir ataques de agotamiento de RAM (OOM).
   - Autenticación delegada en Google (OAuth2 ID Tokens) verificada criptográficamente en backend. Emisión de JWT propios (HS256) de vida corta junto con refresh tokens hasheados en DB.

3. **Infraestructura CI/CD y Testing:**
   - **GitHub Actions:** Pipeline completo que verifica el *build*, el linter y los tests en cada PR a `main`. Emplea un sistema de caché avanzado (`actions/cache@v4`) para retener dependencias de Maven y los pesados binarios del navegador de Playwright.
   - **Integración con Testcontainers:** Levanta una base de datos PostgreSQL real efímera dentro de Docker durante el paso de Testing (`mvn test`) para garantizar que las queries nativas son 100% compatibles.
   - **Docker Layered Jars:** El `Dockerfile` utiliza el extractor `layertools` nativo de Spring Boot 3.3. Separa las dependencias de Maven del código fuente en capas distintas, logrando que los despliegues iterativos reconstruyan la imagen en menos de 2 segundos.

4. **Calidad Frontend:**
   - **TypeScript Strict Mode:** `"noImplicitAny": true` habilitado tras una reestructuración exhaustiva de los AST. Cero vulnerabilidades de tipado en eventos del DOM.
   - Rendimiento optimizado extrayendo la pesada lógica táctil (`onTouchMove`) de las listas de ejercicios a Custom Hooks puros (`useSwipe`), impidiendo re-renders masivos del Virtual DOM.

---

## 🧰 Stack Tecnológico Completo

### Frontend (`/frontend`)

| Capa | Tecnología |
|---|---|
| **Core** | React 19 + TypeScript + Vite |
| **PWA** | `vite-plugin-pwa` + Workbox (`injectManifest`) |
| **Estilos & UI** | Tailwind CSS v4, Radix UI, `class-variance-authority`, `tailwind-merge` |
| **Gestión de Estado** | Zustand (Store reactivo) + TanStack Query v5 (Data Fetching / Caché) |
| **Routing & Gráficas** | React Router v7, Recharts |
| **Librerías Clave** | `@hello-pangea/dnd`, `html5-qrcode`, `date-fns`, `papaparse`, `jwt-decode`, `@react-oauth/google` |
| **Control de Calidad** | ESLint 9, Prettier, Husky + lint-staged (Git Hooks automáticos), Playwright |

### Backend (`/backend`)

| Capa | Tecnología |
|---|---|
| **Core** | Java 17 + Spring Boot 3.3 |
| **Base de Datos** | PostgreSQL 16 (Prod) / H2 (Dev) |
| **Persistencia** | Spring Data JPA + Hibernate + Flyway |
| **Seguridad** | Spring Security, OAuth2 Resource Server (JWT propio), `google-api-client` |
| **Rendimiento** | Caché en memoria con `Caffeine`, Compresión GZIP nativa, MapStruct (DTO mapping) |
| **IA & Externa** | Google Gemini API (Visión/Chat), FatSecret Platform (OAuth 1.0a HMAC-SHA1 proxy) |
| **Push Notifications** | Web Push (`web-push`) + BouncyCastle Cryptography (`bcprov-jdk18on`) |
| **Testing** | JUnit 5 + Testcontainers |

---

## 📁 Estructura del Proyecto

```text
ascension-tracker/
├── backend/
│   ├── src/main/java/com/ascension/
│   │   ├── config/       # Seguridad, CORS, beans de configuración
│   │   ├── controller/   # API REST Endpoints
│   │   ├── dto/          # Objetos de Transferencia de Datos
│   │   ├── exception/    # GlobalExceptionHandler (@ControllerAdvice)
│   │   ├── model/        # Entidades JPA
│   │   └── service/      # Lógica de Negocio (AI, Workout, Nutrition)
│   ├── src/main/resources/db/migration/ # 16+ Migraciones SQL Flyway
│   ├── src/test/java/    # Tests de integración con Testcontainers
│   └── pom.xml           # Configuración de Maven
├── frontend/
│   ├── src/
│   │   ├── api/          # Cliente Axios Interceptors
│   │   ├── components/   # Sistema de Diseño UI
│   │   ├── hooks/        # Lógica pura abstraída (useSwipe, useNow)
│   │   ├── lib/          # Zustand store y tipos globales
│   │   └── pages/        # Vistas de Enrutado
│   ├── sw.ts             # Service Worker nativo (Workbox + Push Events)
│   └── package.json      # Configuración de Vite y dependencias
├── docker-compose.yml    # Orquestación de contenedores (Local/Prod)
├── Dockerfile            # Construcción Monolítica (Frontend embebido + Layered Jar)
└── .github/workflows/ci.yml # Pipeline de Integración Continua
```

---

## 🚀 Puesta en Marcha

### Opción A — Docker Compose (Recomendada)

Ideal para despliegues rápidos o para probar el sistema sin instalar Java/Node.

```bash
git clone https://github.com/RaclosDev/ascension-tracker.git
cd ascension-tracker
cp .env.example .env  # Rellena tus API keys
docker-compose up --build
```
- **Aplicación:** [http://localhost:3000](http://localhost:3000)
- **Documentación API:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Opción B — Desarrollo Manual

**Backend:** Usa el perfil `dev`, que levanta una base de datos H2 en memoria automáticamente, o configúralo contra tu propio clúster PostgreSQL.
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Disponible en [http://localhost:5173](http://localhost:5173) (con proxy a `localhost:8080` para `/api`).

---

## 🔑 Variables de Entorno (.env)

| Variable | Descripción |
|---|---|
| `POSTGRES_DB/USER/PASSWORD` | Credenciales de la BD usadas por Docker |
| `JWT_SECRET` | Secreto fuerte (min. 32 chars) para firmar tus tokens |
| `GOOGLE_CLIENT_ID` | OAuth Client ID para el login de Google |
| `FATSECRET_CLIENT_ID / SECRET` | Credenciales API de FatSecret |
| `GEMINI_API_KEY` | Clave API de Google AI Studio |
| `VAPID_PUBLIC_KEY / PRIVATE_KEY` | Claves para notificaciones Web Push (`npx web-push generate-vapid-keys`) |
| `CORS_ALLOWED_ORIGINS` | Orígenes habilitados (ej: `http://localhost:5173`) |

---

## 📄 Licencia

Este proyecto está bajo licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

Desarrollado por [RaclosDev](https://github.com/RaclosDev).
