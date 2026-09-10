# Cronograma de Indicadores y Comisiones

Sitio estático (HTML + CSS + JS puro, sin dependencias ni build) para pintar rangos de fechas por color y dejar notas, con tres espacios de trabajo: **Blackwell**, **iEmpresa** e **ITAE**.

## Archivos
- `index.html` — estructura de la página.
- `style.css` — estilos.
- `script.js` — toda la lógica (calendario, pintar rangos, etiquetas, notas).

Los datos se guardan en el navegador de cada usuario (`localStorage`), por lo que son locales a cada dispositivo/navegador — no se comparten entre personas ni entre tus tres pestañas más allá de tu propio navegador.

## Cómo usarlo
1. **Pestañas superiores** (Blackwell / iEmpresa / ITAE): cada una tiene su propio calendario y etiquetas guardadas por separado.
2. **Pintar rango de fechas**: elige fecha de inicio, fecha de fin, una etiqueta de color y (opcional) una nota. Al confirmar, todos los días de ese rango se pintan con el color de la etiqueta.
3. **+ Nueva etiqueta**: crea etiquetas propias con el nombre y color que quieras (además de las 6 que vienen por defecto: Reporte, Comité, Cierre, Auditoría, Comisión, Otro).
4. **Clic en cualquier día**: muestra las notas/etiquetas de ese día, permite eliminarlas o pintar directamente ese día.
5. **Selector de mes** e **Ir a la fecha de hoy**: navegación rápida dentro del año.
6. **Flechas junto al año**: cambian de año (2025, 2026, 2027…), conservando lo ya pintado.

## Cómo subirlo a GitHub Pages
1. Crea un repositorio nuevo en GitHub (por ejemplo `cronograma-blackwell`).
2. Sube estos 3 archivos (`index.html`, `style.css`, `script.js`) a la raíz del repositorio.
3. Ve a **Settings → Pages**.
4. En "Source" elige la rama `main` y la carpeta `/ (root)`.
5. Guarda. En un minuto tu sitio estará disponible en `https://tu-usuario.github.io/cronograma-blackwell/`.

## Personalizar
- Los colores/nombres por defecto de las etiquetas están al inicio de `script.js`, en `DEFAULT_CATEGORIES`.
- Los nombres de las pestañas están en `WORKSPACES` (también en `script.js`) y en los botones `<button class="tab" data-tab="...">` de `index.html`.
