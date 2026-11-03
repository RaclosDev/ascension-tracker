# Capturas móviles

Estas tres capturas muestran la interfaz React real con datos ficticios de las fixtures de navegador del repositorio. No se accede a cuentas ni bases de datos reales.

- `dashboard.png`: registro de peso y progreso hacia el objetivo.
- `workout.png`: entrenamiento activo con ejercicios y series.
- `nutrition.png`: diario y resumen de macronutrientes.

Todas usan una ventana móvil de 430 × 932 píxeles CSS y densidad 2×. Se comprueba la carga de Inter y Oswald desde Google Fonts y la ausencia de desbordamiento horizontal. Se captura una pantalla, sin modificar los estilos de la aplicación.

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

El script sobrescribe las tres imágenes. Necesita conexión a Google Fonts; el resto de conexiones externas se bloquea y las llamadas a la API se simulan con las fixtures mantenidas en `frontend/tests/helpers`. Si falta una fuente o una respuesta de API, la captura falla. No requiere Google OAuth, Gemini ni backend.
