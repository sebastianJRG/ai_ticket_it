# Al Ticket It - AGENTS.md

## ⚠️ Mandatory: Constitution Review

**Before performing any task, you MUST read and adhere to** `.specify/memory/constitution.md`. This document contains the supreme governance rules for this project and supersedes all other practices. Violations of non-negotiable (NON-NEGOTIABLE) principles MUST block changes.

Key principles to remember:

- **Domain-Driven & Unidirectional Architecture**: Backend layers (Router → Controller → Service → Repository → Model). Lower layers MUST NOT call higher layers. Dependencies must be injected.
- **Test-Driven Development**: Tests written before implementation. TDD cycle must be strictly enforced.
- **In-Memory Persistence**: All data persisted in memory only. No external database. Repositories MUST be swapped for mocked versions during tests.
- **Domain Entity Integrity**: EstadoCompra transitions: PENDIENTE → {CONFIRMADA, CANCELADA}; CONFIRMADA → {UTILIZADA, CANCELADA, REEMBOLSADA}. Terminal states. Capacity validation must be transactional.
- **Quality, Observability & Simplicity**: Structured logging required. YAGNI. No breaking changes within major version without migration path.
- **Mandatory JSDoc Documentation**: All exported functions/classes/methods must have JSDoc with @param, @returns, @throws, @template, @property. File-level docstrings must describe purpose, ownership, and license.

## 🗺️ Quick Project Map

### Monorepo Structure (npm workspaces)

```
ai_ticket_it_v2/
├── package.json              # Root scripts and configs
├── backend/                  # Node.js + Express API
│   ├── package.json          # Backend dependencies (express, jwt, zod, bcrypt, jest)
│   ├── src/
│   │   ├── app.js            # Express app factory (createApp)
│   │   ├── index.js          # Entry point (creates app, starts server)
│   │   ├── routes/           # Route definitions
│   │   ├── controllers/      # HTTP controllers
│   │   ├── services/         # Business logic services
│   │   ├── repositories/     # In-memory repositories
│   │   ├── models/           # Domain entities with invariants
│   │   ├── dto/              # Data transfer objects
│   │   └── utils/            # Utilities (hashing)
│   └── tests/                # Jest test files
└── frontend/                 # React Native + Expo
    ├── package.json          # Expo dependencies and scripts
    ├── App.js                # Entry component
    └── .gitignore
```

### Key Technology Stack

- **Backend**: Node.js 20 + Express 5.x (ES modules), in-memory persistence
- **Frontend**: React Native + Expo SDK ~58, Expo Router for navigation
- **Testing**: Jest (both backend and frontend)
- **Lint/Format**: ESLint + Prettier

## 🛠️ Useful Package.json Commands

### Root (Monorepo level)

```bash
npm run format    # Format code with prettier
npm run lint      # Lint with eslint
npm run lint:fix  # Lint and auto-fix
npm run dev:backend   # Start backend dev server (nodemon)
npm run dev:backend:seed  # Igual, pero cargando los datos de prueba (SEED=true)
npm run dev:frontend  # Start frontend dev server (expo start)
npm run test:backend  # Run backend Jest tests
```

### Backend (`backend/`)

```bash
npm start     # Start production server (node src/index.js)
npm run dev   # Start dev server with --watch
npm run dev:seed  # Dev server con datos de prueba (SEED=true)
npm run test  # Run Jest tests (tests/*.test.js)
```

#### Datos de prueba (seed)

Con `SEED=true` (`npm run dev:seed` o `npm run dev:backend:seed`), `index.js` llama a `cargarDatosPrueba` (`backend/src/seed/datosPrueba.js`) antes de escuchar. Crea, por medio de los servicios, 5 categorías (Recitales, Teatro, Festivales, Conferencias, Deportes) y 3 eventos futuros por organizador (fechas relativas al arranque). Sin la variable, el backend arranca vacío; las pruebas nunca la cargan salvo `tests/seed.test.js`.

| Usuario | Rol | Contraseña |
|---------|-----|------------|
| `ana.comprador` | COMPRADOR | `Prueba123!` |
| `lucas.comprador` | COMPRADOR | `Prueba123!` |
| `bruno.organizador` | ORGANIZADOR | `Prueba123!` |
| `sofia.organizadora` | ORGANIZADOR | `Prueba123!` |

### Frontend (`frontend/`)

```bash
npm start     # Start Expo dev server
npm run android  # Run on Android
npm run ios    # Run on iOS
npm run web    # Run in web browser
npm run lint   # Lint (if configured)
npx expo-doctor  # Diagnose dependency/config issues
npx expo install <pkg>  # Install Expo-compatible packages
```

### Navigation (Frontend)

- All routes live in `frontend/src/app/` via Expo Router
- `_layout.jsx` files define navigators
- Non-route code (components, hooks, utils) goes outside `src/app/`
- Áreas (feature 003, `specs/003-navegacion-sesion/contracts/navegacion.md`):
  - `(auth)/` → `/login`, `/registro` (con sesión al entrar, redirige al destino del rol).
  - `(comprador)/` (Tabs) → `/explorar`, `/buscar` (públicas), `/favoritos`, `/compras`, `/perfil` (requieren sesión de COMPRADOR).
  - `organizador/` (Tabs) → `/organizador/eventos`, `/organizador/crear`, `/organizador/mensajes`, `/organizador/perfil` (requieren sesión de ORGANIZADOR).
  - `/evento/[idEvento]` → detalle público, apilado sobre las pestañas (`src/app/evento/[idEvento]/index.jsx`).
  - `/evento/[idEvento]/comprar` → checkout (feature 005, `specs/005-detalle-evento-compra/`): solo COMPRADOR; visitante → login con `volverA`; ORGANIZADOR → detalle. Lo protege `RutaProtegida` (`frontend/src/navegacion/RutaProtegida.jsx`), que aplica `decidirAcceso` en rutas fuera de un área con pestañas. Armar los enlaces con `hrefEvento(id)` y `hrefCheckout(id)` de `reglas.js`.
  - `/` redirige a la ruta inicial (visitante y comprador → `/explorar`; organizador → `/organizador/eventos`).
- Las reglas de acceso viven **solo** en `frontend/src/navegacion/reglas.js` (`decidirAcceso`, `rutaInicial`, `hrefLogin`, `destinoTrasLogin`, `destinoTrasRegistro`). Toda ruta nueva se registra ahí con su prueba en `frontend/__tests__/navegacion/reglas-test.js`.
- Para pedir sesión desde una acción: `router.push(hrefLogin(rutaActual))`. Login lee `volverA` y vuelve ahí solo si el rol lo permite (rutas internas; se ignoran URLs externas).
- Componentes compartidos: `AppHeader`, `BottomNav`, `EmptyState`, `Skeleton`, `Toast` (con `useToast()` de `src/feedback/ToastContext.jsx`) y `Modal`, en `frontend/src/components/`. Feature 004 suma `SearchBar`, `Chip`, `CategoryChips`, `SortSelector`, `BottomSheet` (sobre el `Modal` de RN), `Rating` (compact), `ArteCategoria`, `EventCard` (`feature` | `compact`) y `EventCardSkeleton` / `EsqueletosEventos`. Feature 005 suma `TicketTypeRow` (informativo | radio), `QuantityStepper`, `ReviewCard`, `Avatar`, `ResumenCompra`, `BarraAccion` y la variante `estrellas` de `Rating`. Son presentacionales: no importan servicios ni contextos.
- Explorar, Buscar y Favoritos (feature 004, `specs/004-explorar-busqueda-favoritos/`): las tarjetas se renderizan con `EventoConFavorito` (`frontend/src/eventos/`), que abre `/evento/<id>` y maneja el corazón según el rol (COMPRADOR alterna, visitante va a login con `volverA`, ORGANIZADOR no lo ve). El estado de favoritos vive en `FavoritosProvider` / `useFavoritos()` (`frontend/src/favoritos/FavoritosContext.jsx`, montado en el layout raíz; optimista con reversión y toast). Filtrar y ordenar lo hace siempre el servidor (`useEventos` descarta respuestas viejas; `src/eventos/orden.js` define las 6 opciones de orden; `src/eventos/presentacion.js` es la lógica pura de tarjeta).
- Detalle y checkout (feature 005): el detalle carga el evento con `useEvento` y las reseñas del organizador con `SeccionResenias` (`frontend/src/resenias/`, hook `useReseniasOrganizador`); un fallo de reseñas no tapa el detalle. La barra de compra la decide `modoCta` (`src/eventos/detalle.js`). El checkout elige un solo tipo de entrada con cantidad topada en el cupo total (el control real es el 409 del servidor), crea la compra con `useCrearCompra` (una sola petición en curso) y traduce errores con `mensajeErrorCompra` (`src/compras/checkout.js`).
- JSDoc: `npm run lint` verifica el JSDoc de `frontend/src/` con `eslint-plugin-jsdoc` (docstring `@file`, `@param` con tipo, `@returns`; tags `@owner` y `@license` permitidos).

### Authentication & Security

- Backend uses JWT (jsonwebtoken) for auth
- bcrypt for password hashing
- CORS configured for frontend origin
- Protected routes via middleware

### Repository Pattern

- All data in `backend/src/repositories/`
- `repositorioEnMemoria.js` is the in-memory implementation
- Repositories receive via dependency injection
- Mocked repositories injected during Jest tests

### State Transitions (Compra/EstadoCompra)

- PENDIENTE → CONFIRMADA
- PENDIENTE → CANCELADA (allowed while the event has not occurred)
- CONFIRMADA → UTILIZADA (terminal). Es automática: una tarea periódica (`INTERVALO_UTILIZADAS_MS`, 60 s por defecto) marca como UTILIZADA toda compra CONFIRMADA cuyo evento ya ocurrió; el historial (`CambioEstadoCompra`) queda con `quien: null` (sistema)
- CONFIRMADA → CANCELADA (allowed when not UTILIZADA and event not occurred)
- CONFIRMADA → REEMBOLSADA (terminal)

Rutas que las exponen (todas autenticadas, sin cuerpo, y fallan con 400 si el evento ya ocurrió):

- `PATCH /api/compras/:idCompra/cancelacion` — COMPRADOR (solo sus compras) u ORGANIZADOR (solo de sus eventos)
- `PATCH /api/compras/:idCompra/confirmacion` — ORGANIZADOR del evento
- `PATCH /api/compras/:idCompra/reembolso` — ORGANIZADOR del evento

Otras rutas de compras:

- `POST /api/compras` — COMPRADOR autenticado. Cuerpo `{ eventoId, tipoEntradaId, cantidad }`. Crea la compra en PENDIENTE; el total lo calcula el servidor. 400 (datos inválidos o evento ya ocurrido), 401, 403, 404, 409 (cupo insuficiente).
- `GET /api/compras` — COMPRADOR autenticado. Lista sus compras, en cualquier estado y en orden de creación (`[]` si no hay). Cada compra incluye `diasRestantes`: días hasta el evento (redondeado hacia arriba, mínimo 0) si está CONFIRMADA; `null` en otro estado. 401, 403 (otro rol).
- `GET /api/eventos/:idEvento/compras` — ORGANIZADOR dueño del evento (otro organizador: 403). Devuelve `{ compras, disponibilidad }`: todas las compras del evento en cualquier estado y en orden de creación (`[]` si no hay), y por cada tipo de entrada `{ tipoEntradaId, nombre, precio, cupo, vendidas, disponibles }` (PENDIENTE, CONFIRMADA y UTILIZADA ocupan cupo). 400 (ID inválido), 401, 403, 404.

### Usuarios (Usuario)

- `POST /api/usuarios` — público. Registro de un COMPRADOR u ORGANIZADOR.
- `GET /api/usuarios` — autenticada (COMPRADOR u ORGANIZADOR). Sin cuerpo. Devuelve el perfil del usuario del token: `{ id, nombre, apellido, nombreUsuario, rol, permissions }` (nunca hashes ni favoritos). 401 (sin token o token inválido), 403 (otro rol), 404 (el usuario del token ya no existe).

#### Favoritos del comprador

Solo COMPRADOR autenticado (el usuario sale del token), sin cuerpo. Las tres responden **200 con la lista de favoritos** en orden de agregado (`[]` si no hay), con el mismo formato que cada elemento de `GET /api/eventos` (organizador público, `puntajeOrganizador`). Los eventos que ya no existan se omiten. Contrato: `specs/002-backend-favoritos/contracts/favoritos.md`.

- `GET /api/usuarios/favoritos` — lista los favoritos. 401, 403 (otro rol), 404 (el usuario del token ya no existe).
- `PUT /api/usuarios/favoritos/:idEvento` — agrega el evento (idempotente: no duplica ni cambia su posición; se permite un evento que ya ocurrió). 400 (ID vacío), 401, 403, 404 (usuario o evento inexistente).
- `DELETE /api/usuarios/favoritos/:idEvento` — quita el evento (idempotente: si no estaba, 200 con la lista sin cambios; no verifica que el evento exista). 400 (ID vacío), 401, 403, 404 (usuario inexistente).

### Observabilidad (ID de petición)

- El middleware `asignarRequestId` (`backend/src/utils/requestId.js`) asigna `req.id`: usa el header `X-Request-Id` si es válido (1–128 caracteres de `[A-Za-z0-9_-]`) o genera un UUID.
- Los controladores pasan `{ requestId: req.id }` a los servicios, que emiten logs JSON con `requestId` mediante un `logger` inyectable (por defecto `console`).
- Eventos de log de favoritos: `favorito_agregado`, `favorito_quitado`, `favoritos_listados` y `eventos_resueltos`.

### Eventos (Evento)

- `GET /api/eventos` — público. Lista/busca eventos (query: `q`, `categoriaId`, `sortBy` = `precio` | `fecha` | `puntaje`, `order`). Cada evento incluye `puntajeOrganizador`: promedio de las reseñas de todos los eventos de su organizador (`null` si no tiene). `sortBy=puntaje` ordena por ese valor (descendente por defecto; los organizadores sin reseñas quedan al final).
- `GET /api/eventos/:idEvento` — público (sin token). Devuelve el detalle del evento con el mismo formato que cada elemento del listado (organizador en versión pública, sin hashes). 400 (ID inválido), 404 (no existe).
- `POST /api/eventos` — ORGANIZADOR autenticado. Crea un evento.

### Categorías (Categoria)

- `POST /api/categorias` — ORGANIZADOR autenticado. Cuerpo `{ nombre, descripcion }`. 201 con la categoría.
- `GET /api/categorias` — público (sin token). Lista todas las categorías en orden de creación (`[]` si no hay).

### Reseñas (Resenia)

- `POST /api/resenias` — COMPRADOR autenticado. Cuerpo `{ eventoId, detalle, puntuacion }` (puntuación entera 1–5, detalle hasta 1000 caracteres). El comprador sale del token.
  - Reglas: el evento ya debe haber ocurrido (400), el comprador debe tener una compra UTILIZADA de ese evento (403) y solo puede reseñar una vez cada evento (409).
- `GET /api/resenias/:idEvento` — público (sin token). Lista las reseñas del evento (404 si no existe).
- `GET /api/usuarios/:idOrganizador/resenias` — público (sin token). Lista las reseñas de todos los eventos del organizador, en orden de creación (`[]` si no hay). 400 (ID inválido), 404 (no existe o no es ORGANIZADOR).

### Mensajería (Mensaje)

Chat interno por compra entre el COMPRADOR dueño y el ORGANIZADOR del evento. Ambos pueden escribir primero y en cualquier momento (sin importar el estado de la compra ni la fecha del evento). El remitente sale del token.

- `POST /api/compras/:idCompra/mensajes` — autenticada (COMPRADOR u ORGANIZADOR). Cuerpo `{ mensaje }` (1–1000 caracteres). 201 con el mensaje.
- `GET /api/compras/:idCompra/mensajes` — autenticada (COMPRADOR u ORGANIZADOR). Lista el chat del más antiguo al más reciente.
  - Errores: 400 (ID o texto inválido), 401 (sin token), 403 (no es el comprador ni el organizador de esa compra), 404 (la compra no existe).

---

## 📝 Language & Naming Requirements

### Español para documentación y respuestas

- **Todas las respuestas y documentación deben estar en español.**
- Los comentarios de código deben estar en español cuando sea apropiado
- La documentación técnica debe escribirse en español
- Las respuestas a usuarios deben estar en español
