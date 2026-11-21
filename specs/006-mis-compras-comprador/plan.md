# Implementation Plan: Mis compras del comprador

**Branch**: `006-mis-compras-comprador` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-mis-compras-comprador/spec.md`

## Summary

Reemplazar la pantalla provisoria `/compras` (003) por **Mis compras** y agregar el **detalle de compra** en una ruta nueva `/compra/[idCompra]`, trazando a **CU-01, CU-07, CU-08 y CU-09**. Ambas pantallas usan un único hook `useMisCompras` sobre `GET /api/compras` (no hay ruta de una sola compra: el detalle la busca en el listado) ([R2](./research.md#r2-fuente-de-datos-listado-único-sin-detalle-individual)). La lista agrupa por pestaña Activas/Pasadas/Canceladas con contadores, más reciente primero ([R3](./research.md#r3-agrupación-por-pestañas-y-orden)), con `PurchaseCard` que muestra `StatusBadge` y los `diasRestantes` del servidor ([R4](./research.md#r4-estado-y-días-restantes-en-la-tarjeta)). Cancelar se ofrece solo si `esCancelable` (PENDIENTE/CONFIRMADA y evento futuro) y pasa por un `Modal` destructivo con una sola petición en curso; tras la respuesta se recarga el listado y se avisa con toast ([R5](./research.md#r5-cuándo-se-ofrece-cancelar), [R6](./research.md#r6-flujo-de-cancelación)). El detalle muestra resumen, pestañas Detalle/Chat (Chat provisorio hasta 008) y una `StatusTimeline` armada solo con el estado actual ([R9](./research.md#r9-línea-de-estado-statustimeline-sin-historial), [R10](./research.md#r10-pestañas-detalle--chat-del-detalle)). Con la compra UTILIZADA, `SeccionCalificacion` verifica en las reseñas públicas del evento si el comprador ya calificó y ofrece `RatingInput` + comentario, con validación previa y manejo de 400/403/409 ([R11](./research.md#r11-calificar-el-evento-una-vez-por-evento)). Sin dependencias nuevas y sin cambios en `backend/`. Todo con TDD.

## Technical Context

**Language/Version**: JavaScript (ES2022, módulos ES vía Babel de Expo); React 19.3 / React Native 0.88

**Primary Dependencies**: Expo SDK ~58, `expo-router` 58 (`useLocalSearchParams`, `useFocusEffect`, `useRouter`, `useCanGoBack`), `react-native-safe-area-context`, `lucide-react-native` (vía `Icon`), `axios` (vía servicios de 001: `listarMisCompras`, `cancelarCompra`, `crearResenia`, `listarReseniasEvento`). **Sin dependencias nuevas.**

**Storage**: N/A. Sin persistencia en el cliente; las compras y reseñas viven en el backend en memoria.

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`; pantallas con `expo-router/testing-library` (`renderRouter`); servicios simulados con `jest.mock`; promesas diferidas (`helpers/diferido.js`) para "en curso" y doble toque; `ahora` inyectable en la lógica pura ([R13](./research.md#r13-pruebas-tdd))

**Target Platform**: Android, iOS y web (Expo)

**Project Type**: mobile-app (monorepo con API Express existente)

**Performance Goals**: cancelar en exactamente 2 toques (SC-003); estado y días visibles sin abrir la compra (SC-002); 1 petición por carga de lista o detalle (+1 de reseñas solo si UTILIZADA)

**Constraints**: sin cambios en `backend/` (sin historial de estados, sin detalle individual, sin "mis reseñas"); 0 ofertas de cancelación para compras no cancelables (SC-004); el estado y `diasRestantes` son los del servidor; sin pago ("Pagar ahora" fuera de alcance); reglas de acceso solo en `reglas.js`; WCAG 2.2 AA (estado con color + ícono + texto) y tema claro/oscuro

**Scale/Scope**: 2 pantallas (1 reemplaza un placeholder, 1 nueva); 5 componentes presentacionales nuevos (`Tabs`, `PurchaseCard`, `PurchaseCardSkeleton`, `StatusTimeline`, `RatingInput`) + 2 compuestos (`ConfirmarCancelacion`, `SeccionCalificacion`); 3 hooks; 2 módulos puros nuevos + `reglas.js` (aditivo)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio / regla | Evaluación | Estado |
|---|-------------------|-----------|--------|
| 1 | Arquitectura unidireccional (NON-NEGOTIABLE) | Backend sin cambios. Frontend: pantallas → componentes compuestos (`ConfirmarCancelacion`, `SeccionCalificacion`) → hooks (`useMisCompras`, `useCancelarCompra`, `useCalificarEvento`) / contextos (`useAuth`, `useToast`) → servicios de 001 → `api.js`. Componentes de `src/components/` presentacionales (solo `useTheme`); `misCompras.js`, `calificacion.js` y `reglas.js` puros. | ✅ |
| 2 | TDD (NON-NEGOTIABLE) | Pruebas primero (módulos puros → componentes → hooks → reglas → pantallas) → aprobación del usuario → rojo → implementación → refactor (FR-007). `tasks.md` debe incluir el gate de aprobación. | ✅ |
| 3 | Persistencia en memoria (NON-NEGOTIABLE) | Sin persistencia nueva en el cliente: pestaña elegida y borrador de reseña son estado de pantalla; el listado se vuelve a pedir. | ✅ |
| 4 | Integridad de entidades (NON-NEGOTIABLE) | La app solo **pide** la transición a CANCELADA vía `PATCH …/cancelacion`; el backend valida estado y fecha (400). `esCancelable` replica la regla (PENDIENTE/CONFIRMADA y evento no ocurrido) solo para decidir qué mostrar. No se transiciona nada en el cliente (sin optimismo); tras responder se recarga el listado. La regla "una reseña por evento" la aplica el servidor (409); el cliente solo oculta la acción. | ✅ |
| 5 | Calidad, observabilidad, simplicidad | YAGNI: sin contexto global de compras, sin ruta de calificación, sin thumbnails (el DTO no trae imagen), sin historial inventado. Reusa `StatusBadge`, `Modal`, `ResumenCompra`, `EmptyState`, `Skeleton`, `useToast`, `RutaProtegida`, `mensajeError`. Observabilidad: sin logging en cliente (como 001–005); cancelaciones y reseñas ya se registran en el service layer del backend con `requestId`. Compatibilidad: `reglas.js` crece de forma aditiva; `/compras` conserva su URL. | ✅ |
| 6 | JSDoc obligatorio | Docstring de archivo (propósito, owner, licencia) en cada archivo nuevo/modificado; `@param`/`@returns`/`@throws` en cada export; `@typedef` + `@property` para props, `PasoLinea`, `ComprasAgrupadas`, `BorradorResenia` y estados de hooks. Verificado por `npm run lint` (`eslint-plugin-jsdoc`). | ✅ |
| — | Stack fijo | Expo SDK 58 + Expo Router + Jest. | ✅ |
| — | Casos de uso | CU-01 (estado + días), CU-07 (cancelar), CU-08 (solo no utilizada y evento futuro), CU-09 (puntuar y comentar con entrada utilizada). | ✅ |
| — | Workspaces | Cambios localizados en `frontend/` (más esta carpeta de specs). | ✅ |
| — | Lint/format | `npm run lint` y `npm run format` antes de cada commit. | ✅ |
| — | AGENTS.md | Ruta nueva `/compra/[idCompra]` registrada en `reglas.js` con prueba en `reglas-test.js`. Al implementar, sumar la ruta, `hrefCompra` y los componentes nuevos al mapa de navegación de AGENTS.md. | ✅ |

**Resultado**: sin violaciones. **Re-check post-diseño**: los contratos ([pantallas.md](./contracts/pantallas.md), [componentes.md](./contracts/componentes.md)) y el [modelo de datos](./data-model.md) no agregan dependencias, ni transiciones de estado en el cliente, ni llamadas de componentes presentacionales a servicios; el único archivo existente con consumidores que cambia (`reglas.js`) lo hace de forma aditiva → sigue ✅.

## Project Structure

### Documentation (this feature)

```text
specs/006-mis-compras-comprador/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R13
├── data-model.md        # Fase 1: Compra, PestanaCompras, PasoLinea, Reseña, estados de hooks
├── quickstart.md        # Fase 1: cómo validar
├── contracts/
│   ├── pantallas.md     # Rutas, acceso, /compras y /compra/[id]: peticiones, estados, cancelación, calificación
│   └── componentes.md   # Módulos puros, hooks, componentes compuestos y presentacionales
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (comprador)/
│   │   │   └── compras.jsx                 # MOD: Mis compras definitiva (US1, US2)
│   │   └── compra/
│   │       └── [idCompra].jsx              # NUEVO: detalle de compra (US2, US3, US4), en RutaProtegida
│   ├── compras/
│   │   ├── misCompras.js                   # NUEVO (puro): PESTANAS_COMPRAS, pestanaDeEstado, agruparPorPestana, esCancelable, cuerpoCancelacion, mensajeErrorCancelacion, pasosLinea
│   │   └── ConfirmarCancelacion.jsx        # NUEVO: Modal + useCancelarCompra + toast
│   ├── resenias/
│   │   ├── calificacion.js                 # NUEVO (puro): ESCALA_PUNTAJE, textoPuntaje, validarResenia, yaCalifico, mensajeErrorResenia
│   │   └── SeccionCalificacion.jsx         # NUEVO: botón + formulario inline
│   ├── navegacion/
│   │   └── reglas.js                       # MOD (aditivo): hrefCompra, rama /compra/:id
│   ├── hooks/
│   │   ├── useMisCompras.js                # NUEVO
│   │   ├── useCancelarCompra.js            # NUEVO: una sola petición en curso
│   │   └── useCalificarEvento.js           # NUEVO: verificación + envío
│   └── components/
│       ├── Tabs.jsx                        # NUEVO (underline | segmented)
│       ├── PurchaseCard.jsx                # NUEVO
│       ├── PurchaseCardSkeleton.jsx        # NUEVO
│       ├── StatusTimeline.jsx              # NUEVO
│       └── RatingInput.jsx                 # NUEVO
└── __tests__/
    ├── compras/misCompras-test.js                                       # NUEVO
    ├── compras/ConfirmarCancelacion-test.jsx                            # NUEVO
    ├── resenias/calificacion-test.js                                    # NUEVO
    ├── resenias/SeccionCalificacion-test.jsx                            # NUEVO
    ├── hooks/{useMisCompras,useCancelarCompra,useCalificarEvento}-test.jsx  # NUEVOS
    ├── components/{Tabs,PurchaseCard,PurchaseCardSkeleton,StatusTimeline,RatingInput}-test.jsx  # NUEVOS
    ├── navegacion/reglas-test.js                                        # MOD: /compra/:id × 3 roles, hrefCompra, destinoTrasLogin
    ├── screens/{mis-compras,detalle-compra}-test.jsx                    # NUEVOS
    └── helpers/comprasEjemplo.js                                        # MOD: crearCompraListado, COMPRAS_POR_ESTADO
```

**Structure Decision**: monorepo existente; todo el cambio vive en `frontend/`. Siguiendo 004/005, la lógica pura va por dominio fuera de `src/app/` (`src/compras/`, `src/resenias/`), los componentes compuestos junto a su dominio (como `SeccionResenias`), los hooks de datos en `src/hooks/` y los presentacionales del design system en `src/components/` (`Tabs` y `StatusBadge` los reutiliza 007; el detalle `/compra/[idCompra]` lo extiende 008 con el chat y 007/008 abren su acceso al organizador).

## Complexity Tracking

> Sin violaciones de la constitución: no aplica.
