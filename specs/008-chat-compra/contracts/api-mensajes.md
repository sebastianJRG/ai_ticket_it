# Contrato consumido: API de mensajes (sin cambios de API)

**Feature**: `008-chat-compra`

La app solo consume estas rutas a través de `frontend/src/services/mensajeService.js` (001). La fuente es `backend/src/routes/comprasRoutes.js`, `controllers/mensajeController.js`, `services/mensajeService.js` y `dto/mensaje.js`. Las rutas, los cuerpos y las respuestas no cambian. Solo se agregan logs del servidor (ver la sección de abajo y research R11).

| Método y ruta | Servicio del cliente | Cuerpo | Éxito |
|---------------|----------------------|--------|-------|
| `GET /api/compras/:idCompra/mensajes` | `listarMensajes(idCompra)` | — | `200` con `Mensaje[]`, del más antiguo al más reciente (`[]` si no hay) |
| `POST /api/compras/:idCompra/mensajes` | `enviarMensaje(idCompra, texto)` | `{ mensaje }` (1–1000 caracteres después de `trim`) | `201` con `Mensaje` |

Las dos son autenticadas (COMPRADOR u ORGANIZADOR) y el remitente sale del token. Ver la forma de `Mensaje` en [data-model.md §1](../data-model.md#1-entidad-de-la-api-sin-cambios).

## Errores y cómo los muestra la app

| Status | Causa en el servidor | Carga inicial | Consulta periódica | Envío |
|--------|----------------------|---------------|--------------------|-------|
| 400 | ID vacío, o texto vacío o > 1000 | "No pudimos abrir esta conversación" + Reintentar | silencioso | burbuja en error con el mensaje del servidor + Reintentar |
| 401 | sin token o token vencido | lo maneja el interceptor de `api.js` (refresh o logout) | ídem | ídem |
| 403 | no es el comprador dueño ni el organizador del evento | "No tenés acceso a esta conversación" (sin reintento) | detiene la consulta y muestra ese estado | ídem: burbuja en error y estado 403 |
| 404 | la compra no existe | "Esta compra ya no existe" (sin reintento) | detiene la consulta y muestra ese estado | ídem |
| 0 / 5xx | red o servidor | `mensajeError` + Reintentar | silencioso; reintenta en el próximo ciclo | burbuja en error con "Revisá tu conexión e intentá de nuevo." + Reintentar |

## Garantías del servidor en las que se apoya el cliente

- El orden es por creación (`enviado`).
- No hay restricción por estado de la compra ni por fecha del evento.
- El texto se guarda recortado (`trim`). El cliente envía el texto ya recortado para que la deduplicación de R4 compare igual.
- No hay idempotencia: dos POST iguales crean dos mensajes. Por eso la cola es de a uno y no hay reintentos automáticos de envío.

## Logs del servidor

Una línea JSON por operación **exitosa** en `MensajeService`, con el logger inyectado (por defecto `console`). Las operaciones que fallan no emiten un log propio ([research R11](../research.md#r11-observabilidad-del-chat)).

| `evento` | Cuándo | Campos |
|----------|--------|--------|
| `mensaje_creado` | `POST` con 201 | `requestId`, `usuarioId`, `rol`, `compraId`, `estadoCompra`, `mensajeId`, `largo` |
| `mensajes_listados` | `GET` con 200 (también en cada consulta periódica) | `requestId`, `usuarioId`, `rol`, `compraId`, `estadoCompra`, `cantidad` |

- `requestId` sale de `req.id` (middleware `asignarRequestId`); sin contexto es `null`.
- El texto del mensaje **nunca** se registra.
