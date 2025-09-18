# Gestión de Inventario de Árboles Navideños

Este es un proyecto web estático (HTML, CSS y JavaScript puro) diseñado para gestionar el inventario de árboles navideños. Permite visualizar, actualizar y persistir los datos del inventario localmente en el navegador, y está optimizado para ser desplegado fácilmente en GitHub Pages.

## Características

-   **Visualización de Inventario:** Muestra una tabla con la referencia, descripción, precio unitario, cantidad en exhibidor, cantidad en bodega, unidades vendidas y el precio total de ventas por artículo.
-   **Acciones por Artículo:**
    -   **Vender:** Mueve 1 unidad de exhibidor o bodega a vendidos.
    -   **Mover a Exhibidor:** Mueve 1 unidad de bodega a exhibidor.
    -   **Mover a Bodega:** Mueve 1 unidad de exhibidor a bodega.
    -   **+ Añadir:** Incrementa 1 unidad en bodega (por defecto).
    -   **- Quitar:** Decrementa 1 unidad de bodega (por defecto).
    -   **Anular Venta:** Decrementa 1 unidad de vendidos y la devuelve a bodega (por defecto).
-   **Funcionalidades Globales:**
    -   **Búsqueda:** Filtra artículos por referencia o descripción.
    -   **Ordenamiento:** Ordena la tabla por referencia o precio unitario (ascendente/descendente).
    -   **Exportar CSV:** Descarga el inventario actual como un archivo CSV.
    -   **Restablecer Datos:** Vuelve al dataset inicial predefinido.
-   **Persistencia de Datos:** Los cambios se guardan automáticamente en `localStorage` del navegador, persistiendo entre sesiones.
-   **Indicadores de Resumen:** Muestra el total de unidades en exhibidor, en bodega, vendidas y el total de ventas en COP.
-   **Diseño Responsive:** Adaptado para funcionar en dispositivos móviles y de escritorio.

## Estructura del Proyecto

```
Inevntario/
├── index.html
├── styles.css
├── app.js
└── README.md
```

-   `index.html`: La estructura principal de la página web.
-   `styles.css`: Los estilos CSS para la presentación visual.
-   `app.js`: Toda la lógica JavaScript para la gestión del inventario, incluyendo manipulación del DOM, manejo de eventos, persistencia y cálculos.
-   `README.md`: Este archivo, con la descripción del proyecto e instrucciones de despliegue.

## Cómo Usar

1.  Abre el archivo `index.html` en tu navegador web.
2.  Interactúa con la tabla y los botones para gestionar el inventario.
3.  Los cambios se guardarán automáticamente.

## Despliegue en GitHub Pages

Para desplegar este proyecto en GitHub Pages, sigue estos pasos:

1.  **Crea un nuevo repositorio en GitHub:**
    -   Ve a [GitHub](https://github.com/) y crea un nuevo repositorio. Puedes nombrarlo como `inventario-arboles` o el nombre que prefieras.

2.  **Clona el repositorio a tu máquina local:**
    ```bash
    git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
    cd TU_REPOSITORIO
    ```

3.  **Copia los archivos del proyecto:**
    -   Copia `index.html`, `styles.css`, `app.js` y `README.md` a la raíz de tu repositorio local.

4.  **Añade, commitea y sube los cambios a GitHub:**
    ```bash
    git add .
    git commit -m "Initial commit: Inventory management project"
    git push -u origin main
    ```
    (Asegúrate de que la rama principal sea `main` o `master` según la configuración de tu repositorio).

5.  **Configura GitHub Pages:**
    -   En tu repositorio de GitHub, ve a `Settings` (Configuración).
    -   En el menú lateral izquierdo, haz clic en `Pages`.
    -   En la sección `Build and deployment`, selecciona `Deploy from a branch`.
    -   En `Branch`, elige la rama `main` (o `master`) y la carpeta `/ (root)`.
    -   Haz clic en `Save`.

6.  **Accede a tu sitio:**
    -   GitHub Pages tardará unos minutos en construir y desplegar tu sitio.
    -   Una vez listo, verás un mensaje indicando que tu sitio está publicado en `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.

¡Listo! Ya puedes acceder a tu aplicación de gestión de inventario a través de la URL de GitHub Pages.
