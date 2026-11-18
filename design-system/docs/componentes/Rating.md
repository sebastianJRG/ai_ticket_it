# Rating

Puntaje con estrellas: de solo lectura (con valor y cantidad) y para cargar (1 a 5).

- Solo lectura: estrellas `rating` / `rating-empty` + valor con coma ("4,7") + cantidad ("(1.284)"). El valor numérico siempre acompaña: las estrellas solas no alcanzan.
- `compact`: una estrella + valor, para cards y filas.
- `RatingInput` (para la Reseña): 5 estrellas de 52 × 52, `accessibilityRole="radio"` en cada una, caption "4/5 · Muy bueno". Escala: 1 Malo, 2 Regular, 3 Bueno, 4 Muy bueno, 5 Excelente.
- Solo se ofrece cargar reseña cuando la compra está UTILIZADA.
