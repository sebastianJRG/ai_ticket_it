# Contrato de UI: módulos, hooks, componentes y pantalla

**Feature**: `008-chat-compra` | **Plan**: [plan.md](../plan.md)

## Módulos puros

### `src/mensajes/chat.js` (NUEVO)

| Export | Firma | Contrato |
|--------|-------|----------|
| `LIMITE_MENSAJE` | `1000` | Igual a `crearMensajeSchema`. |
| `validarMensaje` | `(texto: string) → { valido, largo, error }` | Ver [data-model §4](../data-model.md#4-validación-validarmensaje). |
| `fusionarMensajes` | `(servidor: Mensaje[], locales: MensajeLocal[], miId: string) → Array<Mensaje \| MensajeLocal>` | Reglas de [research R4](../research.md#r4-sin-duplicados-ni-pérdidas-sc-002). No muta las entradas. |
| `agruparMensajes` | `(mensajes, miId: string, ahora?: Date) → ItemChat[]` | Separadores de día y `mostrarAutor` ([data-model §3](../data-model.md#3-ítems-visibles-agruparmensajes)). |
| `mensajeErrorChat` | `(error) → { titulo, cuerpo, reintentable: boolean }` | 403, 404 y 400 propios; el resto lo resuelve `mensajeError` (R6). |
| `textoErrorEnvio` | `(error) → string` | Texto de una burbuja en error: `error.message` si es un 400, o "Revisá tu conexión e intentá de nuevo." en cualquier otro caso (R3). |
| `estaAlFinal` | `(evento: { contentOffset, contentSize, layoutMeasurement }, margen?: number) → boolean` | Margen por defecto: 48. |

## Hooks (`src/hooks/`)

| Hook | Firma | Contrato |
|------|-------|----------|
| `useChatCompra` (NUEVO) | `(idCompra, { activo, intervaloMs? }) → { mensajes, cargando, error, enviar, reintentar, recargar }` | Consulta periódica encadenada, cola FIFO y descarte de respuestas viejas ([data-model §5](../data-model.md#5-estados-de-los-hooks)). `miId` sale de `useAuth()`. Nunca lanza. |
| `usePantallaActiva` (NUEVO) | `() → boolean` | Foco y `AppState` en `active`. |

## Componentes presentacionales (`src/components/`)

Solo usan `useTheme`: no importan servicios ni contextos.

### `ChatBubble` (NUEVO), doc `design-system/docs/componentes/ChatBubble.md`

| Prop | Tipo | Notas |
|------|------|-------|
| `texto` | `string` | |
| `hora` | `string` | Ya formateada. |
| `propio` | `boolean` | Lado y colores. |
| `autor` | `string` | Siempre en el `accessibilityLabel`. Visible solo con `mostrarAutor`. |
| `mostrarAutor` | `boolean?` | Solo tiene efecto si es ajeno. |
| `estado` | `'enviado' \| 'enviando' \| 'error'` | Por defecto `'enviado'`. |
| `error` | `string?` | Texto bajo la burbuja en `error` (lo arma `textoErrorEnvio`). |
| `alReintentar` | `function?` | Muestra el botón "Reintentar" (con un área táctil de 44 o más) en `error`. |

Accesibilidad: el `accessibilityLabel` es `"{autor}, {hora}: {texto}"`, con el sufijo ". Enviando" o ". No se envió" según el estado. El estado no depende solo del color: lleva ícono y texto.

### `MessageComposer` (NUEVO), doc `MessageComposer.md`

| Prop | Tipo | Notas |
|------|------|-------|
| `valor` | `string` | Controlado. |
| `alCambiar` | `function(string)` | |
| `alEnviar` | `function()` | Solo se llama si `validarMensaje(valor).valido` (el padre valida y le pasa `valido`). |
| `valido` | `boolean` | Habilita "Enviar". |
| `largo` | `number` | Contador `largo/1000` cuando es `>= 800`. |
| `error` | `string?` | En `danger` y anunciado (`accessibilityLiveRegion="polite"`). |
| `placeholder` | `string?` | Por defecto "Escribí un mensaje". |

Comportamiento:

- Pill `surfaceRaised` que crece hasta 4 líneas.
- El botón enviar es un `IconButton` de 44 en `primary`, con la etiqueta "Enviar mensaje".
- Deshabilitado, lleva `accessibilityHint` "Escribí un mensaje para enviar" o el `error`.
- Con el texto recortado vacío y sin `error`, muestra la ayuda visible "Escribí un mensaje para enviar" (`caption`, `textMuted`) debajo del campo. Con `error`, muestra el error en su lugar.
- Sin `maxLength` (R5).
- La prop `locked` del diseño **no** se implementa (YAGNI: el backend nunca bloquea).

## Componente compuesto

### `src/mensajes/ChatCompra.jsx` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `idCompra` | `string` | |
| `activo` | `boolean` | Forma final (US3): `usePantallaActiva() && pestana === 'chat'`. En US1 y US2 la pantalla pasa solo `pestana === 'chat'`, porque todavía no hay consulta periódica. |
| `encabezado` | `ReactNode` | El resumen y las `Tabs` de la pantalla, en `ListHeaderComponent`. |
| `rolOtro` | `'organizador' \| 'comprador'` | Solo para el texto del estado vacío (R9). |

Usa `useAuth`, `useChatCompra`, `chat.js`, `ChatBubble`, `MessageComposer`, `EmptyState` y `Skeleton`. El texto del composer es estado propio y se vacía al enviar. Arma un `FlatList` de `agruparMensajes(...)` con `keyExtractor = clave`, sigue el scroll con `estaAlFinal` (R8) y muestra el chip "Mensajes nuevos" cuando corresponde. Lo envuelve un `KeyboardAvoidingView` con el composer abajo y la safe area inferior.

Estados:

| Estado | Render |
|--------|--------|
| `cargando` | `encabezado` + esqueletos (`busy`) + composer deshabilitado |
| `error` (bloqueante) | `encabezado` + `EmptyState` de `mensajeErrorChat`, con "Reintentar" solo si es `reintentable`, sin composer |
| `mensajes` vacío | `encabezado` + `EmptyState` "Todavía no hay mensajes" + composer |
| con mensajes | `encabezado` + separadores + burbujas + composer |

## Pantalla

### `/compra/[idCompra]` (MOD), `src/app/compra/[idCompra].jsx`

- **Ambas variantes** (comprador y organizador): con `pestana === 'chat'` renderizan `<ChatCompra idCompra={compra.id} activo={activa && pestana === 'chat'} encabezado={…resumen + Tabs…} rolOtro=… />` en lugar del `ScrollView`. Con `'detalle'` todo queda como hoy.
- Se elimina el `EmptyState` provisorio "Muy pronto vas a poder escribirle…" de las dos variantes.
- La variante del organizador suma `KeyboardAvoidingView` como la del comprador.
- No hay rutas nuevas ni cambios en `reglas.js`. El acceso ya lo resuelven `RutaProtegida` y `DETALLE_COMPRA` (006/007). Un organizador ajeno ya ve el 403 de las compras del evento antes del chat; si igual llegara al chat, `ChatCompra` muestra el 403 propio (US2-2).
- Las entradas existentes no cambian: Mis compras → `hrefCompra(id)`; Compras del evento y Mensajes → `hrefCompra(id, { eventoId })`.
