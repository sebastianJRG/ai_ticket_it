# Button

Botón de acción con cuatro variantes, tres tamaños y estados default/pressed/disabled/loading.

**Cuándo usar cada variante**
- `primary` (relleno `primary`, texto `on-primary`): la acción por la que existe la pantalla — *Comprar entradas*, *Pagar $ 70.400*, *Publicar evento*. **Una sola por pantalla.**
- `secondary` (contorno `border-strong`): alternativa de igual peso pero no principal — *Cancelar* junto a *Pagar ahora*, *Guardar borrador*, *Dejar reseña*.
- `ghost` (texto `primary-text`): acciones terciarias y navegación — *Ver todos*, *Deshacer* en un toast.
- `destructive` (relleno `error`): solo para confirmar algo irreversible, y **solo dentro de un Modal de confirmación** (*Sí, cancelar y pedir reembolso*). El botón que abre esa confirmación es `secondary`.

**Tamaños**: `lg` (52) para el CTA fijo inferior y modales, `md` (44) por defecto, `sm` (36 visual + `hitSlop` 4) solo en filas densas.

**Estados**: pressed = `primary-pressed` + escala 0.97 en `duration-instant`; disabled = `opacity-disabled` y sin `onPress`; loading = spinner, mismo ancho, `accessibilityState={{ busy: true }}`. Mientras se procesa un pago usar `loading`, nunca `disabled`.

**Copy**: verbo en infinitivo o imperativo voseado, sentence case, con el monto cuando hay plata en juego (*Pagar $ 70.400*). Sin signos de exclamación.

**React Native**: `Pressable` con `accessibilityRole="button"`, `accessibilityState={{ disabled, busy: loading }}`; `glow` solo en el CTA de detalle/checkout (`shadows.glowPrimary`).
