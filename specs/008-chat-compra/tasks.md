---

description: "Lista de tareas: Chat de una compra (comprador y organizador, envío optimista, actualización periódica)"
---

# Tasks: Chat de una compra

**Input**: documentos de diseño en `/specs/008-chat-compra/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api-mensajes.md](./contracts/api-mensajes.md), [contracts/componentes.md](./contracts/componentes.md), [quickstart.md](./quickstart.md)

**Tests**: OBLIGATORIOS. La constitución (principio 2) y FR-007 exigen TDD. El ciclo es:

1. Escribir la prueba.
2. **El usuario la aprueba.**
3. Correrla y verla fallar (rojo).
4. Implementar lo mínimo.
5. Refactorizar.

Cada fase tiene una tarea de aprobación explícita (⛔ GATE). No se implementa nada de esa fase antes de esa aprobación.

**Organization**: las tareas se agrupan por historia de usuario. Las rutas son relativas a la raíz del repo y los comandos de Jest se corren desde `frontend/`, salvo en Phase 2 (T003–T007), que se corre desde `backend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin depender de tareas incompletas).
- **[Story]**: historia de usuario a la que pertenece (US1–US3).

## Convenciones para todas las tareas

- **Documentación (principio 6, FR-007)**:
  - Cada archivo nuevo o modificado en `frontend/src/` lleva docstring de archivo (`@file`, `@owner Equipo Al Ticket It — frontend`, `@license MIT`).
  - Cada export lleva JSDoc completo: `@param` con tipo, `@returns` y `@throws`.
  - `@typedef` con `@property` para las props y para `MensajeLocal`, `ItemChat`, `ResultadoValidacion` y `EstadoChatCompra`.
  - `npm run lint` lo verifica.
- **Estilos**:
  - Colores, tipografías, tamaños, radios y duraciones salen de `useTheme()` (`frontend/src/theme/ThemeContext.jsx`). Las burbujas propias usan `colors.bubbleOwn` / `colors.onBubbleOwn` y las ajenas `colors.surfaceRaised`.
  - Íconos con `frontend/src/components/Icon.jsx`. Horas y días con `formatDate` de `frontend/src/theme/format.js` (`'time'`, `'day'`).
  - Nada de `fontWeight`. Áreas táctiles de al menos `sizes.touchMin` (44).
- **Render en pruebas**:
  - Componentes con `renderConTema` (`frontend/__tests__/helpers/renderConTema.jsx`), en `scheme="dark"` y `scheme="light"`.
  - Pantallas con `renderRouter` de `expo-router/testing-library`, como en `frontend/__tests__/screens/detalle-compra-test.jsx`.
- **Simulaciones en pruebas**:
  - `jest.mock('../../src/services/mensajeService', () => ({ listarMensajes: jest.fn(), enviarMensaje: jest.fn() }))`.
  - Sesión con `crearAuthFalso`, `COMPRADOR` y `ORGANIZADOR` (`frontend/__tests__/helpers/authFalso.js`).
  - Tiempo con `AHORA` (`frontend/__tests__/helpers/eventosEjemplo.js`) y `jest.useFakeTimers()` para la consulta periódica.
  - Respuestas lentas y carreras con `diferido` (`frontend/__tests__/helpers/diferido.js`).
  - Errores con `new ApiError(...)` de `frontend/src/services/api.js`.
  - Nunca se llama a la red real.
- **Arquitectura (principio 1)**: `ChatBubble` y `MessageComposer` (`frontend/src/components/`) son presentacionales: solo usan `useTheme` y no importan servicios, hooks de datos ni contextos. `frontend/src/mensajes/chat.js` es puro, sin React ni servicios.
- **Estados (principio 4)**: el chat no lee ni pide transiciones de `EstadoCompra`. Está habilitado en cualquier estado de la compra y con eventos pasados.
- **Alcance**: en `backend/`, solo los logs de `MensajeService` (Phase 2: servicio, controlador, `app.js` y sus dos pruebas unitarias). Sin dependencias nuevas, sin rutas nuevas y sin cambios en `frontend/src/navegacion/reglas.js` ni en `frontend/src/services/mensajeService.js`.
- **Textos**: los textos visibles van en español rioplatense y exactamente como figuran en [research.md](./research.md), [data-model.md](./data-model.md) y [contracts/](./contracts/).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: datos de ejemplo de mensajes para todas las pruebas.

- [X] T001 Crear `frontend/__tests__/helpers/mensajesEjemplo.js`:
  - `crearMensaje(parcial)`: un mensaje con la forma de `data-model.md` › `Mensaje.id`, `Mensaje.compraId`, `Mensaje.usuario`, `Mensaje.mensaje` y `Mensaje.enviado`. El `id` es incremental, `compraId` vale `'c-1'`, `usuario` es la versión pública de `COMPRADOR` y `enviado` es un ISO relativo a `AHORA`.
  - `remitentePublico(usuario)`: devuelve `{ id, nombre, apellido, rol }` de `authFalso`.
  - `CONVERSACION`: 4 mensajes de `c-1` en orden. Dos del comprador seguidos ayer, uno del organizador hoy a las 10:00 y otro del organizador hoy a las 10:01, para cubrir separadores de día y agrupación de autor.
  - `TEXTO_1000` y `TEXTO_1001`: textos de 1000 y 1001 caracteres sin espacios en los bordes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: verificar la base del frontend y cerrar el hueco de observabilidad del backend (principio 5, [research R11](./research.md#r11-observabilidad-del-chat)). En el frontend ya existen el servicio (`mensajeService`), la sesión (`useAuth`), la ruta `/compra/[idCompra]` y su guardia (001, 003, 006 y 007). En el backend, `MensajeService` no emite logs estructurados. Es el único cambio en `backend/` de esta feature. Los comandos de esta fase se corren desde `backend/`.

- [X] T002 Verificar la base antes de empezar. Correr `npx jest __tests__/services/mensajeService-test.js __tests__/screens/detalle-compra-test.jsx` (desde `frontend/`) y confirmar que pasan. Confirmar también que `listarMensajes` y `enviarMensaje` coinciden con [contracts/api-mensajes.md](./contracts/api-mensajes.md). Si algo no coincide, detenerse y avisar: no se modifica el servicio del frontend en esta feature.

### Tests de observabilidad (escribir primero) ⚠️

- [X] T003 [P] Ampliar `backend/tests/unit/mensajes/mensaje.service.test.js`. Usar el logger falso `{ info: jest.fn() }`, inyectado como quinto argumento del constructor (después de `reloj`), y el helper `logs(logger)`, copiado de `backend/tests/unit/usuarios/favoritos.service.test.js`. Casos (eventos y campos en [contracts/api-mensajes.md](./contracts/api-mensajes.md#logs-del-servidor)):
  - `crearMensaje(datos, { requestId: 'req-1' })` emite exactamente un `mensaje_creado` con `{ evento, requestId: 'req-1', usuarioId, rol, compraId, estadoCompra, mensajeId, largo }`, y **ninguna** línea contiene el texto del mensaje.
  - `listarPorCompra(datos, { requestId: 'req-2' })` emite `mensajes_listados` con `{ evento, requestId, usuarioId, rol, compraId, estadoCompra, cantidad }`.
  - Sin contexto, `requestId` es `null`.
  - Con un 400 (texto o ID inválido), un 403 (no participa) o un 404 (la compra no existe), no se emite ningún log.
  - Sin logger, el constructor no falla y usa `console` por defecto. Los demás casos existentes no cambian.
- [X] T004 [P] Ampliar `backend/tests/unit/mensajes/mensaje.controller.test.js`: con `req.id = 'req-1'`, `crear` llama a `servicio.crearMensaje({ compraId, usuarioId, mensaje }, { requestId: 'req-1' })` y `listar` llama a `servicio.listarPorCompra({ compraId, usuarioId }, { requestId: 'req-1' })`. Hay que ajustar los `toHaveBeenCalledWith` actuales, que hoy esperan un solo argumento.
- [X] T005 ⛔ GATE: presentar T003–T004 al usuario y esperar su **aprobación**. Después, correr `npm run test:jest -- tests/unit/mensajes` y confirmar que las pruebas nuevas fallan (rojo).

### Implementación de observabilidad

- [X] T006 Implementar los logs en el backend ([research R11](./research.md#r11-observabilidad-del-chat)):
  - `backend/src/services/mensajeService.js`:
    - Agregar `logger = console` como último parámetro del constructor.
    - Agregar el método privado `_log(evento, contexto, datos)`, igual al de `backend/src/services/usuarioService.js`.
    - `crearMensaje(datos, contexto = {})` y `listarPorCompra(datos, contexto = {})` emiten `mensaje_creado` y `mensajes_listados` **después** de la operación exitosa.
    - El texto del mensaje no se registra.
    - Actualizar el JSDoc (`@param` de `logger` y `contexto`).
  - `backend/src/controllers/mensajeController.js`: pasar `{ requestId: req.id }` como segundo argumento, como `backend/src/controllers/favoritoController.js`.
  - `backend/src/app.js`: `new MensajeService(mensajeRepository, compraRepository, usuarioRepository, undefined, console)`.
- [X] T007 Correr `npm run test:backend`: T003 y T004 en verde, y `backend/tests/mensajes.test.js` (integración) sin cambios y en verde.

**Checkpoint**: la base del frontend está en verde y el chat del backend cumple el principio 5. Las historias pueden empezar.

---

## Phase 3: User Story 1 - El comprador escribe sobre su compra (Priority: P1) — CU-05 🎯 MVP

**Goal**: en el detalle de su compra, pestaña Chat, el comprador ve la conversación en orden (los mensajes propios a la derecha y los ajenos a la izquierda, con autor y hora) y envía mensajes de forma optimista. Si un envío falla, puede reintentarlo.

**Independent Test**: enviar "¿Hay estacionamiento?" lo agrega al final como mensaje propio, primero con "Enviando…" y después con su hora. Si falla, queda en "No se envió" con "Reintentar" y el texto intacto. Sin mensajes, se ve "Todavía no hay mensajes".

### Tests for User Story 1 (escribir primero) ⚠️

- [X] T008 [P] [US1] Escribir `frontend/__tests__/mensajes/chat-test.js` (funciones puras, [contracts/componentes.md](./contracts/componentes.md) › `chat.js`):
  - **`validarMensaje`** (tabla de `data-model.md` §4, `LIMITE_MENSAJE`): `''` y `'   '` → `{ valido: false, largo: 0, error: null }`. `'a'` y `TEXTO_1000` son válidos. `TEXTO_1001` → `valido: false` con el error "El mensaje no puede superar los 1000 caracteres.". `'  ' + TEXTO_1000 + '  '` es válido, con `largo` 1000: el recorte va antes del máximo.
  - **`fusionarMensajes`**, reglas 1, 2 y 4 de research R4:
    - Ordena el servidor por `Mensaje.enviado` y luego por `Mensaje.id`.
    - Un local `confirmado` cuyo `MensajeLocal.id` ya está en el servidor aparece una sola vez. Si ese `id` no está, se conserva.
    - Los locales `enviando` y `error` van al final, en orden de `MensajeLocal.creado`.
    - No muta sus entradas.
  - **`agruparMensajes(CONVERSACION, COMPRADOR.id, AHORA)`** (`data-model.md` §3 › `ItemChat`):
    - Separadores "Ayer" y "Hoy". Un día anterior usa `formatDate(..., 'day')`.
    - `propio` es `true` en los mensajes del comprador.
    - `mostrarAutor` es `true` solo en el primer mensaje ajeno del grupo, el de las 10:00.
    - `hora` es `formatDate(enviado, 'time')`.
    - `autor` es "Vos" en los propios y "nombre apellido" en los ajenos.
    - Un `MensajeLocal` sin `enviado` usa `creado` y lleva `estado` `'enviando'` o `'error'`. La `clave` es `Mensaje.id` o `MensajeLocal.claveLocal`.
  - **`mensajeErrorChat`**:
    - 404 → "Esta compra ya no existe", con `reintentable: false`.
    - 400 → "No pudimos abrir esta conversación", con `reintentable: true`.
    - Estado 0 → el título de `mensajeError` de `frontend/src/eventos/presentacion.js`, con `reintentable: true`.
  - **`textoErrorEnvio`**: un 400 devuelve `error.message`; un estado 0, un 500, un 403 y un 404 devuelven "Revisá tu conexión e intentá de nuevo.".
- [X] T009 [P] [US1] Escribir `frontend/__tests__/components/ChatBubble-test.jsx` (props en [contracts/componentes.md](./contracts/componentes.md) › `ChatBubble`), en los dos temas:
  - **Propia**: alineada a la derecha, con fondo `bubbleOwn`.
  - **Ajena**: alineada a la izquierda, con fondo `surfaceRaised`. El autor se ve solo con `mostrarAutor`.
  - **`accessibilityLabel`**: `"{autor}, {hora}: {texto}"`. Con `estado="enviando"` suma ". Enviando" y muestra "Enviando…" con ícono. Con `estado="error"` suma ". No se envió" y muestra el texto `error` y el botón "Reintentar", que llama a `alReintentar` y tiene un área táctil de 44 o más.
  - Sin `alReintentar` no hay botón.
- [X] T010 [P] [US1] Escribir `frontend/__tests__/components/MessageComposer-test.jsx` (props en [contracts/componentes.md](./contracts/componentes.md) › `MessageComposer`):
  - El placeholder por defecto es "Escribí un mensaje".
  - `alCambiar` recibe el texto.
  - **Botón "Enviar mensaje"**: con `valido=false` está deshabilitado (`accessibilityState.disabled`), tiene `accessibilityHint` "Escribí un mensaje para enviar" y no llama a `alEnviar`. Con `valido=true` llama a `alEnviar` una vez.
  - **Ayuda visible**: con `valor` vacío o solo espacios y sin `error`, se ve el texto "Escribí un mensaje para enviar" debajo del campo. Con texto válido no se ve. Con `error`, se ve el error en su lugar.
  - **Contador**: con `largo` 799 no se ve. Con 800 se ve "800/1000". Con 1001 se ve en `danger`, junto al `error` (que va en una región `polite`).
  - El `TextInput` no tiene `maxLength`.
- [X] T011 [P] [US1] Escribir `frontend/__tests__/hooks/useChatCompra-test.jsx`, con la parte de carga y envío, `activo: true` y `intervaloMs` grande para que no corra la consulta periódica (estado en `data-model.md` §5):
  - **Carga**: con ID vacío no llama a `listarMensajes`. Con `'c-1'` llama una vez, `cargando` pasa de `true` a `false` y `mensajes` devuelve la conversación.
  - **Error inicial**: un error en la carga inicial queda en `error`. `recargar()` vuelve a pedir. Con una consulta pendiente (`diferido`), llamar a `recargar()` no dispara un segundo GET.
  - **`enviar('  hola ')`**:
    - Agrega al instante (sin esperar la promesa) un local con `MensajeLocal.estado` `'enviando'` y `MensajeLocal.mensaje` `'hola'`.
    - Llama a `enviarMensaje('c-1', 'hola')`.
    - Al resolver pasa a `confirmado`, con `MensajeLocal.id` y `MensajeLocal.enviado` del servidor.
    - Un texto inválido (vacío o de 1001 caracteres) no se agrega ni se envía.
  - **Cola FIFO**: dos `enviar` seguidos con `diferido` producen un solo POST en curso. El segundo sale al resolver el primero.
  - **Fallo**: deja `MensajeLocal.estado` en `'error'` con `MensajeLocal.error`, sin perder el texto, y la cola sigue con el siguiente. `reintentar(claveLocal)` lo vuelve a `'enviando'` y lo reenvía con el mismo texto.
  - **Texto del error** (en `chat-test.js` con `textoErrorEnvio`, y acá en el ítem resultante): un 400 con el mensaje "El mensaje no puede estar vacío." muestra ese mensaje; un error de red (`status` 0) o un 500 muestran "Revisá tu conexión e intentá de nuevo.".
  - **Desmontado**: si se desmonta con un envío en curso, no actualiza estado.
- [X] T012 [P] [US1] Escribir `frontend/__tests__/mensajes/ChatCompra-test.jsx` (`frontend/src/mensajes/ChatCompra.jsx`, estados en [contracts/componentes.md](./contracts/componentes.md) › `ChatCompra`), con `useAuth` simulado como `COMPRADOR`, `activo` en `true` y un `encabezado` de prueba:
  - **Carga**: se ven el encabezado y los esqueletos (`busy`), y el composer está deshabilitado.
  - **Vacío** (`[]`): "Todavía no hay mensajes" y "Escribile al organizador si tenés dudas sobre tu compra.", con el composer habilitado (US1-4).
  - **Con `CONVERSACION`**: las burbujas salen en orden, con los separadores (US1-1).
  - **Enviar** "¿Hay estacionamiento?": el composer se vacía, la burbuja aparece como "Enviando…" y, al resolver, muestra la hora (US1-2).
  - **Fallo del POST**: la burbuja muestra "No se envió" y "Reintentar", y al tocarlo se reenvía (US1-3).
  - **Validación**: con solo espacios, "Enviar mensaje" está deshabilitado. Con `TEXTO_1001` se ven el contador y el error.
  - **Error inicial de red**: `EmptyState` con "Reintentar".
- [X] T013 [US1] Ampliar `frontend/__tests__/screens/detalle-compra-test.jsx` para la variante del COMPRADOR, simulando `mensajeService`:
  - Al tocar la pestaña "Chat" se llama a `listarMensajes(<idCompra>)` y se ve la conversación.
  - Ya no aparece "Muy pronto vas a poder escribirle al organizador desde acá.".
  - Se puede enviar un mensaje.
  - En la pestaña "Detalle" no se llama a `listarMensajes`.
  - Una compra CANCELADA y una compra de un evento que ya ocurrió también muestran el composer habilitado (Edge Cases, FR-002).
- [X] T014 [US1] ⛔ GATE: presentar T008–T013 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/mensajes __tests__/components/ChatBubble-test.jsx __tests__/components/MessageComposer-test.jsx __tests__/hooks/useChatCompra-test.jsx __tests__/screens/detalle-compra-test.jsx` y confirmar que las pruebas nuevas fallan (rojo).

### Implementation for User Story 1

- [X] T015 [P] [US1] Crear `frontend/src/mensajes/chat.js` (puro), con los exports `LIMITE_MENSAJE`, `validarMensaje`, `fusionarMensajes` (reglas 1, 2 y 4 de research R4; la regla 3 va en T035), `agruparMensajes`, `mensajeErrorChat` y `textoErrorEnvio`:
  - `validarMensaje` según `data-model.md` §4.
  - `fusionarMensajes` según `data-model.md` › `MensajeLocal.estado` / `MensajeLocal.id`. Ordena y deduplica por `data-model.md` › `Mensaje.enviado` (orden) y `Mensaje.id` (clave única).
  - `agruparMensajes` según `data-model.md` §3: arma `ItemChat.tipo` (`'dia'` | `'mensaje'`), `ItemChat.clave` (`Mensaje.id` o `MensajeLocal.claveLocal`), `ItemChat.mostrarAutor` e `ItemChat.estado` (`'enviado'` | `'enviando'` | `'error'`, derivado de `MensajeLocal.estado`), además de `ItemChat.error`.
  - `mensajeErrorChat` según research R6. El 403 se agrega en T026.
  - `textoErrorEnvio(error)` según research R3: devuelve `error.message` si `status` es 400, o "Revisá tu conexión e intentá de nuevo." en cualquier otro caso.
- [X] T016 [P] [US1] Crear `frontend/src/components/ChatBubble.jsx` según [contracts/componentes.md](./contracts/componentes.md) › `ChatBubble` y `design-system/docs/componentes/ChatBubble.md`:
  - Ancho máximo del 80 %.
  - La propia tiene la esquina inferior derecha recortada.
  - El autor visible usa `overline` o `caption`.
  - El estado `error` muestra el ícono, el texto en `danger` y el botón "Reintentar".
- [X] T017 [P] [US1] Crear `frontend/src/components/MessageComposer.jsx` según [contracts/componentes.md](./contracts/componentes.md) › `MessageComposer` y `design-system/docs/componentes/MessageComposer.md`:
  - Pill `surfaceRaised`, multilínea hasta 4 líneas.
  - El botón enviar es un `IconButton` de 44 en `primary`, con la etiqueta "Enviar mensaje".
  - Contador con `largo >= 800` (`data-model.md` §4, `LIMITE_MENSAJE`). Sin `maxLength` y sin prop `locked`.
  - Ayuda visible "Escribí un mensaje para enviar" en `caption` / `textMuted` cuando el texto recortado está vacío y no hay `error` (research R5).
- [X] T018 [US1] Crear `frontend/src/hooks/useChatCompra.js` con la carga inicial, `recargar`, `enviar` y `reintentar` (estado en `data-model.md` §5; ciclo en `data-model.md` › `MensajeLocal.estado`):
  - **Carga**: sigue el patrón de secuencia y montado de `frontend/src/hooks/useComprasEvento.js`. `miId` sale de `useAuth()`.
  - **Mensajes locales**: `claveLocal` con un contador en `useRef` (`data-model.md` › `MensajeLocal.claveLocal`) y `creado = new Date()` (`MensajeLocal.creado`). Se guarda y se envía el texto recortado que devuelve `validarMensaje` (`data-model.md` › `MensajeLocal.mensaje`).
  - **Confirmación y error**: al responder el servidor, se completan `data-model.md` › `MensajeLocal.id` y `MensajeLocal.enviado` (solo en `confirmado`). Si falla, se guarda `MensajeLocal.error` (solo en `error`, se limpia al reintentar). El texto visible del error lo da `textoErrorEnvio` (research R3): `error.message` si es un 400, o "Revisá tu conexión e intentá de nuevo." en cualquier otro caso.
  - **`recargar()`**: no hace nada si ya hay una consulta GET en curso (`data-model.md` §5).
  - **Cola**: FIFO con como máximo un POST en curso (research R3).
  - **Salida**: `mensajes = fusionarMensajes(servidor, locales, miId)`.
  - **Error**: solo el bloqueante se expone en `error`.
  - En esta tarea el parámetro `activo` solo habilita la carga inicial. La consulta periódica va en T037.
- [X] T019 [US1] Crear `frontend/src/mensajes/ChatCompra.jsx` según [contracts/componentes.md](./contracts/componentes.md) › `ChatCompra`:
  - Un `FlatList` de `agruparMensajes(mensajes, usuario.id)`, con `keyExtractor` igual a `data-model.md` › `ItemChat.clave` y `encabezado` en `ListHeaderComponent`.
  - Según `data-model.md` › `ItemChat.tipo`: `'dia'` es un separador en `overline` y `'mensaje'` es un `ChatBubble` con `ItemChat.propio`, `ItemChat.mostrarAutor`, `ItemChat.estado` e `ItemChat.error`. `alReintentar` solo va cuando `ItemChat.estado` es `'error'`.
  - `MessageComposer` fijo abajo, con el texto como estado propio, validado con `validarMensaje` y vaciado al enviar.
  - `KeyboardAvoidingView` (`padding` en iOS) y safe area inferior con `useSafeAreaInsets`.
  - Al enviar un mensaje propio y en la carga inicial, `scrollToEnd`.
  - Estados de carga, error (con `mensajeErrorChat`; "Reintentar" solo si es `reintentable`, sin composer) y vacío según `rolOtro` (research R9).
- [X] T020 [US1] Modificar `frontend/src/app/compra/[idCompra].jsx`, variante `DetalleCompraComprador`:
  - Con `pestana === 'chat'`, renderizar `<ChatCompra idCompra={compra.id} activo={pestana === 'chat'} encabezado={…} rolOtro="organizador" />` en lugar del `ScrollView`. El encabezado es la fecha, `ResumenCompra`, `StatusBadge` y `Tabs`.
  - Quitar el `EmptyState` provisorio.
  - La pestaña Detalle queda igual.
  - Actualizar el docstring del archivo ("La pestaña Chat la completa la feature 008" → descripción real).
  - Extraer el encabezado a una función local para no duplicarlo entre las dos pestañas.
- [X] T021 [US1] Correr las pruebas de T014 y dejarlas en verde. Refactorizar sin cambiar comportamiento y volver a correr `npx jest`.

**Checkpoint**: el comprador ya chatea (CU-05). Las respuestas del organizador se ven al volver a abrir la pestaña.

---

## Phase 4: User Story 2 - El organizador responde (Priority: P1) — CU-06

**Goal**: el organizador abre una compra de su evento (desde Compras del evento o Mensajes) y usa el mismo chat. Si el chat responde 403, ve "No tenés acceso a esta conversación".

**Independent Test**: un mensaje del comprador simulado aparece a la izquierda, con su nombre, en el chat del organizador, y la respuesta del organizador se envía como propia. Con un 403 se ve el mensaje de acceso.

### Tests for User Story 2 (escribir primero) ⚠️

- [ ] T022 [P] [US2] Ampliar `frontend/__tests__/mensajes/chat-test.js` con `mensajeErrorChat` para el 403: devuelve "No tenés acceso a esta conversación" / "Solo el comprador y el organizador del evento pueden usar este chat." con `reintentable: false` (research R6).
- [ ] T023 [P] [US2] Ampliar `frontend/__tests__/mensajes/ChatCompra-test.jsx`:
  - Con `useAuth` como `ORGANIZADOR` y `CONVERSACION`, los mensajes del comprador son ajenos, con su nombre en la primera burbuja del grupo, y los del organizador son propios.
  - El vacío con `rolOtro="comprador"` dice "Escribile al comprador sobre esta compra.".
  - Si `listarMensajes` rechaza con 403, se ve "No tenés acceso a esta conversación", sin "Reintentar" y sin composer.
  - Si `enviarMensaje` rechaza con 403, el chat pasa a ese mismo estado.
  - Si `listarMensajes` rechaza con 404, se ve "Esta compra ya no existe", sin "Reintentar" y sin composer.
- [ ] T024 [US2] Ampliar `frontend/__tests__/screens/detalle-compra-test.jsx` para la variante del ORGANIZADOR (`/compra/<id>?evento=<idEvento>`, con `obtenerComprasEvento` simulado como en 007):
  - La pestaña "Chat" muestra la conversación y permite responder.
  - Ya no aparece "Muy pronto vas a poder escribirle al comprador desde acá.".
  - Con `listarMensajes` en 403 se ve "No tenés acceso a esta conversación" (US2-2).
- [ ] T025 [US2] ⛔ GATE: presentar T022–T024 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/mensajes __tests__/screens/detalle-compra-test.jsx` y confirmar que las pruebas nuevas fallan (rojo).

### Implementation for User Story 2

- [ ] T026 [P] [US2] Agregar el 403 a `mensajeErrorChat` en `frontend/src/mensajes/chat.js`.
- [ ] T027 [US2] En `frontend/src/hooks/useChatCompra.js`, hacer que un 403 o 404 en `enviar` deje el local en `error` **y** fije el `error` bloqueante (research R3, R6).
- [ ] T028 [US2] Modificar `frontend/src/app/compra/[idCompra].jsx`, variante `DetalleCompraOrganizador`:
  - Con `pestana === 'chat'`, renderizar `ChatCompra` con `rolOtro="comprador"` y el encabezado propio de la variante (fecha, `ResumenCompra`, comprador, `StatusBadge` y `Tabs`).
  - Envolver en `KeyboardAvoidingView`, como la variante del comprador.
  - Quitar el `EmptyState` provisorio.
- [ ] T029 [US2] Correr las pruebas de T025 y dejarlas en verde. Después, la suite completa `npx jest` (sin regresiones de 006 y 007 en `detalle-compra-test.jsx` ni en `mensajes-organizador-test.jsx`).

**Checkpoint**: comprador y organizador conversan en el mismo chat (CU-05 y CU-06).

---

## Phase 5: User Story 3 - Ver mensajes nuevos sin salir de la pantalla (Priority: P2)

**Goal**: con el chat visible, los mensajes nuevos llegan solos cada ~5 s. La consulta se detiene al cambiar de pestaña, al salir de la pantalla o al mandar la app a segundo plano. No hay duplicados con el envío optimista y la vista baja solo si el usuario ya estaba al final.

**Independent Test**: con el chat abierto y temporizadores falsos, un mensaje nuevo devuelto por `listarMensajes` aparece al avanzar 5 s. Con la pestaña Detalle activa o la app en segundo plano hay 0 llamadas.

### Tests for User Story 3 (escribir primero) ⚠️

- [ ] T030 [P] [US3] Ampliar `frontend/__tests__/mensajes/chat-test.js`:
  - **`fusionarMensajes`, regla 3 de research R4**: un local `enviando` se oculta si el servidor trae un mensaje propio con el mismo texto recortado, posterior a `MensajeLocal.creado` menos 60 s y no reclamado. Dos locales iguales con un solo gemelo en el servidor dejan visible uno. Un mensaje ajeno con el mismo texto no reclama. Un gemelo más viejo que la tolerancia no reclama.
  - **`estaAlFinal`**: `true` dentro de un margen de 48 y `false` fuera. Acepta un margen personalizado.
- [ ] T031 [P] [US3] Escribir `frontend/__tests__/hooks/usePantallaActiva-test.jsx`. Simula `useFocusEffect` de `expo-router` y `AppState` (`currentState` y `addEventListener` con `remove`). El hook devuelve:
  - `true` con foco y `active`;
  - `false` al pasar a `background`;
  - `false` al perder el foco.

  Además, limpia la suscripción al desmontar.
- [ ] T032 [P] [US3] Ampliar `frontend/__tests__/hooks/useChatCompra-test.jsx` con `jest.useFakeTimers()` e `intervaloMs: 5000`:
  - Con `activo: false` hay 0 llamadas, aun avanzando 30 s (SC-003).
  - Con `activo: true` hay 1 llamada al instante y otra a los 5 s de cada respuesta.
  - Con una respuesta `diferido` pendiente, avanzar 20 s no dispara otra (sin encimar).
  - Al pasar a `activo: false` se cancela el temporizador y se descarta la respuesta en vuelo. Al volver a `true` hay una llamada inmediata.
  - Una respuesta vieja (secuencia anterior) se descarta.
  - Un error de red periódico con datos no fija `error` y conserva los `mensajes`. La siguiente consulta se hace igual (Edge Cases).
  - Un 403 o 404 periódico fija `error` y detiene las consultas.
  - Carrera POST/GET: el GET trae el mensaje antes de que resuelva el POST y se ve una sola vez. Cuando resuelve el POST, sigue una sola vez (SC-002).
  - Al desmontar no queda ningún temporizador (`jest.getTimerCount()` es 0).
- [ ] T033 [US3] Ampliar `frontend/__tests__/mensajes/ChatCompra-test.jsx`:
  - Con `activo` y temporizadores falsos, un mensaje nuevo del otro participante aparece al avanzar 5 s.
  - Si el usuario estaba al final (`onScroll` con `estaAlFinal` en `true`), se llama a `scrollToEnd`.
  - Si había subido (`onScroll` fuera del margen), no se llama a `scrollToEnd` y aparece el chip "Mensajes nuevos", que al tocarlo baja y desaparece (research R8).
  - Con `activo: false` no se consulta.

  Además, ampliar `frontend/__tests__/screens/detalle-compra-test.jsx`: al volver de "Chat" a "Detalle", avanzar 10 s no produce llamadas nuevas a `listarMensajes`.
- [ ] T034 [US3] ⛔ GATE: presentar T030–T033 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/mensajes __tests__/hooks/useChatCompra-test.jsx __tests__/hooks/usePantallaActiva-test.jsx __tests__/screens/detalle-compra-test.jsx` y confirmar que las pruebas nuevas fallan (rojo).

### Implementation for User Story 3

- [ ] T035 [P] [US3] En `frontend/src/mensajes/chat.js`, agregar a `fusionarMensajes` la regla 3 de research R4 (cruce por autor, texto y tolerancia de 60 s sobre `data-model.md` › `MensajeLocal.creado` y `Mensaje.usuario` / `Mensaje.mensaje`, sin reutilizar un mismo gemelo) y agregar `estaAlFinal`.
- [ ] T036 [P] [US3] Crear `frontend/src/hooks/usePantallaActiva.js` (`data-model.md` §5): `useFocusEffect` para el foco, más `AppState.currentState` y `AppState.addEventListener('change')`, con limpieza.
- [ ] T037 [US3] Agregar a `frontend/src/hooks/useChatCompra.js` la consulta periódica de research R2:
  - `setTimeout` encadenado tras cada respuesta, con `intervaloMs` por defecto en 5000 y una llamada inmediata al activarse.
  - Cancelar el temporizador e invalidar la secuencia al desactivarse o desmontarse.
  - Los errores periódicos con datos son silenciosos. Un 403 o 404 detiene las consultas y fija `error`.
  - Al fusionar, limpiar los locales `confirmado` cuyo `MensajeLocal.id` ya llegó del servidor.
- [ ] T038 [US3] En `frontend/src/mensajes/ChatCompra.jsx`, implementar el seguimiento del scroll (`onScroll` con `estaAlFinal`, `scrollEventThrottle`) y la regla de research R8: si el usuario está al final, `scrollToEnd`; si no, el chip "Mensajes nuevos", que baja y se oculta. Se usa el `Chip` existente (`frontend/src/components/Chip.jsx`) con `etiqueta="Mensajes nuevos"`, `icono="ArrowDown"` (nombre Lucide, como lo resuelve `Icon`) y `alPresionar`, flotando sobre el composer.
- [ ] T039 [US3] En `frontend/src/app/compra/[idCompra].jsx`, en las dos variantes, calcular `const activa = usePantallaActiva();` y pasar `activo={activa && pestana === 'chat'}` a `ChatCompra`.
- [ ] T040 [US3] Correr las pruebas de T034 y dejarlas en verde. Después, la suite completa `npx jest`.

**Checkpoint**: la conversación se actualiza sola mientras está visible, sin consultas cuando no lo está (SC-001, SC-002 y SC-003).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T041 [P] Revisar el JSDoc y los docstrings de archivo de `frontend/src/mensajes/chat.js`, `frontend/src/mensajes/ChatCompra.jsx`, `frontend/src/hooks/useChatCompra.js`, `frontend/src/hooks/usePantallaActiva.js`, `frontend/src/components/ChatBubble.jsx`, `frontend/src/components/MessageComposer.jsx` y `frontend/src/app/compra/[idCompra].jsx` (principio 6):
  - `@typedef` de `MensajeLocal`, `ItemChat`, `ResultadoValidacion`, `EstadoChatCompra` y de las props.
  - `@throws` donde corresponda (los hooks documentan que nunca lanzan).
  - Sin menciones desactualizadas a "provisorio" o "feature 008 la completa".
- [ ] T042 [P] Actualizar `AGENTS.md` › Navigation (Frontend):
  - Quitar "La pestaña Chat es provisoria hasta la 008" y "La pestaña Chat del detalle es provisoria hasta la 008".
  - Agregar una viñeta "Chat de una compra (feature 008, `specs/008-chat-compra/`)" que describa:
    - `ChatCompra` (`src/mensajes/`), el mismo para ambos roles en la pestaña Chat de `/compra/[idCompra]`;
    - `useChatCompra` (consulta cada 5 s con `setTimeout` encadenado solo si `activo`; cola FIFO de envío optimista con reintento);
    - `usePantallaActiva` (foco + `AppState`);
    - `src/mensajes/chat.js` (`validarMensaje`, `fusionarMensajes`, `agruparMensajes`, `mensajeErrorChat`, `estaAlFinal`).
  - Sumar `ChatBubble` y `MessageComposer` a la lista de componentes compartidos.
  - En AGENTS.md › Observabilidad (ID de petición), sumar los eventos de log de mensajes: `mensaje_creado` y `mensajes_listados`.
- [ ] T043 Correr `npm run lint` y `npm run format` desde la raíz y corregir lo que reporten.
- [ ] T044 Correr la suite completa con `npm test` en `frontend/`, `npm run test:backend` y `npx expo-doctor` en `frontend/`. Todo tiene que quedar en verde, sin regresiones de 003–007. En `git status backend/` solo pueden aparecer `src/services/mensajeService.js`, `src/controllers/mensajeController.js`, `src/app.js`, `tests/unit/mensajes/mensaje.service.test.js` y `tests/unit/mensajes/mensaje.controller.test.js`. Revisar que no aparezca el warning "VirtualizedLists should never be nested" en las pruebas de la pantalla (research R1).
- [ ] T045 Ejecutar la validación manual de [quickstart.md](./quickstart.md) (escenarios 1–9, más el tema y la accesibilidad), incluida la medición de SC-001 (el otro participante lo ve en menos de 10 s) y SC-003 (Network sin `GET …/mensajes` fuera del chat), y anotar cualquier desvío.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup. Verifica la base del frontend (T002) y agrega los logs del backend (T003–T007). Bloquea las historias: el principio 5 es NON-NEGOTIABLE en la revisión. T002 y T003–T004 se pueden hacer en paralelo (workspaces distintos).
- **US1 (Phase 3)**: depende de Foundational. Es el MVP y crea todos los archivos nuevos.
- **US2 (Phase 4)**: depende de US1 (`ChatCompra`, `useChatCompra` y `chat.js`). Solo extiende y monta en la variante del organizador.
- **US3 (Phase 5)**: depende de US1. Es independiente de US2 en lógica, pero T039 toca las dos variantes de `[idCompra].jsx`, así que conviene hacerla después de US2 (T028).
- **Polish (Phase 6)**: depende de todas las historias.

### Dentro de cada fase

- Primero las pruebas, después el ⛔ GATE con la aprobación del usuario y el rojo, después la implementación y por último el verde.
- Dentro de la implementación, el orden es: módulo puro, luego presentacionales, luego hooks, luego el compuesto y por último la pantalla.
- Las tareas que tocan el mismo archivo van en secuencia:
  - `chat.js`: T015 → T026 → T035.
  - `chat-test.js`: T008 → T022 → T030.
  - `useChatCompra.js`: T018 → T027 → T037.
  - `useChatCompra-test.jsx`: T011 → T032.
  - `ChatCompra.jsx`: T019 → T038.
  - `ChatCompra-test.jsx`: T012 → T023 → T033.
  - `[idCompra].jsx`: T020 → T028 → T039.
  - `detalle-compra-test.jsx`: T013 → T024 → T033.

### Orden sugerido

T001 → T002 → T003–T007 → US1 (T008–T021) → US2 (T022–T029) → US3 (T030–T040) → Polish (T041–T045)

---

## Parallel Examples

### US1

```text
Pruebas:        T008 chat-test · T009 ChatBubble · T010 MessageComposer · T011 useChatCompra · T012 ChatCompra  →  T013 detalle-compra-test
Tras el GATE:   T015 chat.js · T016 ChatBubble · T017 MessageComposer  →  T018 useChatCompra  →  T019 ChatCompra  →  T020 [idCompra].jsx
```

### US2

```text
Pruebas:        T022 chat-test (403) · T023 ChatCompra (organizador)  →  T024 detalle-compra-test
Tras el GATE:   T026 chat.js  →  T027 useChatCompra  →  T028 [idCompra].jsx
```

### US3

```text
Pruebas:        T030 chat-test · T031 usePantallaActiva · T032 useChatCompra (polling)  →  T033 ChatCompra/detalle
Tras el GATE:   T035 chat.js · T036 usePantallaActiva  →  T037 useChatCompra  →  T038 ChatCompra  →  T039 [idCompra].jsx
```

### Foundational

```text
T002 base frontend  ·  T003 servicio · T004 controlador  →  T005 GATE  →  T006 implementación  →  T007 verde
```

### Polish

```text
T041 JSDoc · T042 AGENTS.md  →  T043 lint/format  →  T044 suites  →  T045 manual
```

---

## Implementation Strategy

### MVP primero (US1)

1. Setup y Foundational (T001–T007).
2. US1 (T008–T021): el comprador escribe y ve la conversación (CU-05), con envío optimista y reintento.
3. **Parar y validar**: quickstart, escenarios 1, 2, 6 y 7.

### Entrega incremental

1. Agregar US2: el organizador responde desde el mismo componente (CU-06) y se manejan los errores de acceso (quickstart, escenarios 3 y 8).
2. Agregar US3: consulta periódica, sin duplicados y con desplazamiento inteligente (quickstart, escenarios 4 y 5).
3. Polish: JSDoc, AGENTS.md, lint, las suites y la validación manual (escenario 9 y accesibilidad).

### Notas

- Cada ⛔ GATE es una pausa real: no se escribe código de producción de esa fase sin la aprobación explícita del usuario sobre las pruebas.
- Hasta US3, un mensaje del otro participante solo aparece al volver a abrir la pestaña Chat. Es el alcance esperado de US1 y US2.
- La regla 3 de `fusionarMensajes` (el cruce por texto) recién importa con la consulta periódica, por eso va en US3.
