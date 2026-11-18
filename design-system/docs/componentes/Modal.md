# Modal

Diálogo centrado para confirmar decisiones importantes o irreversibles.

- Uso principal: **cancelar una compra** (pasa a CANCELADA y pide reembolso). Título como pregunta, cuerpo con el impacto concreto (cantidad, monto, plazo de reembolso).
- Botón de confirmación con el verbo exacto ("Sí, cancelar y pedir reembolso"), `destructive` si es irreversible; el secundario conserva ("No, conservar entradas").
- Fondo `scrim-modal`, entrada en `duration-slow`. Cerrar con back de Android = cancelar.
