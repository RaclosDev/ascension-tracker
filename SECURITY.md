# Seguridad

## Comunicar una vulnerabilidad

Envía el informe a [raclosdev@gmail.com](mailto:raclosdev@gmail.com), sin publicar credenciales ni datos personales en un issue. Incluye la revisión afectada, los pasos para reproducirlo y el impacto observado.

El mantenimiento de seguridad se realiza sobre `main`. Este es un proyecto personal; no se ofrece un plazo de respuesta garantizado.

## Autenticación y sesiones

- El backend valida el ID token de Google y emite un JWT de acceso firmado con HS256. No se gestionan contraseñas propias.
- El token de acceso se mantiene en memoria del navegador. Evitar su persistencia reduce su exposición, pero no elimina el riesgo de XSS: un script ejecutado en el origen puede actuar en nombre del usuario.
- El refresh token se almacena como hash SHA-256 en PostgreSQL y se entrega mediante cookie HttpOnly, limitada a `/api/auth`. No se devuelve en el cuerpo JSON. Se rota y se conserva la información necesaria para detectar reutilización fuera del periodo de gracia.
- La cookie usa SameSite configurable. `Secure` depende de HTTPS/configuración y se fuerza con SameSite=None; el entorno local HTTP no tiene la misma configuración que producción.
- Refresh y logout comprueban el origen de la petición. El cierre de sesión normal revoca la familia refresh; un JWT de acceso ya emitido conserva su caducidad. El cierre en todos los dispositivos actualiza además el corte de revocación de la cuenta.
- La validación consulta el estado de seguridad en PostgreSQL. Los JWT nuevos incluyen una versión firmada del corte de revocación, evitando depender de una caché local o de comparaciones redondeadas al segundo.
- El identificador estable de Google permite reconocer un cambio de email verificado. El movimiento de datos es transaccional y se rechaza si el email de destino ya pertenece a otra cuenta.

## Datos y despliegue

Los endpoints de usuario obtienen la identidad del JWT. Hay validación de entradas, límites de tamaño, cuotas y pruebas de aislamiento. Las claves secretas pertenecen al entorno del despliegue; `.env.example` solo describe la configuración.

Las cabeceras CSP se generan desde [scripts/csp-policy.json](scripts/csp-policy.json). El pipeline incluye análisis de código y dependencias. Estas medidas y las pruebas automatizadas no constituyen una certificación de seguridad ni garantizan ausencia de vulnerabilidades.

Consulta [la arquitectura](docs/architecture.md) y [la guía de despliegue y diagnóstico](docs/development.md#despliegue-y-diagnóstico) para conocer los límites operativos.
