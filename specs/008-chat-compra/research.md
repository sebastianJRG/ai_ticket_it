# Research: Chat de una compra

**Feature**: `008-chat-compra` | **Fecha**: 2026-11-21 | **Plan**: [plan.md](./plan.md)

Todas las incógnitas del Technical Context quedan resueltas acá. **No hay dependencias nuevas ni cambios en la API del backend** (el único cambio en `backend/` son los logs de R11): la API ya expone `GET` y `POST /api/compras/:idCompra/mensajes` (contrato en [contracts/api-mensajes.md](./contracts/api-mensajes.md)) y el servicio de 001 ya la envuelve (`listarMensajes`, `enviarMensaje` en `frontend/src/services/mensajeService.js`).

---

## R1. Dónde vive el chat y cómo convive con el scroll del detalle

- **Decision**: un compuesto **`ChatCompra`** (`src/mensajes/ChatCompra.jsx`) que usan las **dos variantes** de `/compra/[idCompra]` (FR-006). Cuando la pestaña seleccionada es Chat, la pantalla **no** usa su `ScrollView`: renderiza `ChatCompra` y le pasa el resumen y las `Tabs` como `encabezado`. `ChatCompra` los pone en el `ListHeaderComponent` de su `FlatList` y deja el `MessageComposer` fijo abajo, dentro de un `KeyboardAvoidingView` que respeta la safe area. La pestaña Detalle queda igual que hoy.
- **Rationale**: un `FlatList` dentro de un `ScrollView` vertical rompe la virtualización y RN avisa con un warning. Con un único contenedor de scroll el resumen se desplaza con la conversación y el composer queda pegado al teclado, como pide `MessageComposer.md`.
- **Alternatives considered**: mapear los mensajes dentro del `ScrollView` actual (sin virtualizar y con el composer al final del contenido, no pegado al teclado); una ruta propia `/compra/[id]/chat` (otra guardia y otra entrada en `reglas.js` para algo que el diseño muestra como pestaña).

## R2. Actualización periódica sin websockets

- **Decision**: el hook **`useChatCompra(idCompra, { activo, intervaloMs = 5000 })`** consulta `listarMensajes` cada ~5 s **solo mientras `activo` es `true`**. Encadena `setTimeout`: la siguiente consulta se programa recién cuando responde la anterior, así nunca hay dos en curso. `activo` lo calcula la pantalla como **pantalla enfocada** (`useFocusEffect`) **y** pestaña Chat seleccionada **y** app en primer plano (`AppState === 'active'`), con el hook **`usePantallaActiva()`** (`src/hooks/usePantallaActiva.js`). Cuando `activo` pasa a `false` se cancela el temporizador pendiente y se descarta la respuesta en vuelo. Cuando vuelve a `true`, consulta al instante y retoma el ciclo.
- **Rationale**: cumple FR-004 y SC-003 (0 consultas con el chat oculto, también con la app en segundo plano). Con 5 s, un mensaje del otro participante aparece en menos de 10 s (SC-001), aun sumando la latencia. El intervalo inyectable permite probar con `jest.useFakeTimers()`.
- **Alternatives considered**: `setInterval` (puede encimar peticiones con la red lenta); websockets o SSE (fuera de alcance, spec › Assumptions); consultar también en la pestaña Detalle (gasta peticiones sin mostrar nada).

## R3. Envío optimista, cola y reintento

- **Decision**: al enviar, el texto se agrega al instante como mensaje **local** `{ claveLocal, mensaje, estado: 'enviando', creado }` y el composer se vacía (SC-001: < 100 ms, sin esperar red). Los envíos salen por una **cola FIFO, de a uno**, así el orden en el servidor coincide con el orden en pantalla.
  - **Éxito**: el local pasa a `confirmado` con el `id` y el `enviado` del servidor.
  - **Fallo**: queda en `error` con el texto intacto y el botón "Reintentar" en la burbuja (US1-3). Reintentar lo vuelve a poner en `enviando` al final de la cola. La cola sigue con los siguientes aunque uno falle.
  - El texto bajo la burbuja lo da la función pura `textoErrorEnvio(error)`: con un 400 es `error.message` (el mensaje del servidor, que ya viene legible en el `ApiError`); con cualquier otro error (red, 5xx, 403 o 404) es "Revisá tu conexión e intentá de nuevo.". Un 403 o 404 además pasa el chat al estado de error de R6, que reemplaza la conversación.
- **Rationale**: FR-003 pide verlo de inmediato y reflejar éxito o error. La cola evita que dos POST en paralelo lleguen invertidos.
- **Alternatives considered**: esperar la respuesta para mostrar (rompe SC-001); envíos en paralelo (el orden puede invertirse); devolver el texto fallido al composer (pisa lo que el usuario esté escribiendo).

## R4. Sin duplicados ni pérdidas (SC-002)

- **Decision**: la lista visible la arma la función pura **`fusionarMensajes(servidor, locales, miId)`** (`src/mensajes/chat.js`):
  1. Toma la última lista del servidor como verdad, ordenada por `enviado` y luego por `id`.
  2. Un local `confirmado` cuyo `id` ya está en esa lista se descarta. Si no está (la consulta salió antes del POST), se conserva hasta que aparezca.
  3. Un local `enviando` se oculta si existe en el servidor un mensaje **propio** con el mismo texto (ya recortado) que no esté reclamado por otro local y que sea posterior a `creado` menos 60 s de tolerancia. Esto cubre que la consulta periódica traiga el mensaje antes de que responda el POST.
  4. Los locales restantes van al final, en orden de creación.

  Además, el hook descarta las respuestas viejas de `listarMensajes` con un número de secuencia, igual que `useComprasEvento`. Una vez fusionados en `servidor`, los locales confirmados se limpian.
- **Limitación conocida**: la tolerancia de la regla 3 compara `creado` (reloj del dispositivo) con `enviado` (reloj del servidor). Si los relojes difieren en más de 60 s, el mensaje puede verse duplicado durante un instante, hasta que responde el POST y la regla 2 lo resuelve por `id`. No hay pérdida de mensajes, y en ese caso la duplicación es transitoria.
- **Rationale**: el servidor no acepta una clave de idempotencia, así que el cruce por autor y texto es la única señal disponible mientras el POST está en vuelo. La regla 2 evita que un mensaje confirmado "parpadee" si una consulta vieja llega después.
- **Alternatives considered**: deduplicar solo por `id` (duplica durante la carrera POST/GET); pausar la consulta mientras hay envíos (retrasa los mensajes del otro participante).

## R5. Validación del texto igual a la del servidor

- **Decision**: la función pura **`validarMensaje(texto)`** replica `crearMensajeSchema` (`backend/src/dto/mensaje.js`): primero hace `trim()`, después exige un largo de 1 a 1000 (`LIMITE_MENSAJE = 1000`). Devuelve `{ valido, largo, error }`, donde `largo` es el del texto recortado. El composer:
  - Deshabilita "Enviar" si el texto no es válido. Con el texto vacío muestra la ayuda "Escribí un mensaje para enviar" (`accessibilityHint` del botón y texto de ayuda visible).
  - Muestra el contador `largo/1000` a partir de 800 caracteres y lo pone en `danger` al pasar de 1000, con el error "El mensaje no puede superar los 1000 caracteres".
  - **No** usa `maxLength`: un texto pegado no se trunca en silencio.
  - Envía el texto recortado.
- **Rationale**: paridad con el servidor (los bordes son 1, 1000 y 1001 caracteres, sin contar espacios). Cubre los Edge Cases de vacío y exceso.
- **Alternatives considered**: `maxLength={1000}` (trunca sin avisar y cuenta los espacios que el servidor recorta).

## R6. Errores claros (FR-005)

- **Decision**: la función pura **`mensajeErrorChat(error)`** traduce:
  - **403** → "No tenés acceso a esta conversación" / "Solo el comprador y el organizador del evento pueden usar este chat." (US2-2).
  - **404** → "Esta compra ya no existe".
  - **400** → "No pudimos abrir esta conversación" (ID inválido).
  - Cualquier otro caso (incluido el 0 de red) → `mensajeError` de `eventos/presentacion.js`.

  Si falla la **carga inicial** sin datos, se muestra `EmptyState` con "Reintentar", salvo en 403 y 404, que no ofrecen reintento. Si falla una **consulta periódica** ya con datos, el error es silencioso: se conserva la lista y se reintenta en el próximo ciclo (Edge Cases). La excepción son 403 y 404, que detienen la consulta y reemplazan el chat por el estado de error (perdió el acceso o la compra desapareció).
- **Rationale**: un aviso intrusivo cada 5 s con la red inestable sería ruido. 403 y 404 no se arreglan solos.
- **Alternatives considered**: un toast por cada consulta fallida (molesto); reintentar indefinidamente ante un 403 (contradice SC-003 en espíritu: consultas inútiles).

## R7. Presentación de los mensajes

- **Decision**: **`agruparMensajes(mensajes, miId, ahora)`** (puro) arma los ítems del `FlatList`:
  - Separadores de día en `overline`: "Hoy", "Ayer" o `formatDate(..., 'day')`.
  - Burbujas con `propio` (`usuario.id === miId`), `mostrarAutor` (en el primer mensaje ajeno de un grupo consecutivo del mismo autor) y la hora `formatDate(enviado, 'time')`.

  **`ChatBubble`** sigue `ChatBubble.md`:
  - Propia: a la derecha, `bubbleOwn` / `onBubbleOwn`, esquina inferior derecha recortada.
  - Ajena: a la izquierda, `surfaceRaised`, con el autor `nombre apellido`.
  - Ancho máximo del 80 %.
  - Estado local: "Enviando…" con un ícono de reloj, o "No se envió" en `danger` con el botón "Reintentar".
  - Sin el check doble de leído y sin mensajes de sistema (spec › Assumptions).

  Así se interpreta "con autor y hora" de US1-1 (aclarado en el spec): la hora se ve en cada burbuja; el autor se ve en el primer mensaje ajeno de cada grupo (los propios son "Vos" por posición y color). El autor también se anuncia en el `accessibilityLabel` de cada burbuja ("Vos, 14:05: …" o "Bruno Pérez, 14:06: …"). Así US1-1 se cumple para lectores de pantalla aunque el nombre visible se omita dentro de un grupo.
- **Rationale**: FR-001 (orden, propios y ajenos, autor y hora) con el lenguaje visual del design system. `ahora` es inyectable para probar "Hoy" y "Ayer".
- **Alternatives considered**: el nombre en todas las burbujas (ruido visual); `FlatList` invertida (complica el encabezado con el resumen y el orden de lectura de accesibilidad).

## R8. Desplazamiento automático (US3-1)

- **Decision**: `ChatCompra` sigue si el usuario está **al final** con `onScroll`. La función pura `estaAlFinal({ contentOffset, contentSize, layoutMeasurement }, margen = 48)` lo decide. Cuando llegan mensajes nuevos al final, solo hace `scrollToEnd` si estaba al final. Si no, muestra el chip "Mensajes nuevos ↓", que baja al tocarlo. Un mensaje **propio** recién enviado siempre baja. En la carga inicial baja al final sin animación.
- **Rationale**: no le saca al usuario lo que está leyendo más arriba y no pierde mensajes nuevos.
- **Alternatives considered**: bajar siempre (interrumpe la lectura); no bajar nunca (el mensaje nuevo queda fuera de la vista).

## R9. Vacío y carga

- **Decision**:
  - **Sin mensajes**: `EmptyState` con el ícono `message`, el título "Todavía no hay mensajes" y un cuerpo según el rol: "Escribile al organizador si tenés dudas sobre tu compra." o "Escribile al comprador sobre esta compra." El composer queda habilitado debajo (US1-4).
  - **Carga inicial**: 3 `Skeleton` alternados (izquierda y derecha) con `accessibilityState={{ busy: true }}`.
  - Las compras en cualquier estado y los eventos pasados **no bloquean** el composer: la variante `locked` del diseño no se usa (Edge Cases).
- **Rationale**: es la regla del backend (CU-05 y CU-06: "en cualquier momento").

## R10. Pruebas (TDD)

- **Decision**: el orden es puros → presentacionales → hooks → compuesto → pantalla, con el gate de aprobación del usuario antes de implementar (principio 2).
  - `chat-test.js`: `validarMensaje` con los bordes 0, 1, 1000 y 1001 y solo espacios; `fusionarMensajes` con las carreras de R4; `agruparMensajes` con Hoy, Ayer y los grupos; `mensajeErrorChat`; `estaAlFinal`.
  - `ChatBubble-test.jsx` y `MessageComposer-test.jsx`: roles, etiquetas, deshabilitado, contador y reintento.
  - `useChatCompra-test.jsx`: con `jest.useFakeTimers()`, verifica que con `activo=false` no hay llamadas, que hay una consulta cada 5 s, que no se encima con una respuesta `diferido` lenta, que se detiene al desactivar, la cola FIFO, el reintento, que un error periódico es silencioso y que 403/404 lo detienen.
  - `usePantallaActiva-test.jsx`: el foco y `AppState` simulados.
  - `ChatCompra-test.jsx` y `detalle-compra-test.jsx` (MOD): las dos variantes muestran el chat, envían y responden, y el 403 muestra "No tenés acceso a esta conversación".
  - Helper nuevo: `helpers/mensajesEjemplo.js`.
- **Rationale**: el polling y las carreras son lo más frágil. Los temporizadores falsos y `diferido` los vuelven deterministas.

## R11. Observabilidad del chat

- **Decision**: `MensajeService` (`backend/src/services/mensajeService.js`) recibe un `logger` inyectable, `logger = console` como último parámetro del constructor, después de `reloj`. Emite una línea JSON por operación exitosa con el método privado `_log(evento, contexto, datos)`, igual al de `UsuarioService`:
  - `mensaje_creado`: `{ evento, requestId, usuarioId, rol, compraId, estadoCompra, mensajeId, largo }`.
  - `mensajes_listados`: `{ evento, requestId, usuarioId, rol, compraId, estadoCompra, cantidad }`.

  `MensajeController` pasa `{ requestId: req.id }` como segundo argumento, como `favoritoController.js`. Sin contexto, `requestId` es `null`. **No se registra el texto del mensaje**: es contenido privado entre comprador y organizador, y alcanza con `largo`. Las operaciones que fallan (400, 403 y 404) no emiten un log propio; el manejador de errores de `app.js` ya las registra.
- **Rationale**: el principio 5 (logs estructurados con request ID, rol y estado de la compra en toda operación de servicio) es un MUST, y la 008 usa estas dos operaciones en cada consulta y en cada envío. El patrón ya existe en el proyecto (favoritos, eventos). Con los parámetros opcionales al final, el cambio es compatible con `app.js`, el seed y las pruebas actuales.
- **Alternatives considered**: declarar una excepción en *Complexity Tracking* (no se puede justificar no cumplir un MUST con un cambio de esta escala); registrar también el texto (expone conversaciones privadas en los logs); agregar logs a `CompraService`, `ReseniaService` y `CategoriaService`, que tienen el mismo hueco (fuera de alcance; queda como deuda para una feature aparte); un log por cada consulta periódica cada 5 s es ruido, pero es lo que exige el principio y es barato; si molesta, se filtra por `evento` en el destino del log.
