# EventCard

Card de evento con la imagen como protagonista: fecha, categoría, precio desde, puntaje del organizador y favorito.

- **feature** (Home, carruseles de 300 de ancho): imagen 16:10 con degradé `scrim-image`, bloque de fecha arriba a la izquierda (día en `display`, mes en `primary-text`), favorito arriba a la derecha, categoría sobre la imagen en `text-on-image`. Debajo: nombre (`title-md`, 2 líneas máx.), lugar · hora, precio "Desde $ 32.000" y puntaje del organizador con su nombre.
- **compact** (resultados, listas): thumbnail 104 × 104 a la izquierda.
- Flags: `lowStock` → tag *Últimas entradas* (`secondary`); `soldOut` → tag *Agotado* y precio reemplazado; `past` → imagen a `opacity-muted-image`.
- Precio: si `minPrice === maxPrice` se muestra el valor sin "Desde"; 0 → "Gratis".
- Toda la card es tocable (`accessibilityRole="button"`, label con nombre, fecha y precio); el favorito es un target separado de 44.
- `PosterArt` es solo un placeholder de diseño: en la app va la imagen real con `expo-image` y `contentFit="cover"`.
