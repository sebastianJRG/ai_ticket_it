---

description: "Lista de tareas: capa de servicios del frontend con axios"
---

# Tasks: Capa de servicios del frontend hacia el backend

**Input**: Documentos de diseño en `/specs/001-servicios-api-axios/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/cliente-api.md](./contracts/cliente-api.md), [contracts/servicios.md](./contracts/servicios.md), [quickstart.md](./quickstart.md)

**Tests**: OBLIGATORIOS. La constitución (principio 2) y FR-021 exigen TDD: escribir la prueba, **el usuario la aprueba**, correrla en rojo, implementar lo mínimo y refactorizar. Cada fase de historia tiene una tarea de aprobación explícita: no se implementa nada antes de esa aprobación.

**Organization**: Tareas agrupadas por historia de usuario. Todas las rutas son relativas a la raíz del repo; los comandos de Jest se corren desde `frontend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede hacer en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3, US4)

## Convenciones para todas las tareas

- Pruebas sin red: usan el adaptador falso de `frontend/__tests__/helpers/adaptadorFalso.js` asignado a `cliente.defaults.adapter` (research R7). Nunca `jest.mock('axios')`.
- Cada archivo nuevo o modificado en `frontend/src/` lleva docstring de archivo (`@file`, `@owner Equipo Al Ticket It — frontend`, `@license MIT`) y JSDoc completo en cada export (principio 6, FR-022).
- Las funciones de servicio siguen las reglas comunes de [contracts/servicios.md](./contracts/servicios.md): devuelven `data` sin transformar, codifican IDs con `encodeURIComponent` y no reciben tokens.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencia axios y soporte de pruebas

- [X] T001 Instalar axios en el workspace del frontend con `cd frontend && npx expo install axios` (research R1); confirmar que queda en `dependencies` de `frontend/package.json` y fijado en `package-lock.json`
- [X] T002 [P] Crear el helper de pruebas `frontend/__tests__/helpers/adaptadorFalso.js` con JSDoc: exporta `crearAdaptadorFalso()`, que devuelve un `jest.fn(config => …)` con una cola de respuestas y estos métodos: `responder(status, data)` (resuelve si `status < 400`; si no, rechaza con `new AxiosError(…, …, config, null, { status, data, headers: {}, config })`), `fallarRed()` (rechaza con `AxiosError` código `ERR_NETWORK` y sin `response`), `agotarTiempo()` (código `ECONNABORTED`, sin `response`) y `responderCon(fn)` (lógica por config, para enrutar por `config.url`). Las llamadas quedan disponibles en `adaptador.mock.calls[i][0]` (config final: `method`, `url`, `params`, `data`, `headers`)
- [X] T003 Ajustar la configuración `jest` de `frontend/package.json`: agregar `"testPathIgnorePatterns": ["/node_modules/", "/__tests__/helpers/"]` para que el helper no corra como suite. Verificar que Jest resuelve axios con una prueba mínima temporal (`import axios from 'axios'; expect(typeof axios.create).toBe('function')`) y borrarla después; si falla por sintaxis ESM, agregar `axios` a la excepción de `transformIgnorePatterns` (research R7)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Instancia axios única, de la que dependen todas las historias

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta terminar esta fase

- [X] T004 Escribir pruebas base en `frontend/__tests__/services/api-test.js`: `cliente.defaults.baseURL === API_URL`; `cliente.defaults.timeout === 15000`; header `Content-Type: application/json`; `new ApiError('m', 409)` tiene `name`, `message` y `status` ([data-model.md](./data-model.md#apierror) `ApiError.name`, `ApiError.message`, `ApiError.status`); una respuesta 200 por el adaptador falso devuelve `response.data` idéntico. Usar `beforeEach` que asigne un adaptador nuevo y llame a `configurarSesion(null)`
- [X] T005 Pedir al usuario la aprobación de las pruebas de T004 (`frontend/__tests__/services/api-test.js`) y correrlas en rojo (`npx jest __tests__/services/api-test.js`)
- [X] T006 Implementar en `frontend/src/services/api.js` la instancia `cliente = axios.create({ baseURL: API_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } })` y `configurarSesion(proveedor)`, que guarda el proveedor en una variable de módulo ([data-model.md](./data-model.md#proveedorsesion) `ProveedorSesion`). Conservar sin cambios `API_URL`, `ApiError` y, **por ahora**, `request` (lo usa `authService` hasta US4). Actualizar el docstring del archivo ([contracts/cliente-api.md](./contracts/cliente-api.md#exportaciones))

**Checkpoint**: `api-test.js` en verde; el resto de la suite sigue en verde

---

## Phase 3: User Story 2 - Errores comprensibles y consistentes (Priority: P1)

**Goal**: Que toda falla del `cliente` llegue como `ApiError` con un mensaje en español y un `status`.

**Why first**: Es P1 como US1 y US4, pero ambas dependen de la normalización a `ApiError` (US1 rechaza con 401 normalizado y US4 conserva los mensajes del backend). Por eso va primero.

**Independent Test**: Con respuestas simuladas 400/403/404/409/500, un error sin cuerpo, una caída de red y un timeout, cada petición rechaza con `ApiError` con el `message` y el `status` correctos.

### Tests for User Story 2 ⚠️

- [X] T007 [US2] Agregar a `frontend/__tests__/services/api-test.js` un bloque `describe('errores')`: 409 con `{ message: 'Cupo insuficiente...' }` → `ApiError` 409 con ese mensaje (US2-1); 400, 403, 404 y 500 conservan su status y mensaje; `fallarRed()` y `agotarTiempo()` → status 0 y "No pudimos conectar con el servidor. Revisá tu conexión." (US2-2); error sin cuerpo, o con `message` que no es un string no vacío → "Ocurrió un error inesperado." con el status real (US2-3); siempre `toBeInstanceOf(ApiError)`
- [X] T008 [US2] Pedir al usuario la aprobación de las pruebas de T007 (`frontend/__tests__/services/api-test.js`) y correrlas en rojo

### Implementation for User Story 2

- [X] T009 [US2] Implementar en `frontend/src/services/api.js` la función interna `aApiError(error)` y registrarla como rama de error de `cliente.interceptors.response` según research R6 y [data-model.md](./data-model.md#apierror) `ApiError.message` y `ApiError.status`. Definir los dos mensajes como constantes de módulo. Esta rama de error es la que ampliará T016 con el caso 401

**Checkpoint**: US2 en verde; cualquier operación futura sobre `cliente` hereda el contrato de errores

---

## Phase 4: User Story 1 - La sesión sigue activa sin volver a iniciar sesión (Priority: P1) 🎯 MVP

**Goal**: Adjuntar la credencial automáticamente y, ante un 401, renovar una sola vez (deduplicada), persistir los tokens rotados y reintentar. Si la renovación falla, cerrar la sesión de forma ordenada.

**Independent Test**: Con el adaptador falso respondiendo 401 a una petición autenticada y 200 a `POST /api/refresh`, la petición original termina bien, hay un único refresh y `guardarTokens` recibe la sesión nueva. En `AuthContext` los tokens rotados quedan en `SecureStore`.

### Tests for User Story 1 ⚠️

- [X] T010 [P] [US1] Agregar a `frontend/__tests__/services/api-test.js` un bloque `describe('credencial')`: con proveedor cuyo `obtenerTokens` devuelve `{ accessToken: 'a1', refreshToken: 'r1' }`, la config enviada lleva `Authorization: 'Bearer a1'`; funciona también si `obtenerTokens` devuelve una promesa; con `{ sinSesion: true }` no hay `Authorization`; sin proveedor (`configurarSesion(null)`) o con `obtenerTokens` que devuelve `null`, no hay `Authorization` (US3-3, FR-002)
- [X] T011 [US1] Agregar a `frontend/__tests__/services/api-test.js` un bloque `describe('renovación')`, usando `responderCon` para enrutar por `config.url`:
  - 401 y luego refresh 200 `{ accessToken: 'a2', refreshToken: 'r2', usuario }` → la petición resuelve; el refresh se envió como `POST /api/refresh` con `{ refreshToken: 'r1' }` y sin `Authorization`; `guardarTokens` se llamó una vez con la respuesta completa **antes** del reintento; el reintento lleva `Bearer a2` (US1-1, US1-4).
  - 3 peticiones concurrentes (`Promise.all`) con 401 → exactamente 1 refresh, 3 reintentos con `Bearer a2` y 1 llamada a `guardarTokens` (US1-2, SC-003).
  - Refresh responde 401 → `alExpirar` 1 vez; la petición original rechaza con `ApiError` 401 y el mensaje de su propio 401; no hay segundo refresh (US1-3; edge case "la propia renovación da 401").
  - 3 concurrentes con refresh fallido → `alExpirar` 1 vez y las 3 rechazan con 401.
  - Sin `refreshToken` en el proveedor → no se llama a `/api/refresh`; `alExpirar` y rechazo 401.
  - El reintento vuelve a dar 401 → rechaza 401 sin segundo refresh (edge case).
  - Sin sesión (no salió `Authorization`) y 401 → no hay refresh ni `alExpirar`.
  - `{ sinSesion: true }` y 401 → no hay refresh (FR-007).
  - 403 → no hay refresh; rechaza 403 (edge case).
  - Tras un refresh fallido, un 401 posterior vuelve a intentar renovar (`renovacionEnCurso` se limpió).
- [X] T012 [P] [US1] Ampliar `frontend/__tests__/auth-AuthContext-test.jsx` con `jest.mock('../src/services/api', () => ({ configurarSesion: jest.fn(), ApiError: class extends Error {} }))`, sin cambiar los 4 casos existentes. Casos nuevos:
  - al montar se llama a `configurarSesion` con un objeto que tiene `obtenerTokens`, `guardarTokens` y `alExpirar`;
  - tras restaurar la sesión guardada, `obtenerTokens()` devuelve `{ accessToken: 'a', refreshToken: 'r' }`; sin sesión, `null`;
  - `guardarTokens({ accessToken: 'a2', refreshToken: 'r2', usuario })` llama a `SecureStore.setItemAsync('sesion', …)` con los tokens nuevos y después `obtenerTokens()` devuelve los nuevos (US1-4);
  - `alExpirar()` deja la UI en "anonimo", llama a `SecureStore.deleteItemAsync` y **no** llama a `authService.cerrarSesion`;
  - al desmontar se llama a `configurarSesion(null)`.
- [X] T013 [US1] Pedir al usuario la aprobación de las pruebas de T010–T012 (`frontend/__tests__/services/api-test.js`, `frontend/__tests__/auth-AuthContext-test.jsx`) y correrlas en rojo

### Implementation for User Story 1

- [X] T014 [US1] Implementar en `frontend/src/services/api.js` el interceptor de request (async), según [contracts/cliente-api.md](./contracts/cliente-api.md#interceptor-de-request) y [data-model.md](./data-model.md): respeta la marca `sinSesion`, consulta `ProveedorSesion.obtenerTokens`, adjunta `Sesion.accessToken` como Bearer y pone la marca `_conSesion`
- [X] T015 [US1] Implementar en `frontend/src/services/api.js` la función interna `renovar()`, deduplicada con la variable `renovacionEnCurso` (research R5; [data-model.md](./data-model.md#estado-de-renovación-módulo-apijs) `renovacionEnCurso`). Hace `POST /api/refresh` con `Sesion.refreshToken` y `sinSesion: true`, llama una vez a `ProveedorSesion.guardarTokens` con la sesión nueva (el `Sesion.refreshToken` rotado incluido), resuelve con el nuevo `Sesion.accessToken`; si falla o no hay `refreshToken`, llama una vez a `ProveedorSesion.alExpirar` y rechaza; limpia `renovacionEnCurso` en `finally` (depende de T014)
- [X] T016 [US1] Ampliar la rama de error del interceptor de response en `frontend/src/services/api.js`: si el status es 401 y la config tiene `_conSesion`, no tiene `_reintentado` y no tiene `sinSesion`, espera `renovar()`, pone `_reintentado`, reemplaza `Authorization` y devuelve `cliente(config)`. Si la renovación falla, rechaza con `aApiError` del 401 original. El resto de los casos sigue en `aApiError` ([contracts/cliente-api.md](./contracts/cliente-api.md#interceptor-de-response-error); [data-model.md](./data-model.md#marcas-internas-de-la-config-axios) `_reintentado`). Depende de T009 y T015
- [X] T017 [US1] Agregar en `frontend/src/services/api.js` los `@typedef` JSDoc `Sesion` y `ProveedorSesion` con `@property` por campo ([data-model.md](./data-model.md) `Sesion.accessToken`, `Sesion.refreshToken`, `Sesion.usuario`, `ProveedorSesion.obtenerTokens`, `ProveedorSesion.guardarTokens`, `ProveedorSesion.alExpirar`) y el JSDoc de `configurarSesion` con `@param {ProveedorSesion|null}`
- [X] T018 [US1] Modificar `frontend/src/auth/AuthContext.jsx` (research R8): agregar `sesionRef`, actualizado junto a cada `setSesion` (en `guardar`, en la restauración, en `cerrarSesion` y en la expiración). En un `useEffect` de montaje, llamar a `configurarSesion({ obtenerTokens, guardarTokens: guardar, alExpirar })`, con `obtenerTokens` leyendo `sesionRef.current` (`Sesion.accessToken`, `Sesion.refreshToken`) y `alExpirar` limpiando el estado y `SecureStore` sin llamar a `authService.cerrarSesion`. En la limpieza del efecto, `configurarSesion(null)`. Actualizar el JSDoc

**Checkpoint**: `api-test.js` y `auth-AuthContext-test.jsx` en verde; US1 y US2 funcionan juntas

---

## Phase 5: User Story 4 - Login y registro se comportan igual que hoy (Priority: P1)

**Goal**: Migrar `authService` de `fetch` al `cliente` axios sin cambiar firmas ni comportamiento visible, y retirar `request`.

**Independent Test**: Las pruebas de `__tests__/screens/login-test.jsx` y `__tests__/screens/registro-test.jsx` pasan sin modificarse, y `authService-test.js` conserva las mismas aserciones de comportamiento sobre el adaptador falso.

### Tests for User Story 4 ⚠️

- [X] T019 [US4] Reescribir `frontend/__tests__/services/authService-test.js` para usar el adaptador falso en vez de `global.fetch`, conservando los 4 casos actuales con las mismas aserciones:
  - `login` envía `POST /api/login` con `{ nombreUsuario, contrasenia }` y devuelve `accessToken`;
  - un 401 rechaza con `ApiError` con status y mensaje del backend;
  - `registrar` envía `POST /api/usuarios` con `rol`;
  - sin red, rechaza con status 0.

  Casos nuevos:
  - `refrescar('r')` envía `POST /api/refresh` con `{ refreshToken: 'r' }`, y `cerrarSesion('r')` envía `POST /api/logout` con `{ refreshToken: 'r' }`;
  - con un proveedor registrado, ninguna de las 4 funciones envía `Authorization`;
  - un login con 401 no dispara `POST /api/refresh` ni `alExpirar` (US1-5).
- [X] T020 [US4] Pedir al usuario la aprobación de las pruebas de T019 (`frontend/__tests__/services/authService-test.js`) y correrlas en rojo

### Implementation for User Story 4

- [X] T021 [US4] Reescribir `frontend/src/services/authService.js` sobre `cliente`, con las mismas firmas y JSDoc `@throws` de [contracts/servicios.md](./contracts/servicios.md#authservicejs-todas-con-sinsesion-true-re-exporta-apierror): cada llamada pasa `{ sinSesion: true }` ([data-model.md](./data-model.md#marcas-internas-de-la-config-axios) `sinSesion`), devuelve `data` y re-exporta `ApiError`
- [X] T022 [US4] Eliminar `request` y todo uso de `fetch` en `frontend/src/services/api.js` (depende de T021). Comprobar que no quedan importaciones de `request` con `grep -rn "request" frontend/src frontend/__tests__`
- [X] T023 [US4] Correr sin modificarlas `npx jest __tests__/screens __tests__/auth-AuthContext-test.jsx` (`frontend/__tests__/screens/login-test.jsx`, `frontend/__tests__/screens/registro-test.jsx`) y confirmar que todo está en verde (SC-004, FR-020). Si alguna falla, corregir la implementación, nunca la prueba

**Checkpoint**: Todas las historias P1 están completas y la app funciona igual que antes, ahora sobre axios

---

## Phase 6: User Story 3 - Todas las operaciones del backend disponibles para las pantallas (Priority: P2)

**Goal**: Un servicio por recurso con todas las operaciones de [contracts/servicios.md](./contracts/servicios.md).

**Independent Test**: Por cada función, una prueba verifica método, `url`, `params`/`data` exactos (y la presencia o ausencia de `Authorization`) y que devuelve `data` sin cambios.

### Tests for User Story 3 ⚠️

> Todas las pruebas usan el adaptador falso y un proveedor con `accessToken` para las operaciones con sesión. Cada archivo incluye al menos un caso con un ID que contiene `/` o espacios, para verificar la codificación (FR-018).

- [X] T024 [P] [US3] Escribir `frontend/__tests__/services/usuarioService-test.js`: `obtenerPerfil`, `listarReseniasOrganizador` (pública: sin proveedor, sin `Authorization`), `listarFavoritos`, `agregarFavorito` (PUT), `quitarFavorito` (DELETE); un 404 de `listarFavoritos` rechaza con `ApiError` 404 (edge case de la feature 002)
- [X] T025 [P] [US3] Escribir `frontend/__tests__/services/eventoService-test.js`:
  - `listarEventos({ q: '', categoriaId: 'c1' })` envía `params` igual a `{ categoriaId: 'c1' }` (US3-1); también se omiten `null`, `undefined` y strings de solo espacios; `sortBy` y `order` pasan tal cual;
  - `listarEventos()` sin argumentos funciona;
  - `listarEventos` y `obtenerEvento` funcionan sin sesión (US3-3);
  - `crearEvento(datos)` envía `POST /api/eventos` con `datos` idéntico;
  - `obtenerComprasEvento(id)` envía `GET /api/eventos/:id/compras`.
- [X] T026 [P] [US3] Escribir `frontend/__tests__/services/categoriaService-test.js`: `listarCategorias` (pública, sin `Authorization`) y `crearCategoria({ nombre, descripcion })` (POST con ese cuerpo y con `Authorization`)
- [X] T027 [P] [US3] Escribir `frontend/__tests__/services/compraService-test.js`:
  - `crearCompra` envía `POST /api/compras` con `{ eventoId, tipoEntradaId, cantidad }`;
  - un 409 rechaza con `ApiError` 409 y el mensaje del backend (US2-1);
  - `listarMisCompras` envía `GET /api/compras`;
  - `cancelarCompra`, `confirmarCompra` y `reembolsarCompra` envían `PATCH /api/compras/:id/{cancelacion|confirmacion|reembolso}` con `data` `undefined` y `Authorization` (US3-2, FR-015).
- [X] T028 [P] [US3] Escribir `frontend/__tests__/services/reseniaService-test.js`: `crearResenia({ eventoId, detalle, puntuacion })` (POST `/api/resenias`) y `listarReseniasEvento(id)` (pública, `GET /api/resenias/:id`)
- [X] T029 [P] [US3] Escribir `frontend/__tests__/services/mensajeService-test.js`: `enviarMensaje('c1', 'hola')` envía `POST /api/compras/c1/mensajes` con `{ mensaje: 'hola' }`; `listarMensajes('c1')` envía `GET /api/compras/c1/mensajes`; un 403 rechaza con `ApiError` 403 sin renovar
- [X] T030 [US3] Pedir al usuario la aprobación de las pruebas de T024–T029 (`frontend/__tests__/services/*Service-test.js`) y correrlas en rojo

### Implementation for User Story 3

- [X] T031 [P] [US3] Crear `frontend/src/services/usuarioService.js` según [contracts/servicios.md](./contracts/servicios.md#usuarioservicejs)
- [X] T032 [P] [US3] Crear `frontend/src/services/eventoService.js` según [contracts/servicios.md](./contracts/servicios.md#eventoservicejs), con la omisión de filtros vacíos de research R9 y `@typedef` JSDoc de los filtros (`sortBy`: `'precio'|'fecha'|'puntaje'`, `order`: `'asc'|'desc'`)
- [X] T033 [P] [US3] Crear `frontend/src/services/categoriaService.js` según [contracts/servicios.md](./contracts/servicios.md#categoriaservicejs)
- [X] T034 [P] [US3] Crear `frontend/src/services/compraService.js` según [contracts/servicios.md](./contracts/servicios.md#compraservicejs); las transiciones se llaman `cliente.patch(ruta)` sin segundo argumento
- [X] T035 [P] [US3] Crear `frontend/src/services/reseniaService.js` según [contracts/servicios.md](./contracts/servicios.md#reseniaservicejs)
- [X] T036 [P] [US3] Crear `frontend/src/services/mensajeService.js` según [contracts/servicios.md](./contracts/servicios.md#mensajeservicejs)

**Checkpoint**: `npx jest __tests__/services` en verde; las 28 operaciones de la capa de servicios están disponibles y probadas (SC-001)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Calidad y validación final

- [X] T037 [P] Revisar el JSDoc de `frontend/src/services/*.js` y `frontend/src/auth/AuthContext.jsx`: docstring de archivo, y `@param`, `@returns` y `@throws` con los status de [contracts/servicios.md](./contracts/servicios.md) en cada export (principio 6, FR-022)
- [X] T038 [P] Verificar que todo el tráfico pasa por axios (FR-001): `grep -rn "fetch(" frontend/src` no debe devolver nada
- [X] T039 Correr `npm run lint` y `npm run format` desde la raíz y corregir lo que reporten en `frontend/src/` y `frontend/__tests__/`
- [X] T040 Correr la suite completa con `cd frontend && npm test` y confirmar que todo está en verde
- [X] T041 Ejecutar la validación manual de la sección 3 de [quickstart.md](./quickstart.md) (backend con `JWT_ACCESS_EXPIRATION=10s`) y anotar el resultado en `specs/001-servicios-api-axios/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias. T002 ∥ T001; T003 depende de T001 y T002.
- **Foundational (Fase 2)**: depende de Setup y bloquea todas las historias.
- **US2 (Fase 3)**: depende de la Fase 2.
- **US1 (Fase 4)**: depende de US2, porque T016 amplía el interceptor de T009.
- **US4 (Fase 5)**: depende de US1, porque T019 verifica que login no dispara refresh, y de US2, por los mensajes.
- **US3 (Fase 6)**: sus pruebas solo dependen de la Fase 2 y se pueden escribir en paralelo con las fases 3–5. Su implementación necesita US2 (errores) y US1 (credencial) para que pasen las aserciones de `Authorization` y de `ApiError`.
- **Polish (Fase 7)**: depende de todas las fases.

### Within Each User Story

- Las pruebas se escriben primero → el usuario las aprueba (T005, T008, T013, T020, T030) → se corren en rojo → se implementa → refactor.
- `api.js` se modifica en serie: T006 → T009 → T014 → T015 → T016 → T017 → T022.

### Parallel Opportunities

- T001 ∥ T002.
- En US1: T010 y T012 en paralelo (archivos distintos). T011 comparte archivo con T010, así que van en serie.
- En US3: T024–T029 en paralelo, y luego T031–T036 en paralelo (cada uno en su archivo).
- Las pruebas de US3 (T024–T029) se pueden escribir mientras se implementan US2, US1 y US4.
- T037 ∥ T038.

---

## Parallel Example: User Story 3

```bash
# Pruebas (en paralelo):
Task: "T024 usuarioService-test.js"   Task: "T025 eventoService-test.js"
Task: "T026 categoriaService-test.js" Task: "T027 compraService-test.js"
Task: "T028 reseniaService-test.js"   Task: "T029 mensajeService-test.js"

# Tras la aprobación T030, implementación (en paralelo):
Task: "T031 usuarioService.js"   Task: "T032 eventoService.js"
Task: "T033 categoriaService.js" Task: "T034 compraService.js"
Task: "T035 reseniaService.js"   Task: "T036 mensajeService.js"
```

## Parallel Example: User Story 1

```bash
Task: "T010 describe('credencial') en api-test.js"
Task: "T012 casos nuevos en auth-AuthContext-test.jsx"
```

---

## Implementation Strategy

### MVP (Fases 1 → 5)

1. Setup y Foundational: cliente axios instalado y probado.
2. US2: errores uniformes.
3. US1: sesión estable con renovación deduplicada. Es el corazón de la feature.
4. US4: login y registro migrados sin regresiones.
5. **PARAR y VALIDAR**: suite completa en verde y la app funciona igual que antes, ahora con renovación automática. Es entregable por sí solo.

### Entrega incremental

- Después del MVP, US3 suma los servicios por recurso. Cada servicio es un incremento independiente que desbloquea su feature de pantallas: evento y categoría → 004/007; compra → 005/006/007; mensaje → 008; reseña y usuario → 004/005.

### Notas

- [P] = archivos distintos y sin dependencias pendientes.
- No modificar `backend/` ni las pruebas de `__tests__/screens/`.
- Commit al cierre de cada fase, con lint y format en verde.
