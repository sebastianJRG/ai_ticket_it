# QuantityStepper

Selector de cantidad −/+ que se deshabilita al llegar al cupo disponible.

- `max` = `min(cupo restante del TipoEntrada, máximo por compra)`. El "+" se deshabilita al llegar y el hint pasa a "Máximo N" en `warning`.
- El "−" se deshabilita en `min` (0 en checkout).
- El "+" es relleno `primary` porque es la acción que avanza la compra; botones de 44 × 44.
- El valor se anuncia (`accessibilityLiveRegion="polite"`) y el grupo lleva `accessibilityLabel` con el nombre del tipo de entrada ("Cantidad de Campo general").
- Nunca permitir tipear la cantidad: evita superar el cupo.
