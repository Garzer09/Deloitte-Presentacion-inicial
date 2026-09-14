# Productividad 10x · presentación inicial

Presentación HTML de apertura de Copilot Práctico para managers y directores. Son 20 diapositivas y el cierre, «Manos a la obra», lleva de fondo el vídeo del semáforo.

## Abrir

Abre `01_Deloitte_Productividad_10x.html` en Chrome o Edge. `index.html` redirige a ese archivo. Fuentes, imágenes, datos y vídeo van incrustados, así que funciona sin conexión.

Controles: flechas o espacio para avanzar, I índice, N notas, S fuentes, D datos de la gráfica, F pantalla completa, R repetir animación.

## Regenerar

No se edita el HTML a mano. Los cambios se hacen en `fuente/`:

- `build_deck.py`: contenido, notas y fuentes de cada diapositiva.
- `deck.css` y `deck.js`: diseño e interacción.

```bash
python3 fuente/build_deck.py
```

El script escribe `01_Deloitte_Productividad_10x.html` y `fuente/Correspondencia_PPT_HTML.csv`. Lee datos, imágenes, logotipo y vídeo de la carpeta de trabajo local del proyecto en OneDrive, por lo que solo se puede regenerar desde ese equipo.
