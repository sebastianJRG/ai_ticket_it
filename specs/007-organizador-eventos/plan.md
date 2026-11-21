# Implementation Plan: Eventos del organizador

**Branch**: `007-organizador-eventos` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-organizador-eventos/spec.md`

## Summary

Esta feature reemplaza las tres pantallas provisorias del organizador (Mis eventos, Crear y Mensajes) y agrega la vista **Compras del evento**, en la ruta nueva `/evento/[idEvento]/compras` ([R1](./research.md#r1-rutas-nuevas-y-acceso)). Traza a **CU-04, CU-02 y CU-08**, más CU-06 como acceso al chat.

- **Mis eventos**: filtra `GET /api/eventos` en el cliente por `organizador.id`, con los próximos primero ([R2](./research.md#r2-mis-eventos-filtrado-en-el-cliente)). Reutiliza `EventCard` ([R3](./research.md#r3-tarjeta-de-mis-eventos)).
- **Crear evento**: un borrador puro con tipos de entrada repetibles que tienen clave estable ([R6](./research.md#r6-tipos-de-entrada-repetibles)). Valida con las mismas reglas que `dto/evento.js` al perder el foco y al publicar ([R5](./research.md#r5-validación-del-formulario-igual-a-la-del-servidor)).
  - Fecha y hora en dos campos con máscara, en hora local, enviados como ISO ([R4](./research.md#r4-fecha-y-hora-sin-selector-nativo)).
  - Multimedia por URL con vista previa de la portada ([R7](./research.md#r7-multimedia-por-url)).
  - Categoría con un `Select` en BottomSheet y alta rápida inline ([R8](./research.md#r8-categoría-con-alta-rápida-select--bottomsheet)).
  - Una sola petición al publicar. Si falla, el borrador se conserva ([R13](./research.md#r13-publicar-y-doble-toque)).
- **Compras del evento**: `AvailabilitySummary` con los números del servidor y `Tabs` Pendientes/Confirmadas/Utilizadas/Canceladas con contadores ([R10](./research.md#r10-compras-del-evento-disponibilidad-y-pestañas)).
  - `OrganizerPurchaseRow` con las acciones que decide `accionesDisponibles` ([R11](./research.md#r11-acciones-de-estado-sobre-una-compra)). La función pura replica las transiciones del principio 4 y oculta todo si el evento ya ocurrió.
  - Confirmar se ejecuta directo. Reembolsar y cancelar pasan por un `Modal` destructivo.
  - Tras cada respuesta se recarga desde el servidor, sin actualización optimista.
- **Mensajes**: agrupa por evento las compras de cada evento propio (N + 1 peticiones) ([R12](./research.md#r12-pestaña-mensajes)). Abre el detalle de compra `/compra/[id]?evento=…`, que gana una variante del organizador con la pestaña Chat provisoria hasta 008 ([R9](./research.md#r9-detalle-de-compra-para-el-organizador-acceso-al-chat)).

Sin dependencias nuevas y sin cambios en `backend/`. Todo con TDD ([R14](./research.md#r14-pruebas-tdd)).

## Technical Context

**Language/Version**: JavaScript (ES2022, módulos ES vía Babel de Expo); React 19.3 / React Native 0.88

**Primary Dependencies**: Expo SDK ~58, `expo-router` 58 (`useLocalSearchParams`, `useFocusEffect`, `useRouter`, `useCanGoBack`), `expo-image` (vista previa de la portada, ya instalado), `react-native-safe-area-context`, `lucide-react-native` (vía `Icon`), `axios` (vía servicios de 001: `listarEventos`, `obtenerEvento`, `crearEvento`, `obtenerComprasEvento`, `listarCategorias`, `crearCategoria`, `confirmarCompra`, `reembolsarCompra`, `cancelarCompra`). **Sin dependencias nuevas** (ni datetimepicker ni zod en el cliente; ver R4 y R5).

**Storage**: N/A. El borrador del evento es estado de pantalla y los eventos, categorías y compras viven en el backend en memoria.

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`. Las pantallas se prueban con `renderRouter` y los servicios se simulan con `jest.mock`. `helpers/diferido.js` sirve para "en curso" y el doble toque. `ahora` se inyecta en la lógica pura.

**Target Platform**: Android, iOS y web (Expo)

**Project Type**: mobile-app (monorepo con API Express existente)

**Performance Goals**:
- Un evento con 2 tipos de entrada se crea en menos de 3 minutos (SC-001).
- Compras del evento: 2 peticiones en paralelo por carga y 1 recarga tras cada acción.
- Mensajes: N + 1 peticiones en paralelo, aceptable con pocos eventos (spec › Assumptions).

**Constraints**:
- Sin cambios en `backend/`: no hay "mis eventos", bandeja de mensajes, fecha de creación de la compra, borradores ni subida de archivos.
- Paridad total con las validaciones del servidor (SC-002).
- 0 acciones ofrecidas que el servidor rechazaría (SC-004).
- Disponibilidad y contadores siempre del servidor (SC-003).
- Reglas de acceso solo en `reglas.js`.
- WCAG 2.2 AA (barras con valor accesible, estado con color, ícono y texto) y tema claro/oscuro.

**Scale/Scope**:
- Pantallas: 5 (3 reemplazan placeholders, 1 nueva y 1 extendida).
- Componentes presentacionales nuevos: 5 (`Select`, `TicketTypeForm`, `AgregarTipoEntrada`, `AvailabilitySummary`, `OrganizerPurchaseRow`).
- Componentes compuestos nuevos: 2 (`SelectorCategoria`, `ConfirmarAccionCompra`).
- Hooks: 6 nuevos y 1 extendido (`useCategorias`).
- Módulos puros: 3 nuevos, más `reglas.js` (aditivo).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio / regla | Evaluación | Estado |
|---|-------------------|-----------|--------|
| 1 | Arquitectura unidireccional (NON-NEGOTIABLE) | Backend sin cambios. Frontend: pantallas → compuestos (`SelectorCategoria`, `ConfirmarAccionCompra`) → hooks / contextos (`useAuth`, `useToast`) → servicios de 001 → `api.js`. Los componentes de `src/components/` son presentacionales (solo `useTheme`). `formularioEvento.js`, `misEventos.js`, `gestionCompras.js` y `reglas.js` son puros. | ✅ |
| 2 | TDD (NON-NEGOTIABLE) | Pruebas primero (puros → componentes → hooks → reglas → pantallas), luego aprobación del usuario, rojo, implementación y refactor (FR-008). `tasks.md` debe incluir el gate de aprobación. | ✅ |
| 3 | Persistencia en memoria (NON-NEGOTIABLE) | Sin persistencia nueva en el cliente: el borrador vive en `useReducer`. "Borrador" no se ofrece porque el backend no lo guarda. | ✅ |
| 4 | Integridad de entidades (NON-NEGOTIABLE) | La app solo **pide** transiciones vía `PATCH …/{confirmacion,reembolso,cancelacion}`, y el backend valida estado y fecha (400). `accionesDisponibles` replica la tabla PENDIENTE → {CONFIRMADA, CANCELADA}; CONFIRMADA → {REEMBOLSADA, CANCELADA} con evento futuro, solo para decidir qué se muestra. UTILIZADA la pone el sistema y nunca se ofrece. No hay optimismo: se recarga tras cada respuesta. El cupo lo valida el servidor en la compra; el cliente solo muestra `disponibilidad`. | ✅ |
| 5 | Calidad, observabilidad, simplicidad | YAGNI: sin bandeja, sin no leídos, sin antigüedad relativa, sin edición ni borrado de eventos, sin selector de fecha nativo, sin contexto global de eventos. Reutiliza `EventCard`, `EmptyState`, `Tabs`, `StatusBadge`, `StatusTimeline`, `ResumenCompra`, `Modal`, `BottomSheet`, `TextField`, `BarraAccion`, `Avatar`, `useEvento`, `useToast`, `RutaProtegida` y `mensajeError`. Observabilidad: sin logging en el cliente (como 001–006); las altas y transiciones ya se registran en el backend con `requestId`. Compatibilidad: `reglas.js`, `hrefCompra` y `useCategorias` crecen de forma aditiva. El único cambio de comportamiento (el ORGANIZADOR ya no es redirigido desde `/compra/:id`) estaba previsto en 006 y se cubre con pruebas. | ✅ |
| 6 | JSDoc obligatorio | Docstring de archivo (propósito, owner y licencia) en cada archivo nuevo o modificado. `@param`, `@returns` y `@throws` en cada export. `@typedef` con `@property` para props, `BorradorEvento`, `TipoEntradaBorrador`, `ResumenDisponibilidad`, `AccionCompra` y los estados de los hooks. Lo verifica `npm run lint` (`eslint-plugin-jsdoc`). | ✅ |
| — | Stack fijo | Expo SDK 58 + Expo Router + Jest. | ✅ |
| — | Casos de uso | CU-04 (crear con varios tipos, precio y cupo), CU-02 (compras por estado y disponibilidad por tipo), CU-08 (cancelar solo si no está utilizada y el evento no ocurrió) y CU-06 (acceso al chat; el chat es de 008). | ✅ |
| — | Workspaces | Cambios localizados en `frontend/` (más esta carpeta de specs). | ✅ |
| — | Lint/format | `npm run lint` y `npm run format` antes de cada commit. | ✅ |
| — | AGENTS.md | La ruta nueva `/evento/[idEvento]/compras` y el acceso del organizador a `/compra/[idCompra]` se registran en `reglas.js` con prueba en `reglas-test.js`. Al implementar hay que sumar al mapa de navegación de AGENTS.md las rutas, `hrefComprasEvento`, el `?evento=` de `hrefCompra` y los componentes nuevos. | ✅ |

**Resultado**: sin violaciones.

**Re-check post-diseño**: los contratos ([pantallas.md](./contracts/pantallas.md), [componentes.md](./contracts/componentes.md)) y el [modelo de datos](./data-model.md) no agregan dependencias, ni transiciones en el cliente, ni llamadas a servicios desde componentes presentacionales. La única regla más estricta que el servidor (las URLs de imagen deben ser http/https, R7) está documentada y no impide enviar nada que el servidor aceptaría con sentido. Los archivos con consumidores que cambian (`reglas.js`, `useCategorias.js`, `compra/[idCompra].jsx`) lo hacen de forma aditiva o prevista → sigue ✅.

## Project Structure

### Documentation (this feature)

```text
specs/007-organizador-eventos/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R14
├── data-model.md        # Fase 1: entidades de la API, borrador, vistas, estados de hooks
├── quickstart.md        # Fase 1: cómo validar
├── contracts/
│   ├── pantallas.md     # Rutas, acceso y las 5 pantallas: peticiones, estados, acciones
│   └── componentes.md   # Módulos puros, hooks, compuestos y presentacionales
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── organizador/
│   │   │   ├── eventos.jsx                 # MOD: Mis eventos (US2)
│   │   │   ├── crear.jsx                   # MOD: Crear evento (US1)
│   │   │   └── mensajes.jsx                # MOD: Mensajes (US5)
│   │   ├── evento/[idEvento]/
│   │   │   └── compras.jsx                 # NUEVO: compras y disponibilidad (US3, US4), en RutaProtegida
│   │   └── compra/
│   │       └── [idCompra].jsx              # MOD: variante ORGANIZADOR (?evento=), Chat provisorio hasta 008
│   ├── eventos/
│   │   ├── formularioEvento.js             # NUEVO (puro): borrador, máscaras, validación, cuerpo
│   │   ├── misEventos.js                   # NUEVO (puro): separarMisEventos
│   │   └── SelectorCategoria.jsx           # NUEVO: Select + alta rápida
│   ├── compras/
│   │   ├── gestionCompras.js               # NUEVO (puro): pestañas, acciones, disponibilidad, agrupación
│   │   └── ConfirmarAccionCompra.jsx       # NUEVO: Modal destructivo reembolsar/cancelar
│   ├── navegacion/
│   │   └── reglas.js                       # MOD (aditivo): hrefComprasEvento, hrefCompra(id, {eventoId}), ramas
│   ├── hooks/
│   │   ├── useMisEventos.js                # NUEVO
│   │   ├── useCrearEvento.js               # NUEVO
│   │   ├── useCrearCategoria.js            # NUEVO
│   │   ├── useCategorias.js                # MOD (aditivo): agregar, recargar
│   │   ├── useComprasEvento.js             # NUEVO
│   │   ├── useAccionCompra.js              # NUEVO
│   │   └── useComprasOrganizador.js        # NUEVO
│   └── components/
│       ├── Select.jsx                      # NUEVO
│       ├── TicketTypeForm.jsx              # NUEVO
│       ├── AgregarTipoEntrada.jsx          # NUEVO
│       ├── AvailabilitySummary.jsx         # NUEVO
│       └── OrganizerPurchaseRow.jsx        # NUEVO
└── __tests__/
    ├── eventos/{formularioEvento,misEventos}-test.js                                    # NUEVOS
    ├── eventos/SelectorCategoria-test.jsx                                               # NUEVO
    ├── compras/gestionCompras-test.js                                                   # NUEVO
    ├── compras/ConfirmarAccionCompra-test.jsx                                           # NUEVO
    ├── components/{Select,TicketTypeForm,AgregarTipoEntrada,AvailabilitySummary,OrganizerPurchaseRow}-test.jsx  # NUEVOS
    ├── hooks/{useMisEventos,useCrearEvento,useCrearCategoria,useComprasEvento,useAccionCompra,useComprasOrganizador}-test.jsx  # NUEVOS
    ├── hooks/useCategorias-test.jsx                                                     # MOD
    ├── navegacion/reglas-test.js                                                        # MOD
    ├── screens/{mis-eventos,crear-evento,compras-evento,mensajes-organizador}-test.jsx  # NUEVOS
    ├── screens/detalle-compra-test.jsx                                                  # MOD: variante organizador
    └── helpers/{eventosEjemplo,comprasEjemplo}.js                                       # MOD
```

**Structure Decision**: es el monorepo existente y todo el cambio vive en `frontend/`. Sigue la convención de 004–006:

- La lógica pura va por dominio, fuera de `src/app/` (`src/eventos/`, `src/compras/`).
- Los compuestos van junto a su dominio.
- Los hooks de datos van en `src/hooks/`.
- Los presentacionales del design system van en `src/components/`.

Las compras del evento cuelgan de `/evento/<id>/compras` (igual que el checkout) y no de una pestaña, para tener pila y guardia propias (R1). La 008 reemplaza la pestaña Chat del detalle de compra compartido.

## Complexity Tracking

> Sin violaciones de la constitución: no aplica.
