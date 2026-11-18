# Accesibilidad

Objetivo: **WCAG 2.2 AA** en ambos temas, con la app usable con VoiceOver/TalkBack y tamaño de texto aumentado.

## Contraste (medido en dark y light)

| Par | Mínimo | Dark | Light |
|---|---|---|---|
| `text` sobre `bg` / `surface` / `surface-overlay` | 4.5:1 | 18.0 / 16.7 / 13.9 | 16.9 / 18.7 / 18.7 |
| `text-muted` sobre las 4 superficies | 4.5:1 | 7.5 – 9.7 | 7.6 – 8.4 |
| `text-subtle` sobre las 4 superficies | 4.5:1 | 4.7 – 6.1 | 5.4 – 5.9 |
| `on-primary` sobre `primary` | 4.5:1 | 15.9 | 14.5 |
| `primary-text` sobre `surface` | 4.5:1 | 15.4 | 6.9 |
| `secondary-text` sobre `secondary-soft` | 4.5:1 | 6.2 | 5.5 |
| `on-error` sobre `error` (botón destructive) | 4.5:1 | 6.7 | 5.6 |
| Estado sobre su `-bg` (los 5) | 4.5:1 | 5.1 – 7.9 | 4.7 – 6.3 |
| `border-strong` (contorno de controles) sobre superficies | 3:1 | 3.6 – 4.7 | 3.3 – 3.7 |
| `focus-ring` sobre superficies | 3:1 | ≥ 12.9 | ≥ 16.9 |
| `rating` (estrellas) sobre superficies | 3:1 | ≥ 14.0 | ≥ 6.2 |
| `text-on-image` sobre `scrim-image` (foto blanca, peor caso) | 4.5:1 | 8.4 | 8.4 |

Excepciones conocidas: `border` (divisores) no llega a 3:1 y por eso nunca es el único límite de un control. En light, el relleno `primary` sobre blanco es 1.3:1: el botón se identifica por su texto (14.5:1); no hacer botones `primary` solo con ícono.

## Tamaños

- Texto mínimo 12 (`caption`, `overline`); cuerpo 15; inputs 16.
- Dynamic Type / escala de fuente de Android activa. Probar con 1.3× y 2×: las cards de evento crecen en alto, los títulos `display` se limitan con `maxFontSizeMultiplier={1.4}`, las filas pasan a 2 líneas.
- Áreas táctiles ≥ 44 × 44 (`touch-min`); estrellas para puntuar 52 × 52; separación mínima de 8 entre targets.

## Lectores de pantalla

- Cards de evento: un solo elemento con label "Divididos — Gira 2027, sábado 12 de diciembre 21:00, desde $ 32.000"; el favorito es un botón aparte con "Guardar en favoritos" / "Quitar de favoritos".
- Estados: el badge se anuncia con el texto completo ("Confirmada, faltan 25 días").
- Stepper: `accessibilityRole="adjustable"` con `accessibilityActions` increment/decrement y `accessibilityValue={{ min, max, now }}`; anunciar "Máximo 3" al llegar al tope.
- Precios: pasar el texto ya formateado; los lectores leen "$ 32.000" como "32 mil pesos".
- Íconos decorativos con `accessible={false}`; `IconButton` siempre con `label`.
- Cambios de estado en vivo (pago aprobado, mensaje nuevo): `AccessibilityInfo.announceForAccessibility`.

## Color y movimiento

- Ninguna información depende solo del color: estados con ícono + texto, escasez con texto ("¡Quedan 14!"), disponibilidad con números además de la barra.
- `success` es turquesa y `error` rojo cálido: además de diferir en tono, siempre llevan ícono distinto.
- "Reducir movimiento": sin escalas, rebotes ni pulso de skeleton; transiciones a fundido de `duration-fast`.
