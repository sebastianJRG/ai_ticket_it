# ChatBubble

Burbujas de chat comprador ↔ organizador dentro de cada compra, con hora y estado de lectura.

- Propia: derecha, `bubble-own` / `on-bubble-own`, esquina inferior derecha recortada, check simple (enviado) o doble en `primary-text` (leído).
- Ajena: izquierda, `surface-raised`, con el nombre del autor en el primer mensaje del grupo.
- `system`: cambios de estado de la compra centrados, con el ícono del estado ("La compra pasó a Confirmada").
- Separadores de día en `overline` ("Hoy", "Ayer", "10 nov"). Ancho máximo 80 %.
