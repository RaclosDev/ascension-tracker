<div align="center">

<img src="docs/screenshots/hero.jpg" alt="Ascension, tu progreso bajo control: capturas móviles del inicio, un entreno en curso y el diario de nutrición" width="100%">

# Ascension Tracker

**Entrenamiento, nutrición y progreso en una sola PWA, con modo entrenador para pautar y seguir a alumnos.**

[![Abrir la app](https://img.shields.io/badge/Abrir_la_app-ascension.raclos.es-f2c94c?style=for-the-badge&logo=googlechrome&logoColor=black)](https://ascension.raclos.es)
[![CI](https://img.shields.io/github/actions/workflow/status/RaclosDev/ascension-tracker/ci.yml?branch=main&style=for-the-badge&label=CI&logo=githubactions&logoColor=white)](https://github.com/RaclosDev/ascension-tracker/actions/workflows/ci.yml)

![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_4.1-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/licencia-MIT-lightgrey?style=flat-square)

[Arquitectura](docs/architecture.md) · [Desarrollo y pruebas](docs/development.md) · [Seguridad](SECURITY.md) · [Modo entrenador](docs/version-coach.md)

</div>

## 📱 La app

<table>
  <tr>
    <td align="center" width="33%"><img src="docs/screenshots/landing.png" alt="Portada pública" width="240"><br><sub><b>Portada</b> · para deportistas y entrenadores</sub></td>
    <td align="center" width="33%"><img src="docs/screenshots/dashboard.png" alt="Inicio con el peso del día y el progreso hacia el objetivo" width="240"><br><sub><b>Inicio</b> · peso del día y meta</sub></td>
    <td align="center" width="33%"><img src="docs/screenshots/workout.png" alt="Entreno en curso con series, cronómetro y descansos" width="240"><br><sub><b>Entreno en curso</b> · series, descansos y cronómetro</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/training.png" alt="Resumen de entrenamiento con recuperación muscular, mapa corporal y calendario de actividad" width="240"><br><sub><b>Entreno</b> · recuperación muscular y actividad</sub></td>
    <td align="center"><img src="docs/screenshots/nutrition.png" alt="Diario de nutrición con calorías y macronutrientes" width="240"><br><sub><b>Nutrición</b> · calorías y macros del día</sub></td>
    <td align="center"><img src="docs/screenshots/tracking.png" alt="Seguimiento semanal de peso, pasos y calorías" width="240"><br><sub><b>Tracking</b> · peso, pasos y kcal por semana</sub></td>
  </tr>
</table>

<sub>Capturas de la interfaz real con datos ficticios. [Cómo se generan](docs/screenshots/README.md).</sub>

## ✨ Qué hace

- **Entrenamiento:** series, variantes, temporizador de descanso con avisos push, plantillas, historial, récords y mapa de recuperación muscular. Importa sesiones desde Hevy (CSV).
- **Nutrición:** diario por comidas, búsqueda de alimentos (Open Food Facts y FatSecret), escáner de códigos de barras, recetas y alimentos guardados.
- **Asistente con IA:** sugerencias nutricionales y recetas según los macros que te quedan, con Gemini.
- **Progreso:** peso, pasos, calorías y resúmenes semanales, fotos de progreso privadas y calculadoras de gasto energético.
- **Modo entrenador:** invitaciones a alumnos con permisos que decide el alumno, programas de entreno por semanas, pautas de nutrición, check-ins semanales y semáforo de seguimiento.
- **Tus datos son tuyos:** exportación completa y restauración de copias, con fusión o sustitución.

## 🧠 Lo interesante por dentro

| | |
| --- | --- |
| **Escrituras idempotentes** | `IdempotencyFilter` guarda la clave, la firma de la petición y la respuesta en la misma transacción. Si la conexión falla, el reintento no duplica entrenos ni comidas. |
| **Concurrencia en PostgreSQL** | Límites de uso con *token bucket* atómico compartido entre instancias, y temporizadores push reclamados con `FOR UPDATE SKIP LOCKED`. |
| **Sesión segura** | Acceso con Google, email y contraseña o llave de acceso. La API emite un JWT de acceso que vive en memoria y un refresh token rotatorio en cookie `HttpOnly`. CSP generada y verificada en CI. |
| **Local-first en el gimnasio** | El entreno en curso se guarda en IndexedDB, aislado por cuenta, y sobrevive a recargas y a una mala cobertura. |
| **Privacidad por diseño** | El alumno elige qué comparte con su entrenador, cada consulta del entrenador queda registrada y el borrado de cuenta no deja datos huérfanos. |
| **Rendimiento medido** | Tests que cuentan las consultas SQL para detectar N+1, y presupuestos de tamaño de JS, CSS y precache comprobados en CI. |

```mermaid
flowchart LR
    UI[React 19 PWA] -->|REST + JWT| API[Spring Boot 4.1]
    UI --> LOCAL[(IndexedDB)]
    API --> DB[(PostgreSQL + Flyway)]
    API --> AI[Gemini]
    API --> FOOD[Open Food Facts / FatSecret]
    API --> PUSH[Web Push]
    API --> GOOGLE[Google OAuth]
```

## ✅ Calidad

- **Más de 850 tests automatizados:** unos 380 de frontend (Vitest y Testing Library) y unos 475 de backend (JUnit y **Testcontainers** con PostgreSQL real).
- **E2E con Playwright** con la API simulada, incluido el aislamiento entre cuentas y el cierre de sesión entre pestañas.
- **Seguridad automatizada:** CodeQL, análisis de imágenes con Trivy y Dependabot.
- **CI en GitHub Actions** con tipos, cobertura, formato, tests y build de cada parte afectada.

## 🛠️ Stack

| Área | Tecnología |
| --- | --- |
| Interfaz | React 19, TypeScript, Vite, Tailwind CSS, PWA (Workbox) |
| Estado | TanStack Query, Zustand, IndexedDB |
| API | Java 21, Spring Boot 4.1, Spring Security (OAuth2 Resource Server), MapStruct |
| Persistencia | PostgreSQL 16, Spring Data JPA, Flyway |
| Integraciones | Gemini, Open Food Facts, FatSecret, Web Push, almacenamiento S3 |
| Pruebas | JUnit, Testcontainers, Vitest, Testing Library, Playwright |
| Automatización | GitHub Actions, CodeQL, Trivy, Docker Compose |

## 🚀 Ejecutarla en local

```bash
cp .env.example .env    # completa las claves y el cliente OAuth de Google
docker compose up --build
```

Abre [localhost:3000](http://localhost:3000). La [guía de desarrollo](docs/development.md) explica la configuración, la recarga en caliente y las verificaciones.

## 👤 Autor

**Carlos Sanz Tomero**: desarrollador full-stack Java y React.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-carlos--sanz--tomero-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/carlos-sanz-tomero/)
[![Portfolio](https://img.shields.io/badge/Portfolio-raclosdev.github.io-181717?style=for-the-badge&logo=github&logoColor=white)](https://raclosdev.github.io)

Código publicado bajo [licencia MIT](LICENSE).
