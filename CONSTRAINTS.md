# CONSTRAINTS.md — Ascension Tracker

Este documento establece el contrato formal e inmutable de calidad, límites arquitectónicos y presupuestos de rendimiento para Ascension Tracker. Cualquier cambio introducido por desarrolladores o agentes de IA debe cumplir obligatoriamente estos umbrales.

---

## 1. Integridad de Tipos y Calidad de Código (TypeScript & Java)

| Dimensión | Límite Estricto | Estado Actual | Verificación |
| :--- | :---: | :---: | :--- |
| `@ts-ignore` | **0** | 0 | `git grep '@ts-ignore' frontend/src` |
| `@ts-expect-error` | **0** | 0 | `git grep '@ts-expect-error' frontend/src` |
| `eslint-disable` en código de producción | **0** | 0 | `git grep 'eslint-disable' frontend/src` |
| `any` explícito en código de producción | **0** | 0 | Prohibido en `src/` excepto mocks de test |
| Compilación Java / Spring Boot | **0 warnings críticos** | 0 | `mvn compile -q` |

> **Regla:** Queda terminantemente prohibido añadir directivas `@ts-ignore` o silenciar ESLint para forzar builds en verde.

---

## 2. Presupuestos de Rendimiento Web y Bundles (Performance Budgets)

| Recurso | Presupuesto Máximo (Comprimido) | Estado Inicial | Objetivo |
| :--- | :---: | :---: | :--- |
| **JS Principal (`index-*.js`)** | **≤ 180 KB** | ~453 KB sin comprimir (~130 KB gzip) | Aislamiento en `manualChunks` |
| **CSS Principal (`index-*.css`)** | **≤ 40 KB** | ~163 KB sin comprimir (~28 KB gzip) | Poda de CSS legado |
| **Precache inicial Service Worker** | **≤ 1.5 MB** | > 2.5 MB | Exclusión de JSONs y assets pesados de Workbox precache |
| **LCP (Largest Contentful Paint)** | **≤ 2.5 s** | Variable en móvil lento | Carga asíncrona de fuentes y optimización de imágenes |
| **CLS (Cumulative Layout Shift)** | **≤ 0.1** | Controlado | Dimensiones explícitas en imágenes y skeletons |
| **INP (Interaction to Next Paint)** | **≤ 200 ms** | Controlado | Virtualización y división de componentes pesados |

---

## 3. Arquitectura y Mantenibilidad

1. **Tamaño de Componentes:** Ningún nuevo componente o refactorización debe superar las **500 líneas de código**. Componentes que superen este umbral deben descomponerse en subcomponentes o custom hooks dedicados.
2. **Offline-First Resilience:** Las mutaciones en `useWorkoutStore` y `AuthContext` deben persistir de forma tolerante a fallos en `idb-keyval` con valores por defecto seguros en migraciones de esquema.
3. **Validación de Tests Obligatoria:**
   - Backend: Los 293+ tests unitarios y de integración deben mantenerse 100% en verde.
   - Frontend: Verificación de tipos (`tsc --noEmit`) obligatoria en cada Pull Request.
   - Frontend: cobertura mínima en `vitest.config.ts` (statements 22 %, branches 18 %, functions 17 %, lines 22 %), comprobada en CI con `npm run test:coverage`. Solo puede subir.
