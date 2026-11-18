# StatusBadge

Badge de estado de compra: color semántico + ícono + texto, nunca solo color.

| Estado | Ícono | Tokens | Texto |
|---|---|---|---|
| PENDIENTE | reloj de arena | `status-pending` / `status-pending-bg` | Pendiente de pago |
| CONFIRMADA | check en círculo | `status-confirmed` / `status-confirmed-bg` | Confirmada · faltan X días |
| UTILIZADA | ticket con check | `status-used` / `status-used-bg` | Utilizada |
| CANCELADA | X en círculo | `status-cancelled` / `status-cancelled-bg` | Cancelada |
| REEMBOLSADA | flecha de devolución | `status-refunded` / `status-refunded-bg` | Reembolsada |

- `md` en cards y detalle; `sm` (texto corto) en listas del organizador.
- CONFIRMADA acepta `daysLeft` → "· faltan 5 días", "· es mañana", "· es hoy".
- Los íconos difieren en forma además de color, así se distinguen en escala de grises y con daltonismo.
- `Tag` es otra cosa: marca del evento (*Últimas entradas* en `secondary-soft`, *Agotado*, *Nuevo*). No mezclar con estados de compra.
