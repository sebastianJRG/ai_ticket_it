# Contrato: cliente HTTP y sesión (`frontend/src/services/api.js`)

## Exportaciones

| Export | Tipo | Descripción |
|--------|------|-------------|
| `API_URL` | `string` | `process.env.EXPO_PUBLIC_API_URL` o `http://10.0.2.2:3000` (Android) / `http://localhost:3000` (resto). Sin cambios. |
| `ApiError` | `class extends Error` | `new ApiError(message, status)`. Sin cambios. |
| `cliente` | `AxiosInstance` | `baseURL: API_URL`, `timeout: 15000`, `headers: { 'Content-Type': 'application/json' }`. Único punto de salida HTTP de la app. |
| `configurarSesion` | `(proveedor: ProveedorSesion \| null) => void` | Registra (o quita) el proveedor de sesión. |

Se elimina `request` (fetch).

## Interceptor de request

1. Si `config.sinSesion` → no toca headers.
2. Si hay proveedor y `obtenerTokens()?.accessToken` → `headers.Authorization = 'Bearer <accessToken>'` y `config._conSesion = true`.
3. Si no hay token → sale sin credencial.

## Interceptor de response (error)

| Situación | Resultado |
|-----------|-----------|
| Sin `response` (red, timeout) | rechaza `ApiError(msgConexion, 0)` |
| `401` y `_conSesion` y no `_reintentado` y no `sinSesion` | espera `renovacionEnCurso` (la crea si no existe) → `_reintentado = true`, `Authorization` nuevo → `return cliente(config)` |
| ↳ la renovación falla | `alExpirar()` una vez (dentro de la renovación compartida) y rechaza `ApiError(msg del 401 original, 401)` |
| `401` en cualquier otro caso (login, refresh, ya reintentada, sin sesión) | rechaza `ApiError(msg, 401)` sin renovar |
| Otro status (400, 403, 404, 409, 5xx) | rechaza `ApiError(data.message ?? msgGenerico, status)` |

Renovación: `POST /api/refresh` `{ refreshToken }` con `sinSesion: true` → `200 { accessToken, refreshToken, usuario }` → `guardarTokens(respuesta)` → nuevo `accessToken`. Si no hay `refreshToken` se trata como fallo.

## Pruebas obligatorias (`__tests__/services/api-test.js`)

Adaptador falso (ver research R7). Cada fila de las tablas tiene al menos un caso, más:

- `baseURL` = `API_URL` y `timeout` = 15000.
- 3 peticiones concurrentes con 401 → exactamente 1 `POST /api/refresh`, las 3 reintentadas con el token nuevo, `guardarTokens` 1 vez (SC-003).
- Refresh rechazado con 401 → `alExpirar` 1 vez, petición original rechaza con status 401, no hay segundo refresh.
- Reintento que vuelve a dar 401 → falla con 401 sin otro refresh.
- 403 no renueva.
- Respuesta de error sin cuerpo → "Ocurrió un error inesperado." con el status real.
- `configurarSesion(null)` → sin `Authorization`.
