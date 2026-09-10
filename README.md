# Cronograma de Indicadores y Comisiones

Calendario anual interactivo con selector de marca (**Blackwell**, **iEmpresa**, **ITAE**). Cada marca guarda su propio cronograma de actividades, con color y descripción por fecha.

## Qué hace

- Muestra los 12 meses del año en tarjetas, igual que el diseño de referencia.
- **Pintar un rango de fechas**: botón "Pintar rango de fechas" en el panel lateral. Eliges fecha de inicio, fecha de fin, un color y el nombre de la actividad, y se aplica a todos los días de ese rango de una sola vez (funciona incluso si el rango cruza de un mes a otro o de un año a otro). El mismo formulario tiene un botón "Borrar rango" para limpiar varios días a la vez.
- **Modificar una fecha puntual**: un clic en cualquier fecha (esté pintada o no) abre su formulario individual para agregar, cambiar el color, editar notas o borrar esa actividad — útil para ajustar un día suelto dentro de un rango ya pintado.
- Las pestañas superiores cambian de marca; cada marca tiene su propio cronograma guardado por separado (y su propio color de identidad en la interfaz).
- Flechas `‹ ›` para cambiar de año, filtro para saltar a un mes, y botón "Ir a la fecha de hoy".
- Todo se guarda en el navegador (`localStorage`) — no requiere servidor ni base de datos.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `cronograma-calendario`).
2. Sube estos tres archivos a la raíz del repositorio: `index.html`, `calendar.js`, `README.md`.
3. Ve a **Settings → Pages** del repositorio.
4. En "Source", elige la rama `main` y la carpeta `/root`, luego guarda.
5. En un par de minutos tu calendario estará disponible en:
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`

## Personalizar

- **Colores de marca**: al inicio de `calendar.js`, en el objeto `BRANDS`, cambia `hex` y `soft` por los colores de cada empresa.
- **Colores de actividad**: en el arreglo `COLORS` de `calendar.js`.
- **Nombres de marca**: cambia `label` y `subtitle` dentro de `BRANDS`.
- Los datos guardados son por navegador. Si necesitas que el cronograma se comparta entre varias personas (no solo en tu propio navegador), se necesitaría conectar una base de datos — avísame si quieres ese siguiente paso.

## Notas técnicas

Un único HTML + un único JS, sin dependencias de compilación (no necesita `npm install`). Usa Google Fonts vía CDN para la tipografía.
