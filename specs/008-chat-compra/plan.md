# Implementation Plan: Chat de una compra

**Branch**: `008-chat-compra` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-chat-compra/spec.md`

## Summary

Esta feature reemplaza la pestaña **Chat** provisoria del detalle de compra `/compra/[idCompra]` por un chat real, el mismo para el comprador y el organizador (FR-006). Traza a **CU-05** y **CU-06**.

- **Un solo compuesto** `ChatCompra` para las dos variantes del detalle. Con la pestaña Chat activa, la pantalla le pasa el resumen y las `Tabs` como encabezado del `FlatList` y el `MessageComposer` queda fijo abajo, pegado al teclado ([R1](./research.md#r1-dónde-vive-el-chat-y-cómo-convive-con-el-scroll-del-detalle)).
- **Actualización periódica** cada ~5 s con `setTimeout` encadenado, solo con la pantalla enfocada, la pestaña Chat visible y la app en primer plano (`usePantallaActiva`). Sin websockets ([R2](./research.md#r2-actualización-periódica-sin-websockets)).
- **Envío optimista** con una cola FIFO de a uno: "enviando" → confirmado, o error con "Reintentar" sin perder el texto ([R3](./research.md#r3-envío-optimista-cola-y-reintento)).
  - La función pura `fusionarMensajes` garantiza 0 duplicados y 0 pérdidas ante la carrera POST/GET y las respuestas viejas ([R4](./research.md#r4-sin-duplicados-ni-pérdidas-sc-002)).
- **Validación** igual a `crearMensajeSchema`: `trim` y largo de 1 a 1000, con un contador visible y sin truncar ([R5](./research.md#r5-validación-del-texto-igual-a-la-del-servidor)).
- **Errores** 400, 403 y 404 con mensajes claros. Los fallos periódicos son silenciosos; 403 y 404 detienen la consulta ([R6](./research.md#r6-errores-claros-fr-005)).
- **Presentación**: `ChatBubble` propias y ajenas, con autor, hora y separadores de día ([R7](./research.md#r7-presentación-de-los-mensajes)). El desplazamiento automático baja solo si el usuario ya estaba al final ([R8](./research.md#r8-desplazamiento-automático-us3-1)).

Sin dependencias nuevas ni rutas nuevas. En `backend/` hay un único cambio acotado: logs estructurados en `MensajeService` (`mensaje_creado`, `mensajes_listados`), para cumplir el principio 5 ([R11](./research.md#r11-observabilidad-del-chat)). Todo con TDD ([R10](./research.md#r10-pruebas-tdd)).

## Technical Context

**Language/Version**: JavaScript (ES2022, módulos ES vía Babel de Expo); React 19.3 / React Native 0.88

**Primary Dependencies**: Expo SDK ~58, `expo-router` 58 (`useFocusEffect`, `useLocalSearchParams`), React Native (`FlatList`, `KeyboardAvoidingView`, `AppState`), `react-native-safe-area-context`, `lucide-react-native` (vía `Icon`), `axios` (vía `listarMensajes` y `enviarMensaje` de 001). **Sin dependencias nuevas** (ni `react-native-keyboard-controller` ni websockets).

**Storage**: N/A. Los mensajes locales en vuelo son estado del hook y los mensajes viven en el backend en memoria.

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`.
- Temporizadores falsos (`jest.useFakeTimers()`) para el polling.
- `helpers/diferido.js` para las respuestas lentas y las carreras.
- `AppState` simulado.
- `ahora` inyectado en la lógica pura.
- Pantallas con `renderRouter` y servicios con `jest.mock`.

**Target Platform**: Android, iOS y web (Expo)

**Project Type**: mobile-app (monorepo con API Express existente)

**Performance Goals**:
- El mensaje propio se ve en menos de 100 ms (sin esperar red).
- El otro participante lo ve en menos de 10 s (consulta cada 5 s más la latencia) (SC-001).
- Como máximo una consulta GET y un POST en curso por chat.

**Constraints**:
- 0 consultas con el chat oculto (SC-003).
- 0 duplicados o pérdidas (SC-002).
- Paridad con la validación del servidor.
- Sin cambios de API en `backend/`: no hay leído/no leído, ni idempotencia, ni historial de estados. El único cambio en el backend son los logs de `MensajeService` (R11), sin efecto en las respuestas.
- WCAG 2.2 AA (la burbuja anuncia autor, hora y estado; el estado no se comunica solo con color; área táctil de 44) y tema claro/oscuro.

**Scale/Scope**:
- Pantallas: 1 modificada (las dos variantes de `/compra/[idCompra]`).
- Componentes presentacionales nuevos: 2 (`ChatBubble`, `MessageComposer`).
- Componentes compuestos nuevos: 1 (`ChatCompra`).
- Hooks nuevos: 2 (`useChatCompra`, `usePantallaActiva`).
- Módulos puros nuevos: 1 (`mensajes/chat.js`).
- Conversaciones de decenas de mensajes; el `FlatList` virtualiza si crecen.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio / regla | Evaluación | Estado |
|---|-------------------|-----------|--------|
| 1 | Arquitectura unidireccional (NON-NEGOTIABLE) | Backend sin cambios. Frontend: pantalla → `ChatCompra` (compuesto) → `useChatCompra` / `useAuth` → `mensajeService` (001) → `api.js`. `ChatBubble` y `MessageComposer` son presentacionales (solo `useTheme`). `chat.js` es puro. Ninguna capa baja llama a una alta. | ✅ |
| 2 | TDD (NON-NEGOTIABLE) | Las pruebas van primero (puros → presentacionales → hooks → compuesto → pantalla), luego la aprobación del usuario, el rojo, la implementación y el refactor (FR-007). `tasks.md` debe incluir el gate de aprobación. | ✅ |
| 3 | Persistencia en memoria (NON-NEGOTIABLE) | Sin persistencia en el cliente: los locales en vuelo viven en el estado del hook y se pierden al salir, igual que el resto de la app. | ✅ |
| 4 | Integridad de entidades (NON-NEGOTIABLE) | El chat no lee ni pide transiciones de `EstadoCompra`. Está habilitado en cualquier estado, que es la regla del backend (CU-05 y CU-06). No hay mensajes de sistema. | ✅ |
| 5 | Calidad, observabilidad, simplicidad | YAGNI: sin websockets, push, leído/no leído, adjuntos, `locked`, mensajes de sistema ni contexto global de chats. Reutiliza `mensajeService`, `useAuth`, `EmptyState`, `Skeleton`, `IconButton`, `Icon`, `Tabs`, `formatDate`, `mensajeError` y el patrón de secuencia de `useComprasEvento`. Observabilidad: sin logging en el cliente (igual que 001–007). `MensajeService` no emitía logs; esta feature le agrega `mensaje_creado` y `mensajes_listados` con `requestId`, `usuarioId`, `rol`, `compraId` y `estadoCompra` (sin el texto del mensaje), siguiendo el patrón `_log` de `UsuarioService` (R11). Deuda previa fuera de alcance: `CompraService`, `ReseniaService` y `CategoriaService` tampoco registran logs; queda para una feature aparte. Compatibilidad: solo se reemplaza un placeholder, sin cambios de contrato. | ✅ |
| 6 | JSDoc obligatorio | Docstring de archivo (propósito, owner y licencia) en cada archivo nuevo o modificado. `@param`, `@returns` y `@throws` en cada export. `@typedef` con `@property` para `MensajeLocal`, `ItemChat`, `ResultadoValidacion`, las props de los componentes y `EstadoChatCompra`. Lo verifica `npm run lint` (`eslint-plugin-jsdoc`). | ✅ |
| — | Stack fijo | Expo SDK 58 + Expo Router + Jest. | ✅ |
| — | Casos de uso | CU-05 (el comprador escribe en cualquier momento) y CU-06 (el organizador responde en cualquier momento). | ✅ |
| — | Workspaces | El chat vive en `frontend/`. En `backend/` solo cambian `MensajeService`, `MensajeController`, `app.js` y sus dos pruebas unitarias. Van en commits separados por workspace. | ✅ |
| — | Lint/format | `npm run lint` y `npm run format` antes de cada commit. | ✅ |
| — | AGENTS.md | No hay rutas nuevas, así que `reglas.js` no cambia. Al implementar hay que actualizar el mapa de AGENTS.md: quitar "La pestaña Chat es provisoria hasta la 008" (en dos lugares) y sumar `ChatCompra`, `useChatCompra`, `usePantallaActiva`, `ChatBubble`, `MessageComposer` y `src/mensajes/chat.js`. | ✅ |

**Resultado**: sin violaciones.

**Re-check post-diseño**: los contratos ([api-mensajes.md](./contracts/api-mensajes.md), [componentes.md](./contracts/componentes.md)) y el [modelo de datos](./data-model.md) no agregan dependencias ni rutas, no llaman a servicios desde componentes presentacionales y no tocan transiciones. La deduplicación por autor y texto (R4) es una heurística del cliente: está documentada y probada, y no cambia nada de lo que el servidor guarda. En el frontend, el único archivo existente que cambia es `compra/[idCompra].jsx`, que reemplaza el placeholder previsto desde 006/007. En el backend, el `logger` y el `contexto` entran como parámetros opcionales al final: el cambio es compatible y las respuestas HTTP no cambian → sigue ✅.

## Project Structure

### Documentation (this feature)

```text
specs/008-chat-compra/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R10
├── data-model.md        # Fase 1: Mensaje de la API, MensajeLocal, ItemChat, estados de hooks
├── quickstart.md        # Fase 1: cómo validar
├── contracts/
│   ├── api-mensajes.md  # API consumida (sin cambios) y mapeo de errores
│   └── componentes.md   # chat.js, hooks, ChatBubble, MessageComposer, ChatCompra, pantalla
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── services/mensajeService.js          # MOD: logger inyectable + mensaje_creado / mensajes_listados (R11)
│   ├── controllers/mensajeController.js    # MOD: pasa { requestId: req.id }
│   └── app.js                              # MOD: inyecta console como logger
└── tests/unit/mensajes/
    ├── mensaje.service.test.js             # MOD: logs emitidos y no emitidos
    └── mensaje.controller.test.js          # MOD: contexto con requestId

frontend/
├── src/
│   ├── app/
│   │   └── compra/
│   │       └── [idCompra].jsx              # MOD: pestaña Chat → ChatCompra en ambas variantes
│   ├── mensajes/
│   │   ├── chat.js                         # NUEVO (puro): validar, fusionar, agrupar, errores, estaAlFinal
│   │   └── ChatCompra.jsx                  # NUEVO: FlatList + composer + polling vía hook
│   ├── hooks/
│   │   ├── useChatCompra.js                # NUEVO: carga, consulta periódica, cola de envío, reintento
│   │   └── usePantallaActiva.js            # NUEVO: foco + AppState
│   └── components/
│       ├── ChatBubble.jsx                  # NUEVO
│       └── MessageComposer.jsx             # NUEVO
└── __tests__/
    ├── mensajes/chat-test.js                                   # NUEVO
    ├── mensajes/ChatCompra-test.jsx                            # NUEVO
    ├── components/{ChatBubble,MessageComposer}-test.jsx        # NUEVOS
    ├── hooks/{useChatCompra,usePantallaActiva}-test.jsx        # NUEVOS
    ├── screens/detalle-compra-test.jsx                         # MOD: Chat en ambas variantes
    └── helpers/mensajesEjemplo.js                              # NUEVO
```

**Structure Decision**: es el monorepo existente. El chat vive en `frontend/` y el backend solo suma los logs de `MensajeService` (R11). Sigue la convención de 004–007:

- La lógica pura y el compuesto van en su dominio, `src/mensajes/`, igual que `src/compras/` y `src/resenias/`.
- Los hooks de datos van en `src/hooks/`.
- Los presentacionales del design system van en `src/components/`.

No hay rutas nuevas: el chat es una pestaña del detalle de compra que 006 y 007 ya dejaron preparada.

## Complexity Tracking

> Sin violaciones de la constitución: no aplica.
