# Data Model: Capa de servicios del frontend

**Feature**: 001-servicios-api-axios | **Fecha**: 2026-11-20

Esta feature no crea entidades de dominio: consume las del backend tal cual (FR-010). Las estructuras de abajo son las propias del cliente.

## Sesion

Persistida en `expo-secure-store` bajo la clave `sesion` (JSON). Dueño: `AuthContext`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `accessToken` | `string` | JWT corto (15 min). Se adjunta como `Authorization: Bearer`. |
| `refreshToken` | `string` | Largo. **Rota en cada renovación**: el anterior deja de servir. |
| `usuario` | `object` | Usuario devuelto por login/refresh (`id`, `nombreUsuario`, `rol`, …). |

**Ciclo de vida**

```text
(anónimo) --login ok--> (activa) --401 + refresh ok--> (activa, tokens nuevos persistidos)
(activa)  --401 + refresh falla--> alExpirar --> (anónimo, SecureStore borrado)
(activa)  --cerrarSesion--> (anónimo) + POST /api/logout (error ignorado)
```

## ProveedorSesion

Contrato que `AuthContext` registra con `configurarSesion(proveedor)`. Ver [contracts/cliente-api.md](./contracts/cliente-api.md).

| Propiedad | Firma | Regla |
|-----------|-------|-------|
| `obtenerTokens` | `() => {accessToken, refreshToken} \| null \| Promise<…>` | Se consulta en cada petición y al renovar. |
| `guardarTokens` | `(sesion: Sesion) => void \| Promise<void>` | Se llama una vez por renovación exitosa, antes de reintentar. |
| `alExpirar` | `() => void \| Promise<void>` | Se llama una sola vez por renovación fallida (aunque esperen N peticiones). |

Sin proveedor registrado (`null`): ninguna petición lleva credencial y nunca se renueva.

## ApiError

| Campo | Tipo | Regla |
|-------|------|-------|
| `name` | `'ApiError'` | |
| `message` | `string` | `data.message` del backend si es string no vacío; si no, "Ocurrió un error inesperado."; sin conexión/timeout, "No pudimos conectar con el servidor. Revisá tu conexión." |
| `status` | `number` | Código HTTP real; `0` = sin conexión o tiempo agotado. |

## Marcas internas de la config axios

No forman parte de la API pública; documentadas para las pruebas.

| Clave | Quién la pone | Efecto |
|-------|---------------|--------|
| `sinSesion` | `authService` | No adjunta credencial; un 401 nunca renueva. |
| `_conSesion` | interceptor de request | La petición salió con `Authorization`; habilita la renovación ante 401. |
| `_reintentado` | interceptor de response | Ya se reintentó una vez; un nuevo 401 falla sin renovar. |

## Estado de renovación (módulo `api.js`)

| Variable | Tipo | Regla |
|----------|------|-------|
| `renovacionEnCurso` | `Promise<string> \| null` | Una sola a la vez. Resuelve con el nuevo `accessToken`; se limpia en `finally`. |

## Entidades del backend consumidas (sin transformar)

Usuario/perfil, Evento (con `puntajeOrganizador` y organizador público), Categoria, Compra (con `diasRestantes` en `GET /api/compras`), disponibilidad por tipo de entrada, Resenia, Mensaje. Formatos: ver AGENTS.md y `backend/src/dto/`. Transiciones de `EstadoCompra` las valida el backend (principio 4); el cliente solo envía `PATCH` sin cuerpo.
