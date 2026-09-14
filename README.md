# Productividad 10x · presentación inicial

Presentación HTML de apertura de Copilot Práctico para managers y directores. Son 20 diapositivas. La portada lleva de fondo un vídeo de líneas verdes en bucle y el cierre, «Manos a la obra», el vídeo del semáforo.

Versión en línea: https://garzer09.github.io/Deloitte-Presentacion-inicial/

## Abrir

Abre `01_Deloitte_Productividad_10x.html` en Chrome o Edge. `index.html` redirige a ese archivo. Fuentes, imágenes, datos y vídeo van incrustados, así que funciona sin conexión.

Controles: flechas o espacio para avanzar, I índice, N notas, S fuentes, D datos de la gráfica, F pantalla completa, R repetir animación.

## Regenerar

No se edita el HTML a mano. Los cambios se hacen en `fuente/`:

- `build_deck.py`: contenido, notas y fuentes de cada diapositiva.
- `deck.css` y `deck.js`: diseño e interacción.
- `media/`: vídeo de portada ya optimizado (1920x1080, H.264, 2 Mbps), su imagen fija, la ficha de procedencia y los scripts de AVFoundation con los que se generaron a partir del original de Pexels en 4K.

La legibilidad de la portada se comprobó con el contraste WCAG medido sobre cinco fotogramas del vídeo: el antetítulo, el texto inferior y el pie superan 4,5:1; «Productividad» y «10×» superan 5:1.

```bash
python3 fuente/build_deck.py
```

El script escribe `01_Deloitte_Productividad_10x.html` y `fuente/Correspondencia_PPT_HTML.csv`. Lee datos, imágenes, logotipo y el vídeo del cierre de la carpeta de trabajo local del proyecto en OneDrive, por lo que solo se puede regenerar desde ese equipo.
