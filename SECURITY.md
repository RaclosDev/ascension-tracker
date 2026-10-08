# Política de Seguridad (Security Policy)

## Modelos Soportados
Actualmente solo se proporciona soporte de seguridad a la rama `main` de este repositorio.

## Reporte de Vulnerabilidades

Si descubres un problema de seguridad en este proyecto, por favor **NO** crees un issue público.
En su lugar, envía un correo electrónico directamente a:

**Email de contacto:** [raclosdev@gmail.com](mailto:raclosdev@gmail.com)

Intentaremos responder a tu informe en un plazo de 48 horas con una evaluación del problema y, si es necesario, los pasos para su mitigación.

## Modelo de Autenticación

Ascension Tracker NO gestiona contraseñas propias. 
El flujo de seguridad funciona de la siguiente manera:
1. El usuario se autentica usando Google Sign-In.
2. El frontend envía el ID Token de Google al backend.
3. El backend verifica la autenticidad del ID Token contra los servidores de Google usando el `google-api-client`.
4. Si es válido, el backend emite su propio JSON Web Token (JWT) firmado en HS256 y un Refresh Token almacenado de forma segura (hasheado).
5. El Refresh Token se almacena en una cookie `HttpOnly` en el cliente para mitigar ataques XSS.

Cualquier vulnerabilidad reportada en relación con el bypass de este flujo o fugas de tokens en logs será tratada con máxima prioridad.
