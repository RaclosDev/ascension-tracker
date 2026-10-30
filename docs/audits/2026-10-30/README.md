# Auditoría 2 · 30 de octubre de 2026

Segunda ronda de auditoría, hecha sobre `main` después de la migración a Spring Boot 4.1.2 y de resolver la auditoría antislop 001. Cuatro informes de solo lectura, uno por área. Los arreglos quedan aparcados hasta que se decida abordarlos.

| Informe | Hallazgos | Lo más urgente |
| --- | --- | --- |
| [Seguridad](security.md) | 1 medio, 13 bajos | El límite de 5 MB del JSON se salta con `application/*+json` |
| [Backend](backend.md) | 3 altos, 15 medios, 6 bajos | Restauración, Gemini y búsqueda de alimentos pueden superar los 30 s del router de Heroku |
| [Frontend](frontend.md) | 6 altos, 11 medios, 4 bajos | Errores de red tratados como datos vacíos; falta `eslint-plugin-react-hooks` |
| [CI, infra y documentación](infra-docs.md) | 3 altos, 10 medios, 9 bajos | Heroku y Vercel despliegan sin esperar al CI; sin health check ni plan de rollback |

Cada informe lleva evidencia (fichero y línea o salida de comando), impacto, arreglo recomendado y esfuerzo. El de infraestructura incluye además la lista de afirmaciones desactualizadas en el README, `SECURITY.md` y `CONSTRAINTS.md`.
