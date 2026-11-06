# Ascension Tracker

**Entrenamiento, nutrición y progreso en una aplicación web instalable.**

Proyecto personal full-stack con interfaz en español. Reúne el registro de sesiones de fuerza, el diario de alimentación y el seguimiento de peso y pasos, con persistencia local del entrenamiento en curso.

[Ver aplicación](https://ascension.raclos.es) · [Arquitectura](docs/architecture.md) · [Desarrollo y pruebas](docs/development.md) · [Seguridad](SECURITY.md)

[![CI](https://github.com/RaclosDev/ascension-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/RaclosDev/ascension-tracker/actions/workflows/ci.yml)

## Qué puedes hacer

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Inicio: peso actual y progreso hacia el objetivo" width="32%">
  <img src="docs/screenshots/workout.png" alt="Entrenamiento: ejercicios y registro de series" width="32%">
  <img src="docs/screenshots/nutrition.png" alt="Nutrición: comidas y macronutrientes del día" width="32%">
</p>

- **Entrenamiento:** ejercicios, series, variantes, temporizador de descanso, plantillas e historial. Importación de sesiones desde CSV de Hevy.
- **Nutrición:** diario por comidas, alimentos guardados, recetas, búsqueda de productos y lectura de códigos de barras.
- **Progreso:** evolución de peso y pasos, resúmenes semanales, objetivos y calculadoras.
- **Datos propios:** exportación y restauración de copias de seguridad, con modos de fusión y sustitución.
- **Integraciones opcionales:** asistencia nutricional con Gemini y avisos de descanso mediante Web Push.

El acceso requiere una cuenta de Google. Las funciones de IA y push necesitan sus servicios configurados. Las capturas muestran la interfaz real en móvil con datos ficticios. [Cómo reproducirlas](docs/screenshots/README.md).

## Stack

| Área | Tecnología |
| --- | --- |
| Interfaz | React 19, TypeScript, Vite, Tailwind CSS |
| Estado y consultas | TanStack Query, Zustand, IndexedDB |
| API | Java 21, Spring Boot 4.1, Spring Security |
| Persistencia | PostgreSQL 16, Spring Data JPA, Flyway |
| Pruebas | JUnit, Testcontainers, Vitest, Testing Library, Playwright |
| Automatización | GitHub Actions, CodeQL, Trivy, Docker Compose |

## Un recorrido por Ascension

1. Accede con Google y configura tus objetivos de peso y nutrición.
2. Crea una plantilla o empieza un entrenamiento vacío: añade ejercicios y registra peso y repeticiones por serie.
3. Anota tus comidas en el diario, reutiliza alimentos o recetas y consulta calorías y macronutrientes.
4. Registra peso y pasos y consulta la evolución semanal para seguir tu progreso.

## Arquitectura y código

La aplicación combina una SPA React con una API Spring Boot y PostgreSQL. La [guía de arquitectura](docs/architecture.md) explica el modelo, la persistencia del entrenamiento, la autenticación y las integraciones, y enlaza a implementaciones y pruebas representativas.

## Arranque local

Necesitas Git, Docker con Compose y un cliente OAuth de Google para una aplicación web.

```bash
git clone https://github.com/RaclosDev/ascension-tracker.git
cd ascension-tracker
cp .env.example .env
```

En PowerShell, sustituye el último comando por `Copy-Item .env.example .env`.

Completa `POSTGRES_PASSWORD`, `JWT_SECRET`, `APP_PII_SALT`, `GOOGLE_CLIENT_ID` y `VITE_GOOGLE_CLIENT_ID`. Los dos identificadores de Google deben corresponder al mismo cliente; autoriza `http://localhost:3000` como origen JavaScript. `JWT_SECRET` necesita al menos 32 bytes. Mantén `VITE_API_URL` vacío y las integraciones que no uses también vacías.

```bash
docker compose up --build
```

Abre [localhost:3000](http://localhost:3000). Nginx sirve el frontend y redirige `/api/` al backend; PostgreSQL conserva sus datos en un volumen. La [guía de desarrollo](docs/development.md) incluye configuración, ejecución con recarga en caliente y resolución de problemas.

## Calidad y verificación

GitHub Actions ejecuta las comprobaciones aplicables a cada cambio: pruebas del backend con PostgreSQL real mediante Testcontainers; lint, tipos, cobertura y build del frontend; presupuestos de assets y pruebas de navegador. También hay análisis de dependencias e imágenes y un workflow de CodeQL.

Los E2E usan API simulada. Las pruebas de integración del backend comprueban persistencia y transacciones; ninguna de estas suites equivale a probar proveedores privados o todos los dispositivos físicos.

Consulta los [comandos y resultados locales de referencia](docs/development.md#verificación) y los [umbrales del proyecto](CONSTRAINTS.md). El badge muestra el estado del workflow, no certifica cambios locales aún sin publicar.

## Estructura

```text
backend/       API, dominio, migraciones y pruebas de integración
frontend/      Aplicación React, service worker y pruebas de navegador
scripts/       Generación y comprobación de la política CSP
docs/          Arquitectura, desarrollo y capturas de la aplicación
.github/       Integración continua y análisis de seguridad
```

## Autor y licencia

Desarrollado por [RaclosDev](https://github.com/RaclosDev). Código publicado bajo [licencia MIT](LICENSE).
