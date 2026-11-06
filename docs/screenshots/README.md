# Capturas móviles

Las capturas del README muestran la interfaz React real con datos ficticios: ocho semanas de peso, seis de entrenos con una rutina torso/pierna y un día de comidas. La API se simula en el navegador; no se accede a cuentas ni bases de datos reales.

- `landing.png`: portada pública, sin sesión.
- `dashboard.png`: peso del día y progreso hacia el objetivo.
- `tracking.png`: peso, pasos y calorías por semana.
- `nutrition.png`: diario con calorías y macronutrientes.
- `training.png`: resumen de entreno con recuperación muscular y actividad.
- `workout.png`: entreno en curso con series completadas.
- `hero.jpg`: composición de la cabecera del README a partir de `dashboard`, `workout` y `nutrition`.

Todas usan el modo oscuro, una ventana móvil de 390 × 844 píxeles CSS, densidad 2× y una hora fija de media tarde. La portada pública tiene su propio diseño claro. El script comprueba que no hay desbordamiento horizontal y falla si alguna llamada a la API no está simulada.

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
```

El script sobrescribe las seis capturas. Solo permite conexiones a Google Fonts y a las miniaturas públicas de ejercicios; el resto de conexiones externas se bloquea. La sesión y los ajustes salen de las fixtures de `frontend/tests/helpers`; los datos de demo están en el propio script.
