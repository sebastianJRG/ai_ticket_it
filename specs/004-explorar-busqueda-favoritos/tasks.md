---

description: "Lista de tareas: Explorar, Búsqueda, orden y Favoritos del comprador"
---

# Tasks: Explorar, buscar y favoritos

**Input**: Documentos de diseño en `/specs/004-explorar-busqueda-favoritos/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/pantallas.md](./contracts/pantallas.md), [contracts/componentes.md](./contracts/componentes.md), [quickstart.md](./quickstart.md)

**Tests**: OBLIGATORIOS. La constitución (principio 2) y FR-010 exigen TDD: escribir la prueba, **el usuario la aprueba**, correrla en rojo, implementar lo mínimo y refactorizar. Cada fase tiene una tarea de aprobación explícita (⛔ GATE): no se implementa nada de esa fase antes de la aprobación.

**Organization**: Tareas agrupadas por historia de usuario. Rutas relativas a la raíz del repo; los comandos de Jest se corren desde `frontend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede hacer en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3, US4)

## Convenciones para todas las tareas

- Cada archivo nuevo o modificado en `frontend/src/` lleva docstring de archivo (`@file`, `@owner Equipo Al Ticket It — frontend`, `@license MIT`) y JSDoc completo en cada export (`@param`, `@returns`, `@throws`; `@typedef` con `@property` para props y formas) (principio 6, FR-010).
- Colores, tipografías, tamaños, radios y duraciones salen de `useTheme()` (`frontend/src/theme/ThemeContext.jsx`); íconos con `frontend/src/components/Icon.jsx`; precios y fechas con `frontend/src/theme/format.js`; nada de `fontWeight` (design-system/docs/react-native.md). Áreas táctiles ≥ `sizes.touchMin` (44).
- Las pruebas de componentes se renderizan con `renderConTema` (`frontend/__tests__/helpers/renderConTema.jsx`) en `scheme="dark"` y `scheme="light"`.
- Los servicios se simulan con `jest.mock('../../src/services/<servicio>', …)`; la sesión con `crearAuthFalso` (`frontend/__tests__/helpers/authFalso.js`). Nunca se llama a la red real.
- Los componentes de `frontend/src/components/` son presentacionales: no importan servicios, hooks de datos ni contextos de sesión/favoritos (plan › Constitution Check, principio 1).
- Filtrar y ordenar lo hace **siempre el servidor**; la app no reordena salvo separar "Muy pronto" (research R1).
- Textos visibles en español rioplatense, como las pantallas existentes.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Datos de ejemplo y utilidades de prueba compartidas (sin dependencias nuevas)

- [X] T001 [P] Crear el helper `frontend/__tests__/helpers/eventosEjemplo.js` con JSDoc: exporta `AHORA` (una `Date` fija), `CATEGORIAS` (Recitales, Teatro y una de nombre libre "Stand-up", con forma `{ id, nombre, descripcion }` de [data-model.md › Categoria](./data-model.md#2-categoria-respuesta-de-la-api)) y `crearEvento(parcial)` que devuelve un evento con todos los campos de [data-model.md › Evento](./data-model.md#1-evento-respuesta-de-la-api-solo-lectura) (`Evento.categoria`, `Evento.fecha` futura respecto de `AHORA` por defecto, `Evento.tiposEntrada` con ≥ 1 tipo, `Evento.multimedia` `[]`, `Evento.organizador` público, `Evento.puntajeOrganizador` `null` por defecto) más `EVENTOS` (≥ 7 eventos: varias categorías, uno finalizado, uno gratis, uno con `multimedia`, uno con "jazz" en el nombre, uno con organizador con puntaje)
- [X] T002 [P] Crear el helper `frontend/__tests__/helpers/diferido.js` con JSDoc: exporta `diferido()` → `{ promesa, resolver, rechazar }` para controlar el orden de llegada de respuestas simuladas (research R13)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lógica de presentación pura, hooks de datos y los componentes de tarjeta y chips que usan todas las historias

**⚠️ CRITICAL**: Ninguna historia empieza hasta completar esta fase

### Pruebas (escribir primero)

- [X] T003 [P] Escribir `frontend/__tests__/eventos/presentacion-test.js` según [contracts/componentes.md › presentacion.js](./contracts/componentes.md#srceventospresentacionjs): `precioDesde` (mínimo, un solo tipo, sin tipos → `null`); `aTarjeta` con `AHORA` de T001 cubre cada campo de [data-model.md › TarjetaEvento](./data-model.md#3-tarjetaevento-derivada-srceventospresentacionjs) — `TarjetaEvento.precioTexto` ("Desde $ …", valor único sin "Desde", `0` → "Gratis", sin tipos → `''`), `TarjetaEvento.imagen` (`multimedia[0]` o `null` con `[]`/string vacío), `TarjetaEvento.finalizado` (fecha igual a `AHORA` → `true`), `TarjetaEvento.dia`/`TarjetaEvento.mes`, `TarjetaEvento.puntaje`, `TarjetaEvento.organizadorNombre` y `TarjetaEvento.etiquetaAccesible` (con ", finalizado" si corresponde); `esPasado`; `iconoCategoria` (Recitales/recitales/"Recitáles" → mismo ícono; desconocido → `Tag`); `paletaCategoria` (nombre conocido → su paleta; desconocido → paleta estable para el mismo `id` y una de las 5) (research R9, R12)
- [X] T004 [P] Escribir `frontend/__tests__/hooks/useEventos-test.jsx` con `renderHook` y `listarEventos` simulado, según [contracts/componentes.md › useEventos](./contracts/componentes.md#useeventosfiltros--srchooksuseeventosjs-llama-listareventos) y las transiciones de [data-model.md › EstadoConsulta](./data-model.md#7-estadoconsulta-useeventos): estado inicial `EstadoConsulta.eventos` `null` y `EstadoConsulta.cargando` `true`; éxito → eventos y `EstadoConsulta.error` `null`; error → `error` con los eventos previos conservados; cambiar filtros por **valor** re-consulta y un objeto nuevo con los mismos valores no; `recargar()` re-consulta; con `diferido` de T002, la respuesta de la petición 1 que llega **después** de la 2 se ignora (y también su error) (SC-003); nada se actualiza tras desmontar
- [X] T005 [P] Escribir `frontend/__tests__/hooks/useCategorias-test.jsx` según [contracts/componentes.md › useCategorias](./contracts/componentes.md#usecategorias--srchooksusecategoriasjs-llama-listarcategorias): `[]` mientras carga, la lista al resolver, `[]` si falla (sin lanzar)
- [X] T006 [P] Escribir `frontend/__tests__/components/Chip-test.jsx` y `frontend/__tests__/components/CategoryChips-test.jsx` según [contracts/componentes.md › Chip](./contracts/componentes.md#chip) y [› CategoryChips](./contracts/componentes.md#categorychips): `Chip` muestra etiqueta, `accessibilityState.selected`, `removible` muestra ✕ con label "Quitar filtro <etiqueta>" y llama `alPresionar`; `CategoryChips` muestra "Todo" primero y seleccionado con `seleccionada={null}`, luego las categorías en su orden; tocar una llama `alCambiar(id)` y "Todo" `alCambiar(null)`; con `categorias=[]` solo "Todo" (edge case); `tablist`/`tab`; dark y light
- [X] T007 [P] Escribir `frontend/__tests__/components/Rating-test.jsx` según [contracts/componentes.md › Rating](./contracts/componentes.md#rating): `valor=4.666` → "4,7" con label "Puntaje del organizador 4,7 de 5"; con `nombre` lo muestra; `valor=null` → "Sin reseñas" y label "Organizador sin reseñas"; dark y light (US3-3)
- [X] T008 [P] Escribir `frontend/__tests__/components/EventCard-test.jsx` y `frontend/__tests__/components/EventCardSkeleton-test.jsx` según [contracts/componentes.md › EventCard](./contracts/componentes.md#eventcard) y [› EventCardSkeleton](./contracts/componentes.md#eventcardskeleton), con eventos de T001 y `ahora={AHORA}`: en `feature` y `compact` muestra nombre, fecha corta, categoría, precio y `Rating`; sin `multimedia` renderiza `ArteCategoria` y con `multimedia` una imagen; finalizado muestra "Finalizado"; tocar la tarjeta llama `alPresionar` y su label es `TarjetaEvento.etiquetaAccesible` ([data-model.md](./data-model.md#3-tarjetaevento-derivada-srceventospresentacionjs)); `favorito.modo='oculto'` no renderiza el corazón; `'alternar'` con `activo` → label "Quitar de favoritos", sin `activo` → "Agregar a favoritos", y tocarlo llama `favorito.alPresionar` **sin** llamar `alPresionar` de la tarjeta; `ocupado` → `accessibilityState.busy`; el skeleton se renderiza en ambas variantes; dark y light (FR-005)
- [X] T009 [P] Escribir `frontend/__tests__/components/SearchBar-test.jsx` según [contracts/componentes.md › SearchBar](./contracts/componentes.md#searchbar): placeholder por defecto "Buscá artistas, obras, eventos…"; editable llama `alCambiar`; con `valor` aparece "Borrar búsqueda" y llama `alCambiar('')`; sin `valor` no aparece; con `alPresionar` (disparador) no es editable y tocarla llama `alPresionar`; dark y light
- [X] T010 ⛔ GATE: presentar T003–T009 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/eventos/presentacion-test.js __tests__/hooks/useEventos-test.jsx __tests__/hooks/useCategorias-test.jsx __tests__/components/Chip-test.jsx __tests__/components/CategoryChips-test.jsx __tests__/components/Rating-test.jsx __tests__/components/EventCard-test.jsx __tests__/components/EventCardSkeleton-test.jsx __tests__/components/SearchBar-test.jsx` y confirmar que fallan (rojo)

### Implementación

- [X] T011 [P] Implementar `frontend/src/eventos/presentacion.js` (puro, sin React): `precioDesde` a partir de `Evento.tiposEntrada` ([data-model.md › Evento](./data-model.md#1-evento-respuesta-de-la-api-solo-lectura)); `aTarjeta` con cada campo de [data-model.md › TarjetaEvento](./data-model.md#3-tarjetaevento-derivada-srceventospresentacionjs): `TarjetaEvento.id`, `TarjetaEvento.nombre`, `TarjetaEvento.categoria`, `TarjetaEvento.fechaCorta` (vía `formatDate(fecha, 'short')`), `TarjetaEvento.dia`, `TarjetaEvento.mes`, `TarjetaEvento.precioMin`, `TarjetaEvento.precioMax`, `TarjetaEvento.precioTexto` (vía `formatPriceFrom`; sin `Evento.tiposEntrada` → `''`), `TarjetaEvento.imagen` (desde `Evento.multimedia`), `TarjetaEvento.paleta`, `TarjetaEvento.finalizado`, `TarjetaEvento.puntaje` (desde `Evento.puntajeOrganizador`), `TarjetaEvento.organizadorNombre` y `TarjetaEvento.etiquetaAccesible`; `esPasado(evento, ahora = new Date())`, `iconoCategoria` y `paletaCategoria` (normalizar nombre: minúsculas, sin acentos; paletas de `PosterArt` en `design-system/referencia-web/index.jsx`; hash estable del `id` para desconocidos) (research R9, R12). Ninguna función lanza
- [X] T012 [P] Implementar `frontend/src/hooks/useEventos.js` según [data-model.md › EstadoConsulta](./data-model.md#7-estadoconsulta-useeventos) (`EstadoConsulta.eventos`, `EstadoConsulta.cargando`, `EstadoConsulta.error`, `EstadoConsulta.recargar`): dependencia por valor de `{ q, categoriaId, sortBy, order }`; número de secuencia en `useRef` y bandera de montado; solo la última petición actualiza (research R3)
- [X] T013 [P] Implementar `frontend/src/hooks/useCategorias.js` (llama `listarCategorias` de `frontend/src/services/categoriaService.js`; `[]` ante error)
- [X] T014 [P] Implementar `frontend/src/components/Chip.jsx` y `frontend/src/components/CategoryChips.jsx` según `design-system/docs/componentes/Chip.md` (category 40 de alto + hitSlop a 44, seleccionado `primary`; filter 36 + hitSlop, seleccionado `primary-soft`; fila horizontal `ScrollView` con padding `space-4` y gap `space-2`; "Todo" con ícono `LayoutGrid`, resto con `iconoCategoria` de T011)
- [X] T015 [P] Implementar `frontend/src/components/Rating.jsx` (variante `compact`: ícono `Star` relleno con color `rating`, `formatRating`) según `design-system/docs/componentes/Rating.md` (research R11); `valor` recibe `Evento.puntajeOrganizador` / `TarjetaEvento.puntaje` ([data-model.md](./data-model.md#1-evento-respuesta-de-la-api-solo-lectura)), que puede ser `null` → "Sin reseñas"
- [X] T016 [P] Implementar `frontend/src/components/ArteCategoria.jsx` (`LinearGradient` de `expo-linear-gradient` con `paletaCategoria` + ícono `iconoCategoria`, `accessible={false}`) (research R9)
- [X] T017 Implementar `frontend/src/components/EventCard.jsx` y `frontend/src/components/EventCardSkeleton.jsx` según `design-system/docs/componentes/EventCard.md` y [contracts/componentes.md › EventCard](./contracts/componentes.md#eventcard): usa `aTarjeta` (T011), `Rating` (T015) y `ArteCategoria` (T016); imagen con `expo-image` (`contentFit="cover"`) y caída a `ArteCategoria` en `onError`; `feature` 300 de ancho con imagen 16:10, degradé `scrim-image` y bloque `TarjetaEvento.dia`/`TarjetaEvento.mes` ([data-model.md](./data-model.md#3-tarjetaevento-derivada-srceventospresentacionjs)); `compact` con thumbnail 104 × 104; finalizado con `opacity-muted-image` y tag "Finalizado"; corazón como `IconButton` separado (`variant="onImage"`, ícono `Heart` con `fill` si `activo`); skeleton compone `Skeleton` de `frontend/src/components/Skeleton.jsx` (depende de T011, T015, T016)
- [X] T018 [P] Implementar `frontend/src/components/SearchBar.jsx` según `design-system/docs/componentes/SearchBar.md` (pill, ícono `Search`, `TextInput` con `returnKeyType="search"` y `autoFocus` según `autoFoco`; modo disparador con `Pressable`; sin botón de filtros, research R4)
- [X] T019 Correr las pruebas de T010 en `frontend/`: todas en verde

**Checkpoint**: tarjeta, chips, buscador y hooks de datos listos para cualquier pantalla.

---

## Phase 3: User Story 1 - Explorar eventos por categoría (Priority: P1) 🎯 MVP — CU-03

**Goal**: La pestaña Explorar muestra categorías como chips, destacados en carrusel y "Muy pronto" con los futuros por fecha; filtrar por categoría deja solo sus eventos; funciona sin sesión.

**Independent Test**: Con categorías y eventos simulados, `/explorar` muestra "Todo" seleccionado, las categorías, destacados y "Muy pronto" sin finalizados; tocar una categoría re-consulta con `categoriaId` y muestra solo esos eventos.

### Pruebas (escribir primero)

- [X] T020 [P] [US1] Agregar a `frontend/__tests__/eventos/presentacion-test.js` los casos de `separarExplorar` según [data-model.md › SeccionesExplorar](./data-model.md#4-seccionesexplorar-derivada): descarta finalizados, conserva el orden recibido en `SeccionesExplorar.muyPronto`, `SeccionesExplorar.destacados` = primeros 5 (y menos si hay menos), lista vacía → ambos `[]` (US1-4, edge case)
- [X] T021 [P] [US1] Escribir `frontend/__tests__/screens/explorar-test.jsx` con `renderRouter` sobre **`frontend/src/app` completo** (como `frontend/__tests__/navegacion/rutas-test.jsx`: incluye el layout raíz, que desde T050 monta `FavoritosProvider`), con `initialUrl: '/explorar'`, `useAuth` simulado (visitante y COMPRADOR) y `eventoService`/`categoriaService`/`usuarioService` simulados (`listarFavoritos` resolviendo `[]` por defecto), según [contracts/pantallas.md › /explorar](./contracts/pantallas.md#explorar--srcappcompradorexplorarjsx-pública): al montar llama `listarEventos({ sortBy: 'fecha', order: 'asc' })` y `listarCategorias()`; mientras carga se ven esqueletos (label "Cargando eventos") (US1-3); luego "Todo" seleccionado + categorías (US1-1), "Destacados" y "Muy pronto" sin el evento finalizado (US1-4, edge); tocar "Teatro" llama `listarEventos` con `categoriaId` de Teatro y, mientras esa respuesta (con `diferido` de T002) no llega, se ven esqueletos y no los eventos de "Todo"; al resolver muestra solo los de Teatro (US1-2); categorías vacías o con error → solo "Todo" y los eventos se muestran igual (edge); error de eventos (`status 0`) → "Sin conexión" + "Reintentar", que vuelve a consultar (edge); sin eventos futuros → "No hay eventos próximos"; tocar la SearchBar → `toHavePathname('/buscar')` (con categoría elegida, parámetro `categoriaId`); tocar una tarjeta → `/evento/<id>` (FR-006); como visitante no redirige a login (FR-009)
- [X] T022 [US1] ⛔ GATE: presentar T020–T021 al usuario y esperar su **aprobación**; correr `npx jest __tests__/eventos __tests__/screens/explorar-test.jsx` y confirmar rojo en los casos nuevos

### Implementación

- [X] T023 [US1] Agregar `separarExplorar(eventos, { ahora, maxDestacados = 5 })` a `frontend/src/eventos/presentacion.js` según [data-model.md › SeccionesExplorar](./data-model.md#4-seccionesexplorar-derivada) (`SeccionesExplorar.destacados`, `SeccionesExplorar.muyPronto`) (research R2)
- [X] T024 [US1] Crear `frontend/src/eventos/EventoConFavorito.jsx` (componente conectado) según [contracts/componentes.md › EventoConFavorito](./contracts/componentes.md#eventoconfavorito-srceventoseventoconfavoritojsx-conectado), por ahora **solo con navegación**: envuelve `EventCard` con `alPresionar` → `router.push('/evento/<id>')` y `favorito.modo='oculto'` (el corazón se conecta en US4, T049)
- [X] T025 [US1] Reemplazar `frontend/src/app/(comprador)/explorar.jsx` por la pantalla definitiva según [contracts/pantallas.md › /explorar](./contracts/pantallas.md#explorar--srcappcompradorexplorarjsx-pública): bienvenida (con nombre de `useAuth().usuario` si hay sesión), `SearchBar` disparador → `/buscar` (o `/buscar?categoriaId=<id>`), `CategoryChips` con `useCategorias`, `useEventos({ categoriaId, sortBy: 'fecha', order: 'asc' })`, `separarExplorar`, carrusel horizontal (`FlatList horizontal`) de `EventoConFavorito variant="feature"` y lista "Muy pronto" `compact`; estados con `EventCardSkeleton` (también mientras `cargando` con eventos previos, al cambiar de categoría) y `EmptyState` (research R10). Deja de importar `PantallaProvisoria`
- [X] T026 [US1] Revisar `frontend/__tests__/navegacion/rutas-test.jsx`: agregar `jest.mock` de `frontend/src/services/eventoService` y `categoriaService` (resolviendo `[]`) si ahora fallan por la pantalla real de Explorar, sin cambiar sus aserciones de navegación
- [X] T027 [US1] Correr `npm test` en `frontend/`: T020–T021 en verde y la suite de 003 sin regresiones

**Checkpoint**: Explorar funcional e independiente (MVP).

---

## Phase 4: User Story 2 - Buscar por texto (Priority: P1) — CU-03

**Goal**: En Búsqueda, el comprador escribe y, tras 300 ms, ve los eventos que devuelve el servidor, con contador y filtros activos removibles; siempre se ve el resultado del último texto.

**Independent Test**: Escribir "jazz" consulta `listarEventos({ q: 'jazz', … })` una sola vez tras 300 ms y muestra "1 evento"; una respuesta vieja que llega tarde no reemplaza a la nueva.

### Pruebas (escribir primero)

- [X] T028 [P] [US2] Escribir `frontend/__tests__/hooks/useDebounce-test.jsx` con `jest.useFakeTimers()` según [contracts/componentes.md › useDebounce](./contracts/componentes.md#usedebouncevalor-ms--300--srchooksusedebouncejs): valor inicial inmediato; cambios seguidos solo emiten el último tras 300 ms; a los 299 ms aún no; limpia al desmontar
- [X] T029 [P] [US2] Escribir `frontend/__tests__/screens/buscar-test.jsx` con `renderRouter` sobre **`frontend/src/app` completo** (igual que T021, con `initialUrl` `/buscar…`), fake timers y servicios simulados (`listarFavoritos` resolviendo `[]` por defecto), según [contracts/pantallas.md › /buscar](./contracts/pantallas.md#buscar--srcappcompradorbuscarjsx-pública): con `/buscar?categoriaId=<id>` inicia con esa categoría y su chip de filtro ([data-model.md › FiltrosBusqueda](./data-model.md#5-filtrosbusqueda-estado-de-la-pantalla-búsqueda), `FiltrosBusqueda.categoriaId`); escribir "jazz" no consulta antes de 300 ms y luego consulta una vez con `q: 'jazz'` (`FiltrosBusqueda.texto` recortado; vacío no se envía) (US2-1); el contador muestra "1 evento" / "N eventos"; aparecen chips removibles de texto y categoría; quitar el de categoría re-consulta **sin espera** y sin `categoriaId` (US2-2); quitar el de texto vacía la SearchBar; sin coincidencias → "No encontramos eventos" con "Quitar filtros", que limpia texto y categoría (US2-3); con `diferido` de T002, escribir "ja" y luego "teatro" y resolver primero "teatro" y después "ja" → se ve solo el resultado de "teatro" (SC-003, edge); mientras re-consulta con resultados previos se ven esqueletos; error → "Reintentar"; los finalizados se muestran con "Finalizado"; tocar una tarjeta → `/evento/<id>`; como visitante funciona (FR-009); **recorrido SC-001**: desde `initialUrl: '/explorar'`, tocar la SearchBar (1) → `/buscar`, escribir el nombre de un evento (2) y avanzar 300 ms, tocar su tarjeta (3) → `toHavePathname('/evento/<id>')`, en exactamente 3 interacciones
- [X] T030 [US2] ⛔ GATE: presentar T028–T029 al usuario y esperar su **aprobación**; correr `npx jest __tests__/hooks/useDebounce-test.jsx __tests__/screens/buscar-test.jsx` y confirmar rojo

### Implementación

- [X] T031 [P] [US2] Implementar `frontend/src/hooks/useDebounce.js` (`useState` + `setTimeout`, limpieza en el efecto)
- [X] T032 [US2] Reemplazar `frontend/src/app/(comprador)/buscar.jsx` por la pantalla definitiva según [contracts/pantallas.md › /buscar](./contracts/pantallas.md#buscar--srcappcompradorbuscarjsx-pública) y [data-model.md › FiltrosBusqueda](./data-model.md#5-filtrosbusqueda-estado-de-la-pantalla-búsqueda) (`FiltrosBusqueda.texto` inicial desde `params.q`, `FiltrosBusqueda.categoriaId` inicial desde `params.categoriaId`, `FiltrosBusqueda.orden` fijo en `'fecha-asc'` → `{ sortBy: 'fecha', order: 'asc' }` hasta US3): `SearchBar` editable con `autoFoco`, `useDebounce(texto, 300)`, `CategoryChips`, fila de `Chip variant="filter" removible`, contador, `FlatList` de `EventoConFavorito variant="compact"`, estados (research R3, R4, R10). Deja de importar `PantallaProvisoria` (depende de T031)
- [X] T033 [US2] Correr `npm test` en `frontend/`: T028–T029 en verde, sin regresiones

**Checkpoint**: Explorar y Búsqueda funcionan juntas (Explorar → Búsqueda con categoría; SC-001).

---

## Phase 5: User Story 3 - Ordenar resultados (Priority: P1) — CU-11

**Goal**: En Búsqueda, el comprador ordena por precio, fecha o puntaje del organizador, en ambos sentidos; cada tarjeta muestra el puntaje o "Sin reseñas".

**Independent Test**: Elegir cada una de las 6 opciones envía su `sortBy`/`order` al servidor y la lista refleja el orden recibido; "Mejor puntaje" es descendente y deja a los sin reseñas al final (orden del servidor).

### Pruebas (escribir primero)

- [X] T034 [P] [US3] Escribir `frontend/__tests__/eventos/orden-test.js` según [data-model.md › OpcionOrden](./data-model.md#6-opcionorden-srceventosordenjs-constante-congelada): `OPCIONES_ORDEN` tiene exactamente las 6 claves con `OpcionOrden.etiqueta`, `OpcionOrden.corta`, `OpcionOrden.sortBy` y `OpcionOrden.order` de la tabla y está congelado; las 6 combinaciones criterio × sentido aparecen una vez (SC-002); `ORDEN_POR_DEFECTO === 'fecha-asc'`; `paramsOrden('puntaje-desc')` → `{ sortBy: 'puntaje', order: 'desc' }` (US3-2); clave desconocida → la de defecto
- [X] T035 [P] [US3] Escribir `frontend/__tests__/components/BottomSheet-test.jsx` y `frontend/__tests__/components/SortSelector-test.jsx` según [contracts/componentes.md › BottomSheet](./contracts/componentes.md#bottomsheet) y [› SortSelector](./contracts/componentes.md#sortselector): `BottomSheet` con `visible=false` no muestra contenido; con `true` muestra título y `children`; "Cerrar", el fondo y el back de Android (`onRequestClose`) llaman `alCerrar`. `SortSelector` muestra "Ordenar: Fecha ↑" con `valor='fecha-asc'` y label "Ordenar resultados, actual: Fecha más próxima"; al tocarlo abre "Ordenar por" con 6 radios y `checked` solo en el actual; elegir "Precio menor a mayor" llama `alCambiar('precio-asc')` y cierra; dark y light
- [X] T036 [P] [US3] Agregar a `frontend/__tests__/screens/buscar-test.jsx`: por defecto consulta con `sortBy: 'fecha', order: 'asc'`; elegir cada una de las 6 opciones re-consulta **sin espera** con su `sortBy`/`order` conservando `q` y `categoriaId` (SC-002); la lista se muestra en el orden devuelto por el servidor simulado (no reordena) (US3-1/2); las tarjetas muestran "★ 4,7" o "Sin reseñas" (US3-3)
- [X] T037 [US3] ⛔ GATE: presentar T034–T036 al usuario y esperar su **aprobación**; correr `npx jest __tests__/eventos/orden-test.js __tests__/components/BottomSheet-test.jsx __tests__/components/SortSelector-test.jsx __tests__/screens/buscar-test.jsx` y confirmar rojo en los casos nuevos

### Implementación

- [X] T038 [P] [US3] Implementar `frontend/src/eventos/orden.js` (puro) con `OPCIONES_ORDEN` (`Object.freeze` de cada `OpcionOrden.clave`/`OpcionOrden.etiqueta`/`OpcionOrden.corta`/`OpcionOrden.sortBy`/`OpcionOrden.order` según [data-model.md › OpcionOrden](./data-model.md#6-opcionorden-srceventosordenjs-constante-congelada)), `ORDEN_POR_DEFECTO` y `paramsOrden` (research R5)
- [X] T039 [P] [US3] Implementar `frontend/src/components/BottomSheet.jsx` sobre `Modal` de React Native (`transparent`, `animationType="slide"`, fondo `scrim-modal` tocable, grabber, título + `IconButton` "Cerrar", radio superior `xl`, padding `space-5`, `useSafeAreaInsets().bottom`) según `design-system/docs/componentes/BottomSheet.md` (research R6)
- [X] T040 [US3] Implementar `frontend/src/components/SortSelector.jsx` con `BottomSheet` (T039) y `OPCIONES_ORDEN` (T038): disparador compacto y lista de radios; aplica al tocar y cierra (`design-system/docs/componentes/SortSelector.md`) (depende de T038, T039)
- [X] T041 [US3] Conectar el orden en `frontend/src/app/(comprador)/buscar.jsx`: estado `FiltrosBusqueda.orden` ([data-model.md](./data-model.md#5-filtrosbusqueda-estado-de-la-pantalla-búsqueda)) con `ORDEN_POR_DEFECTO`, `paramsOrden(orden)` en la consulta y `SortSelector` a la derecha del contador (depende de T040)
- [X] T042 [US3] Correr `npm test` en `frontend/`: T034–T036 en verde, sin regresiones

**Checkpoint**: CU-03 y CU-11 completos.

---

## Phase 6: User Story 4 - Favoritos (Priority: P2)

**Goal**: El comprador marca/desmarca eventos con el corazón (cambio instantáneo, confirmado con el servidor y revertido con aviso si falla) y los ve en la pestaña Favoritos; el visitante es enviado a login; el organizador no ve el corazón.

**Independent Test**: Como COMPRADOR, tocar el corazón en Explorar lo llena en el mismo render y llama `agregarFavorito`; la pestaña Favoritos lo lista; desmarcarlo lo quita; si el servidor falla, vuelve y aparece el toast.

### Pruebas (escribir primero)

- [X] T043 [P] [US4] Agregar a `frontend/__tests__/eventos/presentacion-test.js` los casos de `modoFavorito` según [data-model.md › ModoFavorito](./data-model.md#9-modofavorito-derivado): COMPRADOR → `'alternar'`, `null`/`undefined` → `'pedirSesion'`, ORGANIZADOR → `'oculto'` (US4-2, edge)
- [X] T044 [P] [US4] Escribir `frontend/__tests__/favoritos/FavoritosContext-test.jsx` con `usuarioService` simulado, `useAuth` simulado y `ToastProvider` real (o `useToast` simulado), según [contracts/componentes.md › FavoritosContext](./contracts/componentes.md#contexto-de-favoritos--srcfavoritosfavoritoscontextjsx) y las reglas de [data-model.md › EstadoFavoritos](./data-model.md#8-estadofavoritos-favoritoscontext): con COMPRADOR carga `listarFavoritos` y expone `EstadoFavoritos.eventos` en su orden, `esFavorito` y `EstadoFavoritos.cargando`; visitante y ORGANIZADOR no llaman ningún servicio y `eventos` es `[]`; cambio de usuario descarta y recarga; `alternar(evento)` cambia `esFavorito` **antes** de resolver la petición, de forma síncrona en el mismo `act` (criterio verificable de SC-004: el cambio no espera a la red, así que queda por debajo de 100 ms) y agrega al final / quita; éxito sin otras pendientes adopta la lista del servidor; con dos pendientes, la primera en resolver no pisa el estado optimista de la segunda; error revierte solo ese evento a su posición previa y muestra el toast `error` "No pudimos actualizar tus favoritos" (US4-1); `estaPendiente(id)` y un segundo `alternar` del mismo id mientras está pendiente no hace nada (`EstadoFavoritos.pendientes`); error de carga → `EstadoFavoritos.error` y `recargar()` reintenta; `useFavoritos` fuera del provider lanza
- [X] T045 [P] [US4] Escribir `frontend/__tests__/screens/favoritos-test.jsx` con `renderRouter` sobre `frontend/src/app` completo (layout raíz con `FavoritosProvider`, `initialUrl: '/favoritos'`), COMPRADOR simulado y `usuarioService` simulado, según [contracts/pantallas.md › /favoritos](./contracts/pantallas.md#favoritos--srcappcompradorfavoritosjsx-comprador): esqueletos mientras carga; lista en orden de agregado con el corazón lleno; desmarcar lo quita al instante; sin favoritos → "Todavía no tenés favoritos" con "Explorar eventos" que lleva a `/explorar` (US4-3); error → "Reintentar"; tocar una tarjeta → `/evento/<id>`
- [X] T046 [P] [US4] Agregar a `frontend/__tests__/screens/explorar-test.jsx` (y un caso en `buscar-test.jsx`) los casos del corazón (con `agregarFavorito`/`quitarFavorito` simulados en el mock de `usuarioService` de T021/T029) según [contracts/pantallas.md › Corazón](./contracts/pantallas.md#corazón-todas-las-pantallas): COMPRADOR → tocar lo llena al instante y llama `agregarFavorito(id)`; con `agregarFavorito` rechazando → vuelve a vacío y aparece el toast (US4-1); visitante → navega a `/login?volverA=%2Fexplorar` (en Búsqueda, `volverA` incluye la ruta `/buscar`) sin llamar al servicio (US4-2); el mismo evento marcado en Explorar aparece lleno en Búsqueda (estado compartido, research R7)
- [X] T047 [US4] ⛔ GATE: presentar T043–T046 al usuario y esperar su **aprobación**; correr `npx jest __tests__/eventos __tests__/favoritos __tests__/screens` y confirmar rojo en los casos nuevos

### Implementación

- [X] T048 [P] [US4] Agregar `modoFavorito(usuario)` a `frontend/src/eventos/presentacion.js` según [data-model.md › ModoFavorito](./data-model.md#9-modofavorito-derivado) (research R8)
- [X] T049 [P] [US4] Implementar `frontend/src/favoritos/FavoritosContext.jsx` (`FavoritosProvider` + `useFavoritos`) con `EstadoFavoritos.eventos`, `EstadoFavoritos.ids` (derivado con `useMemo`), `EstadoFavoritos.cargando`, `EstadoFavoritos.error` y `EstadoFavoritos.pendientes` (en `useRef` + estado para re-render) según [data-model.md › EstadoFavoritos](./data-model.md#8-estadofavoritos-favoritoscontext); usa `listarFavoritos`/`agregarFavorito`/`quitarFavorito` de `frontend/src/services/usuarioService.js`, `useAuth()` y `useToast().mostrar` (research R7)
- [X] T050 [US4] Montar `<FavoritosProvider>` en `frontend/src/app/_layout.jsx` dentro de `SesionConAviso` (`AuthProvider`) y por lo tanto dentro de `ToastProvider`, envolviendo el `Navigator`; actualizar su docstring (depende de T049)
- [X] T051 [US4] Conectar el corazón en `frontend/src/eventos/EventoConFavorito.jsx`: `modoFavorito(useAuth().usuario)`; `'alternar'` → `favorito = { modo, activo: esFavorito(id), ocupado: estaPendiente(id), alPresionar: () => alternar(evento) }`; `'pedirSesion'` → `router.push(hrefLogin(rutaActual))` con `rutaActual` de `usePathname()` + query de `useGlobalSearchParams()` y `hrefLogin` de `frontend/src/navegacion/reglas.js`; `'oculto'` → sin corazón (depende de T048, T049)
- [X] T052 [US4] Reemplazar `frontend/src/app/(comprador)/favoritos.jsx` por la pantalla definitiva según [contracts/pantallas.md › /favoritos](./contracts/pantallas.md#favoritos--srcappcompradorfavoritosjsx-comprador): `useFavoritos()`, `recargar()` en `useFocusEffect`, `FlatList` de `EventoConFavorito variant="compact"`, esqueletos, error con "Reintentar" y `EmptyState icono="heart"` con "Explorar eventos" → `router.navigate('/explorar')`. Deja de importar `PantallaProvisoria` (depende de T051)
- [X] T053 [US4] Revisar que `frontend/__tests__/navegacion/rutas-test.jsx` y `frontend/__tests__/navegacion/expiracion-test.jsx` (ambas montan `frontend/src/app` completo) sigan pasando con `FavoritosProvider` montado (agregar `listarFavoritos` resolviendo `[]` al mock de `usuarioService` si hace falta, sin cambiar aserciones); correr `npm test` en `frontend/`: T043–T046 y T021/T029 en verde, sin regresiones

**Checkpoint**: las cuatro historias funcionan; el corazón queda listo para reutilizarse en el detalle (feature 005).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Calidad, documentación y validación final

- [X] T054 [P] Revisar JSDoc y docstrings de archivo de todos los archivos nuevos/modificados en `frontend/src/` (principio 6): `@typedef`/`@property` de props de cada componente, `TarjetaEvento`, `OpcionOrden`, `EstadoConsulta`, `EstadoFavoritos`; `@throws` donde corresponda; sin JSDoc desactualizado
- [X] T055 [P] Borrar `frontend/src/pantallas/PantallaProvisoria.jsx` solo si ya no tiene importadores (`grep -r PantallaProvisoria frontend/src`); si 006–008 todavía la usan (`compras.jsx`, `organizador/*`), dejarla
- [X] T056 [P] Actualizar `AGENTS.md` › Navigation (Frontend): agregar que Explorar/Buscar/Favoritos usan `EventoConFavorito` (`frontend/src/eventos/`), que el estado de favoritos vive en `FavoritosProvider` (`frontend/src/favoritos/FavoritosContext.jsx`, montado en el layout raíz) y sumar `SearchBar`, `Chip`, `CategoryChips`, `SortSelector`, `BottomSheet`, `Rating`, `EventCard` y `EventCardSkeleton` a la lista de componentes compartidos
- [X] T057 Hacer que el lint verifique el JSDoc (principio 6: "linted by the build gate"): instalar `eslint-plugin-jsdoc` como devDependency de la raíz (`npm install -D eslint-plugin-jsdoc` desde la raíz) y agregar en `eslint.config.js` un bloque para `frontend/src/**/*.{js,jsx}` con `jsdoc/require-jsdoc` (exports: `FunctionDeclaration`, `ClassDeclaration`, `ArrowFunctionExpression` exportadas), `jsdoc/require-param`, `jsdoc/require-param-type`, `jsdoc/require-returns`, `jsdoc/require-file-overview` y `jsdoc/check-tag-names` (permitiendo `owner` y `license`) en `error`. El alcance se limita a `frontend/src/` para mantener el cambio en el workspace de esta feature; extenderlo a `backend/` queda para un cambio aparte
- [X] T058 Correr `npm run lint` y `npm run format` desde la raíz y corregir lo que reporten (incluidos los avisos de JSDoc de T057 en archivos existentes de `frontend/src/`)
- [X] T059 Correr la suite completa `npm test` en `frontend/` y `npx expo-doctor` en `frontend/`: todo en verde
- [ ] T060 Ejecutar la validación manual de [quickstart.md](./quickstart.md) §3–§5 (16 escenarios + accesibilidad y tema oscuro) y anotar cualquier desvío

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational. Crea `EventoConFavorito` (solo navegación).
- **US2 (Phase 4)**: depende de Foundational y de T024 (`EventoConFavorito`); puede empezar sus pruebas en paralelo con US1. La navegación Explorar → Búsqueda se valida con ambas.
- **US3 (Phase 5)**: depende de US2 (modifica `buscar.jsx` y `buscar-test.jsx`). `orden.js`, `BottomSheet` y `SortSelector` (T034, T035, T038–T040) pueden hacerse en paralelo con US1/US2.
- **US4 (Phase 6)**: depende de Foundational y de T024; sus pruebas de pantalla (T046) extienden las de US1/US2, así que conviene hacerla después. `FavoritosContext` (T044, T049) puede adelantarse en paralelo.
- **Polish (Phase 7)**: depende de todas las historias.

### Dentro de cada fase

- Pruebas → ⛔ GATE (aprobación del usuario + rojo) → implementación → corrida en verde.
- Módulos puros y hooks antes que componentes; componentes antes que pantallas.
- Tareas que tocan el mismo archivo (`presentacion.js`: T011, T023, T048; `buscar.jsx`: T032, T041; `EventoConFavorito.jsx`: T024, T051) van en secuencia.

### Orden sugerido

T001–T002 → T003–T010 → T011–T019 → US1 (T020–T027) → US2 (T028–T033) → US3 (T034–T042) → US4 (T043–T053) → Polish (T054–T060)

---

## Parallel Examples

### Foundational

```text
Pruebas:             T003 presentacion · T004 useEventos · T005 useCategorias · T006 Chip/CategoryChips · T007 Rating · T008 EventCard/Skeleton · T009 SearchBar
Tras el GATE:        T011 presentacion.js · T012 useEventos.js · T013 useCategorias.js · T014 Chip/CategoryChips · T015 Rating · T016 ArteCategoria · T018 SearchBar
Luego:               T017 EventCard (necesita T011, T015, T016)
```

### US1

```text
Pruebas:             T020 separarExplorar · T021 explorar-test
Implementación:      T023 → T024 → T025 (secuencial: misma cadena de dependencias)
```

### US2

```text
Pruebas:             T028 useDebounce · T029 buscar-test
Implementación:      T031 useDebounce.js → T032 buscar.jsx
```

### US3

```text
Pruebas:             T034 orden · T035 BottomSheet/SortSelector · T036 buscar-test (orden)
Tras el GATE:        T038 orden.js · T039 BottomSheet.jsx  →  T040 SortSelector  →  T041 buscar.jsx
```

### US4

```text
Pruebas:             T043 modoFavorito · T044 FavoritosContext · T045 favoritos-test · T046 corazón en explorar/buscar
Tras el GATE:        T048 modoFavorito · T049 FavoritosContext.jsx  →  T050 _layout.jsx · T051 EventoConFavorito  →  T052 favoritos.jsx
```

---

## Implementation Strategy

### MVP primero (US1)

1. Setup + Foundational (T001–T019).
2. US1 (T020–T027): Explorar con categorías, destacados y "Muy pronto".
3. **Parar y validar**: escenarios 1–3, 14 y 15 de [quickstart.md](./quickstart.md).

### Entrega incremental

1. + US2 → búsqueda por texto con filtros removibles (escenarios 4–6; SC-001, SC-003).
2. + US3 → orden por precio, fecha y puntaje (escenarios 7–8; SC-002). CU-03 y CU-11 completos.
3. + US4 → favoritos con corazón y pestaña (escenarios 10–13, 16; SC-004).
4. Polish (T054–T060).

### Notas

- Cada ⛔ GATE es una parada real: se muestran las pruebas al usuario y no se implementa hasta su aprobación (principio 2).
- Sin cambios en `backend/` ni en `frontend/src/navegacion/reglas.js`: las rutas y el acceso son los de 003.
- Commit al cerrar cada fase (tras lint y format).
