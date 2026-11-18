# AvailabilitySummary

Resumen de disponibilidad por tipo de entrada con barras vendidas/cupo.

- Encabezado con total vendido y porcentaje. Por tipo: nombre, "586 / 600", barra y "Quedan 14".
- Barra `primary`; ≥ 90 % vendido → `secondary` y texto "Quedan N" en `secondary-text`; 100 % → `status-used` y "Agotado".
- El porcentaje nunca es la única información: siempre va el número de vendidas y restantes.
- `accessibilityRole="progressbar"` con `accessibilityValue={{ min: 0, max: capacity, now: sold }}`.
