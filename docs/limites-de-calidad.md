# Límites de calidad

Umbrales de calidad, límites de arquitectura y presupuestos de rendimiento de Ascension. Los cambios los respetan; no se rebajan para hacer pasar una comprobación.

## Tipos y calidad del código

| Dimensión | Límite | Comprobación |
| :--- | :---: | :--- |
| `@ts-ignore` y `@ts-expect-error` | 0 | `git grep -E '@ts-(ignore\|expect-error)' frontend/src` |
| `eslint-disable` en código de producción | 0 | `git grep 'eslint-disable' frontend/src` |
| `any` explícito en código de producción | 0 | ESLint; solo se admite en dobles de prueba |
| Verificación de tipos | sin errores | `npm run typecheck` en cada PR |

## Presupuestos de tamaño

La CI los comprueba tras el build con [`frontend/scripts/check-build-budgets.mjs`](../frontend/scripts/check-build-budgets.mjs).

| Recurso | Máximo | Cómo se mide |
| :--- | :---: | :--- |
| JS principal (`index-*.js`) | 180 KB | gzip |
| CSS principal (`index-*.css`) | 40 KB | gzip |
| Precache inicial del service worker | 1,5 MB | sin comprimir |

Las unidades son decimales: 1 KB = 1.000 bytes y 1 MB = 1.000.000 bytes.

Los objetivos de experiencia son un LCP de 2,5 s, un CLS de 0,1 y un INP de 200 ms como máximo. No hay medición de campo, así que son objetivos de diseño y no cifras de producción.

## Arquitectura y pruebas

- **Tamaño de los componentes.** Un componente nuevo o refactorizado no supera las 500 líneas; si las supera, se divide en subcomponentes o hooks.
- **Datos sin conexión.** Las mutaciones del almacén de entrenos y de la sesión se guardan en IndexedDB de forma tolerante a fallos, con valores por defecto seguros al migrar el esquema.
- **Backend.** La suite completa de pruebas unitarias y de integración se mantiene en verde, sin omitir las que necesitan PostgreSQL.
- **Cobertura del frontend.** `vitest.config.ts` fija los mínimos (50 % de sentencias, 41 % de ramas, 45 % de funciones y 51 % de líneas) y la CI los exige con `npm run test:coverage`. Solo pueden subir.
