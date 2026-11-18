# IconButton

Botón circular de 44 × 44 con solo ícono, para header, favoritos y acciones sobre imágenes.

- `label` es obligatorio: se usa como `accessibilityLabel` ("Guardar en favoritos" / "Quitar de favoritos" según estado).
- `plain` en headers; `filled` (`surface-raised`) cuando flota sobre bg; `onImage` (fondo `scrim-image`) siempre que esté sobre una foto de evento.
- Favorito activo: corazón relleno en `secondary`. Animar con escala 1 → 1.2 → 1 en `duration-fast`.
- `badge` para contadores (notificaciones). No usar para estados de compra.
