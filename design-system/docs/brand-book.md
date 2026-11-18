AI Ticket It es una app mobile (React Native) para descubrir y comprar entradas a recitales, teatro, festivales, conferencias y deportes, y para que los organizadores publiquen eventos y atiendan cada compra. Se siente como la previa de un show: oscura, enérgica, con las imágenes de los eventos al frente; y a la vez transmite la calma de un lugar donde es seguro pagar.

## Principios

1. **El evento es el protagonista.** La imagen ocupa el ancho de la card y va arriba; la interfaz se apaga a su alrededor (`bg`, `surface`). Un solo acento fuerte por vista.
2. **Volt para actuar, Pulse para emocionar.** `primary` (volt, lima eléctrico) marca lo que se toca para avanzar: comprar, pagar, la pestaña activa. `secondary` (pulse, rosa) marca lo que genera ganas: favoritos, *Últimas entradas*, escasez. Nunca intercambiarlos.
3. **El estado se lee sin color.** Cada estado de compra tiene color, ícono con forma propia y texto. Ver *Estados de compra*.
4. **Plata clara, siempre.** Precios en `price` con cifras tabulares, total visible antes de pagar, cargos desglosados, el monto dentro del botón de pago.
5. **Ticket como forma.** El troquel (muescas `radius-notch` + línea punteada) aparece donde hay una entrada real: card de compra, resumen de checkout, empty states. No decorar otra cosa con él.

## Voz y tono

- Español rioplatense con voseo: "Elegí tus entradas", "Pagá antes de las 23:59", "Dejá tu reseña". Nunca "tú" ni "usted".
- Sentence case en todo (títulos, botones, tabs). Mayúsculas solo en `overline` (DIC · RECITAL).
- Directo y concreto: el botón dice qué pasa y cuánto cuesta ("Pagar $ 70.400"), las confirmaciones dicen el impacto ("Se cancelan 2 entradas… reembolso de $ 64.000").
- Entusiasmo en descubrimiento ("Tu próxima noche empieza acá"); sobriedad en pagos, errores y cancelaciones. Sin signos de exclamación en errores; sí en celebraciones puntuales ("¡Compra confirmada!").
- Sin emojis en la interfaz.

## Color

- **Tema principal: dark.** Light es alternativa completa; ambos usan los mismos nombres de token y se eligen con `useColorScheme()` + preferencia del usuario.
- Fondos en tres niveles: `bg` (pantalla) → `surface` (cards, inputs, bottom nav) → `surface-raised` (chips, stepper, burbujas ajenas) → `surface-overlay` (sheets, modales, toasts). En light, las cards se separan del `bg` con `shadow-md`.
- Texto: `text` para todo lo principal, `text-muted` para metadatos, `text-subtle` para placeholders, horas y contadores. Los tres cumplen 4.5:1 sobre todos los fondos en ambos temas.
- `primary` es un relleno, no un color de texto: sobre él va `on-primary`. Para links, precios destacados, estrellas y selección usar `primary-text` (lima en dark, oliva `#466300` en light).
- En light el botón `primary` (lima sobre blanco) se reconoce por su texto `on-primary` (14:1); no lo uses sin label.
- Semánticos `success` (turquesa), `warning`, `error`, `info`, cada uno con su `-soft` para fondos. `success` es turquesa y no verde puro para separarse de `error` con daltonismo rojo-verde.
- Texto sobre imágenes: siempre `text-on-image` encima del degradé a `scrim-image` (≥ 8:1 aun sobre una foto blanca).

## Estados de compra

| Estado | Significa | Ícono | Color | Acompaña |
|---|---|---|---|---|
| PENDIENTE | Reservada, falta pagar | reloj de arena | `status-pending` | "Pagá antes de las 23:59" |
| CONFIRMADA | Pagada | check en círculo | `status-confirmed` | "Faltan 25 días" / "Es mañana" / "Es hoy" |
| UTILIZADA | Se escaneó en el ingreso | ticket con check | `status-used` | "Dejá tu reseña" |
| CANCELADA | El comprador o el organizador la canceló | X en círculo | `status-cancelled` | Imagen atenuada |
| REEMBOLSADA | Se devolvió el dinero | flecha de devolución | `status-refunded` | Monto devuelto en el timeline |

Los badges usan el color sobre su `-bg` (≥ 4.5:1 en ambos temas). Los íconos difieren en forma, así que los estados se distinguen en escala de grises. Nunca comunicar un estado solo con un punto de color.

## Tipografía

- **Bricolage Grotesque** (`display`) para títulos: grotesca expresiva, de cartel, en 600–800. **Manrope** (`text`) para todo lo demás: legible a tamaño chico, con cifras tabulares para precios.
- Escala: `display-xl` 40/44 · `display-lg` 32/36 · `title-lg` 24/30 · `title-md` 20/26 · `title-sm` 17/22 · `body-lg` 17/26 · `body` 15/22 · `body-strong` · `body-sm` 13/18 · `label` 15/20 · `label-sm` 13/16 · `caption` 12/16 · `overline` 12/16 · `price` 17/22 · `price-lg` 28/32.
- 12 es el mínimo absoluto (captions y overline). Cuerpo por defecto 15; inputs 16.
- Respetar el tamaño de texto del sistema: `allowFontScaling` activo y `maxFontSizeMultiplier={1.4}` en títulos `display` para que no rompan el layout.
- En RN cada peso es un `fontFamily` distinto (ver *React Native*); no usar `fontWeight` con fuentes custom.

## Espaciado, layout y radios

- Escala de 4pt: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-8` 32 · `space-10` 40 · `space-12` 48 · `space-16` 64.
- Ancho base `screen-width` 390; diseñar fluido de 360 a 430. Margen lateral `space-4`; entre secciones `space-6`; dentro de cards `space-4`.
- Safe areas siempre con `react-native-safe-area-context`: el header suma `insets.top`, la bottom nav y los CTA fijos suman `insets.bottom`. La imagen hero del detalle sí va debajo del status bar.
- Toda área táctil ≥ `touch-min` (44 × 44). Si lo visual es más chico (botón `sm`, chips de filtro) se completa con `hitSlop`.
- Radios: `radius-md` 12 controles, `radius-lg` 16 cards de compra y filas, `radius-xl` 24 cards de evento y sheets, `radius-full` chips, search y avatares.

## Imágenes

- Cada evento tiene multimedia; la primera imagen es la portada. Recortes: 16:10 en `EventCard`, 4:3 en el hero del detalle, 1:1 en thumbnails. `contentFit="cover"`, nunca deformar.
- Mientras carga, el contenedor muestra `surface-raised` (no un spinner). Con `expo-image` usar `placeholder` con blurhash.
- Compras canceladas/reembolsadas y eventos pasados: imagen a `opacity-muted-image`.
- Los gráficos `PosterArt` de estas previews son placeholders de diseño, no un estilo de ilustración de la marca.

## Iconografía

- **lucide-react-native**, trazo 2, extremos redondeados. 16 en badges, 20 en botones e inputs, 24 en navegación. La tarjeta *Icon* muestra el set y su equivalencia con Lucide.
- Íconos de categoría: Recitales (nota musical), Teatro (máscara), Festivales (carpa), Conferencias (micrófono), Deportes (trofeo).
- No hay logo provisto: el nombre se compone en Bricolage Grotesque 800 hasta que exista una marca.

## Elevación y movimiento

- Dark separa planos por color de superficie; las sombras son sutiles. Light separa cards con `shadow-md`. `shadow-lg` solo en sheets, modales y toasts. `glow-primary` solo en el CTA fijo de compra.
- Duraciones: `duration-instant` 80 (pressed), `duration-fast` 150 (toggles, favorito, stepper), `duration-base` 220 (tabs, toasts), `duration-slow` 320 (sheet, modal), `duration-skeleton` 1200. Curvas `ease-standard`, `ease-enter`, `ease-exit`.
- Pressed: escala 0.97 + color `-pressed`. Favorito: rebote 1 → 1.2 → 1. Respetar "Reducir movimiento" (`AccessibilityInfo.isReduceMotionEnabled`): sin escalas ni pulsos.

## Estados de interacción

- Pressed: color `-pressed` o `opacity-pressed` en superficies (cards, filas).
- Disabled: `opacity-disabled` y sin handler; el motivo se explica cerca ("Máximo 3", "Sin cupo").
- Foco (teclado externo, switch access): anillo 2px `focus-ring` con 2px de separación, ≥ 3:1 sobre cualquier superficie.
- Error: borde 2px `error` + ícono + texto que dice cómo resolverlo.
- Carga: skeletons en listas, `loading` en botones. Nunca bloquear la pantalla entera salvo al procesar el pago.

## Botones: qué variante usar

- Una sola `primary` por pantalla, para la acción que justifica la pantalla.
- `secondary` para la alternativa al lado de la primaria (Cancelar / Pagar ahora; Borrador / Publicar).
- `ghost` para acciones terciarias y "Ver todos".
- `destructive` solo dentro del Modal que confirma algo irreversible (cancelar compra, eliminar evento).
- CTA fijo inferior: `lg`, ancho completo o junto al precio, sobre `surface` con borde superior.

## Roles

Comprador y organizador usan la misma app y el mismo sistema; cambia la bottom nav (ver *BottomNav*) y el contenido. El organizador ve números (disponibilidad, compras por estado) con la misma tipografía tabular; el comprador ve emoción (imágenes, cuenta regresiva).
