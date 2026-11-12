# Capturas móviles

Las capturas del README muestran la interfaz React real con datos ficticios: ocho semanas de peso, seis de entrenos con una rutina torso/pierna, un día de comidas y un entrenador con tres atletas. La API se simula en el navegador; no se accede a cuentas ni bases de datos reales.

- [landing.png](landing.png): portada pública, sin sesión.
- [dashboard.png](dashboard.png): peso, entreno y comidas del día.
- [tracking.png](tracking.png): peso, pasos y calorías por semana.
- [nutrition.png](nutrition.png): diario con calorías y macronutrientes.
- [training.png](training.png): resumen de entreno con recuperación muscular y actividad.
- [workout.png](workout.png): entreno en curso con series completadas.
- [coach.png](coach.png): espacio del entrenador con revisiones pendientes y señales de seguimiento.
- [coach-clients.png](coach-clients.png): lista de atletas con búsqueda y acceso a su ficha.
- [coach-review.png](coach-review.png): check-in semanal de una atleta con energía, sueño, adherencia y respuesta.
- [hero.jpg](hero.jpg): composición de la cabecera a partir de `workout`, `coach` y `nutrition`.

Todas usan una ventana móvil de 390 × 844 píxeles CSS, densidad 2× y una hora fija de media tarde. La app usa modo oscuro; la portada pública tiene su propio diseño claro de papel. El script espera a las fuentes reales Inter y Anton, comprueba que no hay desbordamiento horizontal del documento y falla ante errores de página o llamadas a la API sin simular.

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
```

El script sobrescribe las nueve capturas PNG. Solo permite conexiones externas a Google Fonts y a las miniaturas públicas de ejercicios; el resto se bloquea. La sesión y los ajustes salen de las fixtures de `frontend/tests/helpers`; los datos de demo están en el propio script. Las fechas se calculan con respecto al día de ejecución para que los resúmenes semanales y las revisiones sigan siendo visibles.

Esta comprobación cubre el renderizado del frontend con fixtures, no la autenticación real, la persistencia del backend ni la entrega de correo o notificaciones.

La portada de tres teléfonos se compone con HTML/CSS y estas capturas en el [generador compartido del perfil](https://github.com/RaclosDev/RaclosDev/tree/main/scripts). Los textos de las pantallas proceden de la aplicación; la composición no recrea su interfaz.
