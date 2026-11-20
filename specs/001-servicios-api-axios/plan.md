# Implementation Plan: Capa de servicios del frontend hacia el backend

**Branch**: `001-servicios-api-axios` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-servicios-api-axios/spec.md`

## Summary

Reemplazar el cliente `fetch` de `frontend/src/services/api.js` por una instancia **axios** (`baseURL` = `API_URL` actual, `timeout` 15 s) con dos interceptores: uno de request que adjunta `Authorization: Bearer` desde un proveedor de sesión registrable (`configurarSesion({ obtenerTokens, guardarTokens, alExpirar })`), y uno de response que normaliza todo error a `ApiError` (`status` 0 = sin conexión) y, ante un 401 de una petición que llevaba credencial, hace **una única** renovación compartida (`POST /api/refresh`, que rota el refresh token), persiste los tokens nuevos y reintenta una vez; si la renovación falla, avisa `alExpirar`. Sobre ese cliente se construyen siete servicios por recurso (auth, usuario, evento, categoría, compra, reseña, mensaje) que cubren todas las rutas que usan CU-01…CU-12. `AuthContext` registra el proveedor. Todo con TDD usando un adaptador axios falso (sin red) y sin cambiar el comportamiento de login y registro.

## Technical Context

**Language/Version**: JavaScript (ES2022, módulos ES vía Babel de Expo); React 19.3 / React Native 0.88

**Primary Dependencies**: Expo SDK ~58, expo-router, expo-secure-store; **nueva**: `axios` 1.x (restricción del usuario, ver [research R1](./research.md#r1-cliente-http-axios-instalado-en-el-workspace-frontend))

**Storage**: `expo-secure-store` para la sesión (sin cambios de clave ni formato). Backend en memoria, no se modifica.

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`; HTTP simulado con adaptador axios falso ([R7](./research.md#r7-estrategia-de-pruebas-sin-red))

**Target Platform**: Android, iOS y web (Expo)

**Project Type**: mobile-app (monorepo con API Express existente)

**Performance Goals**: 1 sola renovación por ráfaga de 401 (SC-003); sin sobrecarga perceptible por petición

**Constraints**: timeout 15 s; sin caché, reintentos de red ni modo offline (YAGNI); sin renovación proactiva; sin cambios en `backend/`

**Scale/Scope**: 1 cliente + 7 servicios ≈ 28 operaciones; 1 contexto modificado; 0 pantallas nuevas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio / regla | Evaluación | Estado |
|---|-------------------|-----------|--------|
| 1 | Arquitectura unidireccional (NON-NEGOTIABLE) | Aplica al backend, que no se toca. En el frontend se respeta el mismo espíritu: pantallas → `AuthContext` → servicios → `api.js`. Los servicios no importan UI; la dependencia inversa (sesión) se resuelve con el proveedor inyectado por `configurarSesion` (inyección de dependencias). | ✅ |
| 2 | TDD (NON-NEGOTIABLE) | Cada servicio y cada comportamiento del cliente se escribe primero como prueba → aprobación del usuario → rojo → implementación → refactor (FR-021). `tasks.md` debe incluir el gate de aprobación de pruebas antes de implementar. | ✅ |
| 3 | Persistencia en memoria (NON-NEGOTIABLE) | Backend sin cambios. El frontend solo guarda la sesión en `SecureStore` (ya existente; no es persistencia de dominio). | ✅ |
| 4 | Integridad de entidades (NON-NEGOTIABLE) | El cliente no valida ni altera transiciones: envía `PATCH` sin cuerpo y el backend aplica las reglas de `EstadoCompra` y cupo. | ✅ |
| 5 | Calidad, observabilidad, simplicidad | YAGNI: sin caché, sin dependencia de mocks extra, sin logging en cliente ([R10](./research.md#r10-observabilidad-en-el-frontend): el logging estructurado exigido es el del service layer del backend, ya presente). Compatibilidad: `authService` conserva nombres y firmas; `api.js` conserva `API_URL` y `ApiError`; solo se elimina `request`, interno y sin otros consumidores. | ✅ |
| 6 | JSDoc obligatorio | Docstring de archivo (propósito, owner, licencia) y JSDoc con `@param`/`@returns`/`@throws` (status posibles) en cada export; `@typedef` con `@property` para `ProveedorSesion` y `Sesion` (FR-022). | ✅ |
| — | Stack fijo | Expo SDK 58 + Expo Router + Jest se mantienen; axios es una librería HTTP, no cambia el stack. | ✅ |
| — | Casos de uso | Trazabilidad CU-01…CU-12 en el spec; cada servicio se mapea a sus CU. | ✅ |
| — | Workspaces | Cambios localizados en `frontend/` (más `package-lock.json` de la raíz). | ✅ |
| — | Lint/format | `npm run lint` y `npm run format` antes de cada commit. | ✅ |

**Resultado**: sin violaciones. **Re-check post-diseño**: los contratos y el modelo de datos no introducen dependencias nuevas fuera de axios, ni llamadas hacia capas superiores, ni lógica de dominio en el cliente → sigue ✅.

## Project Structure

### Documentation (this feature)

```text
specs/001-servicios-api-axios/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R10
├── data-model.md        # Fase 1: Sesion, ProveedorSesion, ApiError, marcas de config
├── quickstart.md        # Fase 1: cómo validar
├── contracts/
│   ├── cliente-api.md   # api.js: exports, interceptores, renovación
│   └── servicios.md     # 7 servicios: función → método, ruta, cuerpo, status
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
frontend/
├── package.json                      # + axios (y, si hace falta, axios en transformIgnorePatterns)
├── src/
│   ├── services/
│   │   ├── api.js                    # MODIFICADO: instancia axios, interceptores, configurarSesion, ApiError, API_URL
│   │   ├── authService.js            # MODIFICADO: mismas firmas, ahora sobre `cliente` con sinSesion
│   │   ├── usuarioService.js         # NUEVO
│   │   ├── eventoService.js          # NUEVO
│   │   ├── categoriaService.js       # NUEVO
│   │   ├── compraService.js          # NUEVO
│   │   ├── reseniaService.js         # NUEVO
│   │   ├── mensajeService.js         # NUEVO
│   │   └── validacion.js             # sin cambios (fuera de alcance)
│   └── auth/
│       └── AuthContext.jsx           # MODIFICADO: ref de sesión + configurarSesion al montar
└── __tests__/
    ├── helpers/
    │   └── adaptadorFalso.js         # NUEVO: adaptador axios simulado
    ├── services/
    │   ├── api-test.js               # NUEVO: interceptores, renovación, errores
    │   ├── authService-test.js       # REESCRITO: de fetch a adaptador; mismas aserciones de comportamiento
    │   ├── usuarioService-test.js    # NUEVO
    │   ├── eventoService-test.js     # NUEVO
    │   ├── categoriaService-test.js  # NUEVO
    │   ├── compraService-test.js     # NUEVO
    │   ├── reseniaService-test.js    # NUEVO
    │   └── mensajeService-test.js    # NUEVO
    ├── auth-AuthContext-test.jsx     # AMPLIADO: registro del proveedor, guardarTokens, alExpirar
    └── screens/{login,registro}-test.jsx  # SIN CAMBIOS (SC-004)
```

**Structure Decision**: monorepo existente; la feature vive entera en el workspace `frontend/`. Se mantiene la convención actual (`src/services/` para acceso a red, `src/auth/` para el contexto, pruebas en `__tests__/` espejando `src/`). `backend/` no se modifica.

## Diseño (resumen; detalle en contratos)

1. **`api.js`** — ver [contracts/cliente-api.md](./contracts/cliente-api.md). Estado de módulo: `proveedor` y `renovacionEnCurso`. Marcas de config `sinSesion`, `_conSesion`, `_reintentado` ([data-model](./data-model.md#marcas-internas-de-la-config-axios)).
2. **Servicios** — ver [contracts/servicios.md](./contracts/servicios.md). Funciones delgadas: `const { data } = await cliente.<método>(ruta, cuerpo?, config?)`; `return data`.
3. **`AuthContext`** — `sesionRef` sincronizado con el estado; en el montaje `configurarSesion({ obtenerTokens, guardarTokens: guardar, alExpirar })`, en el desmontaje `configurarSesion(null)`. `alExpirar` limpia estado y `SecureStore` sin llamar a logout ([R8](./research.md#r8-integración-con-authcontext)).

## Orden sugerido (TDD, para `/speckit-tasks`)

1. Instalar axios y verificar que Jest lo resuelve (R7). Helper `adaptadorFalso`.
2. **US2 + US1** (P1): pruebas de `api-test.js` → aprobación → rojo → `api.js`.
3. **US4** (P1): reescribir `authService-test.js` sobre el adaptador (mismas aserciones) → `authService.js`; correr pruebas de pantallas sin tocarlas.
4. **US1-4** (P1): pruebas de `AuthContext` (proveedor, persistencia de tokens rotados, expiración) → `AuthContext.jsx`.
5. **US3** (P2): un par prueba/servicio por recurso; independientes entre sí (paralelizables).
6. JSDoc, lint, format, `grep "fetch("` vacío, quickstart.

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| `jest-expo` resuelve axios a su build ESM y Jest no lo transforma | Agregar `axios` a la excepción de `transformIgnorePatterns` (tarea 1). |
| Dos refresh en paralelo invalidan la sesión (rotación) | Promesa compartida `renovacionEnCurso` + prueba de concurrencia. |
| El interceptor lee una sesión desactualizada tras renovar | El reintento usa el token devuelto por la renovación; `sesionRef` se actualiza en `guardar`. |
| Favoritos devuelven 404 hasta la feature 002 | Esperado y documentado en el contrato; no bloquea. |

## Complexity Tracking

Sin violaciones de la constitución que justificar.
