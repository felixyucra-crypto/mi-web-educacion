# Cronograma de Marcas

Sitio estático de **un solo archivo** (`index.html`, con el CSS y el JS ya incluidos adentro, sin dependencias ni build) para pintar rangos de fechas por color, dejar notas pendientes con alertas, y organizarlo por marca: **Blackwell**, **iEmpresa**, **ITAE** y **Otros**.

## Archivo
- `index.html` — todo el sitio (estructura, estilos y lógica) en un solo archivo. Ábrelo directamente haciendo doble clic, o súbelo a GitHub Pages.

Los datos se guardan en el navegador de cada usuario (`localStorage`), por lo que son locales a cada dispositivo/navegador — no se comparten entre personas ni entre tus pestañas más allá de tu propio navegador.

## Cómo usarlo
1. **Pestañas superiores** (Blackwell / iEmpresa / ITAE / Otros): cada una tiene su propio calendario, etiquetas y notas guardadas por separado, con su color de marca (azul, naranjado, amarillo crema y teal).
2. **Pintar rango de fechas**: elige fecha de inicio, fecha de fin, una o varias etiquetas de color y (opcional) una nota. Si un día tiene más de una etiqueta, se pinta dividido entre los colores.
3. **+ Nueva etiqueta**: crea etiquetas propias con el nombre y color que quieras.
4. **Pendientes**: crea notas con fecha límite y responsable ("quién lo realiza"). Si una nota vence hoy o ya venció y no está marcada como hecha, aparece una alerta roja arriba de la lista.
5. **Clic en cualquier día del calendario**: muestra los rangos/etiquetas de ese día, permite eliminarlos o pintar directamente ese día.
6. **Selector de mes** e **Ir a la fecha de hoy**: navegación rápida dentro del año.
7. **Flechas junto al año**: cambian de año (2025, 2026, 2027…), conservando lo ya pintado.

## Cómo subirlo a GitHub Pages
1. Crea un repositorio nuevo en GitHub (por ejemplo `cronograma-marcas`).
2. Sube el archivo `index.html` a la raíz del repositorio (no necesitas nada más).
3. Ve a **Settings → Pages**.
4. En "Source" elige la rama `main` y la carpeta `/ (root)`.
5. Guarda. En un minuto tu sitio estará disponible en `https://tu-usuario.github.io/cronograma-marcas/`.

## Personalizar
- Los colores/nombres de las pestañas están en la constante `WORKSPACES`, dentro del `<script>` al final de `index.html`.
- Las etiquetas por defecto (Reporte, Comité, Cierre, Auditoría, Comisión, Otro) están en `DEFAULT_CATEGORIES`, justo debajo.
