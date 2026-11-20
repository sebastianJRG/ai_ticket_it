---

description: "Lista de tareas para Favoritos del comprador (backend)"
---

# Tasks: Favoritos del comprador (backend)

**Input**: Documentos de diseño en `/specs/002-backend-favoritos/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/favoritos.md](./contracts/favoritos.md), [quickstart.md](./quickstart.md)

**Tests**: OBLIGATORIOS. La constitución (principio 2) y FR-009 exigen TDD: prueba → **aprobación del usuario** → rojo → implementación mínima → refactor. Cada historia tiene una tarea de puerta de aprobación antes de implementar.

**Organization**: tareas agrupadas por historia de usuario para implementarlas y probarlas de forma incremental.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: historia de usuario a la que pertenece (US1, US2, US3)
- Rutas relativas a la raíz del repositorio. Integración con `node:test`; unitarias con Jest (`@jest/globals`), como en el resto de `backend/tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: rama, línea base verde y andamiaje de la prueba de integración

- [X] T001 Crear y cambiar a la rama `002-backend-favoritos` desde `main` y correr `npm run test:backend` para registrar la línea base en verde (punto de comparación de SC-003)
- [X] T002 Crear `backend/tests/favoritos.test.js` (node:test) solo con el andamiaje: docstring de archivo (propósito, `@license ISC`), `before`/`after` que levantan `createApp()` en puerto efímero, helper `registrarYLoguear(rol, nombreUsuario)` que devuelve `{ token, id }`, helper `crearEvento(tokenOrganizador, nombre)` (crea categoría y evento con fecha futura vía API) y helpers `pedir(metodo, ruta, token)` para GET/PUT/DELETE `/api/usuarios/favoritos[/:idEvento]`. Seguir el estilo de `backend/tests/eventos.detalle.test.js` y `backend/tests/usuarios.test.js`; sin casos `it` todavía

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: piezas compartidas por las tres historias (las tres rutas devuelven la lista resuelta con `EventoService.obtenerPorIds`)

**⚠️ CRITICAL**: ninguna historia empieza hasta terminar esta fase

- [X] T003 [P] Escribir pruebas Jest de `EventoService.obtenerPorIds(ids, contexto)` en `backend/tests/unit/eventos/eventos.obtenerPorIds.service.test.js` con repositorios en memoria nuevos por test (`EventoRepository`, `ReseniaRepository`, etc.; fixtures de `backend/tests/helpers/eventosFixtures.js`) y logger falso `{ info: jest.fn() }` como 6.º argumento del constructor: devuelve los eventos en el **mismo orden** que `ids`; omite IDs inexistentes; `[]` para `[]`; cada evento trae `puntajeOrganizador` (promedio de reseñas del organizador o `null`); no modifica los eventos almacenados; emite un log JSON `eventos_resueltos` con `requestId` (el del contexto, o `null` si no se pasa), `solicitados` y `encontrados` ([R6](./research.md#r6-logging-estructurado-con-id-de-petición))
- [X] T004 [P] Escribir pruebas Jest del middleware `asignarRequestId` en `backend/tests/unit/utils/requestId.test.js` (`req`/`res` dobles, `next = jest.fn()`): usa el header `X-Request-Id` válido tal cual; genera un UUID si falta, está vacío, supera 128 caracteres o tiene caracteres fuera de `[A-Za-z0-9_-]` (p. ej. `<script>`); siempre llama a `next()` una vez sin error
- [X] T005 Puerta TDD: presentar T003 y T004 al usuario, esperar su aprobación y correr `npm run test:jest --workspace backend` confirmando que las pruebas nuevas **fallan**
- [X] T006 Crear `backend/src/utils/requestId.js` con docstring de archivo (propósito, owner, `@license ISC`) y el middleware exportado `asignarRequestId(req, res, next)` (JSDoc completo; `crypto.randomUUID()`), y montarlo en `backend/src/app.js` justo después de `express.json()`; T004 en verde
- [X] T007 Agregar `logger = console` como 6.º parámetro opcional del constructor de `EventoService` e implementar `obtenerPorIds(ids, contexto = {})` en `backend/src/services/eventoService.js` reutilizando `_puntajesPorOrganizador()` (una sola vez) y `_conPuntaje()`, con el log `eventos_resueltos` y JSDoc completo (`@param {string[]}`, `@param {{requestId?: string}}`, `@returns`) — ver [research R3/R4/R6](./research.md#r3-qué-se-guarda-en-favoritos); T003 en verde
- [X] T008 Cambiar el constructor de `UsuarioService` a `(usuarioRepository, eventoRepository, logger = console)` en `backend/src/services/usuarioService.js` (parámetros nuevos opcionales; `new UsuarioService(repo)` sigue funcionando) y agregar helpers privados `_validarIdEvento(id)` (`idEventoSchema` de `backend/src/dto/resenia.js` → `ErrorHttp` 400), `_usuarioOFallar(usuarioId)` (`ErrorHttp` 404 `El usuario no existe.`) y `_log(evento, contexto, datos)` (escribe `logger.info(JSON.stringify({ evento, requestId: contexto.requestId ?? null, ...datos }))`), con JSDoc — ver [research R5/R6](./research.md#r5-inyección-de-dependencias-sin-romper-consumidores)
- [X] T009 [P] Actualizar solo el JSDoc de `favoritos` en `backend/src/models/usuario.js` a `Array<{id: string}>` según [data-model.md › Usuario.favoritos](./data-model.md#favorito-relación-embebida-en-usuariofavoritos)
- [X] T010 [P] Crear `backend/src/controllers/favoritoController.js` con docstring de archivo (propósito, owner, `@license ISC`) y la clase `FavoritoController` con `constructor(usuarioService, eventoService)` documentado; sin métodos de ruta todavía
- [X] T011 Cablear en `backend/src/app.js`: pasar `eventoRepository` a `new UsuarioService(usuarioRepository, eventoRepository)`, crear `new FavoritoController(usuarioService, eventoService)` y pasarlo como quinto argumento a `UsuariosRoutes.init`; en `backend/src/routes/usuariosRoutes.js` agregar el parámetro `favoritoController` a `init` y a su JSDoc (sin rutas nuevas todavía)
- [X] T012 Correr `npm run test:backend`: toda la suite en verde (sin regresiones por los cambios de firma ni por el middleware)

**Checkpoint**: ID de petición en `req.id`, `obtenerPorIds` probado, dependencias inyectadas y controlador creado; las historias pueden empezar

---

## Phase 3: User Story 1 - Guardar un evento como favorito (Priority: P1) 🎯 MVP

**Goal**: `PUT /api/usuarios/favoritos/:idEvento` agrega de forma idempotente un evento existente y devuelve la lista actualizada

**Independent Test**: un comprador hace PUT de un evento existente y la respuesta 200 contiene ese evento con formato público; repetirlo deja exactamente 1; un ID inexistente da 404

### Tests for User Story 1 ⚠️

> Escribirlas PRIMERO; deben FALLAR antes de implementar

- [X] T013 [P] [US1] Pruebas Jest de `UsuarioService.agregarAFavoritos` en `backend/tests/unit/usuarios/favoritos.service.test.js` (repositorios en memoria nuevos + logger falso `{ info: jest.fn() }`): agrega y devuelve `string[]` de IDs; idempotente (dos veces → 1 entrada, sin cambiar de posición; SC-002); permite un evento con fecha pasada; 404 si el evento no existe; 400 si el ID es `'   '`; 404 si el usuario no existe; persiste vía `actualizar` sin mutar el arreglo previamente leído ([R2](./research.md#r2-mutación-compartida-por-el-clon-superficial-del-repositorio)); emite un log JSON `favorito_agregado` con `requestId` (del 3.er argumento `contexto`), `usuarioId`, `rol`, `eventoId`, `cantidad`
- [X] T014 [P] [US1] Pruebas Jest de `FavoritoController.agregar` en `backend/tests/unit/usuarios/favoritos.controller.test.js` (servicios dobles con `jest.fn()`, estilo de `usuarios.controller.test.js`): llama a `usuarioService.agregarAFavoritos(req.user.id, req.params.idEvento, { requestId: req.id })` y a `eventoService.obtenerPorIds(ids, { requestId: req.id })` con los IDs devueltos; responde 200 con `aEventoRespuesta` (organizador sin `contraseniaHash`/`refreshTokenHash`, con `puntajeOrganizador`); pasa los errores a `next`
- [X] T015 [US1] Casos `it` de PUT en `backend/tests/favoritos.test.js` según [contracts/favoritos.md › PUT](./contracts/favoritos.md#put-apiusuariosfavoritosidevento): 200 con lista que contiene el evento y `organizador` público (US1-1); repetir PUT → longitud 1 (US1-2); ID `999` → 404 (US1-3); `%20` → 400; sin token → 401; token ORGANIZADOR → 403
- [X] T016 [US1] Puerta TDD: presentar T013–T015 al usuario, esperar aprobación y correr `npm run test:backend` confirmando que fallan

### Implementation for User Story 1

- [X] T017 [US1] Reescribir `agregarAFavoritos(usuarioId, eventoId, contexto = {})` en `backend/src/services/usuarioService.js`: `_validarIdEvento` → `_usuarioOFallar` → verificar el evento con `eventoRepository.buscarPorId` (404 `El evento con ID <id> no existe.`) → si no está, arreglo nuevo `[...favoritos, { id }]` y `usuarioRepository.actualizar` → `_log('favorito_agregado', contexto, { usuarioId, rol: usuario.rol, eventoId, cantidad })` → devolver los IDs. Restricciones de [data-model.md › Favorito.id](./data-model.md#favorito-relación-embebida-en-usuariofavoritos) y [data-model.md › Usuario.favoritos](./data-model.md#favorito-relación-embebida-en-usuariofavoritos) (orden de agregado, sin duplicados). JSDoc con `@throws {ErrorHttp}` 400/404
- [X] T018 [US1] Implementar `agregar(req, res, next)` en `backend/src/controllers/favoritoController.js` (usuario desde `req.user.id`, nunca desde el cuerpo) con JSDoc
- [X] T019 [US1] Registrar `PUT /favoritos/:idEvento` con `authMiddleware` + `requerirRol('COMPRADOR')` en `backend/src/routes/usuariosRoutes.js`, declarada **antes** de `/:idOrganizador/resenias` ([R7](./research.md#r7-rutas-métodos-y-colisiones))
- [X] T020 [US1] Correr `npm run test:backend`: T013–T015 en verde y sin regresiones; refactorizar si hace falta

**Checkpoint**: MVP. Un comprador puede marcar favoritos y recibe la lista actualizada

---

## Phase 4: User Story 2 - Quitar un favorito (Priority: P1)

**Goal**: `DELETE /api/usuarios/favoritos/:idEvento` quita de forma idempotente y devuelve la lista actualizada

**Independent Test**: quitar un favorito → la respuesta 200 ya no lo contiene; quitar uno que no estaba → 200 con la lista sin cambios

### Tests for User Story 2 ⚠️

- [X] T021 [P] [US2] Pruebas Jest de `UsuarioService.removerDeFavoritos` en `backend/tests/unit/usuarios/favoritos.service.test.js` (favoritos sembrados directo en el repositorio, sin depender de US1): quita y devuelve los IDs restantes en orden; idempotente si no estaba (sin error, lista igual); **no** consulta la existencia del evento (ID inexistente → 200 lógico, sin 404); 400 con `'   '`; 404 si el usuario no existe; log `favorito_quitado` con `requestId` (del 3.er argumento `contexto`), `usuarioId`, `rol`, `eventoId`, `cantidad`, también cuando no había cambios
- [X] T022 [P] [US2] Pruebas Jest de `FavoritoController.quitar` en `backend/tests/unit/usuarios/favoritos.controller.test.js`: llama a `removerDeFavoritos(req.user.id, req.params.idEvento, { requestId: req.id })` y a `obtenerPorIds(ids, { requestId: req.id })`; 200 con `aEventoRespuesta`; errores a `next`
- [X] T023 [US2] Casos `it` de DELETE en `backend/tests/favoritos.test.js` según [contracts/favoritos.md › DELETE](./contracts/favoritos.md#delete-apiusuariosfavoritosidevento) (la preparación usa PUT de US1): 200 sin el evento (US2-1); repetir DELETE → 200 lista igual (US2-2); DELETE de `999` → 200; `%20` → 400; sin token → 401; ORGANIZADOR → 403
- [X] T024 [US2] Puerta TDD: presentar T021–T023 al usuario, esperar aprobación y confirmar que fallan con `npm run test:backend`

### Implementation for User Story 2

- [X] T025 [US2] Reescribir `removerDeFavoritos(usuarioId, eventoId, contexto = {})` en `backend/src/services/usuarioService.js`: `_validarIdEvento` → `_usuarioOFallar` → `filter` a un arreglo nuevo, `actualizar` solo si cambió → `_log('favorito_quitado', contexto, { usuarioId, rol: usuario.rol, eventoId, cantidad })` → devolver los IDs; según [data-model.md › Usuario.favoritos](./data-model.md#transiciones) (quitar idempotente). JSDoc actualizado
- [X] T026 [US2] Implementar `quitar(req, res, next)` en `backend/src/controllers/favoritoController.js` con JSDoc
- [X] T027 [US2] Registrar `DELETE /favoritos/:idEvento` con `authMiddleware` + `requerirRol('COMPRADOR')` en `backend/src/routes/usuariosRoutes.js`, junto a la ruta PUT
- [X] T028 [US2] Correr `npm run test:backend`: verde y sin regresiones; refactorizar

**Checkpoint**: el corazón funciona como toggle (PUT/DELETE)

---

## Phase 5: User Story 3 - Ver mis favoritos (Priority: P2)

**Goal**: `GET /api/usuarios/favoritos` lista los favoritos en orden de agregado, con el formato de `GET /api/eventos`

**Independent Test**: un comprador sin favoritos recibe `[]`; con favoritos recibe los eventos en orden de agregado y con el mismo formato que el listado público

### Tests for User Story 3 ⚠️

- [X] T029 [P] [US3] Pruebas Jest de `UsuarioService.listarFavoritos(usuarioId, contexto)` en `backend/tests/unit/usuarios/favoritos.service.test.js`: devuelve los IDs en orden de agregado; `[]` sin favoritos; 404 si el usuario no existe; emite un log JSON `favoritos_listados` con `requestId`, `usuarioId`, `rol`, `cantidad`
- [X] T030 [P] [US3] Pruebas Jest de `FavoritoController.listar` en `backend/tests/unit/usuarios/favoritos.controller.test.js`: llama a `listarFavoritos(req.user.id, { requestId: req.id })` y a `obtenerPorIds(ids, { requestId: req.id })`; 200 con `aEventoRespuesta`; errores a `next`
- [X] T031 [US3] Casos `it` de GET en `backend/tests/favoritos.test.js` según [contracts/favoritos.md › GET](./contracts/favoritos.md#get-apiusuariosfavoritos): comprador nuevo → `[]` (US3-2); tras PUT de dos eventos en orden B, A → `[B, A]` (US3-1); cada elemento es igual (`deepEqual`) al de `GET /api/eventos/:idEvento` (FR-006); sin token → 401; ORGANIZADOR → 403; `GET /api/usuarios` del comprador con favoritos sigue sin `favoritos` (FR-008)
- [X] T032 [US3] Puerta TDD: presentar T029–T031 al usuario, esperar aprobación y confirmar que fallan con `npm run test:backend`

### Implementation for User Story 3

- [X] T033 [US3] Implementar `listarFavoritos(usuarioId, contexto = {})` en `backend/src/services/usuarioService.js` (`_usuarioOFallar` → IDs de `favoritos` en orden → `_log('favoritos_listados', contexto, { usuarioId, rol: usuario.rol, cantidad })`, ver [data-model.md › Usuario.favoritos](./data-model.md#favorito-relación-embebida-en-usuariofavoritos)) con JSDoc `@throws {ErrorHttp}` 404
- [X] T034 [US3] Implementar `listar(req, res, next)` en `backend/src/controllers/favoritoController.js` con JSDoc
- [X] T035 [US3] Registrar `GET /favoritos` con `authMiddleware` + `requerirRol('COMPRADOR')` en `backend/src/routes/usuariosRoutes.js`, antes de `/:idOrganizador/resenias`
- [X] T036 [US3] Correr `npm run test:backend`: verde y sin regresiones; refactorizar

**Checkpoint**: las tres historias funcionan; la pestaña Favoritos del frontend tiene backend

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: documentación, calidad y validación final

- [X] T037 [P] Documentar las tres rutas en la sección "Usuarios (Usuario)" de `AGENTS.md` (rol COMPRADOR, sin cuerpo, 200 con lista en formato de `GET /api/eventos`, idempotencia, errores 400/401/403/404) según [contracts/favoritos.md](./contracts/favoritos.md) (FR-010)
- [X] T038 [P] Revisar el JSDoc de todos los archivos tocados (`backend/src/services/usuarioService.js`, `backend/src/services/eventoService.js`, `backend/src/controllers/favoritoController.js`, `backend/src/routes/usuariosRoutes.js`, `backend/src/app.js`, `backend/src/models/usuario.js`, `backend/src/utils/requestId.js`): `@param`/`@returns`/`@throws` coinciden con el comportamiento final (principio 6)
- [X] T039 Correr `npm run lint` y `npm run format` desde la raíz y corregir lo que aparezca en los archivos de la feature
- [X] T040 Correr `npm run test:backend` completo (SC-001, SC-003) y la validación manual con curl de [quickstart.md](./quickstart.md#2-prueba-manual-con-curl), incluidos los cuatro logs con `requestId` y la prueba del header `X-Request-Id`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; BLOQUEA todas las historias
- **US1 (Phase 3)**: depende de Foundational
- **US2 (Phase 4)**: depende de Foundational; sus pruebas **unitarias** son independientes de US1, pero la **integración** (T023) usa la ruta PUT de US1 para preparar datos
- **US3 (Phase 5)**: depende de Foundational; la integración (T031) usa PUT de US1 para tener favoritos
- **Polish (Phase 6)**: depende de las historias que se entreguen

### Within Each User Story

- Pruebas (servicio, controlador, integración) → puerta de aprobación + rojo → servicio → controlador → ruta → verde/refactor
- Varias tareas comparten archivo (`usuarioService.js`, `favoritoController.js`, `usuariosRoutes.js`, `favoritos.test.js`, `favoritos.service.test.js`, `favoritos.controller.test.js`), por eso las historias se recomiendan **en secuencia** US1 → US2 → US3

### Parallel Opportunities

- Phase 2: T003, T004, T009 y T010 en paralelo (archivos distintos)
- En cada historia, las pruebas de servicio y de controlador ([P]) en paralelo; la de integración aparte porque comparte `backend/tests/favoritos.test.js`
- Phase 6: T037 y T038 en paralelo

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 en paralelo (archivos distintos):
Task: "Pruebas Jest de UsuarioService.agregarAFavoritos en backend/tests/unit/usuarios/favoritos.service.test.js"
Task: "Pruebas Jest de FavoritoController.agregar en backend/tests/unit/usuarios/favoritos.controller.test.js"
# Luego, en secuencia: casos PUT en backend/tests/favoritos.test.js → puerta de aprobación (T016)
```

## Parallel Example: Foundational

```bash
Task: "Pruebas Jest de EventoService.obtenerPorIds en backend/tests/unit/eventos/eventos.obtenerPorIds.service.test.js"
Task: "Pruebas Jest de asignarRequestId en backend/tests/unit/utils/requestId.test.js"
Task: "JSDoc de favoritos en backend/src/models/usuario.js"
Task: "Esqueleto de FavoritoController en backend/src/controllers/favoritoController.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2
2. Phase 3 (US1): marcar favoritos con PUT
3. **STOP and VALIDATE**: `npm run test:backend` y pasos 2–4 del quickstart

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → PUT (MVP)
3. US2 → DELETE (toggle completo del corazón)
4. US3 → GET (pestaña Favoritos)
5. Polish → AGENTS.md, lint, validación final

---

## Notes

- Las puertas T005, T016, T024 y T032 son obligatorias por la constitución: no implementar sin la aprobación explícita del usuario
- No tocar `RepositorioEnMemoria`, `UsuarioRepository.alternarFavorito`, los DTOs ni el frontend
- Commit al final de cada historia, con el mensaje terminado en la línea de co-autoría indicada
