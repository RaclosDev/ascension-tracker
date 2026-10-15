# Antigravity — auditoría visual integral del frontend

**Objetivo:** conseguir que todo el frontend de Ascension Tracker comparta un lenguaje visual coherente y de calidad, con prioridad especial en el resumen que aparece al finalizar un entrenamiento.

**Modo de trabajo:** inspeccionar primero, diagnosticar, proponer una estructura, implementar, comprobar visualmente y validar. No declarar terminado un trabajo solo porque compile.

## Instrucción principal

Actúa como un **Senior Frontend Engineer especializado en Design Systems, UX/UI y auditorías de consistencia visual**. Trabaja sobre el código real de este repositorio. No hagas un rediseño genérico ni una colección de retoques aislados. Averigua cómo está construida la aplicación y aplica sus patrones visuales de forma coherente.

El resumen postentrenamiento que muestra «Finalizar Sesión» presenta actualmente una composición deficiente: contenido comprimido, jerarquía débil, controles pequeños, métricas apretadas y acciones inferiores cortadas. Debes revisar las causas reales y corregir la composición, no limitarte a cambiar colores o radios.

## 1. Reglas no negociables

### HAZ

- Inspecciona la estructura, rutas, componentes, layouts, estilos globales, variables CSS, tokens, Tailwind y componentes UI antes de editar.
- Identifica qué pantallas representan mejor la identidad actual de Ascension y úsalas como referencia.
- Reutiliza componentes y tokens existentes cuando encajen; consolida patrones duplicados solo cuando la abstracción sea realmente útil.
- Busca la causa del defecto en la estructura del layout, restricciones del contenedor, max-height, overflow, grid/flex, estilos heredados y dimensiones; no asumas que todo se resuelve aumentando el modal.
- Diseña primero una composición clara y después implementa sus estilos.
- Conserva las particularidades funcionales de cada pantalla: consistencia no significa que todas tengan que parecer la misma plantilla.
- Prueba la interfaz en navegador si las herramientas disponibles lo permiten, tanto en escritorio como en móvil.
- Distingue con precisión entre inspección de código, build/tests y verificación visual real.
- Revisa el diff completo antes de finalizar.

### NO HAGAS

- No declares «premium», «terminado» o «validado visualmente» sin pruebas que lo respalden.
- No te limites a cambiar colores, gradientes, sombras o bordes dejando intacta una composición mala.
- No inventes una nueva identidad visual, una paleta alternativa o un sistema de diseño genérico de SaaS.
- No añadas tarjetas, bordes, separadores, badges o gradientes por decoración si no mejoran la jerarquía.
- No comprimas el contenido para que quepa a la fuerza, reduzcas tipografías, ocultes contenido con overflow: hidden ni uses alturas fijas arbitrarias como parche.
- No resuelvas defectos de layout con !important, selectores globales agresivos o CSS duplicado.
- No cambies cálculos, contratos API, persistencia, autenticación o lógica de negocio por motivos estéticos.
- No inventes métricas ni sustituyas datos reales por valores ficticios.
- No elimines funcionalidades para simplificar una pantalla ni introduzcas dependencias sin una justificación demostrable.
- No modifiques el backend salvo que sea imprescindible; si lo fuera, explica la necesidad antes de ampliar el alcance.
- No sobrescribas cambios preexistentes del usuario ni trabajes directamente en main.
- No hagas push, PR o merge antes de terminar las validaciones y resumir los resultados. Respeta las instrucciones explícitas del usuario si establece otro flujo.

## 2. Inspección y diagnóstico inicial

Antes de tocar archivos:

1. Comprueba la rama actual, el estado de Git y los cambios sin confirmar.
2. Recorre las rutas reales y localiza páginas, layouts y componentes compartidos.
3. Inspecciona los tokens de color, tipografía, espaciado, radios, sombras y estados interactivos.
4. Identifica patrones duplicados y estilos hardcodeados que se aparten del sistema existente.
5. Revisa los componentes de entrenamientos y localiza exactamente el flujo y componente que muestra el resumen al finalizar la sesión.
6. Revisa Nutrición → Mis Alimentos → Crear alimento, incluidos su botón flotante y su menú inferior.
7. Prepara un diagnóstico con problemas concretos, rutas/archivos afectados, severidad y causa probable.

No empieces con una reescritura masiva. Si el diagnóstico revela que la estructura actual impide una buena solución, explica brevemente el motivo y después refactoriza solo lo necesario.

## 3. Sistema visual de Ascension

Conserva la identidad fitness de Ascension: estética oscura, contundente, limpia, moderna y funcional. El diseño debe transmitir calidad mediante la composición, el espacio, la legibilidad y la jerarquía, no mediante decoración indiscriminada.

Audita y unifica, donde proceda:

- Fondos, superficies, tarjetas, bordes, textos y colores de acento.
- Tipografía, tamaños, pesos, títulos, etiquetas y cifras destacadas.
- Botones primarios/secundarios, botones de icono y estados interactivos.
- Métricas, estadísticas, badges, chips e indicadores de progreso.
- Inputs, selectores, formularios y controles segmentados.
- Modales, diálogos, bottom sheets, confirmaciones y menús contextuales.
- Espaciado, radios, sombras, elevación y separación entre secciones.
- Estados de carga, vacío, error, éxito, deshabilitado, hover y focus.
- Responsive, teclado virtual, safe areas y navegación inferior.

Antes de crear un componente nuevo, busca si ya existe uno equivalente. No fuerces la reutilización si los comportamientos son sustancialmente distintos.

## 4. Auditoría de todo el frontend

Adapta este inventario a las rutas que realmente existan en el repositorio:

- Dashboard y navegación.
- Entrenamientos: selección, ejecución, descansos, ejercicios y finalización.
- **Resumen postentrenamiento**.
- Historial y detalle de entrenamientos.
- Ejercicios y su gestión.
- Nutrición, comidas, alimentos, creación y edición de alimentos.
- Estadísticas, gráficas y evolución corporal.
- Perfil, configuración, autenticación y pantallas auxiliares.
- Diálogos, formularios, estados vacíos, carga y error.

Evalúa en cada pantalla: coherencia visual, jerarquía, legibilidad, densidad, consistencia de componentes, usabilidad, accesibilidad, responsive y problemas de scroll, recortes o superposición.

Prioriza defectos estructurales y visibles sobre detalles cosméticos menores.

## 5. Prioridad máxima: resumen al finalizar el entrenamiento

La captura actual de «Finalizar Sesión» es la referencia del problema, no un objetivo de diseño. No conserves su composición por inercia.

### Diagnostica primero

Comprueba específicamente:

- Si el diálogo está limitado por dimensiones o estilos heredados inadecuados.
- Si el contenido se comprime verticalmente o se recorta horizontalmente.
- Si max-height, overflow, grid/flex o el contenedor padre fuerzan una distribución incorrecta.
- Si las acciones inferiores quedan cortadas, solapadas o fuera del área visible.
- Si los controles son demasiado pequeños o hay demasiadas cajas, líneas y bordes.
- Si el nombre, la fecha, las métricas, la lista de ejercicios y las notas compiten entre sí.

### Rediseña la composición

**Cabecera**
- Título de cierre claro, fecha como información secundaria y cierre accesible.
- No desperdicies espacio en una cabecera sobredimensionada.

**Métricas**
- Duración, volumen y series deben leerse de un vistazo.
- Las cifras tienen que destacar; las etiquetas y unidades deben ser legibles y secundarias.
- Distribuye las columnas según el ancho real disponible.
- Evita convertir cada dato en una tarjeta con borde si una composición más limpia funciona mejor.

**Ejercicios**
- Presenta el nombre, las series y los datos de carga/repeticiones con jerarquía clara.
- Destaca la mejor serie únicamente si ese dato existe.
- Conserva miniaturas si forman parte de la experiencia, con proporciones correctas.
- En sesiones largas, la lista debe poder crecer y desplazarse sin aplastar las demás secciones.

**Notas**
- Sección secundaria con etiqueta clara y campo de altura razonable.
- El campo vacío no debe competir con los resultados.

**Acciones**
- La acción principal de guardar/completar debe ser inequívoca.
- Compartir debe ser secundaria.
- Volver al entrenamiento debe conservarse si existe en el flujo actual.
- No cortes etiquetas, no solapes botones y no hagas competir tres acciones por el primer puesto visual.

### Comportamiento responsive

No diseñes solo para la resolución de una captura. Comprueba móvil estrecho y escritorio.

- El diálogo debe tener dimensiones proporcionadas al contenido.
- En móvil, usa el ancho disponible con márgenes razonables y respeta las safe areas.
- Si el contenido supera la altura disponible, define correctamente qué zona se desplaza y cómo siguen accesibles las acciones.
- No ocultes contenido ni uses una altura fija como parche.
- Comprueba sesiones cortas y largas y el comportamiento con teclado virtual si las notas pueden editarse desde móvil.

### Integridad funcional

Conserva el guardado, duración, volumen, series, ejercicios, notas, compartir, volver, errores y estados de carga. No cambies cálculos ni contratos para mejorar la apariencia.

## 6. Nutrición → Mis Alimentos → Crear alimento

Revisa también el botón flotante y el menú de creación:

- El color debe seguir los tokens de Ascension, no un verde hardcodeado sin relación con el tema.
- El menú debe tener una jerarquía clara, espaciado suficiente, opciones legibles y objetivos táctiles cómodos.
- Comprueba el scroll, la safe area, el cierre del diálogo y la accesibilidad.
- Las opciones de crear con IA, escanear y crear manualmente deben conservar su comportamiento real.
- No rompas el flujo de OCR ni de selección de archivos.
- Reutiliza los patrones de diálogos/bottom sheets que existan en el proyecto cuando sean apropiados.

## 7. Accesibilidad y calidad técnica

- Conserva roles, nombres accesibles, navegación por teclado y focus visible.
- Usa botones semánticos y tipos correctos dentro de formularios.
- Evita textos truncados, scroll horizontal accidental y controles inaccesibles.
- Mantén los estilos específicos que respondan a necesidades reales.
- Elimina estilos obsoletos solo tras verificar que no tienen usos.
- No introduzcas regresiones en funcionalidades ni en pantallas no relacionadas.

## 8. Validación obligatoria

Ejecuta las comprobaciones que existan en frontend/package.json: lint, tipos, tests y build de producción. Ejecuta también los tests relevantes.

Si puedes arrancar la aplicación y usar un navegador:

1. Captura el resumen antes y después cuando sea posible.
2. Prueba escritorio y móvil.
3. Recorre el flujo real de finalizar y guardar un entrenamiento.
4. Prueba sesiones con pocos y muchos ejercicios.
5. Comprueba notas, acciones, estados de error/carga y navegación.
6. Inspecciona Nutrición → Mis Alimentos → Crear alimento.
7. Corrige los defectos que aparezcan en las capturas.

Si una ruta requiere autenticación, datos o herramientas que no tienes, registra la limitación. No afirmes haberla probado visualmente si solo has inspeccionado el código. No inventes resultados de comandos que no se hayan ejecutado.

## 9. Git y alcance

- Trabaja en una rama específica, nunca directamente en main.
- Comprueba el estado inicial de Git y no sobrescribas cambios del usuario.
- Mantén el diff acotado, coherente y revisable.
- No mezcles refactorizaciones funcionales ajenas a la auditoría.
- Antes de finalizar, revisa git diff, los archivos afectados y los posibles efectos secundarios.
- No hagas push, abras una PR ni hagas merge antes de presentar un informe con las validaciones reales.

## 10. Informe final requerido

Entrega un informe que incluya:

1. Diagnóstico inicial y causas encontradas.
2. Rutas/pantallas inspeccionadas y cuáles se validaron visualmente.
3. Problemas clasificados por severidad y archivos afectados.
4. Cambios implementados y por qué mejoran la composición.
5. Tokens/componentes compartidos reutilizados o consolidados.
6. Análisis específico del resumen postentrenamiento.
7. Validaciones ejecutadas, comandos y resultados reales.
8. Limitaciones de acceso o pruebas pendientes.
9. Riesgos e inconsistencias que sigan existiendo.
10. Rama, commits y estado final de Git.

## Criterio de aceptación

El trabajo no se considera terminado solo porque compile. Las pantallas principales deben compartir un lenguaje visual reconocible; el resumen postentrenamiento debe mejorar claramente en jerarquía, espacio, legibilidad y composición; las acciones no deben cortarse ni quedar ocultas; las funcionalidades deben mantenerse; y las comprobaciones deben reportarse con honestidad.

**No entregues una versión ligeramente menos fea de la misma interfaz. Si la estructura actual es la causa del problema, corrígela. Inspecciona, diagnostica, implementa y verifica.**
