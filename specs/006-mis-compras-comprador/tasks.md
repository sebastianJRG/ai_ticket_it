---

description: "Lista de tareas: Mis compras del comprador (lista por estado, cancelación, detalle y reseña)"
---

# Tasks: Mis compras del comprador

**Input**: Documentos de diseño en `/specs/006-mis-compras-comprador/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/pantallas.md](./contracts/pantallas.md), [contracts/componentes.md](./contracts/componentes.md), [quickstart.md](./quickstart.md)

**Tests**: OBLIGATORIOS. La constitución (principio 2) y FR-007 exigen TDD: escribir la prueba, **el usuario la aprueba**, correrla en rojo, implementar lo mínimo y refactorizar. Cada fase tiene una tarea de aprobación explícita (⛔ GATE): no se implementa nada de esa fase antes de la aprobación.

**Organization**: Tareas agrupadas por historia de usuario. Rutas relativas a la raíz del repo; los comandos de Jest se corren desde `frontend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede hacer en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3, US4)

## Convenciones para todas las tareas

- Cada archivo nuevo o modificado en `frontend/src/` lleva docstring de archivo (`@file`, `@owner Equipo Al Ticket It — frontend`, `@license MIT`) y JSDoc completo en cada export (`@param` con tipo, `@returns`, `@throws`; `@typedef` con `@property` para props y formas). `npm run lint` lo verifica (principio 6, FR-007).
- Colores, tipografías, tamaños, radios y duraciones salen de `useTheme()` (`frontend/src/theme/ThemeContext.jsx`) y de `theme.purchaseStatus` para los estados; íconos con `frontend/src/components/Icon.jsx`; precios, fechas y días con `frontend/src/theme/format.js` (`formatPrice`, `formatDate`, `formatDaysLeft`); nada de `fontWeight` (design-system/docs/react-native.md). Áreas táctiles ≥ `sizes.touchMin` (44).
- Pruebas de componentes con `renderConTema` (`frontend/__tests__/helpers/renderConTema.jsx`) en `scheme="dark"` y `scheme="light"`. Pantallas con `renderRouter` de `expo-router/testing-library`, como `frontend/__tests__/screens/checkout-test.jsx`.
- Servicios simulados con `jest.mock('../../src/services/compraService', …)` y `jest.mock('../../src/services/reseniaService', …)`; sesión con `crearAuthFalso`, `COMPRADOR` (`id: 'u-comprador'`) y `ORGANIZADOR` (`frontend/__tests__/helpers/authFalso.js`); `AHORA` de `frontend/__tests__/helpers/eventosEjemplo.js`; orden de respuestas y "en curso" con `diferido` (`frontend/__tests__/helpers/diferido.js`). Nunca se llama a la red real.
- Los componentes de `frontend/src/components/` son presentacionales: no importan servicios, hooks de datos ni contextos de sesión/toast (plan › Constitution Check, principio 1).
- El cliente **no transiciona** `EstadoCompra` (sin actualización optimista): pide la cancelación y recarga el listado (principio 4, research R6).
- **Sin cambios en `backend/`** ni dependencias nuevas.
- Textos visibles en español rioplatense y exactamente como figuran en [contracts/pantallas.md](./contracts/pantallas.md) y [data-model.md](./data-model.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Datos de ejemplo de compras del listado

- [X] T001 Ampliar `frontend/__tests__/helpers/comprasEjemplo.js` (sin romper sus exports actuales) con `crearCompraListado(parcial)` que devuelve la forma de [data-model.md §1 › Compra](./data-model.md#1-compra-respuesta-de-get-apicompras) (`Compra.evento` `{ id, nombre, fecha }`, `Compra.tipoEntrada` `{ id, nombre, precio }`, `Compra.cantidad`, `Compra.total`, `Compra.estado`, `Compra.diasRestantes` `null` salvo CONFIRMADA) con IDs secuenciales, y `COMPRAS_POR_ESTADO`: 7 compras en orden de creación, con fechas relativas a `AHORA`: PENDIENTE futura, CONFIRMADA futura con `diasRestantes: 3`, CONFIRMADA de hoy (más tarde que `AHORA`) con `diasRestantes: 0`, dos UTILIZADA de un mismo evento pasado (mismo `evento.id`, para el caso "una reseña por evento"), CANCELADA y REEMBOLSADA (totales por pestaña: Activas 3, Pasadas 2, Canceladas 2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ruta del detalle en las reglas, carga del listado y pestañas, que usan la lista y el detalle

**⚠️ CRITICAL**: Ninguna historia empieza hasta completar esta fase

### Pruebas (escribir primero)

- [X] T002 [P] Ampliar `frontend/__tests__/navegacion/reglas-test.js` según [contracts/pantallas.md › Rutas y acceso](./contracts/pantallas.md#rutas-y-acceso): `hrefCompra('a b')` → `/compra/a%20b`; `decidirAcceso` para `/compra/x` (también con `?q=` y barra final): visitante → `redirigir('/login?volverA=%2Fcompra%2Fx')`, COMPRADOR → `permitir`, ORGANIZADOR → `redirigir('/organizador/eventos')`; `/compras` mantiene su comportamiento; `destinoTrasLogin(COMPRADOR, '/compra/x')` → `'/compra/x'` y `destinoTrasLogin(ORGANIZADOR, '/compra/x')` → `'/organizador/eventos'`
- [X] T003 [P] Escribir `frontend/__tests__/hooks/useMisCompras-test.jsx` con `renderHook` y `listarMisCompras` simulado, según [data-model.md §6 › EstadoMisCompras](./data-model.md#6-estados-de-los-hooks) (`compras`, `cargando`, `actualizando`, `error`, `recargar`): al montar pide una vez con `cargando` `true` y `compras` `null`; éxito → `compras` tal cual las devuelve el servicio; error sin datos → `error` y `compras` `null`; `recargar()` con datos → `actualizando` `true` y `cargando` `false`, y si falla conserva `compras` y expone `error`; con `diferido`, una respuesta vieja que llega después de una más nueva se ignora; nada se actualiza tras desmontar; nunca lanza
- [X] T004 [P] Escribir `frontend/__tests__/components/Tabs-test.jsx` según [contracts/componentes.md › Tabs](./contracts/componentes.md#tabs-nuevo): renderiza cada `etiqueta` y el `contador` cuando viene; contenedor con `accessibilityRole="tablist"`; cada pestaña con `accessibilityRole="tab"`, `accessibilityState.selected` según `seleccionada` y label "Activas, 2" con contador (solo "Detalle" sin él); tocar una llama `alCambiar(clave)`; variantes `underline` y `segmented` renderizan; dark y light
- [X] T005 ⛔ GATE: presentar T002–T004 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/navegacion/reglas-test.js __tests__/hooks/useMisCompras-test.jsx __tests__/components/Tabs-test.jsx` y confirmar que fallan (rojo)

### Implementación

- [X] T006 [P] Agregar a `frontend/src/navegacion/reglas.js` el export `hrefCompra(idCompra)` (con `encodeURIComponent`) y la rama `^/compra/[^/]+$` en `decidirAcceso` (visitante → `hrefLogin(r)`, COMPRADOR → permitir, ORGANIZADOR → `RUTAS.organizador.eventos`), de forma aditiva y actualizando el docstring de archivo para citar esta feature (research R1)
- [X] T007 [P] Crear `frontend/src/hooks/useMisCompras.js` sobre `listarMisCompras` de `frontend/src/services/compraService.js` con contador de petición para descartar respuestas viejas (patrón de `frontend/src/hooks/useEventos.js`) y `@typedef EstadoMisCompras` según [data-model.md §6](./data-model.md#6-estados-de-los-hooks) (research R2)
- [X] T008 [P] Crear `frontend/src/components/Tabs.jsx` (presentacional) con variantes `underline` (indicador de 3px en `primary`, contador en pill) y `segmented`, según design-system/docs/componentes/Tabs.md y research R7
- [X] T009 Correr `npx jest __tests__/navegacion __tests__/hooks/useMisCompras-test.jsx __tests__/components/Tabs-test.jsx` y confirmar verde (sin regresiones de las reglas de 003/005)

**Checkpoint**: reglas, carga del listado y pestañas listas → las historias pueden empezar

---

## Phase 3: User Story 1 - Ver mis compras por estado (Priority: P1) 🎯 MVP — CU-01

**Goal**: `/compras` lista las compras del comprador en Activas / Pasadas / Canceladas con contadores, tarjeta con estado (color + ícono + texto) y días restantes si está CONFIRMADA, estados de carga/vacío/error y actualización por gesto.

**Independent Test**: con `COMPRAS_POR_ESTADO`, cada compra aparece solo en su pestaña con el badge correcto, los contadores coinciden y las CONFIRMADA muestran "Confirmada · faltan 3 días" / "Es hoy" (quickstart escenarios 1–4).

### Pruebas (escribir primero)

- [X] T010 [P] [US1] Escribir `frontend/__tests__/compras/misCompras-test.js` (parte lista) según [data-model.md §2 › PestanaCompras](./data-model.md#2-pestaña-de-compras-pestanacompras) y §3: `PESTANAS_COMPRAS` con claves, etiquetas, estados y textos de vacío exactos; `pestanaDeEstado` para los 5 estados de `Compra.estado` y `null` para uno desconocido; `agruparPorPestana(COMPRAS_POR_ESTADO)` pone cada compra en exactamente una lista (SC-001), cada lista en orden de creación descendente, ignora estados desconocidos y devuelve listas vacías con `[]`, `null` o `undefined`
- [X] T011 [P] [US1] Escribir `frontend/__tests__/components/PurchaseCard-test.jsx` y `frontend/__tests__/components/PurchaseCardSkeleton-test.jsx` según [contracts/componentes.md › PurchaseCard](./contracts/componentes.md#purchasecard-nuevo): muestra `Compra.evento.nombre`, la fecha con `formatDate`, "2 × Platea" (`Compra.cantidad` × `Compra.tipoEntrada.nombre`) y `formatPrice(Compra.total)`; CONFIRMADA con `Compra.diasRestantes` 3 → badge "Confirmada · faltan 3 días" y destacado "Faltan 3 días"; con 0 → "Es hoy"; PENDIENTE → badge "Pendiente" (no "Pendiente de pago") y "Esperando la confirmación del organizador"; CANCELADA/REEMBOLSADA atenuadas; tocar la tarjeta llama `alPresionar`; con `cancelable` `false` no hay botón "Cancelar"; con `true` el botón llama `alCancelar` y **no** `alPresionar`; label accesible "Evento, fecha, estado"; el esqueleto tiene `testID="purchase-card-skeleton"`; dark y light
- [X] T012 [P] [US1] Escribir `frontend/__tests__/screens/mis-compras-test.jsx` (parte lista) con `renderRouter`, sesión COMPRADOR y `listarMisCompras` simulado, según [contracts/pantallas.md › /compras](./contracts/pantallas.md#compras--mis-compras-us1-us2): carga inicial → 3 `purchase-card-skeleton`; con `COMPRAS_POR_ESTADO` abre en Activas (PENDIENTE + 2 CONFIRMADA, la más reciente primero), contadores "Activas, 3" / "Pasadas, 2" / "Canceladas, 2", y al cambiar de pestaña solo se ven las de esa pestaña (US1-3); `[]` → "Todavía no compraste entradas" y "Explorar eventos" navega a `/explorar` (US1-4); pestaña vacía con compras en otras → texto de vacío sin acción; error sin datos → mensaje + "Reintentar" que vuelve a pedir; error al actualizar con datos → la lista sigue visible y se muestra toast; el gesto de actualizar (`RefreshControl` `onRefresh`) vuelve a pedir (US1-5); al volver a enfocar la pantalla vuelve a pedir; tocar una tarjeta navega a `/compra/<id>`
- [X] T013 [US1] ⛔ GATE: presentar T010–T012 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/compras/misCompras-test.js __tests__/components/PurchaseCard-test.jsx __tests__/components/PurchaseCardSkeleton-test.jsx __tests__/screens/mis-compras-test.jsx` y confirmar que fallan (rojo)

### Implementación

- [X] T014 [P] [US1] Crear `frontend/src/compras/misCompras.js` (puro) con `PESTANAS_COMPRAS`, `pestanaDeEstado` y `agruparPorPestana` según [data-model.md §2–§3](./data-model.md#3-reglas-de-presentación-puras) (`Compra.estado` → pestaña; orden descendente de creación) y `@typedef` de `PestanaCompras` y `ComprasAgrupadas` (research R3)
- [X] T015 [P] [US1] Crear `frontend/src/components/PurchaseCard.jsx` (ticket troquelado según design-system/docs/componentes/PurchaseCard.md, sin thumbnail ni "Pagar ahora") con `StatusBadge` `size="sm"` y `daysLeft={compra.diasRestantes}` ([data-model.md › Compra.diasRestantes](./data-model.md#1-compra-respuesta-de-get-apicompras)), y `frontend/src/components/PurchaseCardSkeleton.jsx` con `Skeleton` (research R4, R8)
- [X] T016 [US1] Reemplazar la pantalla provisoria `frontend/src/app/(comprador)/compras.jsx` por Mis compras: `AppHeader` grande "Mis compras", `Tabs` `underline` con contadores de `agruparPorPestana`, `FlatList` de `PurchaseCard` (por ahora `cancelable={false}`) con `RefreshControl` ligado a `recargar`/`actualizando`, `useFocusEffect` que llama `recargar`, esqueletos, vacíos y error con `EmptyState` y `mensajeError` de `frontend/src/eventos/presentacion.js`, toast de error con `useToast()` y navegación con `hrefCompra` (contracts/pantallas.md › /compras; research R2, R12); quitar el texto "Provisoria" del docstring
- [X] T017 [US1] Correr `npx jest __tests__/compras __tests__/components/PurchaseCard-test.jsx __tests__/components/PurchaseCardSkeleton-test.jsx __tests__/screens/mis-compras-test.jsx __tests__/navegacion` y confirmar verde

**Checkpoint**: US1 funcional y validable sola (quickstart escenarios 1–4)

---

## Phase 4: User Story 2 - Cancelar una compra (Priority: P1) — CU-07, CU-08

**Goal**: desde la tarjeta, cancelar una compra PENDIENTE o CONFIRMADA de un evento futuro con un diálogo destructivo (2 toques), una sola petición en curso, toast y recarga del listado; nunca ofrecer cancelar compras no cancelables.

**Independent Test**: cancelar una CONFIRMADA futura la mueve a Canceladas con toast "Compra cancelada"; UTILIZADA/CANCELADA/REEMBOLSADA y eventos pasados no ofrecen cancelar; un 400 muestra el mensaje y recarga (quickstart escenarios 5–7).

### Pruebas (escribir primero)

- [X] T018 [P] [US2] Ampliar `frontend/__tests__/compras/misCompras-test.js` (parte cancelación) según [data-model.md §3](./data-model.md#3-reglas-de-presentación-puras): `esCancelable(compra, AHORA)` es `true` solo para `Compra.estado` PENDIENTE o CONFIRMADA con `Compra.evento.fecha` posterior a `AHORA`, `false` para los otros 3 estados y para un evento ya ocurrido o que ocurre exactamente en `AHORA` (SC-004); `cuerpoCancelacion` incluye "2 × Platea", el nombre del evento, `formatPrice(Compra.total)` y la mención del reembolso; `mensajeErrorCancelacion` para 400 (título "No se puede cancelar esta compra" + mensaje del servidor como cuerpo), 403, 404, 0 y uno desconocido, según research R6
- [X] T019 [P] [US2] Escribir `frontend/__tests__/hooks/useCancelarCompra-test.jsx` según [contracts/componentes.md › Hooks](./contracts/componentes.md#hooks-srchooks) y [data-model.md §6](./data-model.md#6-estados-de-los-hooks): `cancelar(compra)` llama `cancelarCompra(compra.id)` y `enviando` es `true` mientras espera (`diferido`); éxito → `alTerminar({ ok: true, compra })`; error → `alTerminar({ ok: false, error })` sin lanzar; una segunda llamada mientras hay una en curso no hace otra petición; nada se actualiza tras desmontar
- [X] T020 [P] [US2] Escribir `frontend/__tests__/compras/ConfirmarCancelacion-test.jsx` según [contracts/componentes.md › ConfirmarCancelacion](./contracts/componentes.md#srccomprasconfirmarcancelacionjsx-nuevo) con `ToastProvider` y `cancelarCompra` simulado: con `compra` `null` no se ve el diálogo; con compra muestra "¿Cancelar esta compra?", `cuerpoCancelacion`, "Sí, cancelar compra" y "No, conservar entradas" (US2-1); "No, conservar entradas" llama `alCerrar` sin petición; confirmar → spinner y "No, conservar entradas" deshabilitado mientras espera; 200 → toast "Compra cancelada", `alTerminar({ ok: true })` y `alCerrar`; 400 → toast con el título de `mensajeErrorCancelacion`, `alTerminar({ ok: false })` y `alCerrar` (US2-4)
- [X] T021 [US2] Ampliar `frontend/__tests__/screens/mis-compras-test.jsx` (parte cancelación): las tarjetas PENDIENTE y CONFIRMADA futuras muestran "Cancelar" y las demás no (US2-3); tocar "Cancelar" abre el diálogo sin navegar al detalle; confirmar (2 toques en total, SC-003) llama `cancelarCompra` una vez y luego `listarMisCompras` otra vez; si la nueva respuesta trae la compra CANCELADA, aparece en Canceladas y el contador cambia (US2-2); un 400 muestra el toast de error y también recarga (US2-4)
- [X] T022 [US2] ⛔ GATE: presentar T018–T021 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/compras __tests__/hooks/useCancelarCompra-test.jsx __tests__/screens/mis-compras-test.jsx` y confirmar que las pruebas nuevas fallan (rojo)

### Implementación

- [X] T023 [P] [US2] Agregar a `frontend/src/compras/misCompras.js` `esCancelable(compra, ahora = new Date())`, `cuerpoCancelacion` y `mensajeErrorCancelacion` según [data-model.md §3](./data-model.md#3-reglas-de-presentación-puras) (`Compra.estado`, `Compra.evento.fecha`) y research R5–R6
- [X] T024 [P] [US2] Crear `frontend/src/hooks/useCancelarCompra.js` sobre `cancelarCompra` de `frontend/src/services/compraService.js`, con ref síncrona para una sola petición en curso (patrón de `frontend/src/hooks/useCrearCompra.js`)
- [X] T025 [US2] Crear `frontend/src/compras/ConfirmarCancelacion.jsx` componiendo `Modal` (`destructivo`, `cargando={enviando}`), `useCancelarCompra` y `useToast()` según [contracts/componentes.md](./contracts/componentes.md#srccomprasconfirmarcancelacionjsx-nuevo) (depende de T023, T024)
- [X] T026 [US2] Integrar la cancelación en `frontend/src/app/(comprador)/compras.jsx`: `cancelable={esCancelable(compra)}`, estado local con la compra a cancelar, `ConfirmarCancelacion` con `alTerminar` → `recargar()` (depende de T016, T025)
- [X] T027 [US2] Correr `npx jest __tests__/compras __tests__/hooks/useCancelarCompra-test.jsx __tests__/screens/mis-compras-test.jsx` y confirmar verde

**Checkpoint**: US1 + US2 cumplen CU-01, CU-07 y CU-08 desde la lista (quickstart escenarios 5–7)

---

## Phase 5: User Story 3 - Ver el detalle de una compra (Priority: P2) — CU-01

**Goal**: `/compra/[idCompra]` muestra resumen, estado con días, pestañas Detalle/Chat (Chat provisorio), línea de estado armada con el estado actual y la acción "Cancelar compra" si corresponde.

**Independent Test**: abrir una compra muestra su resumen y la línea de estado marca el estado actual (Cancelada: Pendiente → Cancelada; Reembolsada: Pendiente → Confirmada → Reembolsada) (quickstart escenarios 8 y 12).

### Pruebas (escribir primero)

- [X] T028 [P] [US3] Ampliar `frontend/__tests__/compras/misCompras-test.js` (parte línea de estado) con `pasosLinea` para los 5 valores de `Compra.estado` y uno desconocido, exactamente como la tabla de [data-model.md §4 › PasoLinea](./data-model.md#4-paso-de-la-línea-de-estado-pasolinea) (`PasoLinea.estado`, `PasoLinea.situacion`), verificando que hay exactamente un paso `actual`
- [X] T029 [P] [US3] Escribir `frontend/__tests__/components/StatusTimeline-test.jsx` según [contracts/componentes.md › StatusTimeline](./contracts/componentes.md#statustimeline-nuevo): un nodo por `PasoLinea` en orden, con el texto corto de `theme.purchaseStatus`; el `actual` con label "<estado>, estado actual"; los `pendiente` atenuados; `pasos` vacío no rompe; dark y light
- [X] T030 [P] [US3] Escribir `frontend/__tests__/screens/detalle-compra-test.jsx` (parte detalle) con `renderRouter` en `/compra/<id>`, sesión COMPRADOR y `listarMisCompras` simulado, según [contracts/pantallas.md › /compra/[idCompra]](./contracts/pantallas.md#compraidcompra--detalle-de-compra-us2-us3-us4): carga → esqueleto; con la compra CONFIRMADA muestra nombre del evento, fecha, "2 × Platea", total, badge con días y pestañas "Detalle" (seleccionada) y "Chat" (US3-1); la línea de estado muestra los pasos de `pasosLinea` (US3-2); tocar "Chat" muestra el estado vacío provisorio; ID ausente del listado → "No encontramos esta compra" y "Ver mis compras" navega a `/compras`; error → mensaje + "Reintentar"; compra cancelable → "Cancelar compra" abre el diálogo y, tras 200, la pantalla vuelve a pedir el listado y muestra CANCELADA sin la acción; UTILIZADA/CANCELADA/REEMBOLSADA no ofrecen cancelar; visitante → login con `volverA=%2Fcompra%2F<id>`; ORGANIZADOR → `/organizador/eventos`
- [X] T031 [US3] ⛔ GATE: presentar T028–T030 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/compras/misCompras-test.js __tests__/components/StatusTimeline-test.jsx __tests__/screens/detalle-compra-test.jsx` y confirmar que las pruebas nuevas fallan (rojo)

### Implementación

- [X] T032 [P] [US3] Agregar `pasosLinea(estado)` y `@typedef PasoLinea` a `frontend/src/compras/misCompras.js` según [data-model.md §4](./data-model.md#4-paso-de-la-línea-de-estado-pasolinea) (`PasoLinea.estado`, `PasoLinea.situacion`) y research R9
- [X] T033 [P] [US3] Crear `frontend/src/components/StatusTimeline.jsx` (presentacional, vertical, sin fechas) según design-system/docs/componentes/StatusTimeline.md y research R9
- [X] T034 [US3] Crear `frontend/src/app/compra/[idCompra].jsx` envuelto en `RutaProtegida`: `useLocalSearchParams` para `idCompra`, `useMisCompras` + `useFocusEffect`, búsqueda por ID, `AppHeader` con volver (a `/compras` si `useCanGoBack()` es `false`), `ResumenCompra` + `StatusBadge` con `Compra.diasRestantes`, `Tabs` `segmented` Detalle/Chat, `StatusTimeline` con `pasosLinea`, "Cancelar compra" con `ConfirmarCancelacion` si `esCancelable`, `EmptyState` provisorio en Chat y estados de carga/no encontrada/error (contracts/pantallas.md; research R1, R10, R12) (depende de T025, T032, T033)
- [X] T035 [US3] Correr `npx jest __tests__/compras __tests__/components/StatusTimeline-test.jsx __tests__/screens/detalle-compra-test.jsx __tests__/navegacion` y confirmar verde

**Checkpoint**: detalle de compra listo como contenedor de la reseña (US4) y del chat (008)

---

## Phase 6: User Story 4 - Reseñar un evento al que asistí (Priority: P2) — CU-09

**Goal**: con una compra UTILIZADA, ofrecer "Calificar evento" una sola vez por evento: `RatingInput` 1–5 + comentario 1–1000, validación previa, manejo de 400/403/409/0 y toast de agradecimiento.

**Independent Test**: con una compra UTILIZADA, enviar 4 estrellas y un comentario crea la reseña, muestra "¡Gracias por tu reseña!" y la acción desaparece; otra compra del mismo evento ya no la ofrece (quickstart escenarios 9–11).

### Pruebas (escribir primero)

- [X] T036 [P] [US4] Escribir `frontend/__tests__/resenias/calificacion-test.js` según [data-model.md §5 › Reseña](./data-model.md#5-reseña) y [contracts/componentes.md › calificacion.js](./contracts/componentes.md#srcreseniascalificacionjs-nuevo): `ESCALA_PUNTAJE` 1 Malo … 5 Excelente; `textoPuntaje(4)` → "4/5 · Muy bueno" y `null` → `''`; `validarResenia` sobre `BorradorResenia.puntuacion` (`null`, 0, 6, 2.5 → "Elegí de 1 a 5 estrellas") y `BorradorResenia.detalle` (`''` y solo espacios → "Escribí un comentario"; 1001 caracteres tras `trim` → "Máximo 1000 caracteres"; 1000 válido), con `valido` y ambos errores a la vez; `yaCalifico(RESENIAS, 'c1')` `true`, con otro ID `false`, tolera `comprador: null` y listas vacías/nulas; `mensajeErrorResenia` para 409 (`yaCalificado: true`, "Ya calificaste este evento"), 400 (mensaje del servidor), 403, 0 y otro (`yaCalificado: false`)
- [X] T037 [P] [US4] Escribir `frontend/__tests__/components/RatingInput-test.jsx` según [contracts/componentes.md › RatingInput](./contracts/componentes.md#ratinginput-nuevo): 5 estrellas con `accessibilityRole="radio"`, `accessibilityState.checked` solo en la elegida y label "4 estrellas, Muy bueno"; tocar la tercera llama `alCambiar(3)`; caption con `textoPuntaje(valor)`; `error` visible bajo las estrellas; `deshabilitado` no llama `alCambiar`; áreas táctiles de 52×52; dark y light
- [X] T038 [P] [US4] Escribir `frontend/__tests__/hooks/useCalificarEvento-test.jsx` según [contracts/componentes.md › Hooks](./contracts/componentes.md#hooks-srchooks) y [data-model.md §6](./data-model.md#6-estados-de-los-hooks), con `listarReseniasEvento` y `crearResenia` simulados: con `eventoId` nulo no pide nada; `verificando` mientras espera; reseña del usuario → `yaCalificado` `true`; verificación fallida → `yaCalificado` `false` sin `error`; `enviar` con borrador inválido devuelve `false` sin petición; válido → `crearResenia({ eventoId, detalle: <trim>, puntuacion })`, `enviando` `true` (`diferido`), 201 → devuelve `true` y `yaCalificado` `true`; 409 → `false`, `yaCalificado` `true` y `error.titulo` "Ya calificaste este evento"; 403 → `error` y `yaCalificado` `false`; segunda llamada en curso no hace otra petición; nada se actualiza tras desmontar
- [X] T039 [P] [US4] Escribir `frontend/__tests__/resenias/SeccionCalificacion-test.jsx` según [contracts/pantallas.md › SeccionCalificacion](./contracts/pantallas.md#seccioncalificacion-us4), con `useAuth` simulado (COMPRADOR), `ToastProvider` y servicios simulados: verificando → esqueleto; ya calificado → "Ya calificaste este evento" sin botón; sin calificar → "Calificar evento" (US4-1) que muestra `RatingInput`, el campo "Comentario" (contador de 1000) y "Enviar reseña"; enviar sin estrellas → "Elegí de 1 a 5 estrellas" sin petición (US4-2); comentario con solo espacios → "Escribí un comentario"; 4 estrellas + comentario → 201 → toast "¡Gracias por tu reseña!" y pasa a "Ya calificaste este evento" (US4-4); 409 → aviso "Ya calificaste este evento" y se oculta la acción (US4-3); 400/403 → aviso en línea y se puede reintentar
- [X] T040 [US4] Ampliar `frontend/__tests__/screens/detalle-compra-test.jsx` (parte reseña): con la compra UTILIZADA se pide `listarReseniasEvento(compra.evento.id)` y se ve la sección; con CONFIRMADA, CANCELADA o REEMBOLSADA no se pide ni se ve; dos compras UTILIZADA del mismo evento con una reseña del usuario no ofrecen calificar en ninguna
- [X] T041 [US4] ⛔ GATE: presentar T036–T040 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/resenias __tests__/components/RatingInput-test.jsx __tests__/hooks/useCalificarEvento-test.jsx __tests__/screens/detalle-compra-test.jsx` y confirmar que las pruebas nuevas fallan (rojo)

### Implementación

- [X] T042 [P] [US4] Crear `frontend/src/resenias/calificacion.js` (puro) con `ESCALA_PUNTAJE`, `textoPuntaje`, `validarResenia`, `yaCalifico` y `mensajeErrorResenia` según [data-model.md §5](./data-model.md#5-reseña) (`BorradorResenia.puntuacion`, `BorradorResenia.detalle`) y `@typedef BorradorResenia` y `MensajeErrorResenia` (research R11)
- [X] T043 [P] [US4] Crear `frontend/src/components/RatingInput.jsx` (presentacional) según design-system/docs/componentes/Rating.md › RatingInput, con colores `rating` / `rating-empty` del theme
- [X] T044 [US4] Crear `frontend/src/hooks/useCalificarEvento.js` sobre `listarReseniasEvento` y `crearResenia` de `frontend/src/services/reseniaService.js`, con ref síncrona para una sola petición y `validarResenia`/`yaCalifico`/`mensajeErrorResenia` de `calificacion.js` (depende de T042)
- [X] T045 [US4] Crear `frontend/src/resenias/SeccionCalificacion.jsx` (usuario de `useAuth()`, `useCalificarEvento`, `useToast()`, `RatingInput`, `TextField` multilínea con `maxLength={1000}`, `Button`) según contracts/pantallas.md › SeccionCalificacion (depende de T043, T044)
- [X] T046 [US4] Integrar `SeccionCalificacion` en la pestaña Detalle de `frontend/src/app/compra/[idCompra].jsx` solo si `Compra.estado === 'UTILIZADA'` ([data-model.md §1](./data-model.md#1-compra-respuesta-de-get-apicompras)), con `KeyboardAvoidingView` alrededor del contenido (depende de T034, T045)
- [X] T047 [US4] Correr `npx jest __tests__/resenias __tests__/components/RatingInput-test.jsx __tests__/hooks/useCalificarEvento-test.jsx __tests__/screens/detalle-compra-test.jsx` y confirmar verde

**Checkpoint**: las 4 historias completas (CU-01, CU-07, CU-08, CU-09)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Calidad, documentación y validación final

- [X] T048 [P] Revisar JSDoc y docstrings de archivo de todos los archivos nuevos/modificados en `frontend/src/` (principio 6): `@typedef`/`@property` de props de `Tabs`, `PurchaseCard`, `StatusTimeline`, `RatingInput`, `ConfirmarCancelacion`, `SeccionCalificacion`, y de `PestanaCompras`, `ComprasAgrupadas`, `PasoLinea`, `BorradorResenia`, `MensajeErrorResenia`, `EstadoMisCompras`; `@throws` donde corresponda; sin JSDoc desactualizado en `reglas.js` ni en `compras.jsx`
- [X] T049 [P] Actualizar `AGENTS.md` › Navigation (Frontend): agregar `/compra/[idCompra]` (solo COMPRADOR por ahora; visitante → login con `volverA`; organizador → `/organizador/eventos`; la abren 007/008) y `hrefCompra`, describir Mis compras (pestañas, `useMisCompras`, cancelación con `ConfirmarCancelacion`, `SeccionCalificacion`) y sumar `Tabs`, `PurchaseCard`, `PurchaseCardSkeleton`, `StatusTimeline` y `RatingInput` a los componentes compartidos
- [X] T050 [P] Verificar con `grep -r PantallaProvisoria frontend/src` que `compras.jsx` ya no la importa; dejar el componente si `organizador/*` todavía lo usa
- [X] T051 Correr `npm run lint` y `npm run format` desde la raíz y corregir lo que reporten
- [X] T052 Correr la suite completa `npm test` en `frontend/` y `npx expo-doctor` en `frontend/`: todo en verde, sin regresiones de 003/004/005
- [ ] T053 Ejecutar la validación manual de [quickstart.md](./quickstart.md) (13 escenarios, incluidos tema oscuro y lector de pantalla) y anotar cualquier desvío

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational. MVP.
- **US2 (Phase 4)**: depende de Foundational; T026 depende de la pantalla de US1 (T016). Sus módulos, hook y diálogo (T023–T025) pueden hacerse en paralelo con US1.
- **US3 (Phase 5)**: depende de Foundational y de `ConfirmarCancelacion` (T025, US2) para la acción del detalle. `pasosLinea` y `StatusTimeline` (T032–T033) pueden hacerse en paralelo con US1/US2.
- **US4 (Phase 6)**: depende de la pantalla del detalle (T034, US3) solo para la integración (T046); `calificacion.js`, `RatingInput`, `useCalificarEvento` y `SeccionCalificacion` (T042–T045) pueden hacerse en paralelo con US1–US3.
- **Polish (Phase 7)**: depende de todas las historias.

### Dentro de cada fase

- Pruebas → ⛔ GATE (aprobación del usuario + rojo) → implementación → corrida en verde.
- Módulos puros y hooks antes que componentes compuestos; componentes antes que pantallas.
- Tareas que tocan el mismo archivo van en secuencia: `misCompras.js` (T014 → T023 → T032), `misCompras-test.js` (T010 → T018 → T028), `compras.jsx` (T016 → T026), `mis-compras-test.jsx` (T012 → T021), `[idCompra].jsx` (T034 → T046), `detalle-compra-test.jsx` (T030 → T040).

### Orden sugerido

T001 → T002–T009 → US1 (T010–T017) → US2 (T018–T027) → US3 (T028–T035) → US4 (T036–T047) → Polish (T048–T053)

---

## Parallel Examples

### Foundational

```text
Pruebas:             T002 reglas · T003 useMisCompras · T004 Tabs
Tras el GATE:        T006 reglas.js · T007 useMisCompras.js · T008 Tabs.jsx
```

### US1

```text
Pruebas:             T010 misCompras (lista) · T011 PurchaseCard + skeleton · T012 mis-compras-test
Tras el GATE:        T014 misCompras.js · T015 PurchaseCard  →  T016 compras.jsx
```

### US2

```text
Pruebas:             T018 misCompras (cancelación) · T019 useCancelarCompra · T020 ConfirmarCancelacion  →  T021 mis-compras-test
Tras el GATE:        T023 misCompras.js · T024 useCancelarCompra.js  →  T025 ConfirmarCancelacion  →  T026 compras.jsx
```

### US3

```text
Pruebas:             T028 pasosLinea · T029 StatusTimeline · T030 detalle-compra-test
Tras el GATE:        T032 pasosLinea · T033 StatusTimeline  →  T034 [idCompra].jsx
```

### US4

```text
Pruebas:             T036 calificacion · T037 RatingInput · T038 useCalificarEvento · T039 SeccionCalificacion  →  T040 detalle-compra-test
Tras el GATE:        T042 calificacion.js · T043 RatingInput  →  T044 useCalificarEvento  →  T045 SeccionCalificacion  →  T046 integración
```

---

## Implementation Strategy

### MVP primero (US1)

1. Setup + Foundational (T001–T009).
2. US1 (T010–T017): Mis compras con pestañas, contadores, estado y días restantes.
3. **Parar y validar**: escenarios 1–4 de [quickstart.md](./quickstart.md). CU-01 (lista) cubierto.

### Entrega incremental

1. + US2 → cancelar desde la tarjeta (escenarios 5–7; SC-003, SC-004). CU-07 y CU-08 completos.
2. + US3 → detalle de compra con línea de estado, pestañas y cancelar desde el detalle (escenarios 8 y 12). Contenedor listo para 008.
3. + US4 → calificar el evento con la compra UTILIZADA (escenarios 9–11). CU-09 completo.
4. Polish → lint, suite completa, AGENTS.md y validación manual.

### Notas

- Cada ⛔ GATE es un punto de parada: no avanzar a la implementación de esa fase sin la aprobación explícita del usuario.
- El paso a UTILIZADA lo hace el backend automáticamente; la app solo lo refleja al recargar (al enfocar o con el gesto).
- La pestaña Chat queda provisoria: la reemplaza la feature 008.
- Commit al cerrar cada fase (después de la corrida en verde), con `npm run lint` y `npm run format` previos.
