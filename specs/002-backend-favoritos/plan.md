# Implementation Plan: Favoritos del comprador (backend)

**Branch**: `002-backend-favoritos` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-backend-favoritos/spec.md`

## Summary

Exponer tres rutas autenticadas solo para COMPRADOR bajo `/api/usuarios/favoritos` (GET listar, PUT agregar, DELETE quitar), que devuelven siempre la lista de favoritos con el mismo formato público que `GET /api/eventos`. Se corrigen con TDD los métodos existentes `UsuarioService.agregarAFavoritos` y `removerDeFavoritos` (hoy alternan, lanzan si no está, no validan ni dan 404) para que sean idempotentes, validen el ID (400), el usuario (404) y, al agregar, la existencia del evento (404) mediante un `EventoRepository` inyectado. Se guardan referencias `{ id }` en `Usuario.favoritos` y al listar se resuelven con un nuevo `EventoService.obtenerPorIds`, que reutiliza el cálculo de `puntajeOrganizador`. Un `FavoritoController` nuevo compone ambas llamadas y serializa con `aEventoRespuesta`. Un middleware nuevo asigna un ID de petición (`req.id`), que el controlador pasa como contexto a los servicios; cada operación nueva o modificada emite un log JSON con `requestId` y `rol` mediante un logger inyectable. Sin cambios de comportamiento en las rutas de usuarios existentes.

## Technical Context

**Language/Version**: JavaScript ES modules sobre Node.js 20

**Primary Dependencies**: Express 5.x, zod 4 (`idEventoSchema` existente), jsonwebtoken (vía `authMiddleware`). Sin dependencias nuevas.

**Storage**: en memoria (`UsuarioRepository`, `EventoRepository` sobre `RepositorioEnMemoria`). Sin cambios de esquema.

**Testing**: `node:test` para integración HTTP (`backend/tests/*.test.js`) + Jest 30 para unitarias (`backend/tests/unit/**`), ambos en `npm run test:backend` ([R8](./research.md#r8-estrategia-de-pruebas))

**Target Platform**: servidor Linux (API REST consumida por la app Expo)

**Project Type**: web-service (workspace `backend/` del monorepo)

**Performance Goals**: no críticos; listar = O(n) búsquedas por ID en memoria con n favoritos, más una pasada sobre reseñas para los puntajes

**Constraints**: idempotencia de PUT/DELETE; no exponer favoritos en perfil/usuario público; no romper rutas existentes (FR-008); cambios localizados en `backend/` + `AGENTS.md`

**Scale/Scope**: 3 rutas, 1 controlador nuevo, 1 middleware nuevo (ID de petición), 3 métodos de servicio (2 reescritos + 1 nuevo) + 1 método nuevo en `EventoService`, 5 archivos de prueba

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio / regla | Evaluación | Estado |
|---|-------------------|-----------|--------|
| 1 | Arquitectura unidireccional + DI (NON-NEGOTIABLE) | Router (`UsuariosRoutes`) → `FavoritoController` → `UsuarioService` / `EventoService` → `UsuarioRepository` / `EventoRepository`. Sin llamadas servicio→servicio ni hacia arriba. `EventoRepository` y `logger` se inyectan en `UsuarioService`; todo se arma en `createApp` ([R4](./research.md#r4-reparto-de-responsabilidades-entre-capas), [R5](./research.md#r5-inyección-de-dependencias-sin-romper-consumidores)). | ✅ |
| 2 | TDD (NON-NEGOTIABLE) | Pruebas de integración y unitarias primero → aprobación del usuario → rojo → implementación mínima → refactor (FR-009). `tasks.md` debe incluir la puerta de aprobación. | ✅ |
| 3 | Persistencia en memoria (NON-NEGOTIABLE) | Favoritos en `Usuario.favoritos` dentro de `UsuarioRepository`; pruebas con repositorios nuevos por test. Se evita la mutación compartida del clon superficial ([R2](./research.md#r2-mutación-compartida-por-el-clon-superficial-del-repositorio)). | ✅ |
| 4 | Integridad de entidades (NON-NEGOTIABLE) | No toca `EstadoCompra` ni cupos. Invariante nueva: favoritos sin duplicados y solo de eventos existentes al agregar. | ✅ |
| 5 | Calidad, observabilidad, simplicidad | Middleware `asignarRequestId` (`req.id`); el controlador pasa `{ requestId }` al servicio; las 4 operaciones de servicio nuevas o modificadas emiten un log JSON con `requestId` y `rol` (`favorito_agregado`, `favorito_quitado`, `favoritos_listados`, `eventos_resueltos`) ([R6](./research.md#r6-logging-estructurado-con-id-de-petición)). Sin librerías nuevas (YAGNI). Compatibilidad: parámetros nuevos opcionales; métodos modificados sin consumidores. | ✅ |
| 6 | JSDoc obligatorio | JSDoc completo (`@param`, `@returns`, `@throws`) en `FavoritoController`, métodos nuevos/reescritos y `UsuariosRoutes.init`; docstring de archivo (propósito, owner, licencia) en archivos nuevos; se corrige el JSDoc de `Usuario.favoritos`. | ✅ |
| — | Trazabilidad a CU | Traza a **CU-03** (explorar eventos): los favoritos guardan lo encontrado al buscar o explorar; US1–US3 derivan de CU-03 (ver spec, "Contexto"). | ✅ |
| — | Workflow: lint + workspace | ESLint/Prettier antes de commit; cambios solo en `backend/` (+ `AGENTS.md`, FR-010). | ✅ |

**Re-evaluación post-diseño (Phase 1)**: el diseño de [data-model.md](./data-model.md) y [contracts/favoritos.md](./contracts/favoritos.md) no introduce violaciones. Gates en verde.

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-favoritos/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── favoritos.md     # Phase 1: contrato HTTP
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.js                         # MOD: monta asignarRequestId; inyecta eventoRepository en UsuarioService; crea FavoritoController; lo pasa a UsuariosRoutes
│   ├── utils/requestId.js             # NUEVO: middleware asignarRequestId (req.id)
│   ├── routes/usuariosRoutes.js       # MOD: GET/PUT/DELETE /favoritos[/:idEvento] (antes de /:idOrganizador/resenias)
│   ├── controllers/favoritoController.js  # NUEVO: listar, agregar, quitar (pasan { requestId: req.id })
│   ├── services/usuarioService.js     # MOD: constructor (eventoRepository, logger); agregarAFavoritos, removerDeFavoritos reescritos; listarFavoritos nuevo; todos con contexto y log
│   ├── services/eventoService.js      # MOD: constructor (+ logger opcional); obtenerPorIds(ids, contexto) nuevo con log
│   └── models/usuario.js              # MOD (solo JSDoc): favoritos = Array<{id: string}>
└── tests/
    ├── favoritos.test.js                              # NUEVO (node:test, integración HTTP)
    └── unit/
        ├── utils/requestId.test.js                    # NUEVO (Jest)
        ├── usuarios/favoritos.service.test.js         # NUEVO (Jest)
        ├── usuarios/favoritos.controller.test.js      # NUEVO (Jest)
        └── eventos/eventos.obtenerPorIds.service.test.js  # NUEVO (Jest)

AGENTS.md                              # MOD: documenta las rutas de favoritos (FR-010)
```

**Structure Decision**: solo el workspace `backend/` (API Express en capas existente). No se tocan `dto/` (se reutilizan `idEventoSchema` y `aEventoRespuesta`), `RepositorioEnMemoria`, `UsuarioRepository` ni el frontend (su cliente ya apunta a estas rutas).

## Complexity Tracking

No hay violaciones de la constitución que justificar.
