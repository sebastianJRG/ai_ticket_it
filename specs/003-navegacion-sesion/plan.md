# Implementation Plan: Navegación por rol y sesión

**Branch**: `003-navegacion-sesion` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-navegacion-sesion/spec.md`

## Summary

Armar el esqueleto de navegación del frontend con **Expo Router**: un Stack raíz que, mientras `AuthContext` restaura la sesión, muestra una pantalla de carga (sin parpadeo de login) y luego monta tres áreas: `(auth)` (login, registro), `(comprador)` (Tabs Explorar · Buscar · Favoritos · Compras · Perfil, con Explorar y Buscar públicas) y `organizador/` (Tabs Mis eventos · Crear · Mensajes · Perfil, todo con sesión). Las reglas de acceso viven en un módulo **puro** (`src/navegacion/reglas.js`: ruta inicial por rol, decisión de acceso por ruta y destino tras login con `volverA` validado), y cada layout de área las aplica con `<Redirect>`; las pestañas protegidas además interceptan `tabPress` del visitante para mandarlo a login con retorno. Se agregan seis componentes compartidos del design system (AppHeader, BottomNav, EmptyState, Skeleton, Toast + `ToastProvider`/`useToast`, Modal), una pantalla Perfil común a ambos roles (perfil desde `GET /api/usuarios`, cerrar sesión) y el aviso de sesión expirada inyectado en `AuthProvider`. Se elimina el `index` provisorio (pasa a ser un redirect) y login/registro solo cambian su destino tras éxito. Todo con TDD.

## Technical Context

**Language/Version**: JavaScript (ES2022, módulos ES vía Babel de Expo); React 19.3 / React Native 0.88

**Primary Dependencies**: Expo SDK ~58, `expo-router` 58.0.32 (Stack, `Tabs` con `tabBar` propio, `Redirect`, `useSegments`, `useLocalSearchParams`; React Navigation viene vendorizado dentro de expo-router), `react-native-safe-area-context`, `lucide-react-native` (vía `Icon`), `expo-secure-store` (sesión, sin cambios). **Sin dependencias nuevas** ([R8](./research.md#r8-toast-provider-propio-sin-librería), [R10](./research.md#r10-skeleton-animated-nativo-y-reducir-movimiento)).

**Storage**: N/A nuevo. La sesión sigue en `expo-secure-store` (clave y formato sin cambios). Backend en memoria, no se modifica.

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`; navegación integrada con `expo-router/testing-library` (`renderRouter`) y `AuthContext`/servicios simulados ([R11](./research.md#r11-estrategia-de-pruebas))

**Target Platform**: Android, iOS y web (Expo)

**Project Type**: mobile-app (monorepo con API Express existente)

**Performance Goals**: 0 frames de login visibles mientras se restaura la sesión (US1-3); visitante a Explorar en 1 toque desde login (SC-002)

**Constraints**: Solo navegación de Expo Router; `volverA` solo acepta rutas internas del área del rol (sin redirecciones abiertas); el "volver a la acción" es volver a la pantalla, sin re-ejecutarla; sin cambios en `backend/`; WCAG 2.2 AA y tema claro/oscuro (design-system/docs/accesibilidad.md)

**Scale/Scope**: 1 layout raíz + 3 layouts de área; 11 rutas (2 auth, 5 comprador, 4 organizador) + `index` redirect + 1 placeholder público de detalle; 6 componentes compartidos + 1 contexto de toasts + 1 pantalla Perfil compartida; 1 módulo de reglas puro

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio / regla | Evaluación | Estado |
|---|-------------------|-----------|--------|
| 1 | Arquitectura unidireccional (NON-NEGOTIABLE) | Aplica al backend, que no se toca. En el frontend: rutas/layouts → hooks/contextos (`AuthContext`, `ToastContext`, `usePerfil`) → servicios → `api.js`. `reglas.js` es puro (no importa React ni servicios). El aviso de expiración se **inyecta** en `AuthProvider` (prop `alExpirar`), así la sesión no depende de la UI ([R6](./research.md#r6-aviso-de-sesión-expirada-inyectado-en-authprovider)). | ✅ |
| 2 | TDD (NON-NEGOTIABLE) | Primero pruebas de `reglas.js`, de cada componente, de `ToastProvider`, de Perfil y de navegación integrada (`renderRouter`) → aprobación del usuario → rojo → implementación → refactor (FR-009). `tasks.md` debe incluir el gate de aprobación. | ✅ |
| 3 | Persistencia en memoria (NON-NEGOTIABLE) | Backend sin cambios. El frontend no agrega persistencia; la sesión en `SecureStore` ya existía y no es persistencia de dominio. | ✅ |
| 4 | Integridad de entidades (NON-NEGOTIABLE) | No toca `Compra`/`EstadoCompra` ni reglas de cupo; solo decide a qué pantalla se llega. El rol lo define el backend (`usuario.rol` de la sesión/perfil). | ✅ |
| 5 | Calidad, observabilidad, simplicidad | YAGNI: sin librerías de toast/modal/skeleton, sin `dots` alimentados con datos (la prop existe; la usan 006–008), sin re-ejecución de acciones tras login, sin bandeja de mensajes. Observabilidad: no se agrega logging en cliente (igual que 001 R10; el logging estructurado exigido es el del service layer del backend). Compatibilidad: login y registro conservan su comportamiento salvo el destino (FR-008); `AuthProvider` suma una prop opcional sin romper consumidores. | ✅ |
| 6 | JSDoc obligatorio | Docstring de archivo (propósito, owner, licencia) en cada archivo nuevo/modificado; JSDoc con `@param`/`@returns`/`@throws` en cada export y `@typedef` con `@property` para props de componentes, `DecisionAcceso`, `Aviso` y `TabDef` (FR-009). | ✅ |
| — | Stack fijo | Expo SDK 58 + Expo Router (única navegación) + Jest. | ✅ |
| — | Casos de uso | Habilita todos los CU (define cómo se llega a cada pantalla); CU-03 exige explorar sin sesión → Explorar/Buscar/detalle públicos. | ✅ |
| — | Workspaces | Cambios localizados en `frontend/`. | ✅ |
| — | Lint/format | `npm run lint` y `npm run format` antes de cada commit. | ✅ |

**Resultado**: sin violaciones. **Re-check post-diseño**: los contratos ([navegacion.md](./contracts/navegacion.md), [componentes.md](./contracts/componentes.md)) y el [modelo de datos](./data-model.md) no agregan dependencias, ni llamadas de servicios hacia la UI, ni lógica de dominio; la única modificación de un módulo existente con consumidores (`AuthProvider`) es aditiva → sigue ✅.

## Project Structure

### Documentation (this feature)

```text
specs/003-navegacion-sesion/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R13
├── data-model.md        # Fase 1: EstadoSesion, Area, TabDef, DecisionAcceso, Perfil, Aviso
├── quickstart.md        # Fase 1: cómo validar
├── contracts/
│   ├── navegacion.md    # Rutas, acceso por rol, volverA, destinos
│   └── componentes.md   # Props de los 6 componentes, useToast, Perfil
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── _layout.jsx                 # MOD: providers (Toast → Auth con alExpirar), PantallaCarga mientras restaura, Stack raíz
│   │   ├── index.jsx                   # MOD: deja de ser la pantalla provisoria → <Redirect> a rutaInicial(usuario)
│   │   ├── (auth)/
│   │   │   ├── _layout.jsx             # NUEVO: Stack sin header; con sesión → rutaInicial
│   │   │   ├── login.jsx               # MOVIDO desde app/login.jsx; destino = destinoTrasLogin(usuario, volverA)
│   │   │   └── registro.jsx            # MOVIDO desde app/registro.jsx; destino = destinoTrasRegistro(usuario, volverA)
│   │   ├── (comprador)/
│   │   │   ├── _layout.jsx             # NUEVO: Tabs + BottomNav comprador; guardia de área y de tabs protegidas
│   │   │   ├── explorar.jsx            # NUEVO placeholder (público; lo completa 004)
│   │   │   ├── buscar.jsx              # NUEVO placeholder (público; 004)
│   │   │   ├── favoritos.jsx           # NUEVO placeholder (sesión; 004)
│   │   │   ├── compras.jsx             # NUEVO placeholder (sesión; 006)
│   │   │   └── perfil.jsx              # NUEVO: monta <PantallaPerfil />
│   │   ├── organizador/
│   │   │   ├── _layout.jsx             # NUEVO: Tabs + BottomNav organizador; guardia de área
│   │   │   ├── eventos.jsx             # NUEVO placeholder "Mis eventos" (007)
│   │   │   ├── crear.jsx               # NUEVO placeholder "Crear evento" (007)
│   │   │   ├── mensajes.jsx            # NUEVO: EmptyState provisorio (comportamiento final en 007)
│   │   │   └── perfil.jsx              # NUEVO: monta <PantallaPerfil />
│   │   └── evento/
│   │       └── [idEvento].jsx          # NUEVO placeholder público del detalle (lo completa 005)
│   ├── navegacion/
│   │   └── reglas.js                   # NUEVO (puro): RUTAS, TABS_COMPRADOR/ORGANIZADOR, rutaInicial, decidirAcceso, destinoTrasLogin, destinoTrasRegistro, hrefLogin
│   ├── auth/
│   │   └── AuthContext.jsx             # MOD: prop opcional alExpirar (aviso a la UI)
│   ├── feedback/
│   │   └── ToastContext.jsx            # NUEVO: ToastProvider + useToast (cola, temporizadores)
│   ├── hooks/
│   │   └── usePerfil.js                # NUEVO: carga GET /api/usuarios con manejo 0/404
│   ├── pantallas/
│   │   └── PantallaPerfil.jsx          # NUEVO: perfil común a ambos roles + cerrar sesión
│   └── components/
│       ├── AppHeader.jsx               # NUEVO
│       ├── BottomNav.jsx               # NUEVO (tabBar de Tabs)
│       ├── EmptyState.jsx              # NUEVO
│       ├── Skeleton.jsx                # NUEVO
│       ├── Toast.jsx                   # NUEVO (presentacional)
│       ├── Modal.jsx                   # NUEVO
│       └── PantallaCarga.jsx           # NUEVO: estado de carga al restaurar sesión
└── __tests__/
    ├── navegacion/reglas-test.js               # NUEVO
    ├── navegacion/rutas-test.jsx               # NUEVO: renderRouter por sesión/rol (SC-001, SC-003)
    ├── components/{AppHeader,BottomNav,EmptyState,Skeleton,Toast,Modal}-test.jsx  # NUEVOS
    ├── feedback/ToastContext-test.jsx          # NUEVO
    ├── screens/perfil-test.jsx                 # NUEVO
    ├── auth-AuthContext-test.jsx               # MOD: caso alExpirar
    └── screens/{login,registro}-test.jsx       # MOD: ruta de import y destino tras éxito
```

**Structure Decision**: monorepo existente; todo el cambio vive en `frontend/`. Las rutas siguen la convención de Expo Router en `src/app/` (grupos `(auth)` y `(comprador)` sin segmento en la URL; `organizador/` como segmento real para no colisionar `/perfil`, ver [R1](./research.md#r1-estructura-de-rutas)). El código que no es ruta (reglas, contextos, hooks, pantallas compartidas, componentes) queda fuera de `src/app/`, como pide `frontend/AGENTS.md`.

## Complexity Tracking

> Sin violaciones de la constitución: no aplica.
