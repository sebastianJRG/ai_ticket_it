---

description: "Lista de tareas: Eventos del organizador (crear evento, mis eventos, compras y disponibilidad, acciones de estado, mensajes)"
---

# Tasks: Eventos del organizador

**Input**: Documentos de diseño en `/specs/007-organizador-eventos/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/pantallas.md](./contracts/pantallas.md), [contracts/componentes.md](./contracts/componentes.md), [quickstart.md](./quickstart.md)

**Tests**: OBLIGATORIOS. La constitución (principio 2) y FR-008 exigen TDD. El ciclo es:

1. Escribir la prueba.
2. **El usuario la aprueba.**
3. Correrla y verla fallar (rojo).
4. Implementar lo mínimo.
5. Refactorizar.

Cada fase tiene una tarea de aprobación explícita (⛔ GATE). No se implementa nada de esa fase antes de esa aprobación.

**Organization**: tareas agrupadas por historia de usuario. Las rutas son relativas a la raíz del repo y los comandos de Jest se corren desde `frontend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin depender de tareas incompletas).
- **[Story]**: historia de usuario a la que pertenece (US1–US5).

## Convenciones para todas las tareas

- **Documentación (principio 6, FR-008)**: cada archivo nuevo o modificado en `frontend/src/` lleva docstring de archivo (`@file`, `@owner Equipo Al Ticket It — frontend`, `@license MIT`). Cada export lleva JSDoc completo: `@param` con tipo, `@returns`, `@throws`, y `@typedef` con `@property` para props y formas. `npm run lint` lo verifica.
- **Estilos**:
  - Colores, tipografías, tamaños, radios y duraciones salen de `useTheme()` (`frontend/src/theme/ThemeContext.jsx`); los estados usan `theme.purchaseStatus`.
  - Íconos con `frontend/src/components/Icon.jsx`.
  - Precios y fechas con `frontend/src/theme/format.js` (`formatPrice`, `formatDate`).
  - Nada de `fontWeight` (design-system/docs/react-native.md).
  - Áreas táctiles de al menos `sizes.touchMin` (44).
- **Render en pruebas**:
  - Componentes con `renderConTema` (`frontend/__tests__/helpers/renderConTema.jsx`), en `scheme="dark"` y `scheme="light"`.
  - Pantallas con `renderRouter` de `expo-router/testing-library`, como `frontend/__tests__/screens/mis-compras-test.jsx`.
- **Simulaciones en pruebas**:
  - Servicios con `jest.mock` de `frontend/src/services/eventoService`, `categoriaService` y `compraService`.
  - Sesión con `crearAuthFalso` y `ORGANIZADOR` (`id: 'u-organizador'`) / `COMPRADOR` (`frontend/__tests__/helpers/authFalso.js`).
  - Tiempo con `AHORA` de `frontend/__tests__/helpers/eventosEjemplo.js`.
  - Orden de respuestas y estado "en curso" con `diferido` (`frontend/__tests__/helpers/diferido.js`).
  - Nunca se llama a la red real.
- **Arquitectura (principio 1)**: los componentes de `frontend/src/components/` son presentacionales: no importan servicios, hooks de datos ni contextos de sesión o toast.
- **Estados (principio 4, research R11)**: el cliente **no transiciona** `EstadoCompra` ni recalcula la disponibilidad. Pide la acción y recarga `GET /api/eventos/:id/compras`, sin actualización optimista.
- **Alcance**: **sin cambios en `backend/`** ni dependencias nuevas.
- **Textos**: los textos visibles van en español rioplatense y exactamente como figuran en [contracts/pantallas.md](./contracts/pantallas.md), [data-model.md](./data-model.md) y [research.md](./research.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: datos de ejemplo de eventos propios y de compras del organizador.

- [X] T001 [P] Ampliar `frontend/__tests__/helpers/eventosEjemplo.js` sin romper sus exports actuales:
  - Agregar `crearEventoDe(organizador, parcial)`, que llama a `crearEvento` con `organizador` pisado.
  - Agregar `EVENTOS_ORGANIZADOR`, relativos a `AHORA`:
    - 2 eventos futuros de `{ id: 'u-organizador', … }`, con fechas desordenadas.
    - 2 eventos pasados de ese mismo organizador.
    - 2 eventos de otro organizador (`org-1`).
- [X] T002 [P] Ampliar `frontend/__tests__/helpers/comprasEjemplo.js` sin romper sus exports actuales:
  - Agregar `crearCompraOrganizador(parcial)`, con la forma de [data-model.md §1 › Compra del organizador](./data-model.md#1-entidades-de-la-api-sin-cambios) (`comprador` `{ id, nombre, apellido }`, `evento`, `tipoEntrada`, `cantidad`, `total`, `estado`, sin `diasRestantes`) e IDs secuenciales.
  - Agregar `COMPRAS_ORGANIZADOR`: 6 compras en orden de creación (2 PENDIENTE, 1 CONFIRMADA, 1 UTILIZADA, 1 CANCELADA y 1 REEMBOLSADA → Pendientes 2, Confirmadas 1, Utilizadas 1, Canceladas 2).
  - Agregar `DISPONIBILIDAD_EJEMPLO`, con la forma de [data-model.md §1 › DisponibilidadTipo](./data-model.md#1-entidades-de-la-api-sin-cambios), con tres tipos:
    - General: `cupo: 100`, `vendidas: 89`.
    - Platea: `cupo: 100`, `vendidas: 90`.
    - VIP: `cupo: 20`, `vendidas: 20`, `disponibles: 0`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: rutas nuevas y acceso del organizador en `reglas.js`, que usan US1 (navegar tras publicar), US2, US3 y US5.

**⚠️ CRITICAL**: ninguna historia empieza hasta completar esta fase.

### Pruebas (escribir primero)

- [X] T003 Ampliar `frontend/__tests__/navegacion/reglas-test.js` según [contracts/pantallas.md › Rutas y acceso](./contracts/pantallas.md#rutas-y-acceso):
  - **Hrefs**:
    - `hrefComprasEvento('a b')` → `/evento/a%20b/compras`.
    - `hrefCompra('c1')` → `/compra/c1` (sin cambios).
    - `hrefCompra('c 1', { eventoId: 'e/1' })` → `/compra/c%201?evento=e%2F1`.
  - **`decidirAcceso` para `/evento/x/compras`** (también con `?q=` y barra final):
    - visitante → `redirigir('/login?volverA=%2Fevento%2Fx%2Fcompras')`;
    - ORGANIZADOR → `permitir`;
    - COMPRADOR → `redirigir('/evento/x')`.
  - **`decidirAcceso` para `/compra/x`**: ORGANIZADOR → `permitir` (cambia respecto de 006); visitante y COMPRADOR sin cambios.
  - **Rutas existentes**: `/evento/x` y `/evento/x/comprar` mantienen su comportamiento.
  - **`destinoTrasLogin`**:
    - `(ORGANIZADOR, '/evento/x/compras')` → `'/evento/x/compras'`;
    - `(COMPRADOR, '/evento/x/compras')` → `'/explorar'`;
    - `(ORGANIZADOR, '/compra/x?evento=e1')` → `'/compra/x?evento=e1'`.
- [X] T004 ⛔ GATE: presentar T003 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/navegacion/reglas-test.js` y confirmar que las pruebas nuevas fallan (rojo).

### Implementación

- [X] T005 Modificar `frontend/src/navegacion/reglas.js` de forma aditiva (research R1):
  - Agregar el export `hrefComprasEvento(idEvento)`.
  - Agregar el segundo parámetro opcional `{ eventoId }` a `hrefCompra`, con `encodeURIComponent`.
  - Agregar la rama `COMPRAS_EVENTO = /^\/evento\/([^/]+)\/compras$/`, evaluada **antes** de `DETALLE_EVENTO`: visitante → `hrefLogin(r)`; ORGANIZADOR → permitir; COMPRADOR → `/evento/<id>`.
  - Cambiar la rama `DETALLE_COMPRA` para que el ORGANIZADOR → permitir.
  - Actualizar el docstring de archivo para citar esta feature.
- [X] T006 Correr `npx jest __tests__/navegacion` y confirmar verde, sin regresiones de 003, 005 y 006. Si `__tests__/screens/detalle-compra-test.jsx` esperaba la redirección del organizador, ajustar esa prueba al nuevo contrato y dejarlo anotado.

**Checkpoint**: rutas listas. Las historias pueden empezar en paralelo.

---

## Phase 3: User Story 1 - Crear un evento con varios tipos de entrada (Priority: P1) — CU-04 🎯 MVP

**Goal**: el organizador completa el formulario (imágenes por URL, nombre, categoría con alta rápida, fecha y hora, descripción y tipos de entrada repetibles) con las mismas validaciones del servidor, y publica con una sola petición.

**Independent Test**: completar un evento con 2 tipos de entrada y publicar llama a `crearEvento` una vez con el cuerpo exacto, muestra el toast "Evento publicado" y navega a `/evento/<id>/compras`. Con un 400, el formulario conserva todo (quickstart, escenarios 3–8).

### Pruebas (escribir primero)

- [X] T007 [P] [US1] Escribir `frontend/__tests__/eventos/formularioEvento-test.js` según [data-model.md §2](./data-model.md#2-borrador-del-formulario-eventosformularioeventojs) y [research.md R4–R7](./research.md#r5-validación-del-formulario-igual-a-la-del-servidor), con `ahora = AHORA`:
  - **Borrador inicial**: `borradorInicial()` trae 1 tipo vacío.
  - **Tipos de entrada**:
    - `agregarTipo` agrega con una `clave` nueva que no repite las anteriores.
    - Agregar un tercero y quitar el segundo deja las claves 1.ª y 3.ª (US1-1).
    - `quitarTipo` sobre el único tipo devuelve el mismo borrador.
  - **Imágenes**: `agregarImagen` no pasa de `MAX_IMAGENES` (5).
  - **Máscaras**:
    - `enmascararFecha('20122026')` → `'20/12/2026'`.
    - `enmascararHora('2130')` → `'21:30'`.
  - **`aFechaLocal`**:
    - `('20/12/2026', '21:30')` → el `Date` local correspondiente.
    - `('31/02/2027', '10:00')` → `null`.
    - `('2026-12-20', '10:00')` → `null`.
  - **`aNumeroPrecio`**:
    - `'0'` → 0; `'1500,50'` → 1500.5; `'1500.50'` → 1500.5.
    - `'-1'` → -1 (lo rechaza el validador).
    - `'abc'` → `null`; `'1.500,00'` → `null`.
    - `'1.500'` → `null` (punto de miles: nunca se interpreta como 1,5); `'1500,505'` → `null` (más de 2 decimales).
    - Con `null`, `validarCampo` devuelve "Escribí el precio solo con números, sin puntos de miles (por ejemplo 1500 o 1500,50)."
  - **`validarCampo` (tabla de paridad con `backend/src/dto/evento.js`)**, cada caso con el mensaje exacto de research R5:
    - nombre y descripción vacíos o con solo espacios;
    - sin categoría;
    - fecha con formato malo, fecha inexistente, fecha igual a `ahora` y fecha pasada;
    - hora con formato malo;
    - tipo con nombre o descripción vacíos;
    - precio vacío, negativo y `0` (válido);
    - cupo `0`, `1,5`, `abc` y `1` (válido);
    - URL `ftp://x` inválida y URL vacía ignorada.
  - **`validarFormulario`**: con un borrador válido → `{ valido: true, errores: {} }`; con varios errores → todas las rutas (`tiposEntrada.<clave>.precio`, etc.).
  - **`aCuerpoEvento`**:
    - aplica trim a los textos y convierte precio y cupo a números;
    - `fecha` termina en `Z` y equivale a la fecha local;
    - omite las URLs vacías;
    - nunca incluye `organizadorId` ni `clave`.
  - **`mensajeErrorPublicar`**: para 400 (con el mensaje del servidor), 404, 0 y genérico.
  - **`validarCategoria`**: nombre y descripción vacíos.
- [X] T008 [P] [US1] Escribir `frontend/__tests__/components/Select-test.jsx` según [contracts/componentes.md › Select](./contracts/componentes.md#select-nuevo-doc-design-systemdocscomponentesselectmd):
  - **Campo cerrado**: muestra `label`, el `placeholder` o la etiqueta de la opción elegida, y el `error`.
  - **Accesibilidad**: el campo tiene `accessibilityRole="button"` y la etiqueta "Categoría, Teatro". Las opciones tienen `accessibilityRole="radio"` y `checked` según `valor`.
  - **Interacción**:
    - tocar el campo llama a `alAbrir`;
    - con `abierto` se ven las opciones y el `pie`;
    - tocar una opción llama a `alElegir(clave)`;
    - con `children` se muestra ese contenido en lugar de la lista.
  - **Tema**: dark y light.
- [X] T009 [P] [US1] Escribir `frontend/__tests__/components/TicketTypeForm-test.jsx` según [contracts/componentes.md › TicketTypeForm](./contracts/componentes.md#tickettypeform-nuevo-doc-tickettypeformmd):
  - **Contenido**:
    - "Tipo de entrada 2";
    - los 4 campos con sus valores;
    - el precio con prefijo `$` y la ayuda "0 = gratis";
    - los errores por campo.
  - **Callbacks**: cambiar el texto llama a `alCambiar('precio', '100')`; perder el foco llama a `alPerderFoco('cupo')`.
  - **Papelera**: solo aparece con `quitable`, tiene la etiqueta "Quitar tipo de entrada 2" y llama a `alQuitar`.
  - **Tema**: dark y light.
- [X] T010 [P] [US1] Escribir `frontend/__tests__/components/AgregarTipoEntrada-test.jsx`:
  - muestra el texto "Agregar tipo de entrada" y tiene `accessibilityRole="button"`;
  - llama a `alPresionar`, y no lo llama con `disabled`;
  - tema dark y light.
- [X] T011 [P] [US1] Escribir `frontend/__tests__/hooks/useCrearEvento-test.jsx` y `frontend/__tests__/hooks/useCrearCategoria-test.jsx` con `renderHook`, según [data-model.md §5](./data-model.md#5-estados-de-los-hooks):
  - el éxito resuelve `{ ok: true, evento | categoria }`;
  - el error resuelve `{ ok: false, error }` y nunca lanza;
  - con `diferido`, una segunda llamada en curso no llama otra vez al servicio y `enviando` es `true`;
  - nada se actualiza tras desmontar.
- [X] T012 [P] [US1] Ampliar `frontend/__tests__/hooks/useCategorias-test.jsx` sin cambiar los casos existentes:
  - `agregar(categoria)` la suma al final y no la duplica si ya existe el mismo `id`;
  - `recargar()` vuelve a pedir `listarCategorias`.
- [X] T013 [P] [US1] Escribir `frontend/__tests__/eventos/SelectorCategoria-test.jsx`, con `categoriaService` simulado y `ToastProvider`, según [contracts/pantallas.md › Selector de categoría](./contracts/pantallas.md#organizadorcrear--crear-evento-us1):
  - **Lista**: abre el sheet con las categorías y "+ Crear categoría"; elegir una llama a `alElegir(id)` y cierra el sheet.
  - **Alta exitosa**: "+ Crear categoría" muestra el formulario de alta. Con nombre y descripción, "Crear y elegir" llama a `crearCategoria({ nombre, descripcion })` con trim, y con 201 se agrega a la lista, llama a `alElegir(nuevaId)` y muestra el toast "Categoría creada" (US1-4).
  - **Validación previa**: con campos vacíos se ven los errores de `validarCategoria` y no se llama al servicio.
  - **Error del servidor**: con 400, el mensaje del servidor queda dentro del sheet y se conserva lo escrito.
  - **Sin categorías**: solo se ve "+ Crear categoría" y la ayuda "Todavía no hay categorías".
- [X] T014 [US1] Escribir `frontend/__tests__/screens/crear-evento-test.jsx` con `renderRouter`, `ORGANIZADOR` y servicios simulados, según [contracts/pantallas.md › /organizador/crear](./contracts/pantallas.md#organizadorcrear--crear-evento-us1):
  - **Estructura**: se ven todas las secciones y "Publicar evento".
  - **Tipos de entrada (US1-1)**: agregar 2 tipos y quitar el 2.º deja "Tipo de entrada 1" y "Tipo de entrada 2"; el primero no tiene papelera.
  - **Confirmación al quitar**: quitar un tipo con datos abre el `Modal` "¿Quitar «VIP»?", con el cuerpo "Se borran los datos cargados de este tipo de entrada." y los botones "Sí, quitar" y "Volver". "Volver" lo conserva. Un tipo vacío se quita sin diálogo.
  - **Validación (US1-2)**:
    - perder el foco del nombre vacío muestra el error de ese campo solamente;
    - "Publicar" con errores los marca todos y no llama a `crearEvento`.
  - **Publicación (US1-3)**: con datos válidos, "Publicar" llama a `crearEvento` una vez con el cuerpo de `aCuerpoEvento`. Con 201: toast "Evento publicado" y navegación a `/evento/<id>/compras`.
  - **Doble toque**: con `diferido`, un doble toque genera una sola llamada.
  - **Errores (US1-5)**:
    - 400 → banner con el mensaje del servidor y los campos conservan lo escrito;
    - 404 → banner de categoría inexistente, categoría limpiada y `listarCategorias` pedida otra vez;
    - 0 → "Sin conexión. Tus datos siguen acá.".
- [X] T015 [US1] ⛔ GATE: presentar T007–T014 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/eventos/formularioEvento-test.js __tests__/eventos/SelectorCategoria-test.jsx __tests__/components/Select-test.jsx __tests__/components/TicketTypeForm-test.jsx __tests__/components/AgregarTipoEntrada-test.jsx __tests__/hooks/useCrearEvento-test.jsx __tests__/hooks/useCrearCategoria-test.jsx __tests__/hooks/useCategorias-test.jsx __tests__/screens/crear-evento-test.jsx` y confirmar que fallan (rojo).

### Implementación

- [X] T016 [P] [US1] Crear `frontend/src/eventos/formularioEvento.js` (puro), con todos los exports de [contracts/componentes.md › formularioEvento](./contracts/componentes.md#srceventosformularioeventojs-nuevo).
  - **Typedefs**: `BorradorEvento` y `TipoEntradaBorrador`.
  - **Restricciones citadas**, de data-model.md §2:
    - `BorradorEvento.nombre`, `BorradorEvento.descripcion`, `BorradorEvento.categoriaId`, `BorradorEvento.fecha`, `BorradorEvento.hora`;
    - `BorradorEvento.multimedia` (máx. 5);
    - `BorradorEvento.tiposEntrada` (mín. 1);
    - `TipoEntradaBorrador.clave` (estable, nunca se reutiliza);
    - `TipoEntradaBorrador.nombre`, `TipoEntradaBorrador.descripcion`, `TipoEntradaBorrador.precio`, `TipoEntradaBorrador.cupo`.
  - **Restricciones citadas**, de data-model.md §1 (usadas por `validarCategoria`): `Categoría.nombre` y `Categoría.descripcion`.
  - **Reglas y mensajes**: research R5. El formato de `TipoEntradaBorrador.precio` se describe en `aNumeroPrecio` (data-model §2).
  - **Restricción propia de esta tarea**: las URLs no vacías deben empezar con `http://` o `https://` (research R7). Es más estricta que el servidor y es deliberada.
- [X] T017 [P] [US1] Crear `frontend/src/components/Select.jsx` (presentacional), con la misma altura y estilo que `TextField` y las opciones en `frontend/src/components/BottomSheet.jsx`. La opción elegida usa `primary-soft`/`primary-text` y check (design-system/docs/componentes/Select.md, research R8).
- [X] T018 [P] [US1] Crear `frontend/src/components/TicketTypeForm.jsx` (presentacional), que usa `TextField` e `IconButton` (design-system/docs/componentes/TicketTypeForm.md, research R6). Los placeholders son General, Platea o VIP según `numero`.
- [X] T019 [P] [US1] Crear `frontend/src/components/AgregarTipoEntrada.jsx` (presentacional): borde punteado `border` con ícono `Plus`.
- [X] T020 [P] [US1] Crear `frontend/src/hooks/useCrearEvento.js` sobre `crearEvento` y `frontend/src/hooks/useCrearCategoria.js` sobre `crearCategoria`, con una ref síncrona para que haya una sola petición en curso (patrón de `frontend/src/hooks/useCrearCompra.js`, research R13).
- [X] T021 [P] [US1] Ampliar `frontend/src/hooks/useCategorias.js` con `agregar(categoria)` y `recargar()`, de forma aditiva: `categorias` no cambia y no se rompen sus consumidores de 004 (research R8).
- [X] T022 [US1] Crear `frontend/src/eventos/SelectorCategoria.jsx` (compuesto). Usa `useCategorias`, `useCrearCategoria`, `useToast()`, `Select`, `TextField` y `Button`, con los modos `lista` y `alta` y `validarCategoria` (contracts/componentes.md › SelectorCategoria). Depende de T016, T017, T020 y T021.
- [X] T023 [US1] Reemplazar `frontend/src/app/organizador/crear.jsx` (deja de usar `PantallaProvisoria`):
  - **Estado**: `useReducer` sobre las funciones puras de `formularioEvento.js`, con `tocados` y errores por campo.
  - **Validación**: al perder el foco, solo el campo tocado; al publicar, todo, y scroll al primer error.
  - **Imágenes**: vista previa de la portada con `expo-image`, y `ArteCategoria` si la imagen falla.
  - **Contenedores**: `KeyboardAvoidingView` + `ScrollView`.
  - **Barra**: `BarraAccion` con "Publicar evento" y `loading`.
  - **Componentes y hooks**: `TicketTypeForm`, `AgregarTipoEntrada` y `Modal` (confirmar el borrado de un tipo con datos); `useCrearEvento`, `useToast()`, `router.push(hrefComprasEvento(id))` y el banner de error con `mensajeErrorPublicar`.
  - Depende de T005, T016–T022.
- [X] T024 [US1] Correr la misma lista de pruebas de T015 y confirmar verde.

**Checkpoint**: US1 funcional. Un organizador ya puede publicar eventos.

---

## Phase 4: User Story 2 - Ver mis eventos (Priority: P1)

**Goal**: el organizador ve solo sus eventos, primero los próximos y después los finalizados, y entra a las compras de cada uno.

**Independent Test**: con `EVENTOS_ORGANIZADOR`, la pantalla muestra los 4 propios en dos secciones y oculta los 2 ajenos. Sin eventos, muestra el estado vacío con "Crear evento" (quickstart, escenarios 1–2).

### Pruebas (escribir primero)

- [X] T025 [P] [US2] Escribir `frontend/__tests__/eventos/misEventos-test.js` según [data-model.md §3](./data-model.md#3-mis-eventos-eventosmiseventosjs):
  - `separarMisEventos(EVENTOS_ORGANIZADOR, 'u-organizador', AHORA)` deja afuera los de `org-1`;
  - `proximos` va por fecha ascendente y `finalizados` por fecha descendente;
  - un evento con fecha igual a `AHORA` cuenta como finalizado;
  - una fecha inválida va a finalizados;
  - una entrada `null`, o sin `organizador`, no lanza.
- [X] T026 [P] [US2] Escribir `frontend/__tests__/hooks/useMisEventos-test.jsx`, con `listarEventos` y `useAuth` simulados, según [data-model.md §5](./data-model.md#5-estados-de-los-hooks):
  - pide `listarEventos({ sortBy: 'fecha', order: 'asc' })` una vez al montar;
  - expone `proximos` y `finalizados` del usuario de la sesión;
  - un error sin datos expone `error`;
  - `recargar()`, si falla, conserva los datos;
  - con `diferido`, una respuesta vieja se ignora;
  - nada se actualiza tras desmontar.
- [X] T027 [US2] Escribir `frontend/__tests__/screens/mis-eventos-test.jsx` con `renderRouter` y `ORGANIZADOR`, según [contracts/pantallas.md › /organizador/eventos](./contracts/pantallas.md#organizadoreventos--mis-eventos-us2):
  - **Contenido (US2-1)**: se ven los encabezados "Próximos" y "Finalizados", las tarjetas propias y el rótulo "Finalizado". No se ven los eventos ajenos ni el corazón de favorito.
  - **Navegación**: tocar una tarjeta lleva a `/evento/<id>/compras`; la acción "Crear" del header lleva a `/organizador/crear`.
  - **Vacío (US2-2)**: "Todavía no creaste eventos", con "Crear evento" que lleva a `/organizador/crear`.
  - **Solo finalizados**: no hay sección "Próximos".
  - **Errores**: sin datos, `EmptyState` con "Reintentar"; con datos, la lista sigue visible y aparece un toast.
  - **Carga**: esqueletos mientras carga.
- [X] T028 [US2] ⛔ GATE: presentar T025–T027 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/eventos/misEventos-test.js __tests__/hooks/useMisEventos-test.jsx __tests__/screens/mis-eventos-test.jsx` y confirmar que fallan (rojo).

### Implementación

- [X] T029 [P] [US2] Crear `frontend/src/eventos/misEventos.js` (puro), con `separarMisEventos` según [data-model.md §3](./data-model.md#3-mis-eventos-eventosmiseventosjs). Filtra por `Evento.organizador` (`organizador.id`) y separa por `Evento.fecha` (data-model §1). Ver research R2.
- [X] T030 [US2] Crear `frontend/src/hooks/useMisEventos.js` sobre `listarEventos`, con `useAuth().usuario.id`, `separarMisEventos` y un contador de petición para descartar respuestas viejas (patrón de `frontend/src/hooks/useEventos.js`). Depende de T029.
- [X] T031 [US2] Reemplazar `frontend/src/app/organizador/eventos.jsx`:
  - **Estructura**: `AppHeader` grande con la acción "Crear" y una `SectionList` (o `ScrollView`) con "Próximos" y "Finalizados".
  - **Tarjetas**: `EventCard` `compact` sin `favorito`, que llevan a `router.push(hrefComprasEvento(id))`.
  - **Recarga**: con `RefreshControl` y al enfocar (`useFocusEffect`).
  - **Estados**: `EsqueletosEventos`, `EmptyState` y `mensajeError` (research R3).
  - Depende de T005 y T030.
- [X] T032 [US2] Correr las pruebas de T028 y confirmar verde.

**Checkpoint**: US1 y US2 funcionan juntas: el evento publicado aparece en Mis eventos.

---

## Phase 5: User Story 3 - Ver compras y disponibilidad de un evento (Priority: P1) — CU-02

**Goal**: en `/evento/[idEvento]/compras`, el organizador ve la disponibilidad por tipo que informa el servidor y las compras por estado, en pestañas con contadores.

**Independent Test**: con `COMPRAS_ORGANIZADOR` y `DISPONIBILIDAD_EJEMPLO`, la pantalla muestra los contadores Pendientes 2, Confirmadas 1, Utilizadas 1 y Canceladas 2, y los números exactos del servidor. Un 403 muestra "No tenés acceso a este evento" (quickstart, escenarios 9 y 13).

### Pruebas (escribir primero)

- [X] T033 [P] [US3] Escribir `frontend/__tests__/compras/gestionCompras-test.js` (parte de lectura), según [data-model.md §4](./data-model.md#4-gestión-de-compras-comprasgestioncomprasjs):
  - **Pestañas**: `PESTANAS_ORGANIZADOR` tiene 4 claves y etiquetas, en orden.
  - **`agruparPorEstado(COMPRAS_ORGANIZADOR)`**: cada estado cae en su pestaña (CANCELADA y REEMBOLSADA en `canceladas`), la más reciente va primero y un estado desconocido se ignora.
  - **`resumenDisponibilidad(DISPONIBILIDAD_EJEMPLO)`**:
    - totales y porcentaje redondeado hacia abajo;
    - General 89% → `normal`, Platea 90% → `casi`, VIP → `agotado` con "Agotado";
    - "Quedan 11";
    - con `cupo: 0` no divide por cero.
  - **`nombreComprador`**: devuelve "Ana García", o "Comprador" si falta.
- [X] T034 [P] [US3] Escribir `frontend/__tests__/components/AvailabilitySummary-test.jsx` según [contracts/componentes.md › AvailabilitySummary](./contracts/componentes.md#availabilitysummary-nuevo-doc-availabilitysummarymd):
  - **Contenido**: el encabezado de totales y, por tipo, nombre, precio formateado, "89 / 100" y "Quedan 11" / "Agotado".
  - **Accesibilidad**: cada barra tiene `accessibilityRole="progressbar"` con `accessibilityValue` `{ min: 0, max: cupo, now: vendidas }` y la etiqueta "Platea: 90 de 100 vendidas, quedan 10".
  - **Tema**: dark y light.
- [X] T035 [P] [US3] Escribir `frontend/__tests__/components/OrganizerPurchaseRow-test.jsx` (parte de presentación), según [contracts/componentes.md › OrganizerPurchaseRow](./contracts/componentes.md#organizerpurchaserow-nuevo-doc-organizerpurchaserowmd):
  - **Contenido**: el nombre del comprador, "2 × Platea · $ 80.000" y `StatusBadge` con el texto corto del estado.
  - **Sin acciones**: sin `acciones` no hay botones.
  - **Navegación**: tocar la fila llama a `alPresionar`.
  - **Tamaño**: la altura mínima es 72.
  - **Tema**: dark y light.
- [X] T036 [P] [US3] Escribir `frontend/__tests__/hooks/useComprasEvento-test.jsx`, con `obtenerComprasEvento` simulado:
  - pide una vez con el ID al montar;
  - con ID vacío (`undefined`, `null` o `''`) no llama al servicio y queda en `{ datos: null, cargando: false, error: null }`;
  - el éxito expone `datos: { compras, disponibilidad }`;
  - un 403 expone `error.status === 403` con `datos` `null`;
  - `recargar()` devuelve una promesa y, si falla con datos, los conserva;
  - con `diferido`, una respuesta vieja se ignora;
  - nada se actualiza tras desmontar.
- [X] T037 [US3] Escribir `frontend/__tests__/screens/compras-evento-test.jsx` con `renderRouter` en `/evento/ev-1/compras`, `ORGANIZADOR` y `obtenerComprasEvento` + `obtenerEvento` simulados, según [contracts/pantallas.md › /evento/[idEvento]/compras](./contracts/pantallas.md#eventoideventocompras--compras-del-evento-us3-us4):
  - **Encabezado**: nombre y fecha del evento.
  - **Disponibilidad (US3-1)**: `AvailabilitySummary` con los números del servidor.
  - **Pestañas**: `Tabs` con "Pendientes, 2", "Confirmadas, 1", "Utilizadas, 1" y "Canceladas, 2"; la inicial es Pendientes.
  - **Cambio de pestaña (US3-2)**: al cambiar, se ven las filas del estado, con comprador, tipo, cantidad, total y badge.
  - **Pestaña vacía**: muestra su texto.
  - **Sin compras**: el resumen sigue visible y aparece "Todavía no hay compras".
  - **Navegación**: tocar una fila lleva a `/compra/<id>?evento=ev-1`.
  - **Errores**:
    - 403 → "No tenés acceso a este evento" con "Ver mis eventos" (US3-3);
    - 404 → "Este evento no existe";
    - otro → "Reintentar".
  - **Respaldo**: si `obtenerEvento` falla, el título sale de `compras[0].evento.nombre`.
  - **Acceso**: un COMPRADOR es redirigido a `/evento/ev-1`.
- [X] T038 [US3] ⛔ GATE: presentar T033–T037 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/compras/gestionCompras-test.js __tests__/components/AvailabilitySummary-test.jsx __tests__/components/OrganizerPurchaseRow-test.jsx __tests__/hooks/useComprasEvento-test.jsx __tests__/screens/compras-evento-test.jsx` y confirmar que fallan (rojo).

### Implementación

- [X] T039 [P] [US3] Crear `frontend/src/compras/gestionCompras.js` (puro) con `PESTANAS_ORGANIZADOR`, `agruparPorEstado`, `resumenDisponibilidad` y `nombreComprador`.
  - **Restricciones citadas**: `PestanaOrganizador.clave` y sus estados (data-model §4), `Compra del organizador.estado` (data-model §1), y `DisponibilidadTipo.cupo`, `DisponibilidadTipo.vendidas` y `DisponibilidadTipo.disponibles` (data-model §1), y `ResumenDisponibilidad.porcentaje`, `ResumenDisponibilidad.nivel` y `ResumenDisponibilidad.textoRestantes` (data-model §4 › ResumenDisponibilidad).
  - **Typedefs**: `ResumenDisponibilidad` y `PestanaOrganizador`.
  - **Fuente de los números**: siempre se usan los del servidor y nunca se recalculan las vendidas (research R10, SC-003).
- [X] T040 [P] [US3] Crear `frontend/src/components/AvailabilitySummary.jsx` (presentacional), con colores por nivel `primary` / `secondary` / `status-used` (design-system/docs/componentes/AvailabilitySummary.md).
- [X] T041 [P] [US3] Crear `frontend/src/components/OrganizerPurchaseRow.jsx` (presentacional). Por ahora solo la presentación y `alPresionar`, con `Avatar` 40, `StatusBadge` `size="sm"` y un divisor `border`. Sin antigüedad ni pill de no leídos (research R11).
- [X] T042 [P] [US3] Crear `frontend/src/hooks/useComprasEvento.js` sobre `obtenerComprasEvento`, con un contador de petición para descartar respuestas viejas y `recargar` que devuelve una promesa. Con `idEvento` vacío no pide nada (data-model §5, research R9 y R10).
- [X] T043 [US3] Crear `frontend/src/app/evento/[idEvento]/compras.jsx`:
  - **Acceso y datos**: envuelto en `RutaProtegida`; usa `useComprasEvento` y `useEvento` en paralelo.
  - **Encabezado**: `AppHeader` con volver (a `/organizador/eventos` si `!useCanGoBack()`), el nombre del evento y la fecha larga; rótulo "Finalizado" si ya ocurrió.
  - **Contenido**: `AvailabilitySummary`, `Tabs` `underline` con contadores y la lista de `OrganizerPurchaseRow`, cuyas filas llevan a `router.push(hrefCompra(id, { eventoId }))`.
  - **Recarga**: con `RefreshControl` y al enfocar.
  - **Estados**: los de 403, 404 y error con `EmptyState`.
  - Depende de T005, T039–T042.
- [X] T044 [US3] Correr las pruebas de T038 y confirmar verde.

**Checkpoint**: CU-02 cubierto. Tras publicar (US1), la navegación lleva a una pantalla real.

---

## Phase 6: User Story 4 - Gestionar el estado de una compra (Priority: P2) — CU-08

**Goal**: desde las compras del evento, el organizador confirma, reembolsa o cancela según las transiciones permitidas y solo con el evento futuro. Reembolsar y cancelar piden confirmación destructiva. Tras cada acción, todo se recarga desde el servidor.

**Independent Test**: confirmar una compra PENDIENTE llama a `confirmarCompra` una vez, muestra el toast "Compra confirmada" y recarga: la compra pasa a Confirmadas y la disponibilidad se actualiza (quickstart, escenarios 10–12 y 16).

### Pruebas (escribir primero)

- [X] T045 [US4] Ampliar `frontend/__tests__/compras/gestionCompras-test.js` (parte de acciones):
  - **Matriz completa de `accionesDisponibles`**: 5 estados × evento futuro / evento pasado / fecha igual a `AHORA` / fecha inválida, que debe coincidir exactamente con la tabla de [data-model.md §4 › AccionCompra](./data-model.md#4-gestión-de-compras-comprasgestioncomprasjs) (SC-004).
  - **`cuerpoAccion`**:
    - `cuerpoAccion('reembolsar', compra)` → "Vas a reembolsar 2 × Platea a Ana García por $ 80.000. No se puede deshacer.";
    - `cuerpoAccion('cancelar', compra)` → "Vas a cancelar 2 × Platea de Ana García por $ 80.000. Se libera el cupo y no se puede deshacer.".
  - **`mensajeErrorAccion`**: para las 3 acciones con 400 (incluye el mensaje del servidor), 403, 404, 0 y genérico.
- [X] T046 [P] [US4] Ampliar `frontend/__tests__/components/OrganizerPurchaseRow-test.jsx` (parte de acciones):
  - **Botones**: con `acciones=['confirmar','cancelar']` se ven "Confirmar" y "Cancelar"; con `['reembolsar','cancelar']`, "Reembolsar" y "Cancelar".
  - **Callbacks**: tocar un botón llama a `alAccion('confirmar')` y **no** a `alPresionar`.
  - **En curso**: con `enCurso='confirmar'`, ese botón está en `loading`.
  - **Deshabilitada**: con `deshabilitada`, todos los botones están deshabilitados.
- [X] T047 [P] [US4] Escribir `frontend/__tests__/hooks/useAccionCompra-test.jsx`, con `confirmarCompra`, `reembolsarCompra` y `cancelarCompra` simulados:
  - `ejecutar('confirmar', compra)` llama al servicio correcto con `compra.id`, y lo mismo para las otras dos acciones;
  - `enCurso` vale `{ accion, idCompra }` mientras está pendiente y `null` al terminar;
  - con `diferido`, una segunda `ejecutar` (aunque sea sobre otra compra) se ignora;
  - `alTerminar` recibe `{ ok: true, accion, compra }` o `{ ok: false, accion, error }`;
  - nunca lanza;
  - nada se actualiza tras desmontar.
- [X] T048 [P] [US4] Escribir `frontend/__tests__/compras/ConfirmarAccionCompra-test.jsx`:
  - con `pedido` `null` no se ve nada;
  - con `{ accion: 'reembolsar', compra }` se ve "¿Reembolsar esta compra?", con `cuerpoAccion`, "Sí, reembolsar" y "Volver";
  - con `cancelar` se ve "¿Cancelar esta compra?" y "Sí, cancelar compra";
  - `cargando` deshabilita "Volver";
  - los callbacks se llaman.
- [X] T049 [US4] Ampliar `frontend/__tests__/screens/compras-evento-test.jsx` (parte de acciones):
  - **Botones según estado (US4-1, US4-2, US4-3)**:
    - PENDIENTE muestra Confirmar y Cancelar;
    - CONFIRMADA muestra Reembolsar y Cancelar;
    - UTILIZADA, CANCELADA y REEMBOLSADA no muestran botones;
    - con el evento pasado, ninguna fila muestra botones.
  - **Confirmar**: llama a `confirmarCompra` sin abrir el modal. Con 200, aparece el toast "Compra confirmada" y se llama de nuevo a `obtenerComprasEvento`; con la nueva respuesta cambian los contadores y la disponibilidad (US4-5).
  - **Reembolsar (US4-4)**: abre el modal destructivo y "Volver" no llama al servicio. "Sí, reembolsar" llama a `reembolsarCompra`, cierra el modal, muestra el toast "Compra reembolsada" y recarga.
  - **Error**: un 400 en cancelar muestra el toast con `mensajeErrorAccion` y recarga.
  - **En curso**: con `diferido`, mientras una acción está en curso todos los botones quedan deshabilitados y un segundo toque no genera otra llamada.
- [X] T050 [US4] ⛔ GATE: presentar T045–T049 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/compras __tests__/components/OrganizerPurchaseRow-test.jsx __tests__/hooks/useAccionCompra-test.jsx __tests__/screens/compras-evento-test.jsx` y confirmar que las pruebas nuevas fallan (rojo).

### Implementación

- [X] T051 [US4] Agregar `accionesDisponibles`, `cuerpoAccion` y `mensajeErrorAccion` a `frontend/src/compras/gestionCompras.js`, con `@typedef AccionCompra`.
  - **Restricciones citadas**: `AccionCompra` y la tabla de `accionesDisponibles` (data-model §4), y `Compra del organizador.estado` (data-model §1).
  - **Restricción propia de esta tarea**: una fecha inválida o desconocida → `[]` (research R11).
  - Depende de T039.
- [X] T052 [P] [US4] Agregar las props `acciones`, `enCurso`, `deshabilitada` y `alAccion` a `frontend/src/components/OrganizerPurchaseRow.jsx`:
  - **Botones**: `Button` `sm` ("Confirmar" `primary`; "Reembolsar" y "Cancelar" `secondary`), como hermanos del área táctil de la fila.
  - Depende de T041.
- [X] T053 [P] [US4] Crear `frontend/src/hooks/useAccionCompra.js` sobre `confirmarCompra`, `reembolsarCompra` y `cancelarCompra` de `frontend/src/services/compraService.js`:
  - **Concurrencia**: una ref síncrona para que haya una sola petición en toda la pantalla (patrón de `frontend/src/hooks/useCancelarCompra.js`, que no se modifica).
  - **Estado**: `enCurso`.
- [X] T054 [P] [US4] Crear `frontend/src/compras/ConfirmarAccionCompra.jsx` (compuesto sobre `frontend/src/components/Modal.jsx`, `destructivo`), con los títulos y las etiquetas de data-model §4. Depende de T051.
- [X] T055 [US4] Integrar las acciones en `frontend/src/app/evento/[idEvento]/compras.jsx`:
  - **Botones por fila**: `accionesDisponibles(compra, evento.fecha)`. Si falta `useEvento`, la fecha sale de `compras[0].evento.fecha`.
  - **Flujo**: `useAccionCompra` con `alTerminar` que muestra el toast (`useToast()`) y hace `recargar()`. Confirmar se ejecuta directo; reembolsar y cancelar pasan por `ConfirmarAccionCompra` con `cargando`.
  - **Sin optimismo**: no hay actualización optimista.
  - Depende de T043, T051–T054.
- [X] T056 [US4] Correr las pruebas de T050 y confirmar verde.

**Checkpoint**: CU-08 cubierto del lado del organizador.

---

## Phase 7: User Story 5 - Pestaña Mensajes del organizador (Priority: P3) — CU-06

**Goal**: Mensajes lista las compras de los eventos propios agrupadas por evento. Tocar una abre el detalle de compra compartido, en la variante del organizador, con la pestaña Chat (la completa 008).

**Independent Test**: con 2 eventos propios con compras y 1 sin compras, se ven 2 secciones. Tocar una fila navega a `/compra/<id>?evento=<id>`, que muestra la compra, el comprador y las pestañas Detalle/Chat (quickstart, escenario 15).

### Pruebas (escribir primero)

- [X] T057 [P] [US5] Ampliar `frontend/__tests__/compras/gestionCompras-test.js` (parte de Mensajes), con `agruparComprasPorEvento` según [data-model.md §4 › Agrupación de Mensajes](./data-model.md#4-gestión-de-compras-comprasgestioncomprasjs):
  - las secciones siguen el orden de los eventos;
  - las compras van de la más reciente a la más antigua;
  - los eventos sin compras se omiten;
  - un resultado `rejected` suma a `fallidos` y no lanza.
- [X] T058 [P] [US5] Escribir `frontend/__tests__/hooks/useComprasOrganizador-test.jsx`, con `listarEventos`, `obtenerComprasEvento` y `useAuth` simulados:
  - pide las compras solo de los eventos propios, en paralelo;
  - expone `secciones` y `fallidos`;
  - si fallan todas las de compras, expone `error`;
  - `recargar()` vuelve a pedir todo;
  - nada se actualiza tras desmontar.
- [X] T059 [US5] Escribir `frontend/__tests__/screens/mensajes-organizador-test.jsx` con `renderRouter` en `/organizador/mensajes` y `ORGANIZADOR`, según [contracts/pantallas.md › /organizador/mensajes](./contracts/pantallas.md#organizadormensajes--mensajes-us5):
  - **Contenido (US5-1)**: secciones con el nombre del evento y filas con comprador, tipo y estado, sin botones de acción.
  - **Navegación**: tocar una fila lleva a `/compra/<id>?evento=<idEvento>`.
  - **Vacío**: "Todavía no hay compras para conversar".
  - **Fallas parciales**: si falló 1 evento, aparece el aviso "No pudimos cargar las compras de 1 evento" con "Reintentar"; si fallaron 2, "No pudimos cargar las compras de 2 eventos".
  - **Todo falló**: `EmptyState` de error.
- [X] T060 [US5] Ampliar `frontend/__tests__/screens/detalle-compra-test.jsx` (variante organizador), con `ORGANIZADOR` en `/compra/c1?evento=ev-1` y `obtenerComprasEvento` simulado, según [contracts/pantallas.md › /compra/[idCompra]](./contracts/pantallas.md#compraidcompra--detalle-de-compra-mod-variante-organizador):
  - **Datos**: se llama a `obtenerComprasEvento('ev-1')` y **no** a `listarMisCompras`.
  - **Contenido**: `ResumenCompra`, "Comprador: Ana García", `StatusBadge`, `StatusTimeline` y las pestañas Detalle/Chat (Chat provisorio).
  - **Sin acciones**: no se ve "Cancelar compra" ni ninguna otra acción de estado.
  - **Errores**:
    - sin `?evento` → "No encontramos esta compra" con "Ver mis eventos", **sin** llamar a `obtenerComprasEvento`;
    - con un ID de compra que no está en la respuesta → "No encontramos esta compra";
    - 403 → "No tenés acceso a esta compra".
  - **Sin regresiones**: los casos del COMPRADOR de 006 siguen igual.
- [X] T061 [US5] ⛔ GATE: presentar T057–T060 al usuario y esperar su **aprobación**. Después, correr `npx jest __tests__/compras/gestionCompras-test.js __tests__/hooks/useComprasOrganizador-test.jsx __tests__/screens/mensajes-organizador-test.jsx __tests__/screens/detalle-compra-test.jsx` y confirmar que las pruebas nuevas fallan (rojo).

### Implementación

- [X] T062 [US5] Agregar `agruparComprasPorEvento` a `frontend/src/compras/gestionCompras.js`, según data-model §4 › Agrupación de Mensajes (research R12). Depende de T051.
- [X] T063 [US5] Crear `frontend/src/hooks/useComprasOrganizador.js`: reutiliza `useMisEventos` (los próximos y luego los finalizados) y hace `Promise.allSettled` de `obtenerComprasEvento` por evento, con `agruparComprasPorEvento`. Depende de T030 y T062.
- [X] T064 [US5] Reemplazar `frontend/src/app/organizador/mensajes.jsx`:
  - **Estructura**: `AppHeader` grande "Mensajes" y una `SectionList` con encabezados por evento y `OrganizerPurchaseRow` sin `acciones`.
  - **Navegación**: `router.push(hrefCompra(id, { eventoId }))`.
  - **Recarga**: con `RefreshControl` y al enfocar.
  - **Estados**: vacío, aviso de fallas parciales y error.
  - Depende de T005, T041 y T063.
- [X] T065 [US5] Agregar la variante ORGANIZADOR a `frontend/src/app/compra/[idCompra].jsx`, según research R9:
  - **Rol y datos**: el rol se lee con `useAuth()`. El evento sale de `useLocalSearchParams().evento`, y `useComprasEvento(evento)` busca la compra por ID.
  - **Contenido**: el comprador con `nombreComprador`, `StatusBadge` `sm`, `StatusTimeline` y Tabs Detalle/Chat (el mismo Chat provisorio de 006).
  - **Sin acciones**: no hay acciones de estado.
  - **Volver**: a `/organizador/mensajes` si no hay historial.
  - **Sin regresiones**: la variante COMPRADOR no cambia.
  - **Docstring**: actualizarlo.
  - Depende de T005, T039 y T042.
- [X] T066 [US5] Correr las pruebas de T061 y confirmar verde.

**Checkpoint**: las cinco historias funcionan. 008 puede reemplazar la pestaña Chat del detalle compartido.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T067 [P] Revisar el JSDoc y los docstrings de archivo de todos los archivos nuevos o modificados en `frontend/src/` (principio 6):
  - **Typedefs de props**: `@typedef`/`@property` de las props de `Select`, `TicketTypeForm`, `AgregarTipoEntrada`, `AvailabilitySummary`, `OrganizerPurchaseRow`, `SelectorCategoria` y `ConfirmarAccionCompra`.
  - **Typedefs de formas**: `BorradorEvento`, `TipoEntradaBorrador`, `ResumenDisponibilidad`, `PestanaOrganizador`, `AccionCompra` y los estados de los hooks.
  - **`@throws`**: donde corresponda.
  - **Sin JSDoc desactualizado**: en `reglas.js`, `useCategorias.js` ni `compra/[idCompra].jsx`.
- [X] T068 [P] Actualizar `AGENTS.md` › Navigation (Frontend):
  - **Rutas**: agregar `/evento/[idEvento]/compras` (solo ORGANIZADOR; visitante → login con `volverA`; COMPRADOR → detalle), `hrefComprasEvento` y `hrefCompra(id, { eventoId })`.
  - **Acceso del organizador a `/compra/[idCompra]`**: cambiar su línea en el mapa por "abierto al organizador con `?evento=`; Chat provisorio hasta 008".
  - **Pantallas**: describir Mis eventos (filtrado en el cliente), Crear evento (`formularioEvento.js`, `SelectorCategoria`), Compras del evento (`gestionCompras.js`, `useComprasEvento`, `useAccionCompra`, `ConfirmarAccionCompra`) y Mensajes (`useComprasOrganizador`).
  - **Componentes compartidos**: sumar `Select`, `TicketTypeForm`, `AgregarTipoEntrada`, `AvailabilitySummary` y `OrganizerPurchaseRow`.
- [X] T069 [P] Verificar con `grep -r PantallaProvisoria frontend/src` que `organizador/eventos.jsx`, `crear.jsx` y `mensajes.jsx` ya no la importan. Dejar el componente si `organizador/perfil.jsx` u otro todavía lo usa.
- [X] T070 Correr `npm run lint` y `npm run format` desde la raíz y corregir lo que reporten.
- [X] T071 Correr la suite completa con `npm test` en `frontend/`, `npm run test:backend` y `npx expo-doctor` en `frontend/`. Todo tiene que quedar en verde, sin regresiones de 003–006 y sin cambios en `backend/` (`git status backend/` vacío).
- [ ] T072 Ejecutar la validación manual de [quickstart.md](./quickstart.md) (16 escenarios, más el tema oscuro y el lector de pantalla), incluida la medición de SC-001 (menos de 3 minutos), y anotar cualquier desvío.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T001 y T002 son [P].
- **Foundational (Phase 2)**: depende de Setup y bloquea todas las historias (`reglas.js`).
- **US1 (Phase 3)**: depende solo de Foundational. Es el MVP.
- **US2 (Phase 4)**: depende solo de Foundational. Es independiente de US1 (las pruebas usan eventos simulados).
- **US3 (Phase 5)**: depende solo de Foundational.
- **US4 (Phase 6)**: depende de US3. Extiende `gestionCompras.js` (T039 → T051), `OrganizerPurchaseRow.jsx` (T041 → T052) y `compras.jsx` (T043 → T055).
- **US5 (Phase 7)**: depende de US2 (`useMisEventos`, T030) y de US3 (`OrganizerPurchaseRow`, `useComprasEvento`, `gestionCompras.js`). `agruparComprasPorEvento` va después de T051 porque toca el mismo archivo.
- **Polish (Phase 8)**: depende de todas las historias.

### Dentro de cada fase

- Primero las pruebas, después el ⛔ GATE con la aprobación del usuario y el rojo, después la implementación y por último el verde.
- Dentro de la implementación, el orden es: módulos puros, luego componentes presentacionales y hooks, luego compuestos y por último pantallas.
- Las tareas que tocan el mismo archivo van en secuencia:
  - `gestionCompras.js`: T039 → T051 → T062.
  - `gestionCompras-test.js`: T033 → T045 → T057.
  - `OrganizerPurchaseRow.jsx`: T041 → T052.
  - `OrganizerPurchaseRow-test.jsx`: T035 → T046.
  - `compras.jsx`: T043 → T055.
  - `compras-evento-test.jsx`: T037 → T049.
  - `[idCompra].jsx`: T065.
  - `detalle-compra-test.jsx`: T006 (ajuste, si hace falta) → T060.

### Orden sugerido

T001–T002 → T003–T006 → US1 (T007–T024) → US2 (T025–T032) → US3 (T033–T044) → US4 (T045–T056) → US5 (T057–T066) → Polish (T067–T072)

---

## Parallel Examples

### Setup

```text
T001 eventosEjemplo · T002 comprasEjemplo
```

### US1

```text
Pruebas:        T007 formularioEvento · T008 Select · T009 TicketTypeForm · T010 AgregarTipoEntrada · T011 useCrearEvento/useCrearCategoria · T012 useCategorias · T013 SelectorCategoria  →  T014 crear-evento-test
Tras el GATE:   T016 formularioEvento.js · T017 Select · T018 TicketTypeForm · T019 AgregarTipoEntrada · T020 hooks de alta · T021 useCategorias  →  T022 SelectorCategoria  →  T023 crear.jsx
```

### US2

```text
Pruebas:        T025 misEventos · T026 useMisEventos  →  T027 mis-eventos-test
Tras el GATE:   T029 misEventos.js  →  T030 useMisEventos  →  T031 eventos.jsx
```

### US3

```text
Pruebas:        T033 gestionCompras · T034 AvailabilitySummary · T035 OrganizerPurchaseRow · T036 useComprasEvento  →  T037 compras-evento-test
Tras el GATE:   T039 gestionCompras.js · T040 AvailabilitySummary · T041 OrganizerPurchaseRow · T042 useComprasEvento  →  T043 compras.jsx
```

### US4

```text
Pruebas:        T045 gestionCompras (acciones) · T046 OrganizerPurchaseRow (acciones) · T047 useAccionCompra · T048 ConfirmarAccionCompra  →  T049 compras-evento-test
Tras el GATE:   T051 gestionCompras.js · T052 OrganizerPurchaseRow · T053 useAccionCompra  →  T054 ConfirmarAccionCompra  →  T055 integración
```

### US5

```text
Pruebas:        T057 gestionCompras (Mensajes) · T058 useComprasOrganizador  →  T059 mensajes-test · T060 detalle-compra-test
Tras el GATE:   T062 agruparComprasPorEvento  →  T063 useComprasOrganizador  →  T064 mensajes.jsx · T065 [idCompra].jsx
```

### Entre historias

Tras Foundational, US1, US2 y US3 pueden avanzar en paralelo (archivos disjuntos). US4 espera a US3, y US5 espera a US2 y US3.

---

## Implementation Strategy

### MVP primero (US1)

1. Setup y Foundational (T001–T006).
2. US1 (T007–T024): el organizador ya puede publicar eventos con varios tipos de entrada (CU-04), que aparecen en Explorar para los compradores.
3. **Parar y validar**: quickstart, escenarios 3–8.

### Entrega incremental

1. Agregar US2: Mis eventos.
2. Agregar US3: la vista de compras y disponibilidad (CU-02); la navegación después de publicar llega a una pantalla real.
3. Agregar US4: confirmar, reembolsar y cancelar (CU-08); las compras ya pueden avanzar de estado.
4. Agregar US5: Mensajes y el detalle de compra del organizador, que deja listo el contenedor para 008.
5. Polish: lint, la suite completa, AGENTS.md y la validación manual.

### Notas

- Cada ⛔ GATE es una pausa real: no se escribe código de producción de esa fase sin la aprobación explícita del usuario sobre las pruebas.
- Hasta US3, el `router.push(hrefComprasEvento(id))` de US1 lleva a una ruta inexistente en la app real. Las pruebas de US1 solo verifican la navegación.
- Si una prueba de 006 dependía de que el organizador fuera redirigido desde `/compra/:id`, se actualiza en T006 con la nota del contrato nuevo (research R1). No es una regresión.
