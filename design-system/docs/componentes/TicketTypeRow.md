# TicketTypeRow

Fila de tipo de entrada (General / Platea / VIP) con descripción, precio, cupo restante, agotado y stepper.

- En **checkout** (`interactive`) lleva `QuantityStepper` con `max = min(cupo, máximo por compra)`. Con cantidad > 0 la fila se marca con borde `primary-text`.
- En **detalle del evento** (`interactive={false}`) solo informa.
- Cupo: "Quedan 412"; escasez (≤ 20 o ≤ 10 %) → "¡Quedan 14!" en `secondary-text`.
- Agotado: tag *Agotado*, precio tachado, "Sin cupo", sin stepper y fila sin relleno. Nunca ocultar un tipo agotado: muestra demanda.
