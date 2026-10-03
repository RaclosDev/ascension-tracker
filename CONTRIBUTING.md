# Contributing to Ascension Tracker

¡Gracias por tu interés en contribuir a Ascension Tracker!

## Cómo levantar el proyecto

### Requisitos previos
- Docker y Docker Compose
- Node.js (v20 o superior)
- Java 17

### Paso a paso
1. Clona el repositorio: `git clone https://github.com/RaclosDev/ascension-tracker.git`
2. Copia `.env.example` a `.env` y rellena las variables de entorno.
3. Puedes usar `docker-compose up --build` para levantar todo el stack (PostgreSQL + Backend + Frontend).
4. Para desarrollo local, ve a `frontend` y ejecuta `npm install` y luego `npm run dev`. El backend se puede ejecutar con `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` (usará base H2 en memoria).

## Reglas Básicas
- **Commits:** Sigue la convención de [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (feat:, fix:, docs:, refactor:, etc.).
- **Tests:** Si añades funcionalidad crítica en el backend, por favor incluye tests unitarios en JUnit 5.
- **Formato:** El proyecto de frontend usa `eslint` y `prettier`. Asegúrate de pasar `npm run lint` antes de crear una Pull Request.
- **Idioma:** Por coherencia con el resto del proyecto (portfolio), los mensajes de error en el backend y la UI en frontend deben mantenerse en español.
