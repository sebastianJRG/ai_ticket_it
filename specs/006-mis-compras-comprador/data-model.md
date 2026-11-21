# Data Model: Mis compras del comprador

**Feature**: `006-mis-compras-comprador` | **Fecha**: 2026-11-21 | **Plan**: [plan.md](./plan.md)

Solo modelos del cliente: no hay entidades nuevas en el backend ni persistencia en el dispositivo. Las reglas de dominio (transiciones de `EstadoCompra`, una reseña por evento) las aplica el servidor; el cliente solo decide qué acciones **mostrar**.

## 1. Compra (respuesta de `GET /api/compras`)

Formato del backend (`aCompraDeCompradorRespuesta`), sin cambios:

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | ID de la compra |
| `comprador` | `{ id, nombre, apellido }` | Datos públicos del dueño |
| `evento` | `{ id, nombre, fecha }` | `fecha` ISO; sin lugar ni categoría |
| `tipoEntrada` | `{ id, nombre, precio }` | |
| `cantidad` | number | Entero ≥ 1 |
| `total` | number | Calculado por el servidor |
| `estado` | `EstadoCompra` | PENDIENTE · CONFIRMADA · UTILIZADA · CANCELADA · REEMBOLSADA |
| `diasRestantes` | number \| null | Días hasta el evento (techo, mínimo 0) si CONFIRMADA; `null` en otro estado |

`PATCH /api/compras/:id/cancelacion` devuelve la compra sin `diasRestantes`; por eso tras cancelar se recarga el listado ([R6](./research.md#r6-flujo-de-cancelación)).

### Transiciones (referencia, las aplica el backend)

```text
PENDIENTE ──► CONFIRMADA ──► UTILIZADA (terminal, automática tras el evento)
    │              ├──────► CANCELADA (terminal)
    │              └──────► REEMBOLSADA (terminal)
    └────────► CANCELADA (terminal)
```

## 2. Pestaña de compras (`PestanaCompras`)

| Clave | Etiqueta | Estados incluidos | Vacío |
|-------|----------|-------------------|-------|
| `activas` | Activas | PENDIENTE, CONFIRMADA | "No tenés compras activas" |
| `pasadas` | Pasadas | UTILIZADA | "No tenés compras pasadas" |
| `canceladas` | Canceladas | CANCELADA, REEMBOLSADA | "No tenés compras canceladas" |

- **ComprasAgrupadas**: `{ activas: Compra[], pasadas: Compra[], canceladas: Compra[] }`, cada lista en orden de creación **descendente**. Invariante: cada compra con estado conocido está en exactamente una lista; `contador(p) = lista(p).length`.

## 3. Reglas de presentación (puras)

| Función | Entrada | Salida |
|---------|---------|--------|
| `pestanaDeEstado(estado)` | `EstadoCompra` | `'activas'\|'pasadas'\|'canceladas'\|null` |
| `agruparPorPestana(compras)` | `Compra[]` | `ComprasAgrupadas` |
| `esCancelable(compra, ahora?)` | Compra, Date | `true` sii estado ∈ {PENDIENTE, CONFIRMADA} y `evento.fecha > ahora` |
| `cuerpoCancelacion(compra)` | Compra | Texto del impacto: cantidad × tipo, evento, total, reembolso |
| `mensajeErrorCancelacion(error)` | `ApiError` | `{ titulo, cuerpo }` (400, 403, 404, 0, otro) |
| `pasosLinea(estado)` | `EstadoCompra` | `PasoLinea[]` (§4) |

## 4. Paso de la línea de estado (`PasoLinea`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `estado` | `EstadoCompra` | Define ícono, color y texto (`theme.purchaseStatus`) |
| `situacion` | `'hecho'\|'actual'\|'pendiente'` | Exactamente un paso `actual` |

| Estado actual | Pasos |
|---------------|-------|
| PENDIENTE | PENDIENTE·actual, CONFIRMADA·pendiente, UTILIZADA·pendiente |
| CONFIRMADA | PENDIENTE·hecho, CONFIRMADA·actual, UTILIZADA·pendiente |
| UTILIZADA | PENDIENTE·hecho, CONFIRMADA·hecho, UTILIZADA·actual |
| CANCELADA | PENDIENTE·hecho, CANCELADA·actual |
| REEMBOLSADA | PENDIENTE·hecho, CONFIRMADA·hecho, REEMBOLSADA·actual |
| desconocido | `[]` |

Sin fechas ni autor por paso (el backend no expone el historial).

## 5. Reseña

**Envío** (`POST /api/resenias`): `{ eventoId, detalle, puntuacion }`; respuesta `{ id, comprador, eventoId, detalle, puntuacion }`.

**BorradorResenia** (estado del formulario): `{ puntuacion: 1..5 | null, detalle: string }`.

| Regla (`validarResenia`) | Mensaje |
|--------------------------|---------|
| `puntuacion` entero 1–5 | "Elegí de 1 a 5 estrellas" |
| `detalle.trim()` no vacío | "Escribí un comentario" |
| `detalle.trim().length ≤ 1000` | "Máximo 1000 caracteres" |

Salida: `{ valido: boolean, errores: { puntuacion?: string, detalle?: string } }`. Se envía `detalle.trim()`.

**Escala** (`ESCALA_PUNTAJE`): 1 Malo · 2 Regular · 3 Bueno · 4 Muy bueno · 5 Excelente. Caption: `"4/5 · Muy bueno"`.

**`yaCalifico(resenias, usuarioId)`**: `true` si alguna reseña tiene `comprador?.id === usuarioId`.

**`mensajeErrorResenia(error)`** → `{ titulo, cuerpo, yaCalificado }`: 409 → "Ya calificaste este evento" (`yaCalificado: true`); 400 → "No pudimos guardar tu reseña" + mensaje del servidor; 403 → "Necesitás una entrada utilizada de este evento para calificarlo"; 0 → "Sin conexión"; otro → genérico.

## 6. Estados de los hooks

**`useMisCompras()`** → `EstadoMisCompras`

| Campo | Tipo | Notas |
|-------|------|-------|
| `compras` | `Compra[]\|null` | `null` hasta la primera respuesta |
| `cargando` | boolean | Carga inicial |
| `actualizando` | boolean | Gesto de actualizar / recarga con datos |
| `error` | `ApiError\|null` | Último error |
| `recargar` | `() => Promise<void>` | Descarta respuestas viejas |

**`useCancelarCompra({ alTerminar })`** → `{ cancelar(compra): Promise<void>, enviando: boolean }`. Una sola petición en curso; `alTerminar({ ok, compra, error })`.

**`useCalificarEvento(eventoId, usuarioId)`** → `{ yaCalificado: boolean, verificando: boolean, enviar(borrador): Promise<boolean>, enviando: boolean, error: MensajeErrorResenia\|null }`.
