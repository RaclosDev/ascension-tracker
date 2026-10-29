# Política de Seguridad (Security Policy)

## Modelos Soportados
Actualmente solo se proporciona soporte de seguridad a la rama `main` de este repositorio.

## Reporte de Vulnerabilidades

Si descubres un problema de seguridad en este proyecto, por favor **NO** crees un issue público.
En su lugar, envía un correo electrónico directamente a:

**Email de contacto:** [raclosdev@gmail.com](mailto:raclosdev@gmail.com)

Intentaremos responder a tu informe en un plazo de 48 horas con una evaluación del problema y, si es necesario, los pasos para su mitigación.

## Modelo de Autenticación

Ascension Tracker no gestiona contraseñas propias. El flujo de seguridad sigue estrictamente los principios de menor privilegio y defensa en profundidad:

1. **Autenticación Federada:** El usuario se autentica mediante Google Sign-In en el frontend.
2. **Verificación Servidor:** El backend valida criptográficamente el ID Token de Google contra los servidores de Google usando `google-api-client`.
3. **Emisión de Tokens:**
   - **Access Token (JWT):** Firmado en HMAC-SHA256. Reside **estrictamente en memoria del navegador** (estado de React / módulo JS). Nunca se persiste en `localStorage` ni `sessionStorage` para neutralizar ataques XSS de extracción de credenciales.
   - **Refresh Token:** Se almacena hasheado en base de datos (SHA-256) y se entrega al cliente **únicamente a través de una cookie `HttpOnly`, `Secure` y `SameSite`**. La cookie se limita a `Path=/api/auth`, así que no viaja con el resto de peticiones a la API.
4. **Flujo de Refresco y Cierre de Sesión:**
   - Ni `/api/auth/login` ni `/api/auth/refresh` exponen jamás el refresh token en el cuerpo JSON de la respuesta.
   - Los endpoints `/api/auth/refresh` y `/api/auth/logout` leen el token de refresco **exclusivamente de la cookie `HttpOnly`**, ignorando cualquier cuerpo JSON o cabecera personalizada (`X-Refresh-Token`).
5. **CORS Sanitizado:**
   - La configuración de CORS no expone cabeceras sensibles como `Authorization` o `X-Refresh-Token`.

Cualquier vulnerabilidad reportada en relación con el bypass de este flujo o fugas de tokens en logs será tratada con máxima prioridad.
