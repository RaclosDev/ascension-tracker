# Auditoría frontend — Ascension Tracker (`frontend/`)

Fecha: 2026-10-30 · Rama auditada: `main` (331033d) en worktree aislado · Modo: solo lectura (ningún fichero versionado modificado; el `playwright.audit-tmp.config.ts` temporal se borró tras la ejecución).

Stack verificado: React 19.3, Vite 8.3.5 (rolldown), TypeScript 5.9.3, Tailwind 4, TanStack Query 5, Zustand 5 + `idb-keyval`, PWA `injectManifest`, Vitest 5, Playwright 1.64.

## Comandos ejecutados y resultado

| Comando | Resultado |
| --- | --- |
| `npm ci` | OK |
| `npm run build` | OK en 740 ms. 40 entradas precache = **1470,03 KiB** (presupuesto 1,5 MB = 1536 KiB → queda un 4 %) |
| `npm run lint` / `npm run typecheck` | OK, sin avisos |
| `npm run test:coverage` | 28 ficheros, 167 tests OK en 6,5 s. **Statements 23,24 % · Branches 18,82 % · Functions 17,93 % · Lines 23,42 %** |
| `CI=1 npx playwright test` (config temporal en puerto 5199, `reuseExistingServer: false`) | **75/75 OK en 45,7 s, 0 reintentos** |
| `npm outdated` | 6 paquetes (ver hallazgo 20) |

Chunks de producción (sin comprimir / gzip):

| Chunk | KB | gzip KB | Observación |
| --- | ---: | ---: | --- |
| `BarcodeScanner-*.js` (html5-qrcode) | 374,2 | 109,9 | lazy, excluido del precache |
| `CategoricalChart-*.js` (recharts) | 300,0 | 89,5 | lazy, excluido del precache |
| `vendor-react-*.js` | 228,1 | 72,4 | precache |
| `index-*.js` | 214,6 | 69,2 | presupuesto ≤180 KB comprimido: **cumple** |
| `index-*.css` | 159,7 | 26,1 | presupuesto ≤40 KB comprimido: **cumple** |
| `SettingsPage-*.js` | 139,4 | 39,4 | mayor chunk de página; incluye dnd, Hevy, Restore, planes |
| `DashboardCharts-*.js` | 81,2 | 21,6 | |
| `UtilitiesPage-*.js` | 60,4 | 20,4 | |
| `active-workout-*.js` | 59,4 | 14,4 | |

---

## Hallazgos

### 1. [Alta] Errores de red convertidos en "datos vacíos" y cacheados como éxito

**Evidencia.** `queryFn` que tragan el error y devuelven listas vacías o `null`:
- `src/hooks/nutrition/useNutritionDiary.ts:37-40` (`.catch(() => ({ data: null }))` / `({ data: [] })` para macros, comidas, ajustes y logs)
- `src/pages/TrackingPage.tsx:73-75`
- `src/components/FoodSearchModal.tsx:50-52`, `src/hooks/my-foods/useMyFoodsData.ts:25-27`
- `src/components/utilities/TdeeCalculator.tsx:42,51`
- Solo hay 4 usos de `isError` en todo `src/` (`SettingsPage.tsx:73`, `WorkoutPage.tsx:25`).

**Impacto.** Un 500, un timeout (10 s, `client.ts:10`) o un 401 no recuperable renderizan el diario de nutrición como "sin comidas hoy", el tracking como semanas vacías y el buscador sin alimentos guardados. TanStack lo guarda como éxito con `staleTime` de 5 min (`main.tsx:22`), así que el usuario ve datos falsos durante 5 minutos sin botón de reintento y sin que `retry` de TanStack actúe (nunca ve el rechazo). En nutrición puede llevar a registrar comidas duplicadas.

**Arreglo.** Dejar que el `queryFn` rechace; separar los `Promise.all` en queries independientes (`useQueries`) para que un endpoint caído no tumbe el resto; renderizar `isError` con `ErrorState` + `refetch` (patrón contenedor/presentación del skill). Si se quiere degradación parcial, usar `Promise.allSettled` y exponer `partialError` en el resultado.

**Esfuerzo.** M.

### 2. [Alta] Sin `eslint-plugin-react-hooks`: 65 efectos sin verificación de dependencias y varios con closures obsoletos

**Evidencia.** `frontend/eslint.config.js` no registra `react-hooks` y `package.json` no lo declara; `grep -c "useEffect(" src` (sin tests) = 65. Casos concretos detectados:
- `src/context/AuthContext.tsx:218` deps `[token, queryClient]`: `queryClient` no se usa en el efecto; el efecto re-registra listeners globales en cada cambio de token y vuelve a decodificar el JWT que ya decodificó `initAuth` (`:98-108` y `:177-185`, lógica duplicada).
- `src/hooks/nutrition/useNutritionDiary.ts:55-64` deps `[meals.length]` mientras itera `meals` (closure obsoleto si cambian las comidas sin cambiar el número).
- `src/components/dashboard/QuickWeightCard.tsx:34-40` deps `[todayWeight, recentWeight, quickWeight]`: efecto que sincroniza props a estado (anti-patrón; borrar el input lo rellena de nuevo).
- `src/pages/SettingsPage.tsx:169-177` y `src/hooks/nutrition/useNutritionDiary.ts:71-85`: `setTimeout` sin `clearTimeout` en limpieza (scroll tras desmontaje).
- `src/pages/SettingsPage.tsx:195-215`: copia la query al estado local en un efecto (segunda fuente de verdad del formulario de ajustes).

**Impacto.** Bugs silenciosos de sincronización que no detecta ni `tsc` ni la suite; cada nuevo efecto se revisa a mano.

**Arreglo.** Añadir `eslint-plugin-react-hooks` (`recommended-latest`, reglas `rules-of-hooks: error`, `exhaustive-deps: error`), corregir lo que marque y migrar los efectos "derivar estado de props" a `useMemo`/estado derivado o `key` en el componente. Para formularios iniciados desde servidor, usar `initialData`/`key={settings.updatedAt}`.

**Esfuerzo.** S (plugin) + M (corrección de avisos).

### 3. [Alta] Tipado del cliente HTTP: `res.data` es `any` en 102 de 107 llamadas

**Evidencia.** `grep -E "api\.(get|post|put|patch|delete)" src` = 107 llamadas; solo 5 llevan genérico (`api.get<...>`). El tipo de dato de las queries se impone por aserción en `useQuery<DashboardData>` (`src/pages/DashboardPage.tsx:20-23`, `SettingsPage.tsx:77`, `Layout.tsx:71-78`), no por el fetch. No hay validación en runtime (sin `zod`/`valibot` en `package.json`). Casts de puente entre modelos: `src/pages/MyFoodsPage.tsx:141,144,185` (`f as unknown as SavedFood` / `PageFoodItem`), `OnboardingScreen.tsx:399` y `SettingsPage.tsx:425` (`setForm as unknown as Dispatch<SetStateAction<MacroForm>>`). `tsconfig.app.json:22` desactiva `useUnknownInCatchVariables`. Non-null: `client.ts:227`, `FoodCard.tsx:121,252`. Gancho de test en producción: `window.__testScanBarcode` (`MyFoodsPage.tsx:55-61`).

**Impacto.** El umbral "0 `any`" de `CONSTRAINTS.md` se cumple de forma nominal: el `any` entra por `AxiosResponse<any>`. Un cambio en un DTO del backend no rompe el `typecheck`; se descubre en runtime. Los `as unknown as` de MyFoods indican dos modelos (`SavedFood` vs `PageFoodItem`) para la misma entidad.

**Arreglo.** Capa `src/api/endpoints/*.ts` con funciones tipadas (`getSettings(): Promise<UserSettings>`) y esquemas `zod` por DTO (`UserSettingsSchema.parse(res.data)`) usadas en `queryFn`; unificar `SavedFood`/`PageFoodItem`; activar `useUnknownInCatchVariables` y `noUnusedLocals`; mover `__testScanBarcode` detrás de `import.meta.env.DEV` o sustituirlo por un `page.route` que devuelva un producto y un `data-testid` en el input de código.

**Esfuerzo.** L (endpoints + zod), S (tsconfig y gancho de test).

### 4. [Alta] Estado del entrenamiento: sin barrera de hidratación de IndexedDB y preferencias con tres fuentes de verdad

**Evidencia.**
- `src/lib/workout/store.ts:501-520`: `persist` con storage asíncrono (`idb-keyval`), sin `onRehydrateStorage` ni `persist.hasHydrated()` en ningún consumidor (`grep hasHydrated|onRehydrateStorage src` = 0). `Layout.tsx:66-69`, `dashboard.tsx:23` y `active-workout.tsx:57` leen `active` desde el primer render.
- Preferencias de descanso/equipo viven en Zustand persistido (`store.ts:135-140,229-247`), en la query `['workoutPreferences']` (`api.ts:196`) y se sincronizan por efecto en dos sitios (`api.ts:232-240` y `SettingsPage.tsx:104-108`); `exercise-card.tsx:236-237` escribe en ambos a mano.
- `migrate` (`store.ts:532-551`) devuelve `as WorkoutState` sin validar la forma de `active.exercises[].sets[]`; versión única (`version: 1`).

**Impacto.** Al abrir la PWA con un entrenamiento activo, el primer frame muestra "sin entrenamiento" y un `startEmpty` rápido (o `useWorkoutStore.setState` en logout) puede pisar el estado que aún se está leyendo de IDB. Un cambio de preferencias desde otro dispositivo se mezcla por `{...state.restTimers, ...prefs.restTimers}` (`store.ts:243`) sin borrar claves eliminadas. Un `active` corrupto en IDB (p. ej. `sets` undefined) rompe `exercises.map` en `active-workout.tsx:462` sin pasar por `migrate`.

**Arreglo.** Exponer `hydrated` vía `onRehydrateStorage` y renderizar `Skeleton` en `Layout`/`ActiveWorkout` hasta entonces; mover `restPreset/restTimers/hiddenEquipments` fuera del store (servidor como única fuente, `useWorkoutPreferences` + `select`) o, si deben funcionar offline, mantenerlos solo en el store y sincronizar al servidor con una mutación; validar `migrate` con un esquema `zod` y `fallback` a `active: null` cuando no valide (cumple el punto 2 de `CONSTRAINTS.md`).

**Esfuerzo.** M.

### 5. [Alta] Cliente API: dos implementaciones del refresco de token, sin cancelación, reintentos ciegos

**Evidencia.** `src/api/client.ts` tiene `refreshAccessToken` (`:115-178`, lock `activeRefreshPromise`) y un segundo flujo completo dentro del interceptor 401 (`:180-293`, lock `isRefreshing` + `failedQueue`); ambos repiten el POST a `/auth/refresh`, el `postMessage` y el `CustomEvent`. El interceptor reintenta con `setTimeout(1500)` fijo (`:238-240`). Ninguna query pasa `signal` (`grep signal src` = 1, solo `App.tsx:201`); no hay `AbortController` por navegación. `useRecentWorkouts` pide 365 días y filtra en cliente (`api.ts:30-40`). Con `retry` por defecto de TanStack (3 reintentos con backoff) y `timeout: 10000`, una query puede tardar ~37 s en fallar.

**Impacto.** Dos locks distintos → `initAuth`/`online` y el interceptor pueden refrescar en paralelo en navegadores sin `navigator.locks` (Safari < 15.4, WebViews). Peticiones de páginas abandonadas siguen vivas y escriben en caché. Comportamiento en fallos difícil de razonar y de testear (la parte `:181-288` está sin cubrir, ver hallazgo 15).

**Arreglo.** Un único `refreshSession()` con promesa compartida que use el interceptor; `failedQueue` sustituida por `await refreshSession()` en cada petición en espera; pasar `signal` de TanStack a axios en todos los `queryFn` (`api.get(url, { signal })`); `retry: (n, err) => !isAxiosError(err) || err.response?.status >= 500` y `retry: 1` por defecto; endpoint `/workouts/recent?since=` con el rango real.

**Esfuerzo.** M.

### 6. [Alta] Script inline de tema bloqueado por la CSP de producción

**Evidencia.** `frontend/index.html:25-48` contiene un `<script>` inline que aplica `--accent-primary` antes del primer render. `security-headers.conf:20` y `vercel.json` fijan `script-src 'self' https://accounts.google.com` sin `'unsafe-inline'`, nonce ni hash; `scripts/generate-csp.js` no genera `sha256-…` (grep = 0).

**Impacto.** En producción el navegador bloquea el script (error de CSP en consola) y el color personalizado se aplica solo en `App.tsx:160-163` tras montar React: flash de color en cada carga; el comentario "evitar flash" es falso en despliegue. Un ingeniero que relaje la CSP para "arreglarlo" abriría XSS.

**Arreglo.** Mover el script a `public/theme-init.js` (`<script src defer>` junto a `pwa-recovery.js`) o calcular su hash SHA-256 en `generate-csp.js` y añadirlo a `script-src`. Añadir un test E2E que afirme ausencia de violaciones CSP (`page.on('console')`).

**Esfuerzo.** S.

### 7. [Media] Service worker: `skipWaiting` + `autoUpdate` recargan la página sin consentimiento, también durante un entrenamiento

**Evidencia.** `src/sw.ts:100-106` (`skipWaiting` en `install`, `clients.claim` en `activate`); `vite.config.ts:15` `registerType: 'autoUpdate'`; `main.tsx:85` `registerSW({ immediate: true })` sin `onNeedRefresh`. `vite-plugin-pwa/dist/client/build/register.js:40-45` hace `window.location.reload()` al activarse una versión nueva. El guard "no recargar con entrenamiento activo" solo existe para el chequeo de `/version` (`App.tsx:44-59`), no para la ruta del SW.

**Impacto.** El usuario puede perder una edición de serie en curso (el estado persiste en IDB, pero el input en foco y el temporizador de descanso no). Además, cuatro mecanismos de recuperación de chunks solapados con tres claves de `sessionStorage` distintas: `public/pwa-recovery.js` (borra todas las cachés, incluido el precache, y desregistra el SW), `main.tsx:39-67`, `utils/lazyWithRetry.ts:35-66`, `components/ErrorBoundary.tsx:19-32` y `App.tsx:119-127`; `pwa-recovery.js:19-33` contradice el comentario de `main.tsx:46`.

**Arreglo.** `registerType: 'prompt'` con `onNeedRefresh` → toast "Nueva versión, recargar" (y recarga automática solo si `useWorkoutStore.getState().active === null`); eliminar `skipWaiting()` del `install` (Workbox lo gestiona con `messageSkipWaiting`); consolidar la recuperación de chunks en un único módulo con una sola clave y una sola política de caché.

**Esfuerzo.** M.

### 8. [Media] Precache al 96 % del presupuesto; `SettingsPage` y `ascension-title.png` son los candidatos obvios

**Evidencia.** Build: `precache 40 entries (1470.03 KiB)` vs 1536 KiB. Mayores entradas: `vendor-react` 222,7, `index.js` 209,6, `index.css` 156,0, `SettingsPage` 136,1, `DashboardCharts` 79,2 KiB. `SettingsPage.tsx:7-14` importa estáticamente `MealConfigurator` (arrastra `@hello-pangea/dnd`, 8 refs `data-rfd` en el chunk), `HevyImportModal` (532 líneas), `RestoreBackupModal` (500) y `WeightLossPlan`. `public/ascension-title.png` es un PNG RGBA de 1024×353 y **448 KB**, usado en `Layout.tsx:156,173` (cabecera de todas las páginas) y `PageLoader.tsx:3`; está excluido del precache (`vite.config.ts:22`), así que el `PageLoader` offline muestra imagen rota.

**Impacto.** Cualquier feature nueva rompe el presupuesto; 448 KB de logotipo en cada primera carga (LCP en móvil 3G ≈ +1,2 s); `PageLoader` sin logo offline.

**Arreglo.** Lazy-load de los tres modales y `MealConfigurator` desde `SettingsPage` (ahorro estimado ≥60 KiB en precache, ~20 KB gzip); exportar `ascension-title` como SVG o WebP ≤25 KB y volver a incluirlo en el precache; `vendor-lucide` nunca se genera porque los iconos se tree-shakean (bien), se puede borrar la regla de `manualChunks:63`. Añadir `size-limit` o `vite-plugin-bundlesize` en CI con los presupuestos de `CONSTRAINTS.md`.

**Esfuerzo.** S.

### 9. [Media] Recharts (89,5 KB gzip) se descarga en Nutrición para un gráfico de tarta

**Evidencia.** `src/components/nutrition/NutritionPieChart.tsx:1` importa `PieChart` de recharts; `NutritionPage.tsx:16` lo carga lazy y `useNutritionDiary.ts:24-27` lo activa a los 150 ms de montar, así que en la práctica se descarga en cada visita. El chunk `CategoricalChart-*.js` pesa 300 KB (89,5 gzip) y lo comparten `DashboardCharts` y `NutritionPieChart`. `routePreload.ts:31-35` precarga todas las páginas en idle.

**Impacto.** Segundo chunk más pesado de la app por un donut de 3 segmentos; en el dashboard es más defendible (líneas + barras).

**Arreglo.** Sustituir `NutritionPieChart` por un donut SVG propio (`stroke-dasharray`, ~40 líneas, accesible con `<title>`), lo que deja recharts solo en el Dashboard; valorar a medio plazo `chart.js`/`uPlot` o `visx` (≈15-30 KB gzip) para las series del dashboard.

**Esfuerzo.** S (donut), M (migrar dashboard).

### 10. [Media] Puntos calientes de render: suscripciones al objeto `active` completo y reloj de 500 ms en `Layout`

**Evidencia.** 7 componentes se suscriben a `useWorkoutStore((s) => s.active)` (`Layout.tsx:66`, `active-workout.tsx:139,486`, `ActiveWorkoutBanner.tsx:11`, `dashboard.tsx:23`, `exercise-picker.tsx:40`, `history.tsx:42`). Cada `updateSet` crea un nuevo `active` (`store.ts:117-127`), por lo que escribir un peso re-renderiza `Layout` entero (nav, menú, banner) y las vistas montadas. `Layout.tsx:68` `useNow(activeWorkout !== null, 500)` re-renderiza `Layout` 2 veces/s durante todo el entrenamiento. `exercise-card.tsx:52` se suscribe a `restTimers` completo.

**Impacto.** INP en móviles de gama media al teclear series (presupuesto ≤200 ms en `CONSTRAINTS.md`); batería durante sesiones de 60-90 min.

**Arreglo.** Seleccionar primitivos (`s.active !== null`, `s.active?.startedAt`, `s.restTimers[exerciseId]`) o `useShallow`; mover el reloj a un componente hoja `<ElapsedTimer startedAt />` para que solo él re-renderice; medir con React Profiler antes/después y dejar la cifra en el PR.

**Esfuerzo.** S.

### 11. [Media] 16 ficheros superan las 500 líneas de `CONSTRAINTS.md` §3.1

**Evidencia** (`wc -l`):

| Fichero | Líneas |
| --- | ---: |
| `src/components/workout/history.tsx` | 793 |
| `src/components/FoodSearchModal.tsx` | 777 |
| `src/components/workout/active-workout.tsx` | 775 |
| `src/utils/fitnessCalculators.ts` | 703 |
| `src/components/workout/exercise-picker.tsx` | 667 |
| `src/components/utilities/UnitConverter.tsx` | 581 |
| `src/components/workout/exercise-details-modal.tsx` | 580 |
| `src/components/utilities/AiNutritionChef.tsx` | 562 |
| `src/lib/workout/store.ts` | 554 |
| `src/components/workout/WorkoutCelebrationModal.tsx` | 551 |
| `src/components/workout/exercise-card.tsx` | 544 |
| `src/components/workout/exercises/MergeExerciseModal.tsx` | 536 |
| `src/components/workout/HevyImportModal.tsx` | 532 |
| `src/components/workout/swipeable-set-row.tsx` | 525 |
| `src/pages/SettingsPage.tsx` | 508 |
| `src/components/settings/RestoreBackupModal.tsx` | 500 (en el límite) |

**Propuesta de división para los tres peores.**

*`history.tsx` (793)* — un único `HistoryView` con lista infinita, diálogo de detalle (`:152-490`), diálogo de borrado (`:491-547`), `Stat` (`:549`) y `HistoryItem` memoizado (`:575-610`):
- `history/HistoryList.tsx` (lista + `useWorkoutHistory` + "cargar más")
- `history/HistoryItem.tsx` (ya memoizado, extraer tal cual)
- `history/WorkoutDetailDialog.tsx` (`:152-490`, con `Stat` dentro)
- `history/DeleteWorkoutDialog.tsx` (`:491-547`)
- `hooks/workout/useHistoryActions.ts` (editWorkout/startFromHistory/delete con confirmación)

*`FoodSearchModal.tsx` (777)* — 12 `useState`, 4 efectos, 8 handlers asíncronos (búsqueda OFF `:171`, OCR `:239`, código de barras `:284`, IA `:474`, confirmación `:421`) y tres fuentes de resultados:
- `hooks/nutrition/useFoodSearch.ts` (query + debounce + `searchRequestId` + `signal`)
- `hooks/nutrition/useFoodCapture.ts` (OCR, barcode, voz, IA: todos comparten `aiSubmitting`/`aiElapsedSeconds`)
- `food/FoodSearchBar.tsx` (`:688-756`), `food/FoodResultsPanel.tsx` (`:757+`, ya existe `FoodSearchResultsList`), `food/SelectedFoodPanel.tsx` (cantidad + comida + confirmar)
- `FoodSearchModal.tsx` queda como orquestador < 150 líneas.

*`active-workout.tsx` (775)* — tres componentes en un fichero (`ActiveWorkout :56`, `LiveSession :137`, `FooterActions :485`) más helpers de fecha (`:39-55`):
- `workout/active/ActiveWorkoutEmptyState.tsx` (`:56-136`)
- `workout/active/LiveSession.tsx` (`:137-484`), con `LiveSessionHeader.tsx` (título editable + selector de fecha, `:146-260` aprox.)
- `workout/active/FooterActions.tsx` (`:485-775`) y `hooks/workout/useFinishWorkout.ts` (lógica de `handleSaveEdit`/`onSave` duplicada en `:527-556` y `:750-766`)
- `lib/workout/datetime.ts` (`toLocalDatetimeString`/`fromLocalDatetimeString`).

**Esfuerzo.** M por fichero; L para la lista completa.

### 12. [Media] `DOMPurify` sin configuración sobre salida de IA y PII en `localStorage`

**Evidencia.** `src/components/utilities/AiNutritionChef.tsx:61,70`: `DOMPurify.sanitize(formatted)` por defecto (permite `<a href>`, `<img src>`, `<table>`, atributos `style`) para renderizar un markdown de solo `**` y `*`. `AuthContext.tsx:51-62` persiste `{email, name, picture}` en `localStorage` (`ascension_cached_user`), necesario para el modo offline. El token de acceso se difunde entre pestañas por `BroadcastChannel` (`client.ts:66,142`), mismo origen, aceptable.

**Impacto.** Si el backend reenviase contenido del modelo con enlaces (`<a href="https://phishing">`) o imágenes de rastreo, se renderizarían dentro de la app; no hay XSS por CSP+DOMPurify, pero sí superficie innecesaria.

**Arreglo.** Sustituir el `innerHTML` por render React: `parseInline(text): ReactNode[]` que devuelve `<strong>`/`<em>` (elimina DOMPurify de la ruta y 20 KB gzip de la dependencia) o, como mínimo, `DOMPurify.sanitize(x, { ALLOWED_TAGS: ['strong','em'], ALLOWED_ATTR: [] })`.

**Esfuerzo.** S.

### 13. [Media] Recuperación de chunks y `logout` borran más de lo previsto

**Evidencia.** `AuthContext.tsx:269-274`: `localStorage.clear()` conserva solo `ascension_custom_color`; se pierde `ascension_theme` (`main.tsx:16`), `ascension:rate-preference` (`useRatePreference.ts:10`) y `ascension_weight_loss_plan` (`WeightLossPlan.tsx:24`). `public/pwa-recovery.js:19-33` borra todas las cachés y desregistra el SW ante cualquier mensaje que contenga `mime type` o `reading 'default'` (regex `:8-11`), incluido un `TypeError` ajeno a chunks.

**Impacto.** Cerrar sesión devuelve la app al tema "brutal" y borra el plan de pérdida de peso local; un error de programación con "reading 'default'" en producción destruye el shell offline.

**Arreglo.** Lista blanca de claves que sobreviven al logout (`ascension_theme`, color, preferencias de UI) y borrado explícito de las de datos; en `pwa-recovery.js` limitar la regex a fallos de carga de módulo (`Failed to fetch dynamically imported module`, `Importing a module script failed`) y no tocar el precache (dejar que Workbox limpie revisiones).

**Esfuerzo.** S.

### 14. [Media] Claves de query planas, invalidaciones a claves inexistentes y fechas en UTC

**Evidencia.** `main.tsx:29-32` invalida `['workouts']` y `['workout-history']`, que no existen como query en `src/` (solo aparecen en invalidaciones: `api.ts:58-60,75-78`); la clave real es `['workoutHistory']`. 29 claves literales repartidas en 20 ficheros sin factoría. `client.ts:301` y `SettingsPage.tsx:131` usan `toISOString().split('T')[0]` pese al aviso de `utils/dateHelper.ts:1-4`.

**Impacto.** Invalidaciones muertas que nadie detecta; renombrar una clave rompe silenciosamente la coherencia de caché; el fichero de backup/CSV lleva la fecha de ayer entre las 00:00 y las 02:00 en España.

**Arreglo.** `src/api/queryKeys.ts` con factoría tipada (`queryKeys.workouts.history()`, `.recent(days)`), borrar claves muertas, usar `getLocalDateString()` en los dos puntos citados. Regla ESLint `no-restricted-syntax` para `toISOString().split`.

**Esfuerzo.** S.

### 15. [Media] Cobertura 23 %: módulos críticos de negocio sin tests

**Evidencia** (`coverage-final.json`, % de statements): `useNutritionDiary.ts` **0 %** (449 LOC), `notifications.ts` **3,6 %** (185 LOC), `dateHelper.ts` **3 %**, `portionHelper.ts` **0 %** (sanitización de kcal por Atwater), `store.ts` 39,7 % (sin cubrir `toggleSet`/`adjustRest`/`finishWorkout`/`migrate`, líneas 313-534), `api.ts` 31 % (PUT-vs-POST en `useSaveWorkout:46-55`, sync de preferencias `:232`), `client.ts` 54 % (interceptor 401 `:181-288` sin cubrir), `useScannerAndOCR.ts` 0 %, `useFoodForms.ts` 0 %, `colorHelper.ts` 0 %. Bien cubiertos: `fitnessCalculators.ts` 81 %, `nutritionCalculators.ts` 82 %, `import.ts` 88 %, `nutritionHelpers.ts` 92 %, `trackingHelpers.ts` 96 %.

**Los 5 módulos de mayor valor por riesgo de negocio, en orden:**
1. `src/lib/workout/store.ts` — `toggleSet` (programa el descanso y la notificación push), `finishWorkout` (cálculo de duración/`finishedAt`, mínimo 60 s), `migrate` (datos del usuario en IDB). Tests puros de store con `idb-keyval` mockeado.
2. `src/api/client.ts:180-293` — cola de 401, refresh concurrente, 403 no cierra sesión. Tests con `msw` o `axios-mock-adapter` y `navigator.locks` ausente.
3. `src/hooks/nutrition/useNutritionDiary.ts` — mutaciones de añadir/mover/borrar log, invalidaciones, colapso de comidas. `renderHook` + `QueryClientProvider` + msw.
4. `src/utils/portionHelper.ts` + `src/utils/dateHelper.ts` — `getSanitizedKcal` (umbral 30 % kJ/kcal) y `formatFriendlyDate`/`addDaysToDateString` con zona horaria fijada (`vi.setSystemTime`, `TZ=Europe/Madrid`). Puros y baratos.
5. `src/lib/workout/notifications.ts` — `scheduleServerRestTimer`/`cancelServerRestTimer` (push desde el backend al terminar el descanso); mock de `fetch`/`api` y `Notification`.

**Impacto.** Los umbrales del ratchet (22/18/17/22) están a ≤1,2 puntos de la medición: cualquier refactor pequeño los rompe o, peor, se mantienen sin que la lógica que mueve dinero/datos esté probada.

**Arreglo.** Los cinco bloques anteriores (aprox. 60-80 tests) subirían statements a ~35 %; actualizar el ratchet en `vitest.config.ts` tras cada bloque. Añadir `@vitest/coverage-v8` `reportOnFailure` y `thresholds.perFile` solo para `utils/` y `lib/`.

**Esfuerzo.** M (≈2-3 días).

### 16. [Media] E2E: verde y estable, pero con esperas fijas, ruido de consola y puerto compartido

**Evidencia.** 75/75 en 45,7 s, 0 reintentos. 16 `page.waitForTimeout` (`tests/mobile-capture.spec.ts:33,40,47,127,162`, entre otros). 84 líneas `console.error: Error al cargar la config de auth: AbortError` en el log: `App.tsx:214-218` registra como error el abort que provoca su propia limpieza (`:220-222`) al desmontarse en StrictMode. 23 líneas `Fix any of the following` (axe en dev). `playwright.config.ts:69-73`: `reuseExistingServer: !CI` en el puerto fijo 5173 → si otro worktree tiene `vite` abierto, la suite prueba ese código, no el de la rama.

**Impacto.** Falsos verdes entre ramas en local; `waitForTimeout` es la causa típica de flakiness bajo carga de CI (4 workers); el ruido oculta errores reales.

**Arreglo.** `if (err.name === 'AbortError') return;` en `App.tsx:214`; sustituir `waitForTimeout` por `expect(locator).toBeVisible()`/`toHaveCSS` o `page.waitForFunction`; `reuseExistingServer: false` o puerto por `process.env.PORT` derivado del nombre del worktree; `reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list'`.

**Esfuerzo.** S.

### 17. [Media] `AuthContext`: cálculo en cada render y estado `isReady` muerto

**Evidencia.** `AuthContext.tsx:67-72`: `getInitialSession()` lee y parsea `localStorage` en cada render del provider (no está dentro de `useState(() => …)`); `:75` `useState(initialSession.token !== null)` es siempre `false` porque `token` siempre es `null` (`:69`). Las cinco funciones del contexto (`login`, `logout`, `updateToken`) se recrean en cada render y el `value` (`:292`) es un objeto nuevo → todos los `useAuth()` (`App.tsx`, `OnboardingScreen`, `LoginPage`, `SettingsPage`) re-renderizan con cada tick.

**Impacto.** Bajo en rendimiento (pocos consumidores), alto en legibilidad: tres sitios decodifican el JWT, `updateToken` no se usa.

**Arreglo.** `useState(() => getCachedUser())`, `isReady` inicial `false`, un solo `applyToken(token)` reutilizado por `initAuth`, `login` y el listener; `useMemo` para el `value`; borrar `updateToken`. Valorar mover la sesión a un store Zustand sin persistencia (`useAuthStore`) y dejar el contexto solo para el provider de Google.

**Esfuerzo.** S.

### 18. [Baja] `BarcodeScanner` (110 KB gzip) sin alternativa nativa

**Evidencia.** `src/components/BarcodeScanner.tsx:2` usa `html5-qrcode` (2.3.8, última publicación 2023) para EAN-13; Chrome Android, Safari iOS 17+ y Chrome desktop exponen `BarcodeDetector` nativo.

**Arreglo.** `if ('BarcodeDetector' in window)` → ruta nativa con `getUserMedia` + `requestAnimationFrame`; cargar `html5-qrcode` solo como fallback. Ahorra la descarga en la mayoría de móviles reales.

**Esfuerzo.** M.

### 19. [Baja] Carga manual de datos fuera de TanStack Query

**Evidencia.** `src/hooks/utilities/useAiNutritionChef.ts:83-103` (`fetchSummary` con `useState` de loading y `console.error`, sin cancelación ni caché), `src/components/MealConfigurator.tsx` y `OnboardingScreen.tsx` (`setLoading(true)` manual).

**Impacto.** Tres patrones de carga distintos; el resumen del asistente se vuelve a pedir en cada montaje.

**Arreglo.** `useQuery({ queryKey: ['assistant-summary', date] })` y `useMutation` para el chat.

**Esfuerzo.** S.

### 20. [Baja] Higiene de dependencias

**Evidencia.** `npm outdated`: `typescript` 5.9.3 → 7.0.2 (major, no migrar aún; esperar soporte de `typescript-eslint`), `eslint` 9.39 → 10.13 (major), `@types/node` 22 → 26 (mantener 22 por `Dockerfile:1` y `ci.yml:124`), `axios` 1.20 → 1.21, `lucide-react` 1.61 → 1.65, `react-router-dom` 7.18.4 → 7.18.5. `react-is` está en `dependencies` sin ningún import directo (solo peer de recharts). `prettier` instalado sin script `format`/`format:check` ni paso en CI. `react-body-highlighter` 2.0.5 (peer `react >=16`, sin releases recientes) es dependencia única de `body-heatmap.tsx`. La regla `manualChunks` para `vendor-lucide` (`vite.config.ts:63`) nunca produce chunk.

**Arreglo.** Subir patches; `npm run format:check` en CI; mover `react-is` a `peerDependencies`-only vía `overrides` o dejarlo documentado; vigilar `react-body-highlighter` (alternativa: SVG propio con los 14 grupos musculares ya definidos en `types.ts`). Activar Dependabot para `frontend/` con agrupación de minors.

**Esfuerzo.** S.

### 21. [Baja] Cachés runtime del SW sin caducidad temporal y sin estrategia para imágenes externas

**Evidencia.** `sw.ts:29-35`: `food-search-cache` con `maxEntries: 100` pero sin `maxAgeSeconds`; no hay ruta para `images.openfoodfacts.org`/`raw.githubusercontent.com` (GIFs de ejercicios, `exercise-card.tsx:200`), que se descargan de nuevo en cada sesión offline-first.

**Arreglo.** `maxAgeSeconds: 7 días` en búsquedas; `CacheFirst` con `ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 días })` para los GIFs de ejercicios, respetando `img-src` de la CSP.

**Esfuerzo.** S.

---

## Lo que ya está bien

- **Token solo en memoria** con cookie HttpOnly de refresco; limpieza de tokens heredados en Web Storage (`client.ts:13-33`); el 403 no cierra sesión (`client.ts:152-160`); `navigator.locks` para refresco entre pestañas.
- **Presupuestos de `CONSTRAINTS.md` §1 y §2 cumplidos**: 0 `@ts-ignore`, 0 `eslint-disable` en producción, 0 `any` explícito, `index.js` 69 KB gzip (≤180), CSS 26 KB gzip (≤40), precache 1470 KiB (≤1536).
- **Code-splitting correcto por ruta** con `lazyWithRetry`, `manualChunks` para React/Query/Radix/date-fns, y los dos chunks pesados (recharts, html5-qrcode) lazy y fuera del precache; precarga en idle de rutas.
- **Navegaciones `NetworkOnly` con fallback a shell precacheado** (`sw.ts:14-26`): evita el clásico "index.html viejo apunta a chunks borrados".
- **Store de entrenamiento** con `partialize`, `migrate` con valores por defecto, migración del nombre `forja-v1` y mantenimiento del `active` hasta confirmación del servidor (`store.ts:432`); `useSaveWorkout` mantiene el entrenamiento local si falla el guardado y lo comunica (`active-workout.tsx:761-765`).
- **Listas memoizadas** donde importa (`HistoryItem`, `ExerciseCard`, `SwipeableSetRow` con selectores por id).
- **Suite E2E amplia** (19 specs, 75 casos, incluidos flujos de resiliencia 401/offline y `#185`), rápida (46 s) y sin flakiness observada; `page.route` en 16 ficheros, sin backend real.
- **Lint y typecheck en verde**, `strict: true`, alias `@/`, CI con `npm run test:coverage` y umbral ratchet.
- Buen manejo de `AbortController` + timeout en la carga de configuración de auth (`App.tsx:196-222`) y timeouts ampliados (45 s) solo en endpoints de IA.
- CSP estricta en nginx y Vercel (`object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`), `Permissions-Policy` limitada a cámara y micro.
