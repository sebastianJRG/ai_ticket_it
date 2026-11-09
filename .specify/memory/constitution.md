<!-- SYNC IMPACT REPORT
Version change: 1.0.0 → 1.1.0
Modified principles: none (principles added; none renamed)
Added sections: Architecture & Technology Stack, Development Workflow & Quality Gates, Governance
Added principles: 6. Mandatory JSDoc Documentation
Removed sections: none
Removed principles: none
Follow-up TODOs: none (all placeholders resolved) -->

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
Domain entities (Usuario, Evento, TipoEntrada, Compra, EstadoCompra, Resenia) are protected by strict invariants and state-transition rules. EstadoCompra MUST only follow these transitions: PENDIENTE → CONFIRMADA; CONFIRMADA → UTILIZADA; CONFIRMADA → CANCELADA; CONFIRMADA → REEMBOLSADA. UTILIZADA, CANCELADA, and REEMBOLSADA are terminal. Cancellation is only allowed when EstadoCompra is not UTILIZADA and the event has not yet occurred. Capacity MUST be validated transactionally during purchase: the total reserved quantity MUST NOT exceed the available capacity of a TipoEntrada.

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

**Version**: 1.1.0 | **Ratified**: 2026-11-07 | **Last Amended**: 2026-11-07
