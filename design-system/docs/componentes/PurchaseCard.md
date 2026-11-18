# PurchaseCard

Card de compra del comprador con forma de ticket troquelado: evento, tipo y cantidad, total, estado y cuenta regresiva.

- Parte superior: thumbnail, nombre del evento, fecha y lugar. Troquel (`radius-notch`, línea punteada `border`). Talón: "2 × Campo general", total en `price`, `StatusBadge` y detalle según estado:
  - PENDIENTE → "Pagá antes de las 23:59" + acciones *Cancelar* / *Pagar ahora*.
  - CONFIRMADA → "Faltan 25 días" (número en `display`, `primary-text`).
  - UTILIZADA → "Dejá tu reseña" si no reseñó + acción *Dejar reseña*.
  - CANCELADA / REEMBOLSADA → imagen atenuada.
- Toda la card abre el detalle de compra (Detalle + Chat).
