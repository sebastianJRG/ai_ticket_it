# Checkbox

Casilla de verificación con label que puede incluir links, para aceptar términos y preferencias.

- Caja de 24 con área táctil de 44 de alto en toda la fila (label incluido). Marcada = relleno `primary` con check `on-primary`.
- Links dentro del label en `primary-text` subrayado; cada link es su propio target.
- Error debajo (`error` + ícono) cuando una casilla obligatoria (términos) queda sin marcar al enviar.
- RN: `Pressable` con `accessibilityRole="checkbox"` y `accessibilityState={{ checked }}`.
- Para elegir una sola opción entre varias usar `ChoiceCard`, no checkboxes.
