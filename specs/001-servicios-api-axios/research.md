# Research: Capa de servicios del frontend hacia el backend

**Feature**: 001-servicios-api-axios | **Fecha**: 2026-11-20

No quedaron `NEEDS CLARIFICATION` en el Technical Context: el spec fija el cliente (axios), el timeout (15 s), el contrato del proveedor de sesión y la lista de operaciones. Este documento registra las decisiones de diseño que el spec deja abiertas.

## R1. Cliente HTTP: axios, instalado en el workspace `frontend`

- **Decision**: agregar `axios` (rama 1.x estable, versión exacta fijada en `package-lock.json` al instalar) como dependencia de `frontend/` con `npx expo install axios` (al no ser paquete gestionado por Expo, cae a `npm install` dentro del workspace).
- **Rationale**: restricción explícita del usuario. axios en React Native usa el adaptador XHR, compatible con Android, iOS y web sin polyfills; soporta `timeout`, interceptores e instancias.
- **Alternatives considered**: mantener `fetch` (descartado por el usuario); `ky`/`ofetch` (no cumplen la restricción).

## R2. Dónde vive el cliente: se conserva `src/services/api.js`

- **Decision**: `api.js` pasa a exportar la instancia axios (`cliente`), `API_URL`, `ApiError` y `configurarSesion`. Se elimina `request` (su único consumidor es `authService`).
- **Rationale**: las pruebas de pantallas importan `ApiError` desde `src/services/api`; conservar el módulo evita tocar pruebas existentes (SC-004) y mantiene el mismo cálculo de `API_URL` (FR-001).
- **Alternatives considered**: nuevo `cliente.js` + `api.js` como re-export (dos módulos para lo mismo; YAGNI).

## R3. Cómo se marcan las rutas sin sesión

- **Decision**: opción de configuración propia `sinSesion: true` en las llamadas de `authService` (login, registro, refresh, logout). El interceptor de request no adjunta credencial a esas peticiones y el de response nunca renueva por ellas.
- **Rationale**: `POST /api/usuarios` (registro, público) y `GET /api/usuarios` (perfil, autenticado) comparten ruta; distinguir por URL exigiría también el método y sería frágil. Una marca explícita en la llamada es local y testeable. axios conserva claves desconocidas en `config`, que vuelven en `error.config`.
- **Alternatives considered**: lista de rutas excluidas en el interceptor (acopla el cliente a cada ruta, ambigua para `/api/usuarios`).

## R4. Qué peticiones llevan credencial y cuáles pueden renovar

- **Decision**: el interceptor de request adjunta `Authorization: Bearer <accessToken>` a toda petición sin `sinSesion` cuando el proveedor devuelve un `accessToken`, incluidas las públicas. Marca la config con `_conSesion = true`. Solo una respuesta 401 con `_conSesion && !_reintentado` dispara la renovación.
- **Rationale**: el `authMiddleware` del backend ignora un token inválido en rutas públicas (`req.user = null`), así que adjuntarlo no tiene costo y simplifica el interceptor. Usar `_conSesion` cumple "petición que llevaba credencial" (FR-004) y el edge case "sin sesión guardada → no renovar". `_reintentado` impide una segunda renovación (edge case de bucle).
- **Alternatives considered**: adjuntar el token solo en rutas autenticadas (pediría a cada servicio declarar si es público; más superficie sin beneficio).

## R5. Deduplicación de la renovación

- **Decision**: variable de módulo `renovacionEnCurso` (promesa). La primera petición con 401 la crea; las demás esperan la misma. Al terminar (bien o mal) se limpia en `finally`. La promesa: lee `refreshToken` del proveedor → `POST /api/refresh` con `sinSesion` → `guardarTokens(respuesta)` → devuelve el nuevo `accessToken`. Si falla, o no hay `refreshToken`, llama a `alExpirar()` **una vez** dentro de la promesa compartida y rechaza.
- **Rationale**: cumple FR-005/SC-003 (N peticiones → 1 refresh) y que la expiración se notifique una sola vez aunque haya N peticiones pendientes. El backend rota el refresh token en cada uso, así que dos refresh paralelos invalidarían la sesión: la deduplicación es necesaria, no una optimización.
- **Alternatives considered**: cola de peticiones fallidas con flag `estaRenovando` (más código, mismo efecto); renovación proactiva por `exp` del JWT (fuera de alcance según Assumptions).

## R6. Normalización de errores

- **Decision**: interceptor de response (rama de error) → siempre `ApiError`:
  - sin `error.response` (red caída, `ECONNABORTED`/`ETIMEDOUT` por timeout, `ERR_NETWORK`) → `status` 0, "No pudimos conectar con el servidor. Revisá tu conexión.";
  - con respuesta → `status` HTTP real; mensaje `response.data?.message` si es string no vacío, si no "Ocurrió un error inesperado.".
  - Cuando falla la renovación, la petición original rechaza con el `ApiError` de su 401 original (status 401, mensaje del backend).
- **Rationale**: mismo contrato que el `request` actual (US2, FR-008/009), ahora para todas las operaciones.
- **Alternatives considered**: propagar `AxiosError` y normalizar en cada servicio (duplicación; las pantallas verían dos tipos de error).

## R7. Estrategia de pruebas sin red

- **Decision**: sustituir el **adaptador** de la instancia (`cliente.defaults.adapter = jest.fn(...)`) en lugar de auto-mockear el módulo `axios`. El adaptador falso recibe la `config` final (método, `url`, `params`, `data`, `headers`) y resuelve `{ data, status, headers, config }` o rechaza con un `AxiosError` armado con `response`. Un helper de prueba (`__tests__/helpers/adaptadorFalso.js`) encapsula esto.
- **Rationale**: `jest.mock('axios')` reemplaza `create` e interceptores por stubs y dejaría sin probar justo lo crítico (renovación, deduplicación, normalización). Con el adaptador falso corren los interceptores reales y no se toca la red (FR-021). No agrega dependencias (`axios-mock-adapter` sería una más; YAGNI).
- **Alternatives considered**: `axios-mock-adapter` (dependencia extra), `msw` (servidor de red simulado, excesivo para unidades), `jest.mock('axios')` (no prueba interceptores).
- **Riesgo a verificar en la primera tarea**: que `jest-expo` resuelva axios a su build CommonJS. Si importa el ESM (`index.js`), agregar `axios` a la lista de excepción de `transformIgnorePatterns` en `frontend/package.json`.

## R8. Integración con `AuthContext`

- **Decision**: `AuthProvider` mantiene la sesión también en un `useRef` (actualizado en el mismo punto donde se hace `setSesion`) y, en un `useEffect` de montaje, llama a `configurarSesion({ obtenerTokens, guardarTokens, alExpirar })`; al desmontar, `configurarSesion(null)`.
  - `obtenerTokens` → `{ accessToken, refreshToken }` desde el ref (o `null`).
  - `guardarTokens(nueva)` → reutiliza `guardar` (estado + `SecureStore`); la respuesta del refresh ya trae `{ accessToken, refreshToken, usuario }`.
  - `alExpirar` → limpia estado y borra `SecureStore` **sin** llamar a `/api/logout` (el refresh ya es inválido).
- **Rationale**: el ref evita registrar de nuevo el proveedor en cada cambio de sesión y garantiza que el interceptor lea el valor vigente. La dependencia va de UI → servicios; los servicios solo conocen el contrato del proveedor (FR-003, FR-019).
- **Alternatives considered**: que `api.js` lea `SecureStore` directamente (acopla servicios a persistencia y duplica la fuente de verdad); pasar `token` como parámetro a cada operación (contradice FR-002).

## R9. Filtros vacíos y codificación de IDs

- **Decision**: `listarEventos(filtros)` arma `params` solo con claves cuyo valor no sea `undefined`, `null` ni string vacío/solo espacios; axios serializa `params`. Los IDs interpolados pasan por `encodeURIComponent`.
- **Rationale**: US3-1 y FR-018; el backend ya trata vacíos como ausentes, pero omitirlos mantiene URLs limpias y pruebas deterministas.
- **Alternatives considered**: `paramsSerializer` personalizado (innecesario).

## R10. Observabilidad en el frontend

- **Decision**: no se agrega logging estructurado en el cliente.
- **Rationale**: el principio 5 exige logging en operaciones de la capa de servicios del backend (request IDs, roles, estado de compra), que ya existe. En la app móvil no hay colector de logs; agregar `console` sería ruido (YAGNI). Los errores llegan tipados a la pantalla (`ApiError`).
- **Alternatives considered**: interceptor que loguee cada petición en `__DEV__` (se puede sumar después sin romper nada).
