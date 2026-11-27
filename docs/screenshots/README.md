# Capturas móviles

Las capturas del README muestran la interfaz React real con la sesión iniciada y datos ficticios. La API se simula en el navegador con el mismo conjunto de datos que la app usa para su recorrido de prueba (`frontend/src/demo`): once semanas de peso, pasos y calorías, entrenos con progresión de cargas, un diario de comidas y la temporada de powerlifting de Lucía Vega, una de las atletas. El script añade el resto de atletas del entrenador y el resumen de su inicio. No se accede a cuentas ni a bases de datos reales.

Las fotos de perfil son retratos de stock de [randomuser.me](https://randomuser.me/), guardados en [`avatars/`](avatars) para que la captura no dependa de la red. Cada persona tiene una foto distinta y acorde con su nombre.

- [landing.png](landing.png): portada pública, sin sesión.
- [dashboard.png](dashboard.png): peso de hoy, meta y comidas y entreno del día.
- [tracking.png](tracking.png): peso, pasos y calorías por semana.
- [nutrition.png](nutrition.png): diario con calorías y macronutrientes.
- [training.png](training.png): resumen de entreno con recuperación muscular y 1RM estimado de los tres básicos.
- [workout.png](workout.png): entreno de empuje en curso con series completadas y la demostración de cada ejercicio.
- [coach.png](coach.png): inicio del entrenador con las semanas por entregar y el último registro de cada atleta.
- [coach-clients.png](coach-clients.png): lista de atletas con foto, último registro y seguimientos por responder.
- [coach-review.png](coach-review.png): seguimiento semanal de una atleta, por responder, con sus valoraciones y el día a día comentado.
- [coach-nutrition.png](coach-nutrition.png): pauta de nutrición de una atleta para días de entreno y de descanso.
- [hero.jpg](hero.jpg): composición de la cabecera a partir de varias capturas.

Todas usan una ventana móvil de 430 × 932 píxeles CSS y una hora fija de la tarde. El script captura a densidad 3× (1290 × 2796) y reduce cada imagen a 860 × 1864. La app usa modo oscuro; la portada pública tiene su propio diseño claro de papel. El script espera a las fuentes reales Inter y Anton, comprueba que no hay desbordamiento horizontal del documento y falla ante errores de página o llamadas a la API sin simular.

## Reproducirlas

Con Node.js 22+, desde la raíz:

```bash
npm --prefix frontend ci
cd frontend
npx playwright install chromium
npm run dev -- --host localhost --port 5173
```

En otra terminal desde la raíz:

```bash
node docs/screenshots/capture.mjs
# Si Vite está en otro puerto:
node docs/screenshots/capture.mjs http://localhost:5181
# Solo algunas capturas:
node docs/screenshots/capture.mjs http://localhost:5173 workout coach-review
```

El script sobrescribe las diez capturas PNG. Solo permite conexiones externas a Google Fonts y a las demostraciones públicas de ejercicios; los retratos se sirven desde `avatars/` y el resto se bloquea. Los datos salen de `frontend/src/demo`, con pequeños ajustes en el script para que no quede ningún apartado vacío. «Hoy» es siempre el jueves de la semana de ejecución, para que la semana en curso enseñe varios días con registros y los seguimientos sigan pendientes.

Esta comprobación cubre el renderizado del frontend con fixtures, no la autenticación real, la persistencia del backend ni la entrega de correo o notificaciones.

La portada de tres teléfonos se compone con HTML/CSS y estas capturas en el [generador compartido del perfil](https://github.com/RaclosDev/RaclosDev/tree/main/scripts). Los textos de las pantallas proceden de la aplicación; la composición no recrea su interfaz.
