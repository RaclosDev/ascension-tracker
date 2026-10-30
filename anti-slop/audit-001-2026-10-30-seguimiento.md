# Seguimiento de la auditoría antislop 001

Rama `fix/antislop-audit-001`. Cada número es el de `audit-001-2026-10-30.md`.

| Nº | Estado | Qué se hizo |
| --- | --- | --- |
| 1 | Pendiente (propietario) | El `DESIGN.md` lo escribe el propietario; no se ha inventado una dirección de diseño. |
| 2 | Hecho | El "+" flotante de Nutrición solo aparece cuando los botones "+" de las comidas no están en pantalla, así que nunca los tapa. Se ha reservado espacio al final de la página. |
| 3 | Hecho | Los títulos de Utilidades y las líneas de detalle de los KPI pasan a dos líneas en vez de cortarse. |
| 4 | Hecho | Todos los controles de las seis pantallas tienen 44 px como mínimo, a 360 y 1280 px, y en Ajustes también con las secciones abiertas. |
| 5 | Hecho | `text-gray-500` sobre fondo oscuro pasa a `text-gray-400`; el contraste cumple 4,5:1. |
| 6 | Hecho | `.calendar-input` y el selector de descanso tienen indicador de foco visible. |
| 7 | Hecho | Las flechas del calendario de actividad se llaman "Mes anterior" y "Mes siguiente". |
| 8 | Hecho | Se vuelve a permitir el zoom. Los campos usan 16 px para que el iPhone no amplíe solo al tocarlos. |
| 9 | Hecho | Las fechas se escriben "Viernes, 30 de octubre de 2026" (también en Tracking, el historial y la celebración). |
| 10 | Hecho | El desenfoque queda solo en el menú inferior y en el fondo de modales y paneles. |
| 11 | Hecho | El brillo queda solo en "Empezar Entrenamiento" y en los indicadores de foco. |
| 12 | Hecho | Etiquetas en minúscula normal y cifras en Inter con `tabular-nums` en lugar de fuente monoespaciada. |
| 13 | Hecho | "Peso actual" es la tarjeta principal y las otras tres le ceden protagonismo; fuera los cuadrados de iconos. |
| 14 | Hecho | El rayo de Recuperación es ahora una batería, y el del récord, una medalla. Se mantiene Lucide porque su trazo es coherente en toda la app. |
| 15 | Hecho | Los puntos de estado laten 2 o 3 veces y se quedan fijos; con "reducir movimiento" no se animan. |
| 16 | Hecho | Fuera el emoji del aviso del código de barras. |
| 17 | Hecho | El nombre accesible coincide con el texto visible en el menú inferior, en Tracking, en el botón de ritmo del dashboard y en el de restaurar copia. |
| 18 | Hecho | Dashboard, Tracking, Nutrición y Entreno tienen un `<h1>`. Las secciones de Utilidades son `<h2>`. |
| 19 | Hecho | Las tarjetas KPI se muestran en 2 columnas en móvil y en 4 en una fila desde 1280 px; ninguna queda sola. |
| 20 | Pendiente (propietario) | Solo hay tema oscuro: falta decidir si se escribe el motivo o se añade un tema claro. |
| 21 | Hecho | Fuera unos 231 comentarios de relleno y 56 acortados en 74 ficheros; el código queda idéntico. No se toca la migración V28, porque Flyway valida su contenido. |
| 22 | Hecho | Los datos simulados de los tests usan `totalLost: -3.8`, y el tipo documenta el signo. La tarjeta dice "Total ganado" cuando se gana peso. |

## Verificación

- Revisión automática de las seis pantallas a 360 y 1280 px: 0 desbordamientos, zoom permitido, 0 controles por debajo de 44 px y axe sin errores.
- `lint`, `typecheck`, 167 tests unitarios, `build` y 75 tests E2E en verde (uno inestable pasa al reintentar). En el backend, 304 tests en verde (solo cambian comentarios).

## Encontrado durante el trabajo, fuera de esta auditoría

- `lazyWithRetry.ts` tiene un `eslint-disable` para un `any`, que `CONSTRAINTS.md` prohíbe.
- El modal de entrada de Tracking y el buscador de alimentos tienen botones de menos de 44 px.
- Las cabeceras del acordeón de Ajustes son `div` con `onClick`: no se puede llegar a ellas con el teclado.
- La barra de progreso del objetivo tiene un brillo animado infinito.
- La insignia "Custom" sigue en inglés.
