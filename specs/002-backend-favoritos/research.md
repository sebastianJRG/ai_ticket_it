# Research: Favoritos del comprador (backend)

**Feature**: `002-backend-favoritos` | **Fecha**: 2026-11-20 | **Plan**: [plan.md](./plan.md)

No quedaron `NEEDS CLARIFICATION` en el Technical Context: el stack está fijado por la constitución y las rutas por la spec y por el cliente del frontend ya escrito (`frontend/src/services/usuarioService.js`, [contrato 001](../001-servicios-api-axios/contracts/servicios.md)). Las decisiones de abajo resuelven cómo encajar la feature en el código existente.

---

## R1. Estado actual del código de favoritos

**Hallazgo**: `Usuario.favoritos` existe (tipado `Evento[]`) y `UsuarioService` tiene `agregarAFavoritos` y `removerDeFavoritos`, pero:

- `agregarAFavoritos` **alterna** (si ya está, lo quita) → viola FR-002 (idempotencia).
- `removerDeFavoritos` **lanza error** si el evento no estaba → viola FR-003.
- Ninguno valida el ID ni que el evento exista (FR-005).
- Usuario inexistente lanza `Error` plano → el manejador central responde 400, no 404.
- Ambos mutan `usuario.favoritos` con `splice`/`push` sobre un clon **superficial** (ver R2).
- Ninguno se usa en rutas ni en pruebas (`grep` en `src/` y `tests/`). `UsuarioRepository.alternarFavorito` tampoco se usa.

**Decision**: reescribir (vía TDD) `agregarAFavoritos` y `removerDeFavoritos` con la semántica de la spec, conservando sus nombres, y agregar `listarFavoritos`. Como hoy no tienen consumidores, cambiar su valor de retorno (de `Usuario` a lista de IDs) no rompe nada (principio 5). `alternarFavorito` del repositorio no se toca ni se usa (YAGNI; borrarlo queda fuera de alcance).

**Rationale**: la spec pide reutilizar los métodos existentes; corregirlos es más simple que crear métodos paralelos y dejar los defectuosos.

**Alternatives considered**: métodos nuevos (`marcarFavorito`, …) dejando los viejos → código muerto y confuso; usar `alternarFavorito` → semántica de toggle incompatible con PUT/DELETE idempotentes.

## R2. Mutación compartida por el clon superficial del repositorio

**Hallazgo**: `RepositorioEnMemoria._clonar` hace `Object.assign` (copia superficial). El arreglo `favoritos` del clon devuelto por `buscarPorId` es **el mismo** que el del elemento almacenado: un `push`/`splice` modifica el estado guardado aunque nunca se llame a `actualizar`.

**Decision**: el servicio construye siempre un arreglo **nuevo** (`[...favoritos, { id }]` / `filter`) y persiste con `usuarioRepository.actualizar(usuario)`. No se modifica `RepositorioEnMemoria`.

**Rationale**: evita efectos laterales invisibles y deja la persistencia explícita (principio 3), sin tocar una clase base usada por todos los repositorios.

**Alternatives considered**: clonado profundo en el repositorio → cambio transversal con riesgo de regresiones (FR-008, SC-003), fuera del alcance.

## R3. Qué se guarda en `favoritos`

**Decision**: se guardan referencias mínimas `{ id: string }` (lo que ya hacía el código existente y compatible con `f.id`), en orden de agregado. Al listar, cada ID se resuelve contra `EventoRepository`; los que ya no existan se omiten.

**Rationale**: guardar el `Evento` completo dejaría copias desactualizadas (nombre, tipos de entrada, organizador) y duplicaría datos. Resolver al listar garantiza el formato vigente de `GET /api/eventos` (FR-006) y cubre el supuesto "si un evento dejara de existir, se omite".

**Alternatives considered**: guardar `Evento` completo → datos obsoletos; guardar `string[]` → contradice el tipo del modelo y obliga a cambiar `Usuario` sin necesidad.

## R4. Reparto de responsabilidades entre capas

**Decision**:

- **`UsuarioService`** (reglas de favoritos): valida el ID con `idEventoSchema` (400), verifica que el usuario exista (404), y en `agregarAFavoritos` verifica que el evento exista consultando **`EventoRepository`** inyectado (404). Devuelve la lista de IDs de favoritos.
- **`EventoService.obtenerPorIds(ids)`** (nuevo): resuelve IDs a eventos en el mismo orden, omite los inexistentes y agrega `puntajeOrganizador` reutilizando `_puntajesPorOrganizador` / `_conPuntaje`.
- **`FavoritoController`** (nuevo): toma el usuario del token, llama a `UsuarioService` y luego a `EventoService.obtenerPorIds`, y serializa con `aEventoRespuesta`.
- **Rutas** en `UsuariosRoutes` con `authMiddleware` + `requerirRol('COMPRADOR')`.

**Rationale**: respeta Router → Controller → Service → Repository sin llamadas servicio→servicio; las reglas de negocio quedan en servicios; el cálculo de `puntajeOrganizador` no se duplica (vive solo en `EventoService`). El controlador solo compone dos llamadas descendentes, igual que otros controladores componen DTOs.

**Alternatives considered**:

- `UsuarioService` inyectado con `EventoService` → llamada entre servicios, ambigua frente a la regla "solo la capa inmediata inferior".
- `UsuarioService` con `ReseniaRepository` y su propio cálculo de puntaje → duplica lógica de `EventoService`.
- Validar la existencia en el controlador con `eventoService.obtenerPorId` → saca una regla de negocio del servicio de favoritos.
- Métodos en `UsuariosController` → mezcla perfil/registro con favoritos; un controlador propio es más claro y testeable.

## R5. Inyección de dependencias sin romper consumidores

**Decision**: `new UsuarioService(usuarioRepository, eventoRepository, logger = console)`. El segundo y tercer parámetro son opcionales para que los usos existentes (`new UsuarioService(repositorio)` en pruebas) sigan funcionando; si se llama a `agregarAFavoritos` sin `eventoRepository` se lanza un error de configuración claro. `createApp` pasa el `eventoRepository` real. `UsuariosRoutes.init` recibe un parámetro más (`favoritoController`).

**Rationale**: FR-007/FR-008; las pruebas pueden inyectar repositorios nuevos o dobles.

## R6. Logging estructurado con ID de petición

**Hallazgo**: los servicios no registran nada hoy; el único precedente es `console.log(JSON.stringify({ evento: ... }))` en `src/index.js`. No existe ID de petición en el proyecto, y el principio 5 lo exige (junto con el rol) en **todas** las operaciones de la capa de servicio.

**Decision**:

1. **Middleware `asignarRequestId`** (nuevo, `backend/src/utils/requestId.js`), montado en `createApp` justo después de `express.json()`: asigna `req.id` = header `X-Request-Id` si es válido (1–128 caracteres de `[A-Za-z0-9_-]`), o si no un `crypto.randomUUID()`. La validación evita inyectar texto arbitrario en los logs. No agrega headers de respuesta (YAGNI).
2. **Contexto explícito**: el controlador pasa `{ requestId: req.id }` como último argumento opcional (`contexto = {}`) a cada método de servicio que usa. El servicio nunca lee `req` (no conoce HTTP).
3. **Logger inyectable** (por defecto `console`) en `UsuarioService` **y** `EventoService`. Cada operación nueva o modificada emite **una** línea JSON con `logger.info(JSON.stringify(...))`:

| Operación | `evento` | Campos |
|-----------|----------|--------|
| `UsuarioService.agregarAFavoritos` | `favorito_agregado` | `requestId`, `usuarioId`, `rol`, `eventoId`, `cantidad` |
| `UsuarioService.removerDeFavoritos` | `favorito_quitado` | `requestId`, `usuarioId`, `rol`, `eventoId`, `cantidad` |
| `UsuarioService.listarFavoritos` | `favoritos_listados` | `requestId`, `usuarioId`, `rol`, `cantidad` |
| `EventoService.obtenerPorIds` | `eventos_resueltos` | `requestId`, `solicitados`, `encontrados` |

`rol` sale del usuario leído del repositorio. `requestId` vale `null` si el llamador no pasa contexto (por ejemplo, pruebas unitarias directas). Las operaciones de servicio existentes que no se tocan en esta feature no se instrumentan (fuera de alcance; el principio se aplica a lo nuevo o modificado). El "estado de compra" del principio 5 no aplica: favoritos no toca compras.

En pruebas se inyecta un logger falso (`{ info: jest.fn() }`) para verificar el contenido y no ensuciar la salida.

**Rationale**: cumple el principio 5 sin dependencias nuevas y sin romper la capa de servicio con objetos de Express. Pasar el contexto como argumento es explícito y fácil de probar.

**Alternatives considered**:

- `AsyncLocalStorage` para propagar el ID sin argumentos → magia implícita, más difícil de probar; excesivo para 4 operaciones.
- Librería de logging (pino/winston, `express-request-id`) → dependencia nueva, YAGNI.
- Dejar el ID de petición fuera de alcance → viola un MUST de la constitución (rechazado en `/speckit-analyze`, hallazgo C1).
- Instrumentar todos los servicios existentes → cambio transversal fuera del alcance de la feature; queda como mejora aparte.

## R7. Rutas, métodos y colisiones

**Decision**:

| Método | Ruta | Respuesta OK |
|--------|------|--------------|
| GET | `/api/usuarios/favoritos` | 200 + `Evento[]` |
| PUT | `/api/usuarios/favoritos/:idEvento` | 200 + `Evento[]` actualizado |
| DELETE | `/api/usuarios/favoritos/:idEvento` | 200 + `Evento[]` actualizado |

Se declaran en el router **antes** de `/:idOrganizador/resenias`. No hay colisión real (distinta cantidad de segmentos), pero declararlas primero evita que una futura ruta `/:id` capture `favoritos`.

PUT y DELETE devuelven **200 con la lista** (no 201/204) porque FR-004 exige devolver la lista actualizada y ambas operaciones son idempotentes.

**Validación del ID**: `idEventoSchema` (texto, `trim`, mínimo 1). `/favoritos/%20` → 400. `/favoritos/` sin ID no coincide con la ruta y cae en el 404 genérico de Express (comportamiento estándar, documentado).

**Orden de verificaciones** (PUT): 401/403 (middleware) → 400 (ID) → 404 (usuario del token) → 404 (evento). DELETE no verifica existencia del evento (idempotente: quitar un ID desconocido devuelve la lista sin cambios).

## R8. Estrategia de pruebas

**Decision** (siguiendo los dos runners que ya usa `npm test`):

- **Integración `node:test`** en `backend/tests/favoritos.test.js`: app real con `createApp()` en puerto efímero, registro/login por HTTP; cubre todos los escenarios de aceptación y edge cases (SC-001), incluido que `GET /api/usuarios` sigue sin `favoritos`.
- **Unitarias Jest** en `backend/tests/unit/usuarios/favoritos.service.test.js`, `backend/tests/unit/usuarios/favoritos.controller.test.js` y `backend/tests/unit/eventos/eventos.obtenerPorIds.service.test.js`: repositorios en memoria nuevos por test (principio 3) y dobles `jest.fn()` para el controlador, con el mismo estilo que `usuario.service.test.js` y `usuarios.controller.test.js`.

**Rationale**: FR-009 y la puerta TDD de la constitución (prueba → aprobación del usuario → rojo → verde → refactor).
