# Contrato de módulos, hooks y componentes: Mis compras del comprador

**Feature**: `006-mis-compras-comprador` | Ver [data-model.md](../data-model.md).

Todo export lleva JSDoc (`@param` con tipo, `@returns`, `@throws` si aplica; `@typedef`/`@property` para props y estados) y cada archivo su docstring `@file` / `@owner` / `@license`.

## Módulos puros (sin React ni servicios)

### `src/compras/misCompras.js` (NUEVO)

```js
export const PESTANAS_COMPRAS; // readonly [{ clave: 'activas'|'pasadas'|'canceladas', etiqueta, estados: EstadoCompra[], vacio }]
export function pestanaDeEstado(estado) {}            // → clave | null
export function agruparPorPestana(compras) {}         // → { activas, pasadas, canceladas } (más reciente primero)
export function esCancelable(compra, ahora = new Date()) {} // → boolean
export function cuerpoCancelacion(compra) {}          // → string
export function mensajeErrorCancelacion(error) {}     // → { titulo, cuerpo }
export function pasosLinea(estado) {}                 // → PasoLinea[]
```

### `src/resenias/calificacion.js` (NUEVO)

```js
export const ESCALA_PUNTAJE;                    // { 1: 'Malo', …, 5: 'Excelente' }
export function textoPuntaje(puntuacion) {}     // 4 → "4/5 · Muy bueno"; null → ''
export function validarResenia(borrador) {}     // → { valido, errores: { puntuacion?, detalle? } }
export function yaCalifico(resenias, usuarioId) {} // → boolean
export function mensajeErrorResenia(error) {}   // → { titulo, cuerpo, yaCalificado }
```

### `src/navegacion/reglas.js` (MOD, aditivo)

```js
export function hrefCompra(idCompra) {} // → `/compra/${encodeURIComponent(idCompra)}`
// decidirAcceso: nueva rama /compra/:id → visitante: login con volverA; COMPRADOR: permitir; ORGANIZADOR: /organizador/eventos
```

## Hooks (`src/hooks/`)

| Hook | Servicios | Contrato |
|------|-----------|----------|
| `useMisCompras()` (NUEVO) | `listarMisCompras` | `EstadoMisCompras` (data-model §6). Pide al montar; `recargar()` descarta respuestas viejas; `cargando` solo sin datos, `actualizando` con datos. No recarga al enfocar por sí solo: lo hace la pantalla con `useFocusEffect(recargar)`. |
| `useCancelarCompra({ alTerminar })` (NUEVO) | `cancelarCompra` | `cancelar(compra)` ignora llamadas mientras `enviando` (ref síncrona); llama `alTerminar({ ok: true, compra })` o `alTerminar({ ok: false, error })`. No lanza. |
| `useCalificarEvento(eventoId, usuarioId)` (NUEVO) | `listarReseniasEvento`, `crearResenia` | Con `eventoId` nulo no pide nada. Verifica con `yaCalifico`; si la verificación falla, `yaCalificado = false`. `enviar(borrador)` valida con `validarResenia` (si es inválido devuelve `false` sin petición), envía `detalle.trim()`, una sola petición en curso; 201/409 → `yaCalificado = true`. Devuelve `true` solo con 201. |

## Componentes compuestos (usan hooks/contextos)

### `src/compras/ConfirmarCancelacion.jsx` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `compra` | `Compra\|null` | `null` → diálogo cerrado |
| `alCerrar` | `() => void` | Cierra sin cancelar (o tras terminar) |
| `alTerminar` | `(resultado) => void` | Tras la respuesta (la pantalla recarga) |

Usa `useCancelarCompra`, `useToast` y `Modal` (`destructivo`, `etiquetaConfirmar="Sí, cancelar compra"`, `etiquetaCancelar="No, conservar entradas"`, `cuerpo={cuerpoCancelacion(compra)}`, `cargando={enviando}`).

### `src/resenias/SeccionCalificacion.jsx` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `eventoId` | string | Evento a calificar |

Toma el usuario de `useAuth()`; usa `useCalificarEvento`, `useToast`, `RatingInput`, `TextField`, `Button`. Comportamiento en [pantallas.md › SeccionCalificacion](./pantallas.md#seccioncalificacion-us4).

## Componentes presentacionales (`src/components/`, sin servicios ni contextos salvo `useTheme`)

### `Tabs` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `pestanas` | `{ clave, etiqueta, contador? }[]` | Máx. 4 visibles |
| `seleccionada` | string | Clave activa |
| `alCambiar` | `(clave) => void` | |
| `variante` | `'underline'\|'segmented'` | `underline` por defecto |

Accesibilidad: contenedor `tablist`; cada pestaña `role="tab"`, `accessibilityState={{ selected }}`, label "Activas, 2" si hay contador.

### `PurchaseCard` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `compra` | `Compra` | Formato del listado |
| `cancelable` | boolean | Muestra "Cancelar" |
| `alPresionar` | `() => void` | Abre el detalle |
| `alCancelar` | `() => void` | Botón propio, no dispara `alPresionar` |

Muestra nombre del evento, `formatDate(fecha)`, "2 × Platea", `formatPrice(total)`, `StatusBadge size="sm" daysLeft={diasRestantes}`; CONFIRMADA → `formatDaysLeft(diasRestantes)` destacado; PENDIENTE → "Esperando la confirmación del organizador"; CANCELADA/REEMBOLSADA atenuadas. `accessibilityRole="button"` con label "Evento, fecha, estado".

### `PurchaseCardSkeleton` (NUEVO)

Sin props obligatorias; forma de la tarjeta con `Skeleton`. `testID="purchase-card-skeleton"`.

### `StatusTimeline` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `pasos` | `PasoLinea[]` | De `pasosLinea(estado)` |

Lista vertical; cada nodo con ícono/color de `theme.purchaseStatus`, texto corto; el `actual` con anillo y `accessibilityLabel` "<estado>, estado actual"; `pendiente` atenuado.

### `RatingInput` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `valor` | `1..5\|null` | |
| `alCambiar` | `(n) => void` | |
| `error` | string | Mensaje bajo las estrellas |
| `deshabilitado` | boolean | |

5 estrellas de 52×52, cada una `accessibilityRole="radio"`, `accessibilityState={{ checked: n === valor }}`, label "4 estrellas, Muy bueno"; caption `textoPuntaje(valor)`.

## Archivos existentes reutilizados sin cambios

`StatusBadge`, `Modal`, `ResumenCompra`, `EmptyState`, `Skeleton`, `AppHeader`, `Button`, `TextField`, `Toast`/`useToast`, `RutaProtegida`, `formatDate`/`formatPrice`/`formatDaysLeft`, `mensajeError` (`eventos/presentacion.js`), servicios `compraService` y `reseniaService`.
