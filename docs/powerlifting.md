# Powerlifting para entrenadores

En **Alumnos → ficha → Powerlifting**, el entrenador dispone de tres áreas. El alumno debe compartir entrenamiento para consultarlas y permitir su edición para cambiar perfiles, marcas o competiciones. La preparación pertenece al vínculo con ese entrenador.

- **Perfil y marcas:** especialidad activa, equipamiento, federación, máximos de trabajo y marcas fechadas. Las marcas son anotaciones del entrenador, con contexto de entrenamiento o competición y referencia opcional.
- **Competiciones:** calendario, categoría, objetivo de total y bloques de preparación. Cada básico tiene tres intentos con carga prevista, carga realizada y resultado. Archivar conserva los resultados.
- **Seguimiento S/B/D:** sesiones registradas durante 4, 12 o 52 semanas, con series, repeticiones, volumen, carga máxima y RPE cuando existe. La carga semanal usa lunes a domingo según la fecha local del navegador.

## Cómo se interpretan los números

El total de competición suma el mejor intento **válido** de cada básico. Si falta alguno, no hay total; mientras quede algún intento pendiente, se identifica como provisional. Las cargas previstas se conservan aparte.

El seguimiento incluye los identificadores del catálogo de sentadilla con barra, banca plana con barra y peso muerto convencional o sumo. Excluye calentamientos, series incompletas, números inválidos y ejercicios personalizados sin identificar. El volumen es la suma de carga por repeticiones. El RPE medio indica cuántas series tienen ese dato y no rellena los valores ausentes.

La estimación de 1RM usa Epley en series de 2 a 10 repeticiones y la carga realizada en series de una repetición, con redondeo a 0,5 kg. Una mejor serie histórica y una marca manual son datos diferentes. La suma de estimaciones personales puede combinar fechas distintas; no representa un total realizado en competición. Los porcentajes de seguimiento usan el máximo de trabajo **actual**, no el que existía cuando se registró la sesión.

Las reglas de la organización son la opción inicial. La referencia IPF de marzo de 2026 añade avisos de incrementos; no valida la inscripción, la elegibilidad para un récord ni las decisiones arbitrales. [Reglamento usado como referencia](https://www.powerlifting.sport/fileadmin/ipf/data/rules/technical-rules/english/2026_IPF_Technical_Rulebook__effective_01_March_2026__v3.pdf).

## Persistencia y mantenimiento

Los formularios conservan un borrador por cuenta y ficha en la pestaña actual. La versión del servidor evita sobrescribir una edición más reciente: se puede consultar la guardada antes de descartar el borrador. Cerrar la pestaña elimina ese almacenamiento temporal.

`/api/coach/clients/{linkId}/powerlifting` gestiona el perfil y `/meets` sus competiciones. Las migraciones V22 y V23 añaden tablas con RLS y borrado en cascada desde el vínculo. El backend comprueba los permisos en cada petición y serializa las escrituras de una ficha antes de comparar versiones.

La exportación de datos incluye perfiles y competiciones para entrenador y alumno. Son secciones de consulta del archivo exportado: la restauración de datos personales no vuelve a crear vínculos ni concede permisos a entrenadores.

Las pruebas de integración cubren permisos, vínculos ajenos o finalizados, versiones, validación y borrado. Las pruebas de navegador cubren móvil/escritorio, borradores, resultados, archivo, errores y solo lectura. Los cálculos de seguimiento y totales tienen pruebas independientes.


## Clasificación y semana de competición

Desde Ficha y gestión se activa la especialidad de cada alumno. Ocultarla conserva sus perfiles y resultados. El perfil permite clasificar ejercicios personalizados y combinaciones de agarre/máquina como competición, variante o excluidos. El seguimiento respeta estas asignaciones y permite incluir variantes expresamente.

La competición separa **Preparación** y **Día de competición**. Los nueve intentos se registran en una tabla con previsto, realizado y resultado. Los bloques enlazan con sus semanas de planificación, sin modificar automáticamente las sesiones. Los porcentajes prescritos guardan el TM de publicación; los indicadores retrospectivos de seguimiento mantienen su referencia al TM actual.
