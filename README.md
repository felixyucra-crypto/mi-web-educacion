# Cronograma de Indicadores y Comisiones

Calendario anual interactivo con selector de marca (**Blackwell**, **iEmpresa**, **ITAE**). Cada marca guarda su propio cronograma de actividades, con color y descripción por fecha.

## Qué hace

- Muestra los 12 meses del año en tarjetas, igual que el diseño de referencia.
- Un clic en cualquier fecha abre un formulario para agregar una **actividad**, notas y un **color**.
- Las fechas con actividad quedan pintadas del color elegido.
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
