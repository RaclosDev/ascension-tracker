# Auditoría backend — Ascension Tracker

- **Alcance:** `backend/` en `main` @ `331033d` (Spring Boot 4.1.2, Java 17, Hibernate 7.4.13, Spring Framework 7.0.10, Postgres 16 en Testcontainers, 28 migraciones Flyway).
- **Modo:** solo lectura. No se ha modificado ningún fichero versionado. `target/` se regeneró con `mvn clean test-compile` para ver los avisos de deprecación.
- **Guías aplicadas:** `spring-boot-review`, `code-review-and-quality` (cinco ejes) y `performance-optimization` (medir antes de optimizar; N+1, índices, peticiones sin límite).
- **Comandos ejecutados:**
  - `./mvnw -B verify`: **BUILD SUCCESS, 318 tests, 0 fallos, 0 errores, 0 omitidos, 1 min 05 s** (log en `scratchpad/audit2/verify.log`).
  - `./mvnw -B -o clean test-compile -Dmaven.compiler.showDeprecation=true -Dmaven.compiler.showWarnings=true`

Las prioridades tienen en cuenta el despliegue real: un único dyno de Heroku (512 MB), el router de Heroku que corta las peticiones a los 30 s (error H12) y una PWA offline-first.

---

## Hallazgos

### 1. [Alta] La restauración de backups no usa inserciones por lotes y supera el límite de 30 s del router con datos reales
- **Evidencia:**
  - `application.yml:21-27`: solo está configurado `default_batch_fetch_size`. Faltan `hibernate.jdbc.batch_size`, `order_inserts` y `order_updates`.
  - `FoodLog.java:21`, `SavedFood.java:21`, `WeightEntry.java:14`, `StepsEntry.java:18`, `Meal.java:17` y `Recipe.java:21` usan `GenerationType.IDENTITY`, y Hibernate desactiva el batching JDBC con IDENTITY.
  - `UserDataRestoreService.java:380-416` hace un `foodLogRepository.save()` por fila. `flushAndClearBatch` (l. 85-90) vacía el contexto cada 100 entidades, pero sin `batch_size` cada fila sigue siendo un viaje de ida y vuelta.
  - `restoreWorkouts` (l. 254-329) inserta workout, ejercicios y series uno a uno. Con las cuotas por defecto (`application.yml:79-87`: 3000 workouts, 25 000 food logs, 2000 pesos, 2000 pasos), un backup lleno supone más de 100 000 INSERT individuales dentro de una sola transacción.
- **Impacto:** con unos 0,5-1 ms de latencia por sentencia dentro de la región, la restauración tarda claramente más de 30 s. Heroku devuelve H12 al cliente, pero la transacción sigue abierta en el dyno, ocupa una conexión del pool (máximo 8) y bloquea filas. El usuario reintenta y la restauración se ejecuta dos veces.
- **Solución:**
  1. Añadir `spring.jpa.properties.hibernate.jdbc.batch_size: 50`, `order_inserts: true` y `order_updates: true`.
  2. Para las tablas con IDENTITY, cambiar a `@GeneratedValue(strategy = SEQUENCE)` con `@SequenceGenerator(allocationSize = 50)`. Requiere una migración nueva (V29) que cree o reutilice la secuencia de cada `bigserial` y le ajuste `INCREMENT BY 50`.
  3. Como alternativa más directa, hacer la restauración con `JdbcTemplate.batchUpdate` o `COPY`, ya que el wipe ya usa JDBC (`UserOwnedTables`).
  4. Mover la restauración a un trabajo asíncrono (`202 Accepted` + estado consultable) o al menos limitarla por tamaño.
- **Esfuerzo:** M

### 2. [Alta] Gemini: el plazo total de 35 s supera el límite de 30 s del router y no se aplica a cada llamada HTTP
- **Evidencia:**
  - `GeminiApiClient.java:32`: `TOTAL_REQUEST_DEADLINE_MS = 35_000L`.
  - `application.yml:111`: `GEMINI_READ_TIMEOUT_MS:25000`.
  - `checkDeadline` solo se comprueba entre intentos (l. 141, 170, 347). Una llamada que empieza en el segundo 34 puede durar hasta el 59.
  - El peor caso encadena el modelo en caché, 3 modelos × 3 intentos (l. 139-186, 342-381) y el descubrimiento de modelos (l. 268-273), que también usa un read timeout de 25 s.
  - El mensaje de `applyBackoff` dice "(20s)" (l. 448), lo que no coincide con la constante.
  - El descubrimiento se ejecuta dentro de `synchronized (this)` (l. 156-163), así que todas las peticiones de IA esperan mientras dura.
- **Impacto:** el cliente recibe H12 mientras el hilo de Tomcat sigue trabajando y consumiendo cuota de Gemini. Si las llamadas son lentas, muchos hilos quedan bloqueados a la vez.
- **Solución:**
  1. Fijar un presupuesto total por debajo de 30 s (por ejemplo 25 s).
  2. Calcular el timeout de cada intento como `min(readTimeout, deadline - now)`. Se puede usar `RestClient` con `JdkClientHttpRequestFactory` y un timeout por petición en `HttpRequest.Builder.timeout`, o un `TimeLimiter` de Resilience4j.
  3. Reducir a 2 modelos × 2 intentos.
  4. Hacer el descubrimiento de modelos de forma asíncrona y programada (por ejemplo, `@Scheduled` cada hora), fuera del camino de la petición.
- **Esfuerzo:** M

### 3. [Alta] Búsqueda de alimentos: bloqueos de E/S en el `ForkJoinPool` común y llamadas que siguen en marcha tras el timeout
- **Evidencia:**
  - `FoodExternalService.java:287-305`: usa `CompletableFuture.supplyAsync(...)` sin executor, es decir, el `commonPool`. En un dyno con 1-2 CPU el paralelismo es 1 o el JDK crea un hilo por tarea.
  - `FoodExternalService.java:308-317`: impone un plazo global de 4 s y después llama a `cancel(true)`. `CompletableFuture.cancel` **no interrumpe** la tarea en curso.
  - `FatSecretClient.java:77-110` reintenta hasta 3 veces con un read timeout de 15 s (`application.yml:103-106`). La llamada puede seguir viva unos 45 s después de que el usuario haya recibido la respuesta.
  - `OpenFoodFactsClient` hereda 15 s por defecto (`ExternalApiProperties.java:17`).
  - El endpoint tiene un rate limit por usuario de 20/min (`application.yml:73`), sin bulkhead global.
- **Impacto:** cada búsqueda puede dejar hasta dos hilos ocupados decenas de segundos. Con concurrencia moderada se agotan los hilos y la memoria del dyno, y FatSecret se satura con reintentos que nadie va a esperar.
- **Solución:**
  1. Usar un `ThreadPoolTaskExecutor` acotado propio (por ejemplo 4-8 hilos con cola pequeña) o, al migrar a Java 21, hilos virtuales.
  2. Alinear los timeouts con el presupuesto: connect 1 s, read 3 s, 1 reintento como máximo.
  3. Usar `orTimeout`/`completeOnTimeout` y propagar la cancelación cerrando la petición.
  4. Añadir un circuit breaker y un bulkhead por proveedor (ver #9).
- **Esfuerzo:** M

### 4. [Media] La caché `foodSearch` no tiene límite de memoria, normaliza mal la clave y guarda JSON sin filtrar
- **Evidencia:**
  - `application.yml:3-5`: `maximumSize=1000,expireAfterWrite=24h`, sin weigher ni `recordStats`.
  - `OpenFoodFactsClient.java:213-214`: la búsqueda no envía `fields=`, así que OFF devuelve documentos de producto completos. `FoodExternalService.java:319-346` los concatena sin filtrar y los cachea como `String`.
  - `FoodExternalService.java:281`: la clave `'q:' + #query` no normaliza mayúsculas, espacios ni acentos. La condición `unless = "#result.contains('error')"` busca la subcadena en todo el JSON, de modo que cualquier producto con "error" en un campo impide cachear el resultado.
  - No he podido medir el tamaño real de la respuesta de OFF: la petición de prueba fue bloqueada por la política de herramientas.
- **Impacto:** la memoria de la caché depende del tamaño de las respuestas de terceros y puede ser una parte importante de un heap de unos 300 MB. La tasa de aciertos es baja y el contenido que llega al cliente es el JSON en bruto de terceros (ver #15).
- **Solución:**
  - Pedir solo los campos necesarios con `fields=product_name,brands,nutriments,serving_size,code,...` y mapear a un DTO propio.
  - Configurar `Caffeine.maximumWeight(...)` con un `weigher` por longitud o un `maximumSize` más pequeño, y `recordStats()` expuesto en Actuator.
  - Normalizar la clave (`trim().toLowerCase(Locale.ROOT)` + NFC).
  - Cachear el objeto mapeado y no cachear errores lanzando una excepción en lugar de buscar subcadenas.
- **Esfuerzo:** S-M

### 5. [Media] `GlobalExceptionHandler` convierte errores 4xx de Spring en 500 y las respuestas de error no son coherentes
- **Evidencia:**
  - `GlobalExceptionHandler.java:188-193`: `@ExceptionHandler(Exception.class)` captura todo. No hay handlers para `NoResourceFoundException` (404), `HttpRequestMethodNotSupportedException` (405), `HttpMediaTypeNotSupportedException` (415) ni `MissingRequestHeaderException`, y la clase no extiende `ResponseEntityExceptionHandler`. `ExceptionHandlerExceptionResolver` se evalúa antes que `DefaultHandlerExceptionResolver`, así que todas acaban como 500 con un log ERROR y stack trace. Es comportamiento documentado de Spring MVC; no está cubierto por ningún test (`grep NoResourceFound|MethodNotSupported` en `src/test` no devuelve nada).
  - L. 88-94: devuelve `ex.getMessage()` de cualquier `IllegalArgumentException`, incluidas las de librerías. Por ejemplo, `Base64.getDecoder().decode` en `GeminiAiService.java:70` y `:265` genera "Illegal base64 character 2d".
  - Estados poco adecuados:
    - `DataIntegrityViolationException` responde 400 (l. 181-186); lo correcto es 409.
    - `AiProcessingException` responde 400 (l. 142-147); lo correcto es 502.
    - `UserDataQuotaExceededException` responde 429 (l. 135-140); no es un límite de frecuencia, debería ser 409 o 422.
  - Formatos distintos: `AuthController` responde `Map.of("error", ...)` sin `trace_id` (l. 107, 115, 123, ...) y `JsonSizeLimitFilter.java:30-31` escribe `text/plain`.
  - El `trace_id` es un UUID aleatorio por error (l. 33 y siguientes) que no aparece en ningún otro log de la petición: no hay MDC ni filtro de correlación (`grep MDC` no devuelve nada).
- **Impacto:** se monitorizan como errores del servidor cosas que son errores del cliente, se ensucian los logs ERROR, los clientes reciben mensajes internos y el `trace_id` no sirve para correlacionar.
- **Solución:**
  1. Extender `ResponseEntityExceptionHandler` y adoptar `ProblemDetail` (RFC 9457) con `spring.mvc.problemdetails.enabled=true`.
  2. Hacer que el catch-all respete `ErrorResponse`/`@ResponseStatus`.
  3. Exponer solo mensajes de excepciones propias (`InvalidInputException`).
  4. Añadir un `OncePerRequestFilter` que genere `X-Request-Id`, lo ponga en el MDC y lo devuelva en el `ProblemDetail`, o usar Micrometer Tracing.
  5. Unificar `AuthController` y el filtro con el mismo formato de error.
- **Esfuerzo:** S-M

### 6. [Media] El registro de comidas por IA no es atómico y el lock de cuota se aplica fuera de una transacción
- **Evidencia:**
  - `GeminiAiService.java` no es `@Transactional`. En l. 145-152 recorre las comidas devueltas por la IA y llama a `nutritionLogService.addFoodLog` por cada una. Cada llamada abre su propia transacción, con cuota, `pg_advisory_xact_lock`, `count(*)`, INSERT y búsqueda en `saved_foods` (`NutritionLogService.java:105-129`).
  - La cuota previa solo reserva 1 (l. 75), aunque el modelo devuelva N alimentos.
  - `UserDataQuotaService.java:27-35`: `pg_advisory_xact_lock` dentro de un `catch (Exception ignored)`. Fuera de una transacción el lock se libera en el mismo autocommit, así que no protege nada.
  - Ya existe un método atómico equivalente, `NutritionLogService.applyAssistantFoods` (l. 160-212).
- **Impacto:** si falla una inserción a mitad, quedan comidas a medias. Hay 4-5 sentencias por alimento, la cuota se puede saltar con peticiones concurrentes y los fallos del lock se ignoran.
- **Solución:** persistir con un único método `@Transactional` que valide la cuota con `foods.size()` y use `saveAll`, reutilizando `applyAssistantFoods`. En `acquireUserQuotaLock`, añadir `@Transactional(propagation = MANDATORY)` y dejar de capturar la excepción.
- **Esfuerzo:** S

### 7. [Media] Refresh tokens: `graceUsed` se escribe pero nunca se lee, y la limpieza nocturna elimina la detección de reutilización
- **Evidencia:**
  - `RefreshTokenService.java:181-188`: dentro de la ventana de gracia, un token ya rotado genera un token nuevo **cada vez** que se presenta. `setGraceUsed(true)` (l. 185) no se consulta en ningún sitio (`grep graceUsed` solo devuelve el setter).
  - `RefreshTokenCleanupService.java:263` borra los tokens con `replaced_at` anterior a "ahora menos 10 s" cada noche. Después, reutilizar un token robado da "not found" en lugar de revocar toda la familia (l. 189-191).
  - Hay valores por defecto distintos para la gracia: `@Value(...:300)` en `RefreshTokenService.java:113` frente a `REFRESH_GRACE_SECONDS:30` en `application.yml:91`.
  - El instante de creación se deduce como `expiryDate - 30 días` (l. 172), sin columna `created_at`.
- **Impacto:** en la ventana de gracia, un token interceptado puede generar un número ilimitado de sesiones válidas. Además, la detección de reutilización solo funciona hasta las 03:00.
- **Solución:**
  1. Permitir una sola reemisión en gracia: si `graceUsed`, revocar la familia.
  2. Conservar los tokens rotados hasta su `expiryDate` (o al menos N días) para que la detección siga funcionando.
  3. Añadir `issued_at` en V29.
  4. Unificar el valor por defecto en `@ConfigurationProperties`.
- **Esfuerzo:** S

### 8. [Media] Endpoints de listas sin límite que devuelven grafos completos (producto cartesiano)
- **Evidencia:**
  - `GET /api/workouts/recent?since=`: `WorkoutRepository.java:20-21` usa `@EntityGraph({"exercises","exercises.sets"})` sin límite. El frontend pide **un año** y filtra a 60 días en el cliente (`frontend/src/lib/workout/api.ts:29-38`). El fetch join de dos colecciones devuelve workouts × ejercicios × series filas. `since=0` (permitido por `@Min(0)`, `WorkoutController.java:44`) devuelve hasta 3000 workouts.
  - `GET /api/workouts/exercise-history/{id}`: `WorkoutExerciseRepository.java:13-14` usa `DISTINCT ... LEFT JOIN FETCH we.sets` sin paginar. No tiene consumidor en el frontend (`grep exercise-history` en `frontend/src` no devuelve nada).
  - Semanas sin límite desde el primer registro:
    - `/api/nutrition/calories/weekly` (`NutritionLogService.java:54-103`, `FoodLogRepository.java:20-21`)
    - `/api/weights` y `/api/weights/weekly` (`WeightService.java:27, 140`)
    - `/api/steps` y `/api/steps/weekly` (`StepsService.java:24, 50`)
  - `/api/nutrition/my-foods` corta en 200 sin avisar al cliente (`NutritionLogService.java:250`).
- **Impacto:** las respuestas y el trabajo de Hibernate crecen con el historial del usuario y el `/recent` se carga en la pantalla principal. La serialización ocupa memoria del heap del dyno.
- **Solución:**
  - Que el frontend envíe el rango real (60 días) y el backend imponga un tope (por ejemplo `since >= now - 400 d` y `LIMIT 200`).
  - Para `/recent`, dos consultas: ids paginados y después `@BatchSize` (ya configurado). Así se evita el fetch join de dos colecciones, como en `getWorkoutHistory`, que no tiene este problema.
  - Paginar `exercise-history` con `Pageable` (o eliminarlo si no se usa).
  - Aceptar `from`/`to` en los endpoints semanales.
- **Esfuerzo:** S-M

### 9. [Media] Resiliencia de clientes externos hecha a mano, desigual y sin circuit breaker salvo en Gemini
- **Evidencia:**
  - Cada cliente implementa su propio bucle de reintentos con `Thread.sleep`: `FatSecretClient.java:77-110, 153-162` y `GeminiApiClient.java:342-381, 443-456`.
  - OpenFoodFacts no tiene reintentos ni circuit breaker (`OpenFoodFactsClient.java:211-258`). Web Push tampoco tiene circuit breaker.
  - El circuit breaker de Gemini es casero y no tiene estado half-open: al acabar el enfriamiento pasa todo el tráfico (`GeminiQuotaService.java:37-43, 85-96`).
  - Las cuotas de IA viven en memoria (`GeminiQuotaService.java:31-32`) y se reinician con el reinicio diario del dyno.
  - `GeminiApiClient` y `PushNotificationService` crean `new ObjectMapper()` (l. 48 y 54) en lugar de inyectar el `JsonMapper` de Boot.
- **Impacto:** el comportamiento ante fallos es distinto en cada proveedor, no hay métricas y las cuotas se pueden saltar tras un reinicio.
- **Solución:**
  - Unificar con Resilience4j (CircuitBreaker + Retry con backoff exponencial y jitter + Bulkhead + TimeLimiter) por proveedor, o con las anotaciones de resiliencia de Spring Framework 7 (`@Retryable`, `@ConcurrencyLimit`) complementadas con el circuit breaker de Resilience4j.
  - Exponer las métricas en Actuator.
  - Persistir la cuota diaria de IA en Postgres (tabla `ai_usage(user_email, day, count)` con `INSERT ... ON CONFLICT DO UPDATE`).
- **Esfuerzo:** M

### 10. [Media] Web Push: API deprecada, claves VAPID inválidas que se ignoran en silencio y entrega como mucho una vez
- **Evidencia:**
  - `PushNotificationService.java:249` llama a `pushService.sendAsync(notification)`, deprecado según javac (`PushNotificationService.java:[249,33] sendAsync(...) has been deprecated`). En `:250` se captura `NoSuchMethodError`.
  - `PushConfig.java:440-447`: si las claves VAPID no son válidas, el `catch (Exception ignored)` devuelve un `new PushService()` sin configurar y todas las notificaciones fallan sin un log claro.
  - `PushNotificationService.java:68-83` duplica esa inicialización, aunque es código muerto porque el bean siempre existe.
  - `RestTimerService.java:310-322` marca el temporizador `COMPLETED` antes de enviar. Si el dyno se reinicia entre medias, la notificación se pierde.
  - La detección de 404/410 busca subcadenas en el mensaje (`PushNotificationService.java:239`).
  - El endpoint de la suscripción, que es una URL de capacidad, aparece completo en los logs WARN/ERROR (l. 225, 230, 233, 238).
  - El sondeo se ejecuta cada 1 s con UPDATE + `SELECT ... FOR UPDATE SKIP LOCKED` (l. 149-151): unas 170 000 sentencias al día.
- **Impacto:** fallos silenciosos en producción, notificaciones perdidas y datos sensibles en los logs.
- **Solución:**
  - Usar `pushService.send(notification, Encoding.AES128GCM)` de forma síncrona: ya se ejecuta en `pushExecutor`, así que no hace falta el `Future`. Configurar los timeouts del cliente HTTP.
  - Fallar en el arranque si las claves VAPID no son válidas y eliminar el `init()` duplicado.
  - Pasar a estados `SENDING` → `SENT`/`FAILED` con reintento acotado.
  - Enmascarar el endpoint (solo el host).
  - Subir el intervalo de sondeo a 2-5 s.
- **Esfuerzo:** S-M

### 11. [Media] `@Valid` sobre contenedores (HV000271): sintaxis deprecada en Hibernate Validator 9
- **Evidencia:** `verify.log` muestra HV000271 para `MealController#updateMeals`, `chatHistory`, `foods`, `foodLogs`, `workoutTemplates`, `weightEntries`, `customExercises`, `recipes`, `meals`, `stepsEntries`, `savedFoods`, `workouts`, `exercises` y `sets` (×2). Ubicaciones en el código:
  - `MealController.java:35`: `@Valid @RequestBody List<MealDTO>`, además **sin `@Size`**, lo que permite una lista de cualquier tamaño.
  - `WorkoutDTO.java:21-24` (`exercises`) y `WorkoutExerciseDTO.java:19-21` (`sets`).
  - `WorkoutTemplateDTO.java:16-19`: `@Valid` en el campo **y** en el argumento de tipo, es decir, cascada doble.
  - `AiApplyRequestDTO.java:31-32` (`foods`) y `AiChatRequestDTO.java:26-27` (`chatHistory`).
  - Los 9 campos de lista de `UserDataExportDTO` (`foodLogs`, `workouts`, etc.).
  - `WorkoutImportRequestDTO.java:18, 22` ya usa la forma correcta, `List<@Valid X>`.
  - `WorkoutExerciseDTO.VariantDTO` (`grip`/`machine`) no tiene `@Size`, aunque las columnas son `varchar(255)`. Un valor largo provoca `DataIntegrityViolation` en lugar de un 400 de validación.
- **Solución:** usar `private List<@Valid WorkoutExerciseDTO> exercises;` (sin `@Valid` en el campo) y, en el controlador, `@RequestBody @Size(max = 20) List<@Valid MealDTO> meals` (la clase ya tiene `@Validated`). Añadir `@Size(max=255)` en `VariantDTO`. Añadir un test que falle si aparece HV000271 en el arranque.
- **Esfuerzo:** S

### 12. [Media] Clases de más de 500 líneas y lógica duplicada con valores por defecto distintos
- **Evidencia:**
  - `UserDataRestoreService.java`: 673 líneas. `GeminiAiService.java`: 501 líneas. `GeminiApiClient.java`: 493, cerca del límite. El umbral está en `CONSTRAINTS.md` §3.1.
  - La construcción del grafo de un workout está duplicada en `WorkoutService.java:255-299` y `UserDataRestoreService.java:278-318`, con **diferencias de comportamiento**:

    | Aspecto | `WorkoutService` | `UserDataRestoreService` |
    | --- | --- | --- |
    | `completed` por defecto | `false` (l. 292) | `true` (l. 311) |
    | `type` por defecto | `null` | `"normal"` (l. 305) |
    | Decimales con coma | Rechaza `"80,5"`: `WorkoutMapper.stringToBigDecimal` no la reemplaza, el número se pierde y queda `null` | Acepta `"80,5"` (l. 668) |

  - La resolución de ejercicios personalizados por nombre está duplicada en `WorkoutService.java:180-216` y `UserDataRestoreService.java:210-252`.
  - En `GeminiAiService`, el patrón try/catch de cuota y circuit breaker se repite 4 veces (l. 118-141, 167-188, 219-240, 362-386). El contexto de alimentos y recetas está duplicado (l. 88-110 frente a 312-335) y la decodificación y validación de imagen también (l. 66-72 frente a 261-267).
- **Impacto:** el mismo dato produce resultados distintos según entre por la app, por la importación o por la restauración. Además, los cambios hay que hacerlos en varios sitios.
- **Solución:**
  - Crear un único `WorkoutGraphFactory` (o ampliar `WorkoutMapper`) y un `CustomExerciseResolver` que usen `WorkoutService`, la importación y la restauración, con reglas comunes y documentadas.
  - Dividir `UserDataRestoreService` en un `Restorer` por agregado (estrategia) con un orquestador transaccional.
  - En `GeminiAiService`, extraer un método `<T> T callWithQuota(String user, Supplier<String> call)`, un `PromptContextBuilder` y un `ImageValidator`.
  - Añadir tests que comparen el resultado de la importación y de la restauración.
- **Esfuerzo:** M

### 13. [Media] Crear entrenamientos y comidas no es idempotente (PWA offline-first)
- **Evidencia:**
  - `WorkoutService.java:58-72` y `:222-223` siempre generan `UUID.randomUUID()` en el servidor e ignoran `dto.getId()`.
  - `NutritionLogService.java:105-129` y `/api/workouts/import` tampoco tienen deduplicación ni `Idempotency-Key`.
  - La restauración sí deduplica por `startedAt` (`UserDataRestoreService.java:257-265`); la creación normal no.
- **Impacto:** si se pierde la respuesta (H12, red móvil) y el usuario o la PWA reintentan, se crean entrenamientos o comidas duplicados.
- **Solución:** aceptar un UUID generado por el cliente como clave natural (las entidades ya implementan `Persistable`) con `INSERT ... ON CONFLICT (id) DO NOTHING` y comprobación del propietario, o una cabecera `Idempotency-Key` guardada 24 h. Para el import, añadir un índice único parcial `(user_email, started_at)` en V29.
- **Esfuerzo:** M

### 14. [Media] Los ejercicios de una plantilla no tienen orden garantizado
- **Evidencia:**
  - `WorkoutTemplate.java:22-24`: `@ElementCollection List<TemplateExercise>` sin `@OrderColumn` ni `@OrderBy`.
  - `V1__init_schema.sql:143-146`: `workout_template_exercises(exercise_id, template_id)`, sin columna de posición y sin clave primaria.
- **Impacto:** Postgres no garantiza el orden sin `ORDER BY`, así que el orden de la plantilla puede cambiar tras un VACUUM o un UPDATE. Además, con una bag Hibernate borra y reinserta toda la colección en cada cambio.
- **Solución:** crear la migración V29 con `ALTER TABLE workout_template_exercises ADD COLUMN position int` y un backfill con `row_number()` por `ctid`. Después, `@OrderColumn(name = "position")` y una PK `(template_id, position)`.
- **Esfuerzo:** S

### 15. [Media] Responsabilidades de capa: un controlador demasiado grande, dependencias entre controladores y respuestas en bruto de terceros
- **Evidencia:**
  - `AuthController.java` (414 líneas) concentra en el controlador:
    - la orquestación del login: vinculación de `google_sub`, cambio de email, alta de usuario y emisión de tokens (l. 103-181), repartida en 3-4 transacciones independientes;
    - la construcción de cookies y la comprobación de Origin (l. 183-330);
    - sobrecargas públicas que solo existen para los tests (`logout(...)` l. 332-338, `deleteAccount(Jwt)` l. 406-408).
  - Una `IOException` de Google se convierte en `RuntimeException` y acaba como 500 (l. 116-119); lo correcto sería 503.
  - `UserController.java:16-25` inyecta `AuthController` y llama a su método, una dependencia entre controladores. Además, el borrado de cuenta tiene 3 rutas (`/api/auth/account`, `/api/auth/users/account`, `/api/users/account`).
  - `FoodExternalController.java:22-36` devuelve `String` con el JSON de OFF/FatSecret en bruto. `processNutritionalLabel` y `assistant-summary` devuelven `Map<String,Object>`. Fuera de esos casos, todos los controladores exponen DTOs y ninguna entidad JPA (bien).
  - En los servicios hay delegaciones muertas: `WorkoutService.java:125-165` (`getTemplates`, `saveTemplate`, `getCustomExercises`, etc.) solo se usan en `WorkoutServiceTest`.
- **Solución:**
  - Crear `AuthService.login(...)` como `@Transactional`, un `RefreshCookieFactory` y un `OriginCheckFilter` (o el CSRF de Spring Security con `CookieCsrfTokenRepository` para `/api/auth/refresh` y `/api/auth/logout`).
  - Dejar una sola ruta de borrado de cuenta.
  - Tipar las respuestas externas con DTOs propios.
  - Eliminar los métodos de test de la API pública.
- **Esfuerzo:** M

### 16. [Media] La exportación carga todos los datos del usuario en memoria
- **Evidencia:** `UserDataExportService.java:32-72` hace `findAllByUserEmailOrderByStartedAtDesc` (EntityGraph de dos colecciones, `WorkoutRepository.java:23-24`) y `findAllByUserEmailOrderByDateAscIdAsc` (hasta 25 000 food logs), construye todo el árbol de DTOs y Jackson lo serializa de golpe (`UserDataExportController.java:34-42`).
- **Impacto:** con las cuotas llenas, el pico de memoria es de decenas de MB por exportación en un heap de unos 300 MB. Dos exportaciones a la vez pueden provocar `OutOfMemoryError`. Está limitado a 10/min por usuario, no globalmente.
- **Solución:** generar la respuesta en streaming (`StreamingResponseBody` + `JsonGenerator`, leyendo por páginas o con `Stream<T>` + `@QueryHints(fetchSize)` en una transacción de solo lectura), o generarla de forma asíncrona y descargarla después.
- **Esfuerzo:** M

### 17. [Media] Configuración del runtime para un dyno de 512 MB
- **Evidencia:**
  - `Procfile`: `web: java $JAVA_OPTS -Dserver.port=$PORT -jar target/*.jar`. Depende de los valores por defecto del buildpack; no fija GC, tamaño de pila de hilos ni `ExitOnOutOfMemoryError`.
  - No se limitan los hilos de Tomcat (200 por defecto, `application.yml` no define `server.tomcat.threads.max`), mientras el pool de Hikari es de 8 (`application.yml:15`). Las llamadas lentas a Gemini y FatSecret retienen hilos.
  - `Dockerfile:27` usa `-XX:MaxRAMPercentage=75.0` (deja poco margen para metaspace, pilas y buffers directos). El `HEALTHCHECK` está fijado a `:8080` (l. 25-26), aunque `server.port=${PORT}`.
  - No hay Actuator (`pom.xml`), así que no hay sondas de liveness/readiness, métricas de JVM, de Hikari, de caché ni de clientes HTTP.
  - Java 17 impide usar hilos virtuales (`spring.threads.virtual.enabled`), que resolverían buena parte de #2 y #3.
- **Solución:**
  - En el Procfile: `java -XX:MaxRAMPercentage=65 -XX:+UseSerialGC -Xss512k -XX:+ExitOnOutOfMemoryError -XX:ReservedCodeCacheSize=64m -jar ...`.
  - `server.tomcat.threads.max: 50`.
  - Añadir `spring-boot-starter-actuator` (health con grupos liveness/readiness y métricas Prometheus solo en un puerto o ruta protegidos) y apuntar el healthcheck a `/actuator/health`.
  - Valorar Java 21 y CDS (`-XX:SharedArchiveFile`) para el arranque.
- **Esfuerzo:** S

### 18. [Media] Huecos en los tests y tests con ruido
- **Evidencia (`verify` en verde: 318 tests en 65 s, sin flakes en esta ejecución):**
  - Sin ninguna referencia en tests:
    - Controladores: `FoodExternalController`, `SettingsController`, `StepsController`, `UserController`, `WeightController` y `WorkoutPreferencesController`.
    - Servicios: `FoodExternalService`, `OpenFoodFactsClient`, `FatSecretResponseMapper`, `StepsService`, `WorkoutPreferencesService`, `RefreshTokenCleanupService` e `InMemoryRateLimiterService`.
    - Filtros: `JsonSizeLimitFilter`.
  - Los `@Scheduled` se ejecutan durante los tests. En `FlywayLegacyDataMigrationTest`, el sondeo de temporizadores lanza `ERROR: relation "rest_timers" does not exist` (`verify.log` l. 1928-1984) porque el contexto migra solo hasta V22. Es un riesgo de inestabilidad e interferencia entre tests.
  - `WorkoutPerformanceIntegrationTest.java:45` (`paginationRunsInDatabaseWithoutInMemoryFetch`) no comprueba el número de consultas. No hay ningún test que proteja contra N+1 (Hibernate `Statistics`).
  - No hay medición de cobertura del backend (JaCoCo no está en `pom.xml`). `CONSTRAINTS.md` solo fija cobertura para el frontend.
  - Los tests usan APIs deprecadas (ver #20) y `UserServiceTest` tiene operaciones *unchecked*.
  - La caché y los timeouts de la búsqueda combinada no tienen tests.
- **Solución:**
  - Añadir tests `@WebMvcTest` para los 6 controladores y tests de `FoodExternalService` con `MockRestServiceServer`.
  - Añadir `spring.task.scheduling.enabled`/`@ConditionalOnProperty("app.scheduling.enabled")` y desactivarlo en `src/test/resources/application.properties`.
  - Añadir aserciones de número de consultas con `SessionFactory.getStatistics()` (`hibernate.generate_statistics=true` solo en tests).
  - Añadir JaCoCo con un umbral inicial igual al actual y registrarlo en `CONSTRAINTS.md`.
- **Esfuerzo:** M

### 19. [Baja] Índices redundantes y nombres de índice en las entidades que no existen en la base de datos
- **Evidencia:**
  - `idx_workouts_user_email` (V5:5) queda cubierto por `idx_workouts_user_email_started_at` (V7:1).
  - `idx_food_logs_user_email` (V5:3) queda cubierto por `idx_food_logs_email_date` (V7:3). `idx_food_logs_log_date` (V5:4) no lo usa ninguna consulta filtrada por usuario.
  - `idx_saved_foods_user_email` (V16:2) queda cubierto por `idx_saved_foods_user_name` (V27:3).
  - `idx_weight_entries_user_email` y `idx_steps_entries_user_email` (V5:6-7) quedan cubiertos por las restricciones `UNIQUE (user_email, date)` (V1:86, 116).
  - `idx_workout_exercises_workout_id` (V18:1) puede duplicar un índice anterior. El refresh token `token unique` (V1:61) está bien.
  - Las anotaciones `@Index` de las entidades (`idx_workout_user_started`, `idx_food_log_user_date`, `idx_workout_template_user_email`...) no coinciden con los nombres de las migraciones. Con `ddl-auto: validate` no tienen efecto y confunden.
  - No he podido ejecutar EXPLAIN ni consultar `pg_stat_user_indexes` contra producción.
- **Impacto:** cada INSERT y UPDATE paga el mantenimiento de esos índices y la base ocupa más espacio.
- **Solución:** confirmar en producción con `SELECT indexrelname, idx_scan FROM pg_stat_user_indexes` que no se usan y eliminarlos en una V29 (en Flyway, `DROP INDEX CONCURRENTLY` exige `-- flyway:executeInTransaction=false`). Quitar las `@Index` engañosas.
- **Esfuerzo:** S

### 20. [Baja] APIs y configuración deprecadas que siguen en uso
- **Evidencia:**
  - `HHH90000025` aparece 4 veces en `verify.log` por `hibernate.dialect` en `application.yml:26` y `application-prod.yml:18`.
  - javac marca como deprecados (ver la salida de `test-compile` arriba):
    - `PushNotificationService.java:[249,33]` y `PushNotificationIntegrationTest.java:[114,25]`: `sendAsync`.
    - `RefreshTokenRotationIntegrationTest.java:[47,56]` y `RefreshTokenServiceTest.java:[53,51]`: `createRefreshToken(String,String,String)`.
    - `RefreshTokenServiceTest.java:[40,23]`: `RefreshToken(String,String,String,Instant)`.
  - Los constructores y métodos `@Deprecated` (`RefreshToken.java:54-62`, `RefreshTokenService.java:136-146`) solo se usan en tests.
  - El aviso `Serializing PageImpl instances as-is is not supported` aparece en `verify.log` por `WorkoutController.java:32`, que devuelve `Page<WorkoutDTO>`.
- **Solución:**
  - Eliminar `dialect` de los dos YAML.
  - Borrar las sobrecargas deprecadas y actualizar los tests.
  - Configurar `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` o devolver `PagedModel<WorkoutDTO>`/un `PageDTO` propio. El JSON cambia: comprobar `JsonContractTest` y el frontend.
  - Añadir `-Xlint:deprecation` y `-Werror` para `src/main` en el compilador.
- **Esfuerzo:** S

### 21. [Baja] Higiene de configuración
- **Evidencia:**
  - `application-prod.yml` repite bloques que ya están en el YAML base (multipart, `server.tomcat.remoteip`, `ddl-auto`, `jwt`).
  - Hay propiedades que solo existen en `@Value` con valores por defecto en código y no aparecen en el YAML: `app.gemini.*` (`GeminiQuotaService.java:18-28`, `GeminiApiClient.java:36-43`, que además lee las variables de entorno `GEMINI_API_KEY`/`GEMINI_MODEL`), `app.push.timer-cleanup-cron` y `app.flyway.repair`.
  - `FlywayConfig.java:20-28` lee `spring.profiles.active` como cadena en lugar de usar `Environment.acceptsProfiles`.
  - `format_sql: true` (`application.yml:27`) no aporta nada.
- **Solución:** crear `@ConfigurationProperties` con `@Validated` para `app.gemini`, `app.push` y `app.auth`, dejar en `application-prod.yml` solo las diferencias y documentar todas las variables de entorno en un único sitio.
- **Esfuerzo:** S

### 22. [Baja] La caché de seguridad de usuarios se actualiza antes del commit
- **Evidencia:** `UserService.java:101-103` (`ensureUserExists`) y `:141-147` (`updateTokensValidAfter`) escriben en `securityCache` dentro de métodos `@Transactional`, antes de que se confirme la transacción. Las cachés Caffeine creadas a mano (`UserService.java:41-44`, `InMemoryRateLimiterService.java:19-22`) no tienen `recordStats` ni métricas.
- **Impacto:** si la transacción hace rollback, la caché guarda durante 30 s un estado que no existe en la base de datos.
- **Solución:** actualizar o invalidar la caché en `TransactionSynchronization.afterCommit` (o con `@TransactionalEventListener(phase = AFTER_COMMIT)`). Registrar las cachés con `CaffeineCacheMetrics`.
- **Esfuerzo:** S

### 23. [Baja] Código muerto y caminos inalcanzables
- **Evidencia:**
  - `NutritionLogService.java:141-143, 289-291`: `throw new RuntimeException("Unauthorized")` es inalcanzable, porque la consulta ya filtra por usuario. Si llegara a ejecutarse, daría un 500.
  - Métodos sin uso: `parseDoubleSafe`/`parseIntSafe` (`NutritionLogService.java:214-232`, `UserDataRestoreService.java:647-663`), `WorkoutService.toSetDTO` (l. 148-150), `RefreshTokenService.verifyExpiration` (l. 209-215), `WorkoutMapper.INSTANCE` (l. 16).
  - El segundo constructor de `UserDataRestoreService` con `EntityManager` opcional (l. 34-83).
  - 56 comprobaciones `if (userEmail == null) return 401` en los controladores (`grep -c`), inalcanzables porque `/api/**` exige autenticación (`SecurityConfig`).
- **Solución:** borrarlo. Para el email, crear un `HandlerMethodArgumentResolver` con `@CurrentUserEmail String email` que lance `AuthenticationCredentialsNotFoundException`.
- **Esfuerzo:** S

### 24. [Baja] Control de concurrencia optimista incompleto
- **Evidencia:**
  - `Workout` no tiene `@Version` (`Workout.java`). `updateWorkout` borra y reinserta todos los ejercicios y series (`WorkoutService.java:84-86`).
  - `UserSettings` tiene `@Version` (`UserSettings.java:17`), pero `UserSettingsDTO` no expone `version`, así que solo protege dentro de una transacción y no evita la pérdida de actualizaciones entre dispositivos.
- **Solución:** añadir `@Version` y exponerlo en los DTOs con `If-Match`/ETag en los PUT. El handler de 409 ya existe (`GlobalExceptionHandler.java:174-179`).
- **Esfuerzo:** S-M

---

## Lo que ya está bien

- `open-in-view: false`, `ddl-auto: validate` y Flyway con `validate-on-migrate`. Hay tests de migración sobre base vacía y sobre datos heredados (`FlywayCleanDatabaseMigrationTest`, `FlywayLegacyDataMigrationTest`).
- Ningún controlador expone entidades JPA. Las entidades usan `@Getter`/`@Setter` y no `@Data`, así que no hay problemas de `equals`/`hashCode` en relaciones.
- `getWorkoutHistory` pagina en base de datos y usa `@BatchSize` y `default_batch_fetch_size`, sin `fetch join` sobre colecciones paginadas. Las estadísticas se agregan en SQL (`WorkoutRepository.getWorkoutStats`).
- `@Transactional(readOnly = true)` está bien aplicado en los servicios de lectura principales. El wipe y la restauración son atómicos. `noRollbackFor` en la rotación permite confirmar la revocación de la familia de tokens.
- Los temporizadores usan `FOR UPDATE SKIP LOCKED` y un executor separado del hilo del scheduler.
- La revocación de JWT mediante `tokens_valid_after` usa una caché de 30 s y el índice funcional `LOWER(email)` (V27). `ON UPDATE CASCADE` permite cambiar el email en una sola sentencia (V28).
- La siembra de comidas por defecto está protegida con un advisory lock y un recuento. Hay `CHECK` de no negatividad (V26).
- Hay límites de tamaño de JSON y multipart, rate limiting por grupo con Bucket4j y validación del secreto JWT y de la configuración en el arranque (`AppEnvValidator`). Swagger está desactivado en producción. Los emails se enmascaran en los logs (`PiiMasker`) y hay un test que lo verifica.
- Los clientes externos tienen timeouts de conexión y lectura configurables. Gemini ya tiene una cuota diaria y un circuit breaker básico.
- La batería de tests es rápida (65 s), usa Testcontainers con Postgres 16 real y falla en CI si falta Docker (`DisabledIfDockerUnavailable`).
- Las imágenes de Docker están fijadas por digest, la build es multi-stage y el contenedor se ejecuta como usuario sin privilegios.
