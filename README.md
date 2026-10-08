<p align="center">
  <img src="frontend/public/ascension-title.png" alt="Ascension Tracker" width="480">
</p>

<p align="center">
  <b>Progressive Web App (PWA) Full-Stack de fitness y nutrición con integración profunda de IA (Visión y Texto), temporizadores Push y biometría avanzada.</b>
</p>

<p align="center">
  <img alt="CI" src="https://github.com/RaclosDev/ascension-tracker/actions/workflows/ci.yml/badge.svg">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-blue.svg">
  <img alt="Java 17" src="https://img.shields.io/badge/Java-17-orange.svg">
  <img alt="Spring Boot 3.3" src="https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F.svg">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6.svg">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-5A0FC8.svg">
</p>

## 🚀 El Proyecto (Elevator Pitch)

**Ascension** no es otro clásico tracker de fitness; es una **Progressive Web App (PWA) de nivel producción** diseñada para resolver el problema del seguimiento físico unificando entrenamientos paramétricos, nutrición biométrica y asistencia por Inteligencia Artificial en una sola plataforma en la nube.

Desarrollada íntegramente como proyecto de portafolio, la aplicación demuestra un dominio Full-Stack moderno mediante arquitecturas resilientes:
- **Resiliencia Frontend:** Experiencia Offline-Ready gestionada por `Workbox` (estrategia NetworkFirst), sincronización de estado local ultrarrápida con `Zustand` + `IndexedDB` y notificaciones **Web Push** nativas.
- **Robustez Backend:** Arquitectura Spring Boot 3.3, mitigación de ataques DDoS mediante un Rate Limiter en memoria (`Caffeine`), mapeo seguro de DTOs (`MapStruct`) y erradicación del problema N+1 de Hibernate utilizando la interfaz `Persistable<String>`.
- **IA y APIs Integradas:** Orquestación nativa de la API de **Google Gemini** (Visión, OCR y Texto) para actuar como copiloto nutricional, y un proxy backend seguro (HMAC-SHA1) para consumir el catálogo de *FatSecret Platform*.

*(Nota: UI, parseo de fechas y locale configurados estrictamente en Español `es-ES`).*

---

## ✨ Funcionalidades Avanzadas (Core)

Lo que diferencia a Ascension de otras aplicaciones comerciales es su nivel extremo de detalle paramétrico y su UX orientada a atletas avanzados:

### 🏋️ Motor de Entrenamientos y Variantes
- **Micro-Variaciones (El factor diferencial):** A diferencia de otras apps, Ascension separa el historial y los Récords Personales (PRs) no solo por ejercicio, sino por **Máquina** (Polea, Smith, Libre) y **Agarre** (Prono, Supino, Neutro). *Un Press de Banca en Multipower se rastrea independientemente de un Press con Mancuernas.*
- **Tipos de Serie Complejos:** Soporte nativo para series de *Calentamiento* (ignoradas en el volumen total), *Dropsets*, *Al Fallo* y series cardiovasculares (Distancia y Duración).
- **Temporizador Background Push:** El Service Worker dispara notificaciones Web Push de "Descanso Terminado" (con vibración rítmica) que despiertan tu móvil incluso si está bloqueado o estás navegando en otra app.
- **Gestión Visual:** Reordenamiento mediante *Drag & Drop* (`@hello-pangea/dnd`), creación de plantillas personalizadas y mapa de calor interactivo (`react-body-highlighter`) para visualizar el desgaste muscular acumulado.
- **Migración de Datos:** Parseador de CSV integrado (`papaparse`) para importar historiales antiguos desde apps como Hevy.

### 🍎 Nutrición Asistida (FoodAI Copilot)
- **Análisis Multi-modal con IA:** Sácale una foto a una etiqueta nutricional o al plato de comida; Gemini Vision procesará la imagen mediante OCR e inferencia, calculará las porciones y las añadirá automáticamente a tus macros del día.
- **Buscador Híbrido:** Unifica el catálogo global de OpenFoodFacts y FatSecret en una sola barra de búsqueda veloz.
- **Lector de Código de Barras:** Integración de la cámara del dispositivo (`html5-qrcode`) para escanear productos físicos.
- **Configuración Biométrica:** Partición dinámica de comidas (Desayuno, Almuerzo, Pre-entreno, etc.) donde cada comida tiene su propia configuración de macros (`proteinPct`, `fixedCarbs`, horarios).

### 📈 Analítica Biométrica
- **Motor de Deltas Reales:** No solo anotas el peso; el sistema calcula variaciones de peso, pasos diarios y calorías, agrupándolas en promedios semanales para ajustar automáticamente tu TDEE (Gasto Energético Diario).
- **Dashboard Vectorial:** Gráficas interactivas renderizadas con `Recharts` para auditar tendencias de macronutrientes a lo largo de los meses.

---

## 🛠 Arquitectura y Retos Técnicos Superados

Esta aplicación ha sido refactorizada repetidamente bajo estrictos estándares de ingeniería de software:

1. **Optimización de Base de Datos (JPA + Flyway):**
   - 16 migraciones controladas (ej. `V11__migrate_to_base_exercises.sql`) que normalizan el catálogo de ejercicios e inyectan índices compuestos estratégicos en PostgreSQL, asegurando búsquedas en `O(log N)` en historiales de alto volumen.
   - Entidades UUID mapeadas con `Persistable<String>` y una flag `@Transient isNew` para evitar los costosos `SELECT` previos al `INSERT` masivo de Hibernate.

2. **Seguridad y Rate Limiting:**
   - La API pública está protegida por un interceptor de `Caffeine` configurado con un límite estricto de tamaño (`maximumSize(10_000)`) para prevenir ataques de agotamiento de RAM (OOM) por escaneo de IPs.
   - Autenticación delegada en Google (OAuth2 ID Tokens) verificada criptográficamente en backend. Emisión de JWT propios (HS256) de vida corta junto con refresh tokens hasheados.

3. **Infraestructura CI/CD y Testing:**
   - **GitHub Actions:** Pipeline completo que verifica el *build*, el linter y los tests en cada PR a `main`. Emplea un sistema de caché avanzado (`actions/cache@v4`) para retener dependencias de Maven y los binarios del navegador de Playwright.
   - **Integración con Testcontainers:** Levanta una base de datos PostgreSQL real efímera dentro de Docker durante el paso de Testing (`mvn test`) para garantizar que las queries nativas son 100% compatibles.
   - **Docker Layered Jars:** El `Dockerfile` utiliza el extractor `layertools` nativo de Spring Boot 3.3. Separa las dependencias de Maven del código fuente en capas distintas, logrando despliegues ultrarrápidos.

4. **Calidad Frontend:**
   - **TypeScript Strict Mode:** `"noImplicitAny": true` habilitado tras una inyección de tipos en todo el AST del proyecto. Cero vulnerabilidades de tipado en variables de estado.
   - Rendimiento optimizado extrayendo la pesada lógica de eventos táctiles (`onTouchMove`) de las listas de ejercicios a Custom Hooks puros (`useSwipe`), bloqueando el *leak* de memoria en el Virtual DOM de React.

---

## 🧰 Stack Tecnológico Completo

### Frontend (`/frontend`)

| Capa | Tecnología |
|---|---|
| **Core** | React 19 + TypeScript + Vite |
| **PWA** | `vite-plugin-pwa` + Workbox (`injectManifest`) |
| **Estilos & UI** | Tailwind CSS v4, Radix UI, `class-variance-authority`, `tailwind-merge` |
| **Estado y Caché** | Zustand (IndexDB Persist) + TanStack Query v5 (Data Fetching) |
| **Librerías Clave** | `@hello-pangea/dnd`, `html5-qrcode`, `date-fns`, `papaparse`, `jwt-decode` |
| **Control de Calidad** | ESLint 9, Prettier, Husky + lint-staged (Git Hooks automáticos), Playwright |

### Backend (`/backend`)

| Capa | Tecnología |
|---|---|
| **Core** | Java 17 + Spring Boot 3.3 |
| **Persistencia** | PostgreSQL 16 / H2 (Dev) + Spring Data JPA + Hibernate + Flyway |
| **Seguridad** | Spring Security, OAuth2 Resource Server, `google-api-client` |
| **Rendimiento** | Caché en memoria con `Caffeine`, Compresión GZIP nativa, `MapStruct` |
| **IA & Proxies** | Google Gemini API (Visión/Chat), FatSecret Platform (OAuth 1.0a proxy) |
| **Notificaciones** | Web Push (`web-push`) + BouncyCastle Cryptography (`bcprov-jdk18on`) |
| **Testing** | JUnit 5 + Testcontainers |

---

## 🚀 Puesta en Marcha

### Opción A — Docker Compose (Recomendada)

Ideal para despliegues locales rápidos o producción.

```bash
git clone https://github.com/RaclosDev/ascension-tracker.git
cd ascension-tracker
cp .env.example .env  # Rellena tus API keys
docker-compose up --build
```
- **Aplicación:** [http://localhost:3000](http://localhost:3000)
- **API Swagger:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Opción B — Desarrollo Manual

**Backend:**
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

---

## 📄 Licencia

Este proyecto está bajo licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

Desarrollado por [RaclosDev](https://github.com/RaclosDev).
