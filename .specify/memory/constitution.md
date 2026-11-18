<!-- SYNC IMPACT REPORT
Version change: 1.2.0 → 1.3.0
Modified principles: none
Added sections: Use Cases (CU-01 … CU-12)
Added principles: none
Removed sections: none
Removed principles: none
Rationale: the Development Workflow requires acceptance criteria derived from the use cases, but the use cases were not recorded; they are now the traceable functional requirements for specs and the frontend.
Migration/compatibility: backward-compatible (only adds a section; the backend already fulfills all use cases).
Follow-up TODOs: none

Previous: 1.1.0 → 1.2.0 — new transition PENDIENTE → CANCELADA in principle 4 (needed by PATCH /api/compras/:idCompra/cancelacion).
Previous: 1.0.0 → 1.1.0 — added principle 6 (Mandatory JSDoc Documentation), Architecture & Technology Stack, Development Workflow & Quality Gates, Governance. -->

# Al Ticket It Constitution

<!-- Project Constitution for Al Ticket It — ticket selling and management platform. -->

## Core Principles

### 1. Domain-Driven & Unidirectional Architecture (NON-NEGOTIABLE)
<!-- Backend layers: Router -> Controller -> Service -> Repository -> Model -->
The backend MUST follow strict Object-Oriented Programming using classes, constructors, and methods. A strict unidirectional layer flow is enforced: Router → Controller → Service → Repository → Model. Lower layers MUST NOT call higher layers; only the immediately lower layer is invoked. Circular or upward calls are prohibited. Every service and repository MUST receive its dependencies (repositories, etc.) through dependency injection, so in-memory repositories are injected at runtime and mocked or restarted repositories are injected during Jest tests.

### 2. Test-Driven Development (NON-NEGOTIABLE)
Tests are written before implementation. The TDD cycle is strictly enforced: (1) write the test, (2) user approves the test, (3) run the tests until they fail, (4) implement the minimal code to pass, (5) refactor. No feature is complete without a passing test suite, and every new behavior MUST be covered by tests.

### 3. In-Memory Persistence (NON-NEGOTIABLE)
All data is persisted strictly in memory. There is no external database and no file-based persistence. The system resets to a known state between runs. In-memory state MUST be stored in well-defined repository classes that can be swapped for mocked repositories during tests.

### 4. Domain Entity Integrity (NON-NEGOTIABLE)
Domain entities (Usuario, Evento, TipoEntrada, Compra, EstadoCompra, Resenia) are protected by strict invariants and state-transition rules. EstadoCompra MUST only follow these transitions: PENDIENTE → CONFIRMADA; PENDIENTE → CANCELADA; CONFIRMADA → UTILIZADA; CONFIRMADA → CANCELADA; CONFIRMADA → REEMBOLSADA. UTILIZADA, CANCELADA, and REEMBOLSADA are terminal. Cancellation is only allowed from PENDIENTE or CONFIRMADA (never from UTILIZADA) and while the event has not yet occurred. Capacity MUST be validated transactionally during purchase: the total reserved quantity MUST NOT exceed the available capacity of a TipoEntrada.

### 5. Quality, Observability & Simplicity
The codebase MUST be observable, simple, and backward-compatible within the same major version. Structured logging (including request IDs, user roles, and purchase state) is required for all service-layer operations. New features MUST start simple and follow YAGNI (you aren't gonna need it). Breaking changes MUST be avoided within a major version; any necessary breaking change MUST be documented with a migration path in the changelog.

### 6. Mandatory JSDoc Documentation
<!-- Public API surface and modules must be self-documenting for onboarding -->
All exported functions, classes, methods, and object shapes MUST be preceded by JSDoc comments. File-level docstrings MUST describe the module's purpose, ownership, and license. Exported members MUST include @param (type + description), @returns, @throws, @template, and @property where applicable, accurately reflecting behavior. JSDoc MUST never be stale: it is regenerated with behavior changes and linted by the build gate. This rule exists to make the codebase readable, tool-aware (IDE autocomplete, type inference), and consistent for contributors and maintainers across the React Native and Node.js layers.

## Architecture & Technology Stack

<!-- Backend: Node.js + Express; Frontend: React Native + Expo; Persistence: in-memory; Testing: Jest -->

The technology stack is fixed and non-negotiable:
- Backend: Node.js with Express 5.x, written as ES modules (`"type": "module"`), with the repository located under `backend/src`.
- Frontend: React Native + Expo (SDK ~58), using Expo Router for all navigation. The app MUST follow mobile-first patterns and cross-platform compatibility.
- Persistence: strictly in-memory; no third-party database packages.
- Testing: Jest as the test runner for both backend and frontend.

## Use Cases

<!-- Requisitos funcionales vigentes. El backend ya los cumple; el frontend debe implementarlos. -->

Los siguientes casos de uso son los requisitos funcionales vigentes de la aplicación. Toda spec o feature MUST trazar sus criterios de aceptación a uno o más de estos casos de uso.

### Compras (comprador)

- **CU-01**: Como comprador, quiero poder visualizar mis compras, diferenciando con claridad el estado en el que se encuentran y cuántos días faltan para el evento en caso de estar en estado confirmada.
- **CU-07**: Como comprador, quiero poder cancelar una compra para obtener el reembolso en caso de no poder asistir al evento.
- **CU-12**: Como comprador, quiero poder realizar una compra sobre un Evento seleccionando uno de los tipos de entrada disponibles y la cantidad deseada, sin superar el cupo disponible.

### Eventos (organizador)

- **CU-02**: Como organizador, quiero poder visualizar las compras asociadas a un Evento en particular, diferenciando con claridad el estado en el que se encuentran y cuántas entradas quedan disponibles de cada tipo.
- **CU-04**: Como organizador, quiero poder crear un Evento ofreciendo distintos tipos de entrada, cada uno con su precio y cupo, permitiendo adaptarse a diferentes públicos y presupuestos.
- **CU-08**: Como organizador, quiero que los compradores puedan cancelar una compra siempre que la misma no se encuentre en estado utilizada y el evento aún no se haya realizado.

### Búsqueda y exploración (comprador)

- **CU-03**: Como comprador, quiero poder buscar Eventos de forma específica mediante una búsqueda textual o explorarlos por categorías.
- **CU-11**: Como comprador, al buscar Eventos, quiero poder ordenarlos por precio, fecha del evento y puntaje del organizador.

### Mensajería

- **CU-05**: Como comprador, quiero poder enviar mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.
- **CU-06**: Como organizador, quiero poder responder mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.

### Reseñas

- **CU-09**: Como organizador, quiero que una vez utilizada una entrada el comprador pueda puntuar el Evento de forma numérica y dejar un comentario escrito.
- **CU-10**: Como comprador, quiero que las reseñas de eventos anteriores se visualicen en los Eventos de cada organizador para conocer experiencias previas antes de comprar.

## Development Workflow & Quality Gates

<!-- TDD, review, quality gates -->

- TDD is mandatory: tests are written → user-approved → tests fail → then implementation → refactor.
- A pull request MUST include tests covering new behavior and MUST pass the full Jest suite before merge.
- Code review MUST verify the unidirectional layer rule, dependency injection, and in-memory persistence rule.
- New features MUST document acceptance criteria derived from the use cases before implementation.
- Lint and format checks (ESLint + Prettier) MUST run before commit.
- The monorepo is managed with npm workspaces; changes in `backend/` or `frontend/` MUST be localized to their workspace.

## Governance

<!-- Constitution supersedes all; amendments after documentation, approval, migration plan -->

The constitution is the supreme governance document for "Al Ticket It" and supersedes all other practices. Amendments require:
1. A documentation note describing the change.
2. A rationale tied to a project goal or rule above.
3. A migration or compatibility plan for any prior version.
4. A proposed version bump: MAJOR for removals or redefinitions, MINOR for new principles or sections, PATCH for clarifications.

Amendments MUST be approved by the project maintainer and then applied to `.specify/memory/constitution.md`. The version line MUST be updated using semantic versioning rules. Compliance is reviewed during every code review; violations of non-negotiable (NON-NEGOTIABLE) principles MUST block the change.

**Version**: 1.3.0 | **Ratified**: 2026-11-07 | **Last Amended**: 2026-11-17
