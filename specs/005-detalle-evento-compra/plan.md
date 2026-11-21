# Implementation Plan: Detalle de evento y compra de entradas

**Branch**: `005-detalle-evento-compra` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-detalle-evento-compra/spec.md`

## Summary

Reemplazar el detalle provisorio de `/evento/[idEvento]` (003) por el definitivo y agregar el checkout en una ruta nueva **`/evento/[idEvento]/comprar`**, trazando a **CU-12** y **CU-10**. El detalle pide `GET /api/eventos/:id` y, con el ID del organizador, `GET /api/usuarios/:id/resenias` en un hook aparte para que un fallo de reseñas no tape el detalle ([R3](./research.md#r3-carga-del-detalle-y-de-las-reseñas)); muestra el promedio del servidor, la cantidad y las 2 reseñas más recientes con "Ver todas" que expande en el lugar ([R4](./research.md#r4-reseñas-promedio-cantidad-y-más-recientes)), y una barra fija cuyo modo depende del rol y de si el evento ocurrió ([R5](./research.md#r5-cta-del-detalle-según-sesión-y-estado-del-evento)). El checkout está protegido por una regla nueva en `reglas.js` (visitante → login con `volverA` del checkout; organizador → detalle) ([R2](./research.md#r2-rutas-detalle-y-checkout)); se elige **un** tipo como radio y la cantidad con un `QuantityStepper` topado en el cupo total ([R6](./research.md#r6-checkout-elegir-exactamente-un-tipo-y-una-cantidad)); al confirmar, una ref síncrona garantiza una sola petición y los errores 400/403/404/409/0 se muestran en un aviso en línea ([R7](./research.md#r7-confirmar-una-sola-compra-y-manejo-de-errores)); con 201 la pantalla pasa a un estado de éxito con el total del servidor y "Ver mis compras" ([R8](./research.md#r8-después-de-crear-la-compra)). Sin dependencias nuevas y sin cambios en `backend/`. Todo con TDD.

## Technical Context

**Language/Version**: JavaScript (ES2022, módulos ES vía Babel de Expo); React 19.3 / React Native 0.88

**Primary Dependencies**: Expo SDK ~58, `expo-router` 58 (`useLocalSearchParams`, `usePathname`, `Redirect`, `useCanGoBack`), `expo-image` (hero), `expo-linear-gradient` (vía `ArteCategoria`), `react-native-safe-area-context` (barra fija), `lucide-react-native` (vía `Icon`), `axios` (vía servicios de 001: `obtenerEvento`, `listarReseniasOrganizador`, `crearCompra`). **Sin dependencias nuevas.**

**Storage**: N/A. Sin persistencia en el cliente; la compra se crea en el backend en memoria (estado PENDIENTE).

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`; pantallas con `expo-router/testing-library` (`renderRouter`); servicios simulados con `jest.mock`; promesas diferidas para "enviando" y doble toque; `ahora` inyectable en la lógica pura ([R10](./research.md#r10-pruebas-tdd))

**Target Platform**: Android, iOS y web (Expo)

**Project Type**: mobile-app (monorepo con API Express existente)

**Performance Goals**: compra completa en ≤ 4 interacciones desde el detalle (SC-001; 2 con un solo tipo y 1 entrada); detalle visible sin esperar a las reseñas

**Constraints**: sin cambios en `backend/` (el detalle no expone vendidas: el tope es el cupo total y el control real es el 409 del servidor); exactamente un tipo por compra; 0 compras duplicadas por doble toque (SC-003); el monto definitivo es el del servidor (FR-005); sin pasarela de pago (sin cargos extra); reglas de acceso solo en `reglas.js`; WCAG 2.2 AA y tema claro/oscuro

**Scale/Scope**: 2 pantallas (1 reemplaza un placeholder, 1 nueva); 6 componentes nuevos + 1 variante (`Rating`); 1 guardia de ruta (`RutaProtegida`); 3 hooks; 3 módulos puros (1 modificado: `reglas.js`, aditivo); 1 archivo movido (`evento/[idEvento].jsx` → `evento/[idEvento]/index.jsx`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio / regla | Evaluación | Estado |
|---|-------------------|-----------|--------|
| 1 | Arquitectura unidireccional (NON-NEGOTIABLE) | Backend sin cambios. Frontend: pantallas → hooks/contextos (`useEvento`, `useReseniasOrganizador`, `useCrearCompra`, `useAuth`, `useFavoritos`) → servicios de 001 → `api.js`. Componentes presentacionales (`TicketTypeRow`, `QuantityStepper`, `ReviewCard`, …) no importan servicios ni contextos; `detalle.js`, `checkout.js`, `resenias/presentacion.js` y `reglas.js` son puros. `RutaProtegida` depende de `AuthContext` y `reglas.js` (hacia abajo). | ✅ |
| 2 | TDD (NON-NEGOTIABLE) | Pruebas primero para módulos puros, hooks, componentes, reglas y pantallas → aprobación del usuario → rojo → implementación → refactor (FR-008). `tasks.md` debe incluir el gate de aprobación. | ✅ |
| 3 | Persistencia en memoria (NON-NEGOTIABLE) | Sin persistencia nueva en el cliente; la selección del checkout es estado de la pantalla; la compra la guarda el backend en memoria. | ✅ |
| 4 | Integridad de entidades (NON-NEGOTIABLE) | La app no transiciona `EstadoCompra`: la compra nace PENDIENTE en el backend. La validación transaccional del cupo sigue en el servidor (`compraService` con exclusión mutua); el tope del selector es solo una ayuda y el 409 se informa tal cual. El total lo calcula el servidor. | ✅ |
| 5 | Calidad, observabilidad, simplicidad | YAGNI: sin ruta de "todas las reseñas" (expande en el lugar), sin máximo por compra, sin parsear el mensaje de 409, sin pasarela ni cargos; reusa `ArteCategoria`, `AppHeader`, `Button`, `EmptyState`, `Skeleton`, `useFavoritos`. Observabilidad: sin logging en cliente (como 001/003/004); la creación de compras ya se registra en el service layer del backend con `requestId`. Compatibilidad: la URL del detalle no cambia; `Rating` y `reglas.js` crecen de forma aditiva. | ✅ |
| 6 | JSDoc obligatorio | Docstring de archivo (propósito, owner, licencia) en cada archivo nuevo/modificado; `@param`/`@returns`/`@throws` en cada export; `@typedef` + `@property` para props, `DetalleEvento`, `TipoEntradaVista`, `ModoCta`, `SeleccionCheckout` y estados de hooks. Verificado por `npm run lint` (`eslint-plugin-jsdoc`, desde 004). | ✅ |
| — | Stack fijo | Expo SDK 58 + Expo Router + Jest. | ✅ |
| — | Casos de uso | CU-12 (tipo + cantidad sin superar el cupo), CU-10 (reseñas de eventos anteriores del organizador). | ✅ |
| — | Workspaces | Cambios localizados en `frontend/` (más esta carpeta de specs). | ✅ |
| — | Lint/format | `npm run lint` y `npm run format` antes de cada commit. | ✅ |
| — | AGENTS.md | Toda ruta nueva se registra en `reglas.js` con su prueba en `reglas-test.js` → `/evento/[id]/comprar` lo hace. Al implementar, sumar la ruta y los componentes nuevos al mapa de navegación de AGENTS.md. | ✅ |

**Resultado**: sin violaciones. **Re-check post-diseño**: los contratos ([pantallas.md](./contracts/pantallas.md), [componentes.md](./contracts/componentes.md)) y el [modelo de datos](./data-model.md) no agregan dependencias, ni reglas de dominio en el cliente más allá de la ayuda de UI (tope por cupo total, documentado en la spec), ni llamadas de componentes presentacionales a servicios; los archivos modificados con consumidores (`reglas.js`, `Rating.jsx`) cambian de forma aditiva y el movimiento de `[idEvento].jsx` conserva la URL → sigue ✅.

## Project Structure

### Documentation (this feature)

```text
specs/005-detalle-evento-compra/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R10
├── data-model.md        # Fase 1: Evento, TipoEntrada, Resenia, Compra, DetalleEvento, ModoCta, SeleccionCheckout, estados de hooks
├── quickstart.md        # Fase 1: cómo validar
├── contracts/
│   ├── pantallas.md     # Rutas, acceso, /evento/[id] y /evento/[id]/comprar: peticiones, estados, CTA, errores
│   └── componentes.md   # Módulos puros, hooks, RutaProtegida y props de componentes
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   └── evento/
│   │       ├── [idEvento].jsx              # SE MUEVE → [idEvento]/index.jsx
│   │       └── [idEvento]/
│   │           ├── index.jsx               # MOD: detalle definitivo (US1, US2)
│   │           └── comprar.jsx             # NUEVO: checkout (US3), envuelto en RutaProtegida
│   ├── eventos/
│   │   └── detalle.js                      # NUEVO (puro): aDetalle, aTipoEntradaVista, textoPrecioDesde, modoCta, textoCta
│   ├── compras/
│   │   └── checkout.js                     # NUEVO (puro): seleccionInicial, limitesCantidad, ajustarCantidad, totalEstimado, textoConfirmar, mensajeErrorCompra
│   ├── resenias/
│   │   └── presentacion.js                 # NUEVO (puro): recientes, ordenRecientes, promedio, aResenia
│   ├── navegacion/
│   │   ├── reglas.js                       # MOD (aditivo): hrefEvento, hrefCheckout, rama /evento/:id/comprar
│   │   └── RutaProtegida.jsx               # NUEVO: guardia para rutas fuera de áreas con pestañas
│   ├── hooks/
│   │   ├── useEvento.js                    # NUEVO
│   │   ├── useReseniasOrganizador.js       # NUEVO
│   │   └── useCrearCompra.js               # NUEVO: una sola petición en curso
│   └── components/
│       ├── TicketTypeRow.jsx               # NUEVO (informativo | interactivo/radio)
│       ├── QuantityStepper.jsx             # NUEVO
│       ├── ReviewCard.jsx                  # NUEVO
│       ├── Avatar.jsx                      # NUEVO
│       ├── ResumenCompra.jsx               # NUEVO
│       ├── BarraAccion.jsx                 # NUEVO
│       └── Rating.jsx                      # MOD (aditivo): variante "estrellas" + cantidad
└── __tests__/
    ├── eventos/detalle-test.js                                   # NUEVO
    ├── compras/checkout-test.js                                  # NUEVO
    ├── resenias/presentacion-test.js                             # NUEVO
    ├── hooks/{useEvento,useReseniasOrganizador,useCrearCompra}-test.jsx  # NUEVOS
    ├── components/{TicketTypeRow,QuantityStepper,ReviewCard,Avatar,ResumenCompra,BarraAccion}-test.jsx  # NUEVOS
    ├── components/Rating-test.jsx                                # MOD
    ├── navegacion/RutaProtegida-test.jsx                         # NUEVO
    ├── navegacion/reglas-test.js                                 # MOD: checkout × 3 roles, href*, destinoTrasLogin
    ├── navegacion/rutas-test.jsx                                 # MOD: detalle real (simular servicios), volverA → checkout
    └── screens/{detalle-evento,checkout}-test.jsx                # NUEVOS
```

**Structure Decision**: monorepo existente; todo el cambio vive en `frontend/`. La ruta del detalle ya existe (003) y pasa a carpeta para anidar el checkout sin cambiar su URL. Siguiendo 004, la lógica pura va por dominio fuera de `src/app/` (`src/eventos/`, `src/compras/`, `src/resenias/`), los hooks de datos en `src/hooks/`, la guardia junto a las reglas en `src/navegacion/` y los componentes presentacionales del design system en `src/components/` (`TicketTypeRow`, `ReviewCard`, `Avatar` y `ResumenCompra` los reutilizan 006 y 007).

## Complexity Tracking

> Sin violaciones de la constitución: no aplica.
