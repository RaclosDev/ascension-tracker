# Revisión para portafolio — 31 de octubre de 2026

Base inspeccionada: `21368c5`. Objetivo: que un recruiter entienda el producto y un entrevistador pueda contrastar sus afirmaciones con el código. Revisión inicial de presentación, configuración, CI y puntos críticos; no certifica ausencia de vulnerabilidades ni sustituye pruebas manuales completas.

## Hallazgos confirmados

| Prioridad | Evidencia actual | Consecuencia y corrección |
|---|---|---|
| Alta | `frontend/src/hooks/my-foods/useMyFoodsData.ts:25` y `hooks/nutrition/useNutritionDiary.ts:37` convierten fallos HTTP en arrays vacíos o null | La consulta termina como éxito y puede mostrar que no hay datos cuando falla la red. Propagar errores, conservar los últimos datos y mostrar reintento; probar fallo parcial y recuperación. |
| Alta | `frontend/package.json:15`: typecheck ejecuta `tsc --noEmit`; el tsconfig raíz tiene files vacío y references | La comprobación aislada no comprueba los proyectos referenciados. Confirmado ejecutando `tsc --project frontend/tsconfig.json --listFiles --noEmit`: no lista archivos. Usar modo build o comprobar explícitamente ambos proyectos. El build actual sí ejecuta `tsc -b`, por lo que CI no carece completamente de comprobación de tipos. |
| Alta | `.github/workflows/ci.yml`: backend/frontend dependen de changes; protección de main exige esos jobs y CodeQL, pero no Detect changes | Falta un resultado agregado que falle si falla la detección. Añadir gate obligatorio que distinga omisiones esperadas de errores; verificar configuración de protección después. |
| Media | El filtro de CI solo activa frontend/backend por sus directorios y dos archivos compartidos | Cambiar `scripts/csp-policy.json` o `scripts/generate-csp.js` no activa las comprobaciones correspondientes. Compose puede activar images sin activar los jobs que contienen los builds. Cubrir explícitamente infraestructura y CSP. |
| Alta para presentación | `README.md:25` atribuye a Persistable la erradicación de N+1 y a un limitador en memoria mitigación DDoS | Reescribir con el alcance real: evitar SELECT previos a INSERT es distinto de resolver N+1 en lecturas; limitar solicitudes de una instancia no justifica una garantía DDoS. Evitar promesas absolutas sin pruebas. |
| Media | `README.md:74` dice 18 migraciones; existen 28. La guía Docker enlaza Swagger en localhost:8080, pero compose no publica ese puerto | El onboarding documentado no coincide con la configuración. Probar las instrucciones desde un clon limpio y documentar requisitos, variables obligatorias y acceso real. |
| Media | `frontend/eslint.config.js` no registra reglas de React Hooks | No se comprueban reglas de hooks ni dependencias de efectos. Incorporarlas y corregir causas sin supresiones; añadir regresiones para efectos que cambien comportamiento. |
| Media | `history.tsx`, `active-workout.tsx`, `FoodSearchModal.tsx` superan 700 líneas no vacías; `index.css` supera 5.400 | Priorizar separación por responsabilidades: historial/filtros, sesión/persistencia y búsqueda/selección. Modularizar CSS con verificación visual. El tamaño señala candidatos, no demuestra por sí solo un defecto. |
| Media | `frontend/playwright.config.ts` arranca npm run dev y solo configura Desktop Chrome; cobertura mínima 22/18/17/22 | Añadir pruebas sobre build de producción y escenarios móviles/PWA. Elevar cobertura a través de casos críticos, no tests que reflejen la implementación. |
| Media | `VersionController.java` devuelve el instante de arranque como version | No permite identificar el commit desplegado. Añadir identificación de build manteniendo compatibilidad con consumidores actuales. |
| Media | `FoodExternalService.java:28,37` usa supplyAsync sin executor; `GeminiApiClient.java:32` fija 35 segundos | Revisar aislamiento de E/S y plazo completo de dependencias externas. La compatibilidad con el timeout del hosting requiere verificar el hosting actual; no se ha reproducido aquí una caída en producción. |

## Qué limpiar y qué conservar

- README: reducir superlativos, repetir menos el catálogo de funciones y poner primero propósito, demo, capturas, ejecución y decisiones técnicas defendibles.
- Playwright: quitar bloques comentados del scaffold cuando se concrete la matriz de navegadores.
- `RefreshToken.graceUsed`: se escribe y se comprueba en tests, pero la búsqueda no encontró una lectura en la lógica de producción. Aclarar su intención de seguridad antes de retirarlo; cualquier cambio de columna necesita una migración nueva.
- Auditar exports, dependencias y assets con referencias y herramientas de análisis antes de borrarlos. La ausencia de un import directo no demuestra que una dependencia sea prescindible.
- Conservar tests, migraciones aplicadas y evidencia útil de auditorías. Consolidar el estado de los hallazgos antiguos con referencias a sus arreglos; eliminar informes para ocultar deuda no mejora el producto.
- El grafo local es del 29 de octubre: sirve de orientación, no como evidencia del estado actual.

## Orden de ejecución y criterios de cierre

1. Fiabilidad: errores de red y comprobaciones de tipos/CI. Cierre: regresiones de fallo y recuperación, typecheck real y gate obligatorio probado.
2. Presentación: README breve y exacto, arranque reproducible, demo visible y limitaciones documentadas. Cierre: seguir instrucciones desde un clon limpio.
3. Refactorización: abordar un flujo por cambio, empezando por entrenamiento y búsqueda. Cierre: comportamiento conservado, responsabilidades claras, pruebas y revisión visual.
4. Operación y cobertura: build identificable, pruebas móviles sobre producción, fallos de APIs externas y presupuestos automatizados. Cierre: evidencia reproducible, no solo declaraciones en CONSTRAINTS.

## Verificación de esta revisión

- Frontend: lint y comando typecheck terminaron sin errores; typecheck tiene el defecto descrito arriba. 30 archivos de tests y 175 tests pasaron. Build con `tsc -b` pasó.
- Build: JS principal 73,01 kB gzip; CSS 27,57 kB gzip; precache 1.485,18 KiB. Definir explícitamente MB frente a MiB antes de automatizar el presupuesto de 1,5 MB.
- CI y CodeQL del último push inspeccionado a main estaban en verde. Protección consultada: strict=false; checks Backend CI, Frontend CI y los dos de CodeQL.
- Backend: `mvnw.cmd -B verify` terminó con BUILD SUCCESS: 331 tests, cero fallos, errores u omisiones. Hubo avisos de APIs deprecadas y operaciones unchecked en tests; no equivalen a fallos de la suite.
- No se ha realizado en esta ronda pentest, navegación completa autenticada, ejecución E2E ni validación del despliegue actual. Los informes del 30 de octubre contienen más candidatos que requieren revalidación individual.


## Correcciones implementadas en la rama codex/portfolio-audit

- Consultas de alimentos y diario: los fallos llegan a TanStack Query, se conservan los datos previos, se muestra error y se permite reintentar. Tipadas las siete respuestas HTTP de carga. Regresiones verifican fallo parcial, recuperación y conservación tras un segundo fallo.
- `typecheck` usa `tsc -b`; comprobación real de proyectos referenciados.
- CI activa comprobaciones para Compose/scripts, verifica sincronización CSP e incorpora un Quality gate que exige éxito de los jobs aplicables. Falta publicar el workflow y hacer obligatorio Quality gate en la protección de GitHub; el código local no cambia esa protección.
- README reescrito con alcance real, requisitos y límites; corregidas instrucciones de entorno y puertos. Pendiente reproducir el onboarding completo desde un clon limpio con OAuth configurado.
- `/api/version` añade commit configurable y conserva version numérica para sus consumidores. Test de contrato verificado. El hosting debe suministrar APP_BUILD_COMMIT o HEROKU_SLUG_COMMIT.
- Añadidas pruebas de recuperación del diario sobre build de producción en escritorio y móvil, integradas en CI. Eliminados ejemplos comentados de Playwright.

Validación tras cambios: 331 tests backend; 177 tests frontend con cobertura; 79 E2E existentes y 2 E2E nuevos de producción. Lint, typecheck, build y check:csp correctos. Cobertura: statements 24,4 %, branches 19,27 %, functions 18,96 %, lines 24,63 %. No se han bajado umbrales.

El bloque siguiente actualiza los pendientes de esta primera implementación. No se ha hecho commit, push ni despliegue.


## Segunda implementación: refactorización y verificación integrada

- React Hooks: `rules-of-hooks` y `exhaustive-deps` como errores. Corregidas dependencias inestables, navegación, callbacks del escáner y efectos circulares de recetas. Tests nuevos para callback actualizado sin reiniciar cámara y borrado del último ingrediente.
- Historial: listado, tarjeta y detalle independientes. Sesión: entrada, sesión activa y acciones de pie independientes. Búsqueda de alimentos: hooks de selección, consulta, IA y listas. Todos estos componentes quedan en 500 líneas o menos.
- Listas del buscador: corregido también el error HTTP oculto, con aviso, reintento, tipos de respuesta y regresión de recuperación.
- CSS: retirados 36 media queries vacíos y 7 definiciones globales de animación sobrescritas por definiciones posteriores. Se conserva la definición efectiva y el orden de las reglas restantes; no se ha rediseñado la interfaz.
- Servicios externos: pools separados y acotados (alimentos 8 workers/16 en cola; IA 4/8). Timeout de búsqueda 4 s con cancelación y resultado parcial; plazo Gemini 25 s incluyendo cola y descubrimiento. Saturación 503 y timeout IA 504. Clientes HTTP interruptibles. Límites por instancia, no distribuidos.
- Seguridad: el límite JSON se aplica a application/json y application/*+json, con parámetros y sin depender del idioma del sistema. Diez pruebas cubren tamaño conocido, chunked y entradas pequeñas. El handler existente conserva el 413 para cuerpos chunked que exceden el límite.
- Presupuestos: script inspecciona el manifiesto precache emitido y mide assets reales. Unidades decimales explícitas, sin ampliar umbrales. El icono apple-touch se sirve normalmente, pero sale del precache de instalación; se mantiene el sonido y los assets de la sesión. Medido: JS principal 72.401 bytes gzip, CSS 27.547 bytes gzip y precache 1.483.187 bytes.
- E2E: mocks explícitos para temporizador y resumen IA; capturas en test-results, sin ruta personal absoluta. Las pruebas de escritorio/móvil sobre build de producción están en CI.

Validación integrada: 346 tests backend sin fallos ni omisiones; 180 tests frontend pasan. Lint, typecheck y build pasan. Cobertura statements 25,39 %, branches 20,01 %, functions 19,86 %, lines 25,69 %. 79 E2E existentes y 2 E2E de producción pasan.

### Límites y tareas de publicación

Quality gate debe hacerse obligatorio en GitHub después de publicar su primera ejecución. El hosting debe proporcionar el commit del build. No se han desplegado cambios ni verificado configuración real de hosting/OAuth desde un clon limpio. Los informes antiguos describen observaciones históricas y no constituyen una lista de defectos actuales: por ejemplo, la caché ya está acotada y AuthContext.isReady tiene consumidores. No se han eliminado dependencias ni campos de seguridad solo por sospecha.

Fuentes de implementación: [reglas de efectos React](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps), [Effect Events](https://react.dev/reference/react/useEffectEvent), [ExecutorService Java 17](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ExecutorService.html), [cliente HTTP JDK de Spring](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/client/JdkClientHttpRequestFactory.html), [MediaType de Spring](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/MediaType.html).


### Revisión final adicional

- Escáner: unificadas las referencias actuales a callbacks en arranque, reanudación, cambio de cámara y escaneo de archivo; regresiones de reanudación y cambio de cámara verificadas.
- Retirados cinco exports internos sin consumidores tras búsqueda global: formatFriendlyDate, mphToKmh, getActivityFactor (TypeScript), getWordVariants y REST_PRESETS. Conservados react-is (peer de Recharts), isReady (usado por App) y campos de seguridad cuya eliminación requeriría otro análisis.
- Actualizado únicamente follow-redirects de 1.16.1 a 1.16.2 mediante npm, sin editar el lockfile a mano. `npm audit --omit=dev` devuelve cero vulnerabilidades. [Aviso del proveedor](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p): no se ha demostrado explotación en esta aplicación; el propio aviso no afirma que Axios 1.20.0 esté afectado.
- Quedan cuatro avisos LOW del árbol de desarrollo, todos por la cadena deepmerge → plugin-node-resolve → workbox-build → vite-plugin-pwa. npm propone degradar vite-plugin-pwa a 0.2.1 con --force; no se aplica esa ruptura de la herramienta de PWA. No afectan al resultado del audit de dependencias de producción.

Validación final tras la actualización transitiva, limpieza de exports y segundo ajuste del escáner: 182 tests frontend pasan; cobertura statements 25,94 %, branches 20,41 %, functions 20,15 %, lines 26,27 %. Se ha inspeccionado la captura móvil de la sesión activa generada por Playwright. Backend permanece en 346 tests verdes.
