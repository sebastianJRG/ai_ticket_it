# Contrato de pantallas: Mis compras del comprador

**Feature**: `006-mis-compras-comprador` | Ver [data-model.md](../data-model.md) y [research.md](../research.md).

## Rutas y acceso

| Ruta | Archivo | Visitante | COMPRADOR | ORGANIZADOR |
|------|---------|-----------|-----------|-------------|
| `/compras` | `src/app/(comprador)/compras.jsx` (MOD) | login con `volverA=/compras` (ya existe, 003) | permitir | `/organizador/eventos` (ya existe) |
| `/compra/[idCompra]` | `src/app/compra/[idCompra].jsx` (NUEVO) | `hrefLogin('/compra/<id>')` | permitir | `/organizador/eventos` (007/008 lo cambian a permitir) |

- `reglas.js` (aditivo): `RUTAS` no cambia; se agrega `hrefCompra(idCompra)` → `/compra/<id codificado>` y la rama `/^\/compra\/[^/]+$/` en `decidirAcceso`. Pruebas en `__tests__/navegacion/reglas-test.js` (3 roles + `destinoTrasLogin` con `volverA=/compra/x`).
- `/compra/[idCompra]` va envuelta en `RutaProtegida`.

## `/compras` — Mis compras (US1, US2)

**Peticiones**: `listarMisCompras()` al montar, al enfocar y con el gesto de actualizar (`RefreshControl`). Las respuestas viejas se descartan.

**Estructura**: `AppHeader` grande "Mis compras" → `Tabs` `underline` (Activas · Pasadas · Canceladas, con contador) → `FlatList` de `PurchaseCard` de la pestaña elegida (más reciente primero).

| Estado | UI |
|--------|----|
| Carga inicial | 3 esqueletos de tarjeta |
| Sin compras (lista vacía) | `EmptyState` "Todavía no compraste entradas" + acción "Explorar eventos" → `/explorar` |
| Pestaña vacía (hay compras en otras) | `EmptyState` sin acción, texto por pestaña (data-model §2) |
| Error sin datos | `EmptyState` con `mensajeError(error)` + "Reintentar" |
| Error con datos | Lista visible + toast de error |
| Con datos | Tarjetas; contadores = largo de cada grupo |

**Tarjeta**: tocarla → `router.push(hrefCompra(id))`. Si `esCancelable(compra)`: botón "Cancelar" → `ConfirmarCancelacion`.

**Cancelación** (2 toques: Cancelar + confirmar):

| Resultado | Efecto |
|-----------|--------|
| 200 | Cierra el diálogo, toast "Compra cancelada", `recargar()`; la compra aparece en Canceladas |
| 400 / 403 / 404 / 0 / otro | Cierra el diálogo, toast de error (`mensajeErrorCancelacion`), `recargar()` |
| 401 | Lo maneja la capa de servicios (001: cierre de sesión y login) |

Mientras se envía: botón de confirmar con spinner, "No, conservar entradas" deshabilitado, sin segunda petición.

## `/compra/[idCompra]` — Detalle de compra (US2, US3, US4)

**Peticiones**: `listarMisCompras()` (busca la compra por `idCompra`); si la compra está UTILIZADA, además `listarReseniasEvento(compra.evento.id)` para saber si ya calificó.

**Estructura**: `AppHeader` con volver (a `/compras` si no hay historial) y título del evento → resumen (`ResumenCompra`: evento, fecha larga, "2 × Platea", total) + `StatusBadge` con días → `Tabs` `segmented` Detalle · Chat.

**Pestaña Detalle**:

1. `StatusTimeline` con `pasosLinea(estado)`.
2. Si `esCancelable(compra)`: botón secundario destructivo "Cancelar compra" → `ConfirmarCancelacion` (mismo resultado que en la lista; tras 200 la pantalla se actualiza en el lugar con el nuevo estado).
3. Si `estado === 'UTILIZADA'`: `SeccionCalificacion`.

**Pestaña Chat**: `EmptyState` provisorio (ícono `message`); la reemplaza 008.

| Estado | UI |
|--------|----|
| Carga | Esqueleto del resumen |
| Compra no está en el listado | `EmptyState` "No encontramos esta compra" + "Ver mis compras" → `/compras` |
| Error | `EmptyState` con `mensajeError(error)` + "Reintentar" |

### SeccionCalificacion (US4)

| Estado | UI |
|--------|----|
| Verificando reseñas del evento | Esqueleto de una línea |
| `yaCalificado` | Texto "Ya calificaste este evento" (sin acción) |
| Sin calificar | Botón "Calificar evento" → muestra el formulario inline |
| Formulario | `RatingInput` + `TextField` multilínea "Comentario" (máx. 1000, contador) + "Enviar reseña" |
| Validación fallida | Error bajo el campo: "Elegí de 1 a 5 estrellas" / "Escribí un comentario" / "Máximo 1000 caracteres"; no hay petición |
| Enviando | Botón con spinner; sin segunda petición |
| 201 | Toast "¡Gracias por tu reseña!"; la sección pasa a "Ya calificaste este evento" |
| 409 | Aviso "Ya calificaste este evento"; se oculta la acción |
| 400 / 403 / 0 | Aviso en línea (`mensajeErrorResenia`); se puede reintentar |
