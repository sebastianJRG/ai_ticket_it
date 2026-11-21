---

description: "Lista de tareas: detalle de evento, reseñas del organizador y checkout de entradas"
---

# Tasks: Detalle de evento y compra de entradas

**Input**: Documentos de diseño en `/specs/005-detalle-evento-compra/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/pantallas.md](./contracts/pantallas.md), [contracts/componentes.md](./contracts/componentes.md), [quickstart.md](./quickstart.md)

**Tests**: OBLIGATORIOS. La constitución (principio 2) y FR-008 exigen TDD: escribir la prueba, **el usuario la aprueba**, correrla en rojo, implementar lo mínimo y refactorizar. Cada fase tiene una tarea de aprobación explícita (⛔ GATE): no se implementa nada de esa fase antes de la aprobación.

**Organization**: Tareas agrupadas por historia de usuario. Rutas relativas a la raíz del repo; los comandos de Jest se corren desde `frontend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede hacer en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3)

## Convenciones para todas las tareas

- Cada archivo nuevo o modificado en `frontend/src/` lleva docstring de archivo (`@file`, `@owner Equipo Al Ticket It — frontend`, `@license MIT`) y JSDoc completo en cada export (`@param` con tipo, `@returns`, `@throws`; `@typedef` con `@property` para props y formas). `npm run lint` lo verifica (principio 6, FR-008).
- Colores, tipografías, tamaños, radios y duraciones salen de `useTheme()` (`frontend/src/theme/ThemeContext.jsx`); íconos con `frontend/src/components/Icon.jsx`; precios y fechas con `frontend/src/theme/format.js` (`formatPrice`, `formatDate(…, 'long')`, `formatRating`, `formatTickets`); nada de `fontWeight` (design-system/docs/react-native.md). Áreas táctiles ≥ `sizes.touchMin` (44).
- Pruebas de componentes con `renderConTema` (`frontend/__tests__/helpers/renderConTema.jsx`) en `scheme="dark"` y `scheme="light"`. Pantallas con `renderRouter` de `expo-router/testing-library`, como `frontend/__tests__/screens/explorar-test.jsx`.
- Servicios simulados con `jest.mock('../../src/services/<servicio>', …)`; sesión con `crearAuthFalso`, `COMPRADOR` y `ORGANIZADOR` (`frontend/__tests__/helpers/authFalso.js`); eventos con `crearEvento` y `AHORA` (`frontend/__tests__/helpers/eventosEjemplo.js`); orden de respuestas con `diferido` (`frontend/__tests__/helpers/diferido.js`). Nunca se llama a la red real.
- Los componentes de `frontend/src/components/` son presentacionales: no importan servicios, hooks de datos ni contextos de sesión/favoritos (plan › Constitution Check, principio 1).
- **Sin cambios en `backend/`** ni dependencias nuevas. El tope del selector es el cupo total; el control real lo hace el servidor (409) (research R1).
- Textos visibles en español rioplatense y exactamente como figuran en [contracts/pantallas.md](./contracts/pantallas.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Datos de ejemplo y la carpeta de ruta que permite anidar el checkout

- [X] T001 [P] Crear el helper `frontend/__tests__/helpers/comprasEjemplo.js` con JSDoc: exporta `crearResenia(parcial)` con la forma de [data-model.md › Resenia](./data-model.md) (`Resenia.comprador` `{ id, nombre, apellido }` por defecto, `Resenia.detalle` texto no vacío, `Resenia.puntuacion` entero 1–5), `RESENIAS` (5 reseñas en orden de creación, una con `comprador: null` y una con `detalle` largo de > 6 líneas), `TIPOS_CHECKOUT` (General `$ 25.000` cupo 100, Platea `$ 40.000` cupo 2, Invitación `$ 0` cupo 10, Agotada cupo 0 — ver `TipoEntrada.precio` y `TipoEntrada.cupo` en [data-model.md](./data-model.md)) y `crearCompraRespuesta(parcial)` con la forma de [data-model.md › Compra](./data-model.md) (`Compra.estado` `'PENDIENTE'`, `Compra.cantidad`, `Compra.total`)
- [X] T002 Mover `frontend/src/app/evento/[idEvento].jsx` a `frontend/src/app/evento/[idEvento]/index.jsx` sin cambiar su contenido (ajustar el import relativo de `PantallaProvisoria` a `../../../pantallas/PantallaProvisoria`) y correr `npx jest __tests__/navegacion` para confirmar que `/evento/abc123` sigue resolviendo (research R2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reglas de ruta del checkout, presentación de tipos de entrada, carga del evento y componentes que usan el detalle y el checkout

**⚠️ CRITICAL**: Ninguna historia empieza hasta completar esta fase

### Pruebas (escribir primero)

- [X] T003 [P] Ampliar `frontend/__tests__/navegacion/reglas-test.js` según [contracts/pantallas.md › Rutas](./contracts/pantallas.md#rutas): `hrefEvento('a b')` → `/evento/a%20b` y `hrefCheckout('a b')` → `/evento/a%20b/comprar`; `decidirAcceso` para `/evento/x/comprar` (también con `?q=` y barra final): visitante → `redirigir('/login?volverA=%2Fevento%2Fx%2Fcomprar')`, ORGANIZADOR → `redirigir('/evento/x')`, COMPRADOR → `permitir`; `/evento/x` sigue permitido a los tres; `destinoTrasLogin(COMPRADOR, '/evento/x/comprar')` → `'/evento/x/comprar'` y `destinoTrasLogin(ORGANIZADOR, '/evento/x/comprar')` → `'/organizador/eventos'`
- [X] T004 [P] Escribir `frontend/__tests__/eventos/detalle-test.js` (parte base) según [contracts/componentes.md › detalle.js](./contracts/componentes.md#srceventosdetallejs): `aTipoEntradaVista` (precio 0 → `precioTexto` "Gratis"; `cupo` 0 → `agotado`); `textoPrecioDesde` ("desde $ 25.000"; todos 0 → "Gratis"; mínimo 0 con otros > 0 → "desde $ 0"; sin tipos → `''`); `aDetalle` con `AHORA` cubre cada campo de [data-model.md › DetalleEvento](./data-model.md#5-detalleevento-derivado-srceventosdetallejs-adetalle) (`fechaLarga`, `descripcion`, `tipos` en orden, `precioDesdeTexto`, `organizadorId`, y los heredados de `aTarjeta`: `imagen`, `paleta`, `finalizado`), y no lanza con `{}`
- [X] T005 [P] Escribir `frontend/__tests__/hooks/useEvento-test.jsx` con `renderHook` y `obtenerEvento` simulado, según [contracts/componentes.md › Hooks](./contracts/componentes.md#hooks-srchooks) y [data-model.md › Estados de las consultas](./data-model.md#10-estados-de-las-consultas-hooks): inicial `cargando` `true`; éxito → `evento`; 404 y 400 → `noEncontrado` `true`; 0 → `error` con `noEncontrado` `false`; `recargar()` vuelve a pedir; cambiar `idEvento` re-consulta y, con `diferido`, la respuesta del ID anterior que llega después se ignora; nada se actualiza tras desmontar; nunca lanza
- [X] T006 [P] Escribir `frontend/__tests__/components/TicketTypeRow-test.jsx` según [contracts/componentes.md › TicketTypeRow](./contracts/componentes.md#tickettyperow-nuevo): informativo muestra nombre, descripción y `precioTexto` y no tiene rol `radio`; `agotado` muestra "Agotado" y "Sin cupo"; interactivo tiene `accessibilityRole="radio"`, `accessibilityState.checked` según `seleccionado`, label "<nombre>, <precio>" (", agotado" si corresponde) y tocarlo llama `alSeleccionar`; agotado o `deshabilitado` no llaman `alSeleccionar`; `children` solo se renderizan con `seleccionado`; dark y light
- [X] T007 [P] Escribir `frontend/__tests__/components/BarraAccion-test.jsx` según [contracts/componentes.md › BarraAccion](./contracts/componentes.md#barraaccion-nuevo): renderiza `children` y aplica el inset inferior de safe area (simular `useSafeAreaInsets`); dark y light
- [X] T008 ⛔ GATE: presentar T003–T007 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/navegacion/reglas-test.js __tests__/eventos/detalle-test.js __tests__/hooks/useEvento-test.jsx __tests__/components/TicketTypeRow-test.jsx __tests__/components/BarraAccion-test.jsx` y confirmar que fallan (rojo)

### Implementación

- [X] T009 [P] Agregar a `frontend/src/navegacion/reglas.js` los exports `hrefEvento(id)` y `hrefCheckout(id)` (con `encodeURIComponent`) y la rama `^/evento/[^/]+/comprar$` en `decidirAcceso` **antes** de la de `DETALLE_EVENTO`, según [contracts/pantallas.md › Rutas](./contracts/pantallas.md#rutas); sin tocar `destinoTrasLogin` ni `destinoTrasRegistro` (research R2)
- [X] T010 [P] Crear `frontend/src/eventos/detalle.js` (puro) con `aTipoEntradaVista`, `textoPrecioDesde` y `aDetalle`, reutilizando `aTarjeta`, `precioDesde` y `esPasado` de `frontend/src/eventos/presentacion.js`; implementa `TipoEntradaVista.precioTexto` y `TipoEntradaVista.agotado` a partir de `TipoEntrada.precio` y `TipoEntrada.cupo` y `DetalleEvento.fechaLarga` a partir de `Evento.fecha` ([data-model.md §2, §5, §6](./data-model.md)); `@typedef` de `DetalleEvento` y `TipoEntradaVista`
- [X] T011 [P] Crear `frontend/src/hooks/useEvento.js` (llama `obtenerEvento` de `frontend/src/services/eventoService.js`) con secuencia en `useRef` para descartar respuestas viejas, como `frontend/src/hooks/useEventos.js`; `noEncontrado` con status 404 o 400; `@typedef EstadoEvento` ([data-model.md §10](./data-model.md#10-estados-de-las-consultas-hooks))
- [X] T012 [P] Crear `frontend/src/components/TicketTypeRow.jsx` según [contracts/componentes.md › TicketTypeRow](./contracts/componentes.md#tickettyperow-nuevo) y design-system/docs/componentes/TicketTypeRow.md (borde `primary-text` cuando está seleccionado, agotado con precio tachado y sin relleno); sin "Quedan N" (research R9)
- [X] T013 [P] Crear `frontend/src/components/BarraAccion.jsx` según [contracts/componentes.md › BarraAccion](./contracts/componentes.md#barraaccion-nuevo) (fondo `surface`, borde superior, `paddingBottom` = `useSafeAreaInsets().bottom` + espaciado del theme)
- [X] T014 Correr las pruebas de T008 y confirmar verde; refactorizar si hace falta

**Checkpoint**: reglas del checkout, presentación de tipos, carga del evento y componentes base listos

---

## Phase 3: User Story 1 - Ver el detalle de un evento (Priority: P1) 🎯 MVP

**Goal**: Reemplazar el detalle provisorio por el definitivo: hero, datos del evento, organizador con puntaje, tipos de entrada informativos y barra "Comprar entradas · desde $ X" según rol y fecha.

**Independent Test**: Abrir un evento existente muestra todos sus datos y el CTA; uno finalizado muestra "Evento finalizado" deshabilitado; un ID inexistente muestra "Evento no encontrado" con "Volver a Explorar" (escenarios 1, 4, 5 y 13 de [quickstart.md](./quickstart.md)).

### Pruebas (escribir primero)

- [X] T015 [P] [US1] Ampliar `frontend/__tests__/eventos/detalle-test.js` con `modoCta` y `textoCta` según [data-model.md › ModoCta](./data-model.md#7-modocta-derivado-modoctaevento-usuario-ahora): los 5 modos (`oculto`, `finalizado`, `sinEntradas` —sin tipos y con todos `cupo` 0—, `pedirSesion`, `comprar`) y la prioridad (ORGANIZADOR con evento finalizado → `oculto`; visitante con evento finalizado → `finalizado`); `textoCta('comprar', 'desde $ 25.000')` → "Comprar entradas · desde $ 25.000", `'finalizado'` → "Evento finalizado", `'sinEntradas'` → "Sin entradas a la venta"
- [X] T016 [P] [US1] Escribir `frontend/__tests__/screens/detalle-evento-test.jsx` (parte US1) con `renderRouter`, `obtenerEvento` simulado y `listarReseniasOrganizador` simulado devolviendo `[]`, según [contracts/pantallas.md › /evento/[idEvento]](./contracts/pantallas.md#eventoidevento--detalle-del-evento-us1-us2): esqueleto mientras carga; listo muestra nombre como `header`, fecha larga, categoría, descripción, nombre del organizador con su `Rating` compact, una fila por tipo ("Gratis" en el de precio 0) y el CTA "Comprar entradas · desde $ …" (US1-1, FR-001); sin `multimedia` renderiza `ArteCategoria` y con `multimedia` la imagen; evento finalizado → "Evento finalizado" y botón deshabilitado (US1-2); 404 y 400 → "Evento no encontrado" y "Volver a Explorar" lleva a `/explorar` (US1-3); error 0 → "Sin conexión" y "Reintentar" vuelve a llamar `obtenerEvento`; ORGANIZADOR → sin CTA (edge case); visitante toca el CTA → `/login` con `volverA=/evento/<id>/comprar`; COMPRADOR toca el CTA → `/evento/<id>/comprar`; corazón visible para COMPRADOR/visitante y oculto para ORGANIZADOR (`useFavoritos` desde el `FavoritosProvider` real con `usuarioService` simulado)
- [X] T017 [P] [US1] Actualizar el caso "puede ver Buscar y el detalle de un evento (FR-003)" de `frontend/__tests__/navegacion/rutas-test.jsx`: simular `obtenerEvento` y `listarReseniasOrganizador` y esperar el `header` con el nombre del evento en lugar de "Detalle del evento"
- [X] T018 [US1] ⛔ GATE: presentar T015–T017 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/eventos/detalle-test.js __tests__/screens/detalle-evento-test.jsx __tests__/navegacion/rutas-test.jsx` y confirmar rojo

### Implementación

- [X] T019 [US1] Agregar `modoCta` y `textoCta` a `frontend/src/eventos/detalle.js` con la prioridad de [data-model.md › ModoCta](./data-model.md#7-modocta-derivado-modoctaevento-usuario-ahora) (`ahora` inyectable; usa `Evento.fecha` vía `esPasado` y `TipoEntrada.cupo` vía `TipoEntradaVista.agotado`) y `@typedef ModoCta`
- [X] T020 [US1] Reemplazar `frontend/src/app/evento/[idEvento]/index.jsx` por el detalle definitivo según [contracts/pantallas.md › /evento/[idEvento]](./contracts/pantallas.md#eventoidevento--detalle-del-evento-us1-us2): `useLocalSearchParams` → `useEvento`; estados cargando (`Skeleton`), no encontrado y error (`EmptyState` + `mensajeError` de `frontend/src/eventos/presentacion.js`); hero 4:3 (`expo-image` con `Evento.multimedia[0]` o `ArteCategoria`) bajo `AppHeader variante="transparent"` con "Volver" (`useCanGoBack`) y corazón según `modoFavorito`/`useFavoritos`; hoja superpuesta `radius-xl` con chip de categoría, título `display-xl` (`accessibilityRole="header"`), fecha larga, descripción, organizador + `Rating` compact (`Evento.puntajeOrganizador` nullable, [data-model.md §1](./data-model.md#1-evento-respuesta-de-get-apieventosidevento)), sección "Entradas" con `TicketTypeRow interactive={false}`; `BarraAccion` con `Button` según `modoCta` (visitante → `router.push(hrefLogin(hrefCheckout(id)))`; COMPRADOR → `router.push(hrefCheckout(id))`); "Volver a Explorar" usa `rutaInicial(usuario)`. Dejar un lugar marcado para la sección de reseñas (US2)
- [X] T021 [US1] Correr las pruebas de T018 y confirmar verde; refactorizar si hace falta

**Checkpoint**: el detalle muestra el evento completo y deriva al checkout o al login (US1 validable sola; el checkout es todavía la ruta inexistente → se completa en US3)

---

## Phase 4: User Story 2 - Leer reseñas del organizador antes de comprar (Priority: P1) — CU-10

**Goal**: En el detalle, mostrar el promedio y la cantidad de reseñas del organizador, las 2 más recientes y "Ver todas" expandible; estado vacío y error aislado.

**Independent Test**: Un organizador con reseñas en eventos pasados muestra promedio, cantidad y las 2 más recientes en el detalle de un evento nuevo suyo; sin reseñas muestra "Este organizador todavía no tiene reseñas" (escenarios 2 y 3 de [quickstart.md](./quickstart.md)).

### Pruebas (escribir primero)

- [X] T022 [P] [US2] Escribir `frontend/__tests__/resenias/presentacion-test.js` según [contracts/componentes.md › resenias/presentacion.js](./contracts/componentes.md#srcreseniaspresentacionjs) y [data-model.md §9](./data-model.md#9-resúmenes-de-reseñas-derivado-srcreseniaspresentacionjs) con `RESENIAS` de T001: `recientes` (últimas 2 en orden inverso; con 1 o 0); `ordenRecientes` (todas invertidas, sin mutar la entrada); `promedio` (número del servidor gana; `null` del servidor con reseñas → promedio local; sin reseñas → `null`); `aResenia` ("Nombre A.", iniciales "NA"; `comprador: null` → "Comprador")
- [X] T023 [P] [US2] Escribir `frontend/__tests__/hooks/useReseniasOrganizador-test.jsx` con `listarReseniasOrganizador` simulado: sin ID no llama al servicio y `cargando` `false`; con ID → lista; error → `error` y `resenias` `[]`; `recargar()`; cambio de ID descarta la respuesta vieja (`diferido`); nada tras desmontar
- [X] T024 [P] [US2] Escribir `frontend/__tests__/components/Avatar-test.jsx` y `frontend/__tests__/components/ReviewCard-test.jsx` según [contracts/componentes.md › ReviewCard](./contracts/componentes.md#reviewcard-nuevo) y [› Avatar](./contracts/componentes.md#avatar-nuevo): `Avatar` muestra iniciales, mismo color para el mismo nombre, `accessible={false}`, tamaños 32/40/64; `ReviewCard` muestra autor, estrellas y detalle, label "<autor>, <n> de 5 estrellas: <detalle>"; detalle largo muestra "Leer más" y al tocarlo "Leer menos" (simular `onTextLayout` con > 6 líneas); dark y light
- [X] T025 [P] [US2] Ampliar `frontend/__tests__/components/Rating-test.jsx` con la variante `estrellas` según [contracts/componentes.md › Rating](./contracts/componentes.md#rating-mod-aditivo): 5 estrellas, valor "4,6", `cantidad={12}` → "(12)" y label "Puntaje 4,6 de 5, 12 reseñas"; sin `cantidad` no muestra paréntesis; los casos existentes de `compact` siguen pasando sin cambios
- [X] T026 [P] [US2] Ampliar `frontend/__tests__/screens/detalle-evento-test.jsx` con la sección "Reseñas del organizador" según [contracts/pantallas.md › /evento/[idEvento]](./contracts/pantallas.md#eventoidevento--detalle-del-evento-us1-us2) punto 6: llama `listarReseniasOrganizador` con `evento.organizador.id`; con 5 reseñas muestra promedio y "(5)", las 2 más recientes (las 2 últimas de `RESENIAS`) y "Ver todas las 5 reseñas", que al tocarlo muestra las 5 y "Ver menos" (US2-1, SC-004); con `[]` → "Este organizador todavía no tiene reseñas" (US2-2); con error → "No pudimos cargar las reseñas" y "Reintentar" vuelve a llamar al servicio, **mientras el resto del detalle sigue visible**
- [X] T027 [US2] ⛔ GATE: presentar T022–T026 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/resenias __tests__/hooks/useReseniasOrganizador-test.jsx __tests__/components/Avatar-test.jsx __tests__/components/ReviewCard-test.jsx __tests__/components/Rating-test.jsx __tests__/screens/detalle-evento-test.jsx` y confirmar rojo

### Implementación

- [X] T028 [P] [US2] Crear `frontend/src/resenias/presentacion.js` (puro) con `recientes`, `ordenRecientes`, `promedio` y `aResenia` según [data-model.md §3 y §9](./data-model.md) (`Resenia.comprador` nullable; `Resenia.puntuacion` 1–5; `Resenia.detalle` se muestra tal cual; sin fecha: "recientes" por orden de creación, research R4)
- [X] T029 [P] [US2] Crear `frontend/src/hooks/useReseniasOrganizador.js` (llama `listarReseniasOrganizador` de `frontend/src/services/usuarioService.js`) con el mismo descarte por secuencia que T011; `@typedef EstadoResenias`
- [X] T030 [P] [US2] Crear `frontend/src/components/Avatar.jsx` según [contracts/componentes.md › Avatar](./contracts/componentes.md#avatar-nuevo) y design-system/docs/componentes/Avatar.md (color determinístico por hash del nombre sobre colores del theme)
- [X] T031 [P] [US2] Agregar a `frontend/src/components/Rating.jsx` la `variante="estrellas"` y la prop `cantidad` según [contracts/componentes.md › Rating](./contracts/componentes.md#rating-mod-aditivo) (colores `rating`/`rating-empty`, media estrella por redondeo a 0,5); `compact` sigue siendo el valor por defecto y no cambia
- [X] T032 [US2] Crear `frontend/src/components/ReviewCard.jsx` según [contracts/componentes.md › ReviewCard](./contracts/componentes.md#reviewcard-nuevo) y design-system/docs/componentes/ReviewCard.md (usa `Avatar` 32 y `Rating variante="estrellas"`; `numberOfLines={6}` con "Leer más"/"Leer menos"; sin fecha ni "Asistió con …") (depende de T030, T031)
- [X] T033 [US2] Agregar la sección "Reseñas del organizador" a `frontend/src/app/evento/[idEvento]/index.jsx`: `useReseniasOrganizador(evento?.organizador?.id)`; esqueletos, error con "Reintentar", vacío, y con reseñas `Rating variante="estrellas"` con `promedio(resenias, Evento.puntajeOrganizador)` y `cantidad` = largo de la lista, `ReviewCard` de `recientes(…)` y el botón "Ver todas las N reseñas"/"Ver menos" que alterna con `ordenRecientes(…)` (research R4)
- [X] T034 [US2] Correr las pruebas de T027 y confirmar verde; refactorizar si hace falta

**Checkpoint**: CU-10 completo; el detalle muestra la experiencia previa con el organizador

---

## Phase 5: User Story 3 - Comprar entradas (Priority: P1) — CU-12

**Goal**: Checkout protegido en `/evento/[idEvento]/comprar`: elegir un tipo (radio) y una cantidad topada en el cupo, ver el total, confirmar una sola vez, manejar 400/403/404/409/0 y mostrar el éxito con el total del servidor y "Ver mis compras".

**Independent Test**: Elegir 2 entradas de un tipo y confirmar crea una compra PENDIENTE con el total del servidor; el "+" se detiene en el cupo; un 409 muestra "No quedan suficientes entradas de este tipo"; doble toque crea una sola compra (escenarios 6–14 de [quickstart.md](./quickstart.md)).

### Pruebas (escribir primero)

- [X] T035 [P] [US3] Escribir `frontend/__tests__/compras/checkout-test.js` según [contracts/componentes.md › checkout.js](./contracts/componentes.md#srccomprascheckoutjs) y [data-model.md › SeleccionCheckout](./data-model.md#8-seleccioncheckout-estado-de-la-pantalla-srccomprascheckoutjs) con `TIPOS_CHECKOUT` de T001: `seleccionInicial` (un solo tipo no agotado → preseleccionado; varios → `tipoId` `null`; uno disponible y uno agotado → el disponible); `limitesCantidad` (`{ min: 1, max: cupo }`); `ajustarCantidad` (0 → 1, cupo + 1 → cupo, no enteros) (SC-002); `totalEstimado` (40000 × 2 = 80000; sin tipo → 0); `textoConfirmar` ("Elegí un tipo de entrada", "Evento finalizado", "Confirmar compra · $ 80.000", "Confirmar compra · Gratis"); `mensajeErrorCompra` con la tabla de [research R7](./research.md#r7-confirmar-una-sola-compra-y-manejo-de-errores) (409 → título "No quedan suficientes entradas de este tipo" y cuerpo = mensaje del servidor; 400 → "No pudimos crear la compra" + mensaje del servidor; 403; 404; 0 → "Sin conexión"; otro) y `bloquea` en 403 y 404
- [X] T036 [P] [US3] Escribir `frontend/__tests__/hooks/useCrearCompra-test.jsx` con `crearCompra` simulado y `diferido`: `confirmar` envía `{ eventoId, tipoEntradaId, cantidad }`; `enviando` `true` hasta que resuelve; éxito → `compra` y devuelve la compra; error → `error` (ApiError) y devuelve `null`; **dos `confirmar` seguidos sin esperar → `crearCompra` llamado 1 vez** (SC-003); tras resolver se puede volver a confirmar; `limpiarError()`; nada tras desmontar
- [X] T037 [P] [US3] Escribir `frontend/__tests__/components/QuantityStepper-test.jsx` según [contracts/componentes.md › QuantityStepper](./contracts/componentes.md#quantitystepper-nuevo): "−" deshabilitado en `min`; "+" deshabilitado en `max` y hint "Máximo N"; tocar llama `alCambiar(valor ± 1)` y nunca fuera de `[min, max]`; `deshabilitado` bloquea ambos; label del grupo = `etiqueta`; valor con `accessibilityLiveRegion="polite"`; no hay `TextInput`; botones ≥ 44; dark y light
- [X] T038 [P] [US3] Escribir `frontend/__tests__/components/ResumenCompra-test.jsx` según [contracts/componentes.md › ResumenCompra](./contracts/componentes.md#resumencompra-nuevo): muestra título, cada línea (etiqueta y valor) y el total; dark y light
- [X] T039 [P] [US3] Escribir `frontend/__tests__/navegacion/RutaProtegida-test.jsx` según [contracts/componentes.md › RutaProtegida](./contracts/componentes.md#srcnavegacionrutaprotegidajsx-nuevo) con `renderRouter` y `crearAuthFalso`: COMPRADOR en `/evento/x/comprar` ve los `children`; visitante es redirigido a `/login?volverA=…`; ORGANIZADOR a `/evento/x`; si la sesión pasa de COMPRADOR a `null` con la pantalla montada, navega a login con `replace`
- [X] T040 [P] [US3] Escribir `frontend/__tests__/screens/checkout-test.jsx` con `renderRouter`, sesión de COMPRADOR, `obtenerEvento` y `crearCompra` simulados, según [contracts/pantallas.md › /evento/[idEvento]/comprar](./contracts/pantallas.md#eventoideventocomprar--checkout-us3): header "Comprar entradas" con el nombre del evento; con varios tipos ninguno elegido y botón "Elegí un tipo de entrada" deshabilitado; elegir Platea muestra su stepper en 1, "+" → 2, total "$ 80.000" y botón "Confirmar compra · $ 80.000" (US3-1, FR-005); en 2 el "+" está deshabilitado con "Máximo 2" (US3-2); la fila agotada no se puede elegir; cambiar de tipo reinicia a 1; confirmar llama `crearCompra({ eventoId, tipoEntradaId, cantidad: 2 })`; **doble toque con `diferido` → una sola llamada** y botón ocupado (SC-003); 409 → aviso con "No quedan suficientes entradas de este tipo" y el mensaje del servidor, y la pantalla sigue editable; cambiar la cantidad borra el aviso (US3-3); 400 con evento ya ocurrido → mensaje del servidor y botón "Evento finalizado" (US3-4); 403 → botón deshabilitado; 404 → "Volver a Explorar"; 0 → "Sin conexión" y reintentable; 201 → "Compra creada", "Quedó pendiente de confirmación del organizador.", total **de la respuesta** (distinto del estimado en el mock) y "Ver mis compras" lleva a `/compras` con `replace` (US3-6, FR-007); un solo tipo → preseleccionado (SC-001); evento finalizado al cargar → botón "Evento finalizado"; ID inexistente → "Evento no encontrado"
- [X] T041 [P] [US3] Ampliar `frontend/__tests__/navegacion/rutas-test.jsx`: visitante en el detalle toca "Comprar entradas" → `/login` con `volverA=/evento/<id>/comprar`, inicia sesión como COMPRADOR (`authService` simulado) y termina en `/evento/<id>/comprar` (US3-5); ORGANIZADOR que abre `/evento/<id>/comprar` termina en `/evento/<id>`
- [X] T042 [US3] ⛔ GATE: presentar T035–T041 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/compras __tests__/hooks/useCrearCompra-test.jsx __tests__/components/QuantityStepper-test.jsx __tests__/components/ResumenCompra-test.jsx __tests__/navegacion __tests__/screens/checkout-test.jsx` y confirmar rojo

### Implementación

- [X] T043 [P] [US3] Crear `frontend/src/compras/checkout.js` (puro) con `seleccionInicial`, `limitesCantidad`, `ajustarCantidad`, `totalEstimado`, `textoConfirmar` y `mensajeErrorCompra`; implementa `SeleccionCheckout.tipoId` (nullable) y `SeleccionCheckout.cantidad` con tope en `TipoEntrada.cupo` y mínimo de `Compra.cantidad` ([data-model.md §2, §4, §8](./data-model.md)); `@typedef SeleccionCheckout` y del resultado de `mensajeErrorCompra`
- [X] T044 [P] [US3] Crear `frontend/src/hooks/useCrearCompra.js` (llama `crearCompra` de `frontend/src/services/compraService.js`): `useRef` "en curso" marcado **antes** de la llamada para ignorar un segundo `confirmar`; `enviando`, `error`, `compra`, `limpiarError`; nunca lanza (research R7)
- [X] T045 [P] [US3] Crear `frontend/src/components/QuantityStepper.jsx` según [contracts/componentes.md › QuantityStepper](./contracts/componentes.md#quantitystepper-nuevo) y design-system/docs/componentes/QuantityStepper.md ("+" relleno `primary`, hint "Máximo N" en `warning`, sin entrada de texto)
- [X] T046 [P] [US3] Crear `frontend/src/components/ResumenCompra.jsx` según [contracts/componentes.md › ResumenCompra](./contracts/componentes.md#resumencompra-nuevo) (borde troquelado del design system, total `price-lg`; sin cargo por servicio)
- [X] T047 [P] [US3] Crear `frontend/src/navegacion/RutaProtegida.jsx` según [contracts/componentes.md › RutaProtegida](./contracts/componentes.md#srcnavegacionrutaprotegidajsx-nuevo): `decidirAcceso({ usuario, ruta: usePathname() })`; `<Redirect>` al montar y `router.replace` si la decisión cambia con la pantalla montada (mismo patrón que `frontend/src/navegacion/AreaConPestanas.jsx`)
- [X] T048 [US3] Crear `frontend/src/app/evento/[idEvento]/comprar.jsx` envuelto en `RutaProtegida`, según [contracts/pantallas.md › /evento/[idEvento]/comprar](./contracts/pantallas.md#eventoideventocomprar--checkout-us3) y las transiciones de [data-model.md §11](./data-model.md#11-transiciones-de-la-pantalla-de-checkout): `useEvento` + `aDetalle`; estados cargando/no encontrado/error de carga; `TicketTypeRow interactive` como grupo de radio con `QuantityStepper` como `children` del elegido (`limitesCantidad`, `ajustarCantidad`, reinicio a 1 al cambiar de tipo); `ResumenCompra` con `totalEstimado`; aviso en línea `accessibilityRole="alert"` con `mensajeErrorCompra` que se limpia al cambiar selección; `BarraAccion` con `Button` (`loading` = `enviando`, deshabilitado sin tipo, con evento finalizado o con error que `bloquea`) que llama `confirmar`; en éxito, estado "Compra creada" con `ResumenCompra` de `Compra.tipoEntrada`, `Compra.cantidad` y `Compra.total` ([data-model.md §4](./data-model.md#4-compra-respuesta-de-post-apicompras-201)), "Ver mis compras" (`router.replace(RUTAS.compras)`) y "Volver al evento" (`router.back()` o `router.replace(hrefEvento(id))`), sin "Volver" en el header (research R6–R8) (depende de T043–T047)
- [X] T049 [US3] Correr las pruebas de T042 y confirmar verde; refactorizar si hace falta

**Checkpoint**: CU-12 completo; flujo detalle → (login) → checkout → compra PENDIENTE → Mis compras

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Calidad, documentación y validación final

- [X] T050 [P] Revisar JSDoc y docstrings de archivo de todos los archivos nuevos/modificados en `frontend/src/` (principio 6): `@typedef`/`@property` de props de cada componente nuevo, `DetalleEvento`, `TipoEntradaVista`, `ModoCta`, `SeleccionCheckout`, `EstadoEvento`, `EstadoResenias`; `@throws` donde corresponda; sin JSDoc desactualizado en `Rating.jsx`, `reglas.js` ni en el docstring del detalle ("Provisoria: la completa la feature 005" debe desaparecer)
- [X] T051 [P] Actualizar `AGENTS.md` › Navigation (Frontend): agregar `/evento/[idEvento]/comprar` (solo COMPRADOR; visitante → login con `volverA`; organizador → detalle) a la lista de áreas, mencionar `hrefEvento`/`hrefCheckout` y `RutaProtegida` (`frontend/src/navegacion/`), y sumar `TicketTypeRow`, `QuantityStepper`, `ReviewCard`, `Avatar`, `ResumenCompra`, `BarraAccion` y la variante `estrellas` de `Rating` a los componentes compartidos
- [X] T052 [P] Verificar con `grep -r PantallaProvisoria frontend/src` que el detalle ya no la importa; dejar el componente si `compras.jsx` u `organizador/*` todavía la usan
- [X] T053 Correr `npm run lint` y `npm run format` desde la raíz y corregir lo que reporten
- [X] T054 Correr la suite completa `npm test` en `frontend/` y `npx expo-doctor` en `frontend/`: todo en verde, sin regresiones de 003/004
- [ ] T055 Ejecutar la validación manual de [quickstart.md](./quickstart.md) §3–§4 (15 escenarios, incluidos tema oscuro y lector de pantalla) y anotar cualquier desvío

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T002 (mover la ruta) antes de cualquier tarea que toque `frontend/src/app/evento/`.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational. MVP.
- **US2 (Phase 4)**: depende de Foundational y de T020 (la pantalla del detalle donde se agrega la sección). Sus módulos y componentes (T028–T032) pueden hacerse en paralelo con US1.
- **US3 (Phase 5)**: depende de Foundational; el CTA que lleva al checkout es de US1 (T020), pero la pantalla `comprar.jsx` y sus pruebas (salvo T041) son independientes y pueden empezar en paralelo con US1/US2.
- **Polish (Phase 6)**: depende de todas las historias.

### Dentro de cada fase

- Pruebas → ⛔ GATE (aprobación del usuario + rojo) → implementación → corrida en verde.
- Módulos puros y hooks antes que componentes; componentes antes que pantallas.
- Tareas que tocan el mismo archivo van en secuencia: `detalle.js` (T010 → T019), `detalle-test.js` (T004 → T015), `[idEvento]/index.jsx` (T002 → T020 → T033), `detalle-evento-test.jsx` (T016 → T026), `rutas-test.jsx` (T017 → T041), `Rating-test.jsx`/`Rating.jsx` (T025 → T031).

### Orden sugerido

T001–T002 → T003–T014 → US1 (T015–T021) → US2 (T022–T034) → US3 (T035–T049) → Polish (T050–T055)

---

## Parallel Examples

### Foundational

```text
Pruebas:             T003 reglas · T004 detalle (base) · T005 useEvento · T006 TicketTypeRow · T007 BarraAccion
Tras el GATE:        T009 reglas.js · T010 detalle.js · T011 useEvento.js · T012 TicketTypeRow · T013 BarraAccion
```

### US1

```text
Pruebas:             T015 modoCta/textoCta · T016 detalle-evento-test · T017 rutas-test (detalle)
Implementación:      T019 detalle.js → T020 [idEvento]/index.jsx
```

### US2

```text
Pruebas:             T022 resenias/presentacion · T023 useReseniasOrganizador · T024 Avatar/ReviewCard · T025 Rating · T026 detalle (reseñas)
Tras el GATE:        T028 presentacion.js · T029 hook · T030 Avatar · T031 Rating  →  T032 ReviewCard  →  T033 sección en el detalle
```

### US3

```text
Pruebas:             T035 checkout.js · T036 useCrearCompra · T037 QuantityStepper · T038 ResumenCompra · T039 RutaProtegida · T040 checkout-test · T041 rutas-test (volverA)
Tras el GATE:        T043 checkout.js · T044 useCrearCompra · T045 QuantityStepper · T046 ResumenCompra · T047 RutaProtegida  →  T048 comprar.jsx
```

---

## Implementation Strategy

### MVP primero (US1)

1. Setup + Foundational (T001–T014).
2. US1 (T015–T021): detalle definitivo con CTA según rol y fecha.
3. **Parar y validar**: escenarios 1, 4, 5 y 13 de [quickstart.md](./quickstart.md).

### Entrega incremental

1. + US2 → reseñas del organizador en el detalle (escenarios 2–3; SC-004). CU-10 completo.
2. + US3 → checkout con tope por cupo, manejo de errores y éxito (escenarios 6–12 y 14; SC-001, SC-002, SC-003). CU-12 completo.
3. Polish → lint, suite completa, AGENTS.md y validación manual.

### Notas

- Cada ⛔ GATE es un punto de parada: no avanzar a la implementación de esa fase sin la aprobación explícita del usuario.
- La compra nace PENDIENTE en el backend; esta feature no transiciona `EstadoCompra` (la confirma el organizador en 007).
- Commit al cerrar cada fase (después de la corrida en verde), con `npm run lint` y `npm run format` previos.
