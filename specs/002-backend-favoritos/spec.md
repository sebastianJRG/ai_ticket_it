# Feature Specification: Favoritos del comprador (backend)

**Feature Branch**: `002-backend-favoritos`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "002 backend-favoritos: rutas de backend para que el COMPRADOR liste, agregue y quite eventos favoritos (GET /api/usuarios/favoritos, PUT y DELETE /api/usuarios/favoritos/:idEvento), reutilizando los métodos existentes de UsuarioService/UsuarioRepository y validando que el evento exista. Única modificación de backend del plan del frontend; necesaria para la pestaña Favoritos del diseño."

## Contexto

El diseño del comprador incluye una pestaña **Favoritos** y un corazón en cada tarjeta de evento. El modelo `Usuario` ya guarda favoritos y el servicio tiene métodos para agregar/quitar, pero no hay rutas que lo expongan ni se valida que el evento exista. El usuario decidió agregar estas rutas al backend (excepción explícita a "no modificar el backend").

**Trazabilidad**: traza a **CU-03** ("Como comprador, quiero poder buscar Eventos de forma específica mediante una búsqueda textual o explorarlos por categorías"). Los favoritos son parte de la exploración: el comprador guarda los eventos que encontró al buscar o explorar para volver a ellos sin repetir la búsqueda. Todos los escenarios de aceptación (US1–US3) derivan de CU-03.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guardar un evento como favorito (Priority: P1)

Un comprador con sesión marca un evento como favorito para encontrarlo después.

**Why this priority**: Es la acción base; sin ella no hay lista.

**Independent Test**: Marcar un evento existente y verificar que aparece en la lista de favoritos del comprador.

**Acceptance Scenarios**:

1. **Given** un comprador con sesión y un evento existente, **When** lo marca como favorito, **Then** el evento queda en sus favoritos y se devuelve la lista actualizada.
2. **Given** un evento ya favorito, **When** lo vuelve a marcar, **Then** no se duplica (operación idempotente).
3. **Given** un evento inexistente, **When** intenta marcarlo, **Then** se rechaza con 404.

---

### User Story 2 - Quitar un favorito (Priority: P1)

**Why this priority**: Complemento necesario del corazón (toggle).

**Independent Test**: Quitar un favorito y verificar que ya no aparece.

**Acceptance Scenarios**:

1. **Given** un evento favorito, **When** lo quita, **Then** desaparece de la lista y se devuelve la lista actualizada.
2. **Given** un evento que no era favorito, **When** lo quita, **Then** la operación es exitosa y la lista no cambia (idempotente).

---

### User Story 3 - Ver mis favoritos (Priority: P2)

**Why this priority**: Alimenta la pestaña Favoritos.

**Independent Test**: Listar favoritos devuelve los eventos con el mismo formato que el listado público.

**Acceptance Scenarios**:

1. **Given** un comprador con favoritos, **When** los lista, **Then** recibe los eventos en orden de agregado, con el mismo formato que `GET /api/eventos` (organizador público, `puntajeOrganizador`).
2. **Given** un comprador sin favoritos, **When** los lista, **Then** recibe `[]`.

### Edge Cases

- Sin token → 401; token de ORGANIZADOR → 403.
- ID de evento vacío o inválido → 400.
- El usuario del token ya no existe → 404.
- Los favoritos nunca se exponen en el perfil (`GET /api/usuarios`) ni en el usuario público.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir a un COMPRADOR autenticado listar sus eventos favoritos.
- **FR-002**: El sistema MUST permitir agregar un evento existente a favoritos de forma idempotente.
- **FR-003**: El sistema MUST permitir quitar un evento de favoritos de forma idempotente.
- **FR-004**: Agregar y quitar MUST devolver la lista actualizada de favoritos.
- **FR-005**: El sistema MUST rechazar con 404 un evento inexistente al agregar, con 400 un ID inválido, con 401 sin sesión y con 403 si el rol no es COMPRADOR.
- **FR-006**: Los eventos devueltos MUST tener el mismo formato público que el listado de eventos (sin datos sensibles del organizador).
- **FR-007**: La nueva funcionalidad MUST respetar la arquitectura en capas e inyección de dependencias de la constitución, con logging estructurado (incluido el ID de petición y el rol del usuario) en cada operación de servicio, y JSDoc.
- **FR-008**: Las rutas existentes (`GET /api/usuarios`, `GET /api/usuarios/:idOrganizador/resenias`, `POST /api/usuarios`) MUST seguir funcionando igual.
- **FR-009**: Las pruebas MUST escribirse y aprobarse antes de implementar (TDD) y la suite completa del backend MUST seguir verde.
- **FR-010**: La documentación de rutas (AGENTS.md) MUST actualizarse.

### Key Entities

- **Favorito**: relación comprador ↔ evento, sin datos propios; orden = orden de agregado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un comprador puede marcar, ver y quitar favoritos; el 100% de los escenarios de aceptación tienen prueba automatizada.
- **SC-002**: Marcar dos veces el mismo evento deja exactamente 1 favorito.
- **SC-003**: 0 regresiones en la suite existente del backend.

## Assumptions

- Rutas: `GET /api/usuarios/favoritos`, `PUT /api/usuarios/favoritos/:idEvento`, `DELETE /api/usuarios/favoritos/:idEvento`, declaradas para no colisionar con `/:idOrganizador/resenias`.
- Persistencia en memoria (se pierden al reiniciar, como el resto de los datos).
- Si un evento favorito dejara de existir, se omite del listado (hoy no hay borrado de eventos).
- Se permite marcar como favorito un evento que ya ocurrió.
