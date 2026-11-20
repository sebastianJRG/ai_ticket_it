# Contrato: servicios por recurso (`frontend/src/services/*Service.js`)

Reglas comunes:

- Todas las funciones son `async`, devuelven `response.data` sin transformar (FR-010) y rechazan con `ApiError` (ver [cliente-api.md](./cliente-api.md)).
- Los IDs de ruta pasan por `encodeURIComponent` (FR-018).
- Las transiciones de compra se envían **sin cuerpo**.
- Ninguna operación recibe tokens por parámetro (FR-002).
- Cada función tiene JSDoc con `@param`, `@returns` y `@throws` listando los status posibles (FR-022).
- "Sesión" = autenticada vía proveedor. "Pública" = funciona sin sesión.

## authService.js (todas con `sinSesion: true`; re-exporta `ApiError`)

| Función | HTTP | Cuerpo | Status de error |
|---------|------|--------|-----------------|
| `login({ nombreUsuario, contrasenia })` | `POST /api/login` | `{ nombreUsuario, contrasenia }` | 400, 401, 0 |
| `registrar(datos)` | `POST /api/usuarios` | `{ nombre, apellido, nombreUsuario, contrasenia, rol }` | 400, 0 |
| `refrescar(refreshToken)` | `POST /api/refresh` | `{ refreshToken }` | 400, 401, 0 |
| `cerrarSesion(refreshToken)` | `POST /api/logout` | `{ refreshToken }` | 400, 401, 0 |

Las firmas son las actuales: `AuthContext` y las pantallas no cambian.

## usuarioService.js

| Función | HTTP | Acceso | Status de error |
|---------|------|--------|-----------------|
| `obtenerPerfil()` | `GET /api/usuarios` | Sesión | 401, 403, 404 |
| `listarReseniasOrganizador(idOrganizador)` | `GET /api/usuarios/:idOrganizador/resenias` | Pública | 400, 404 |
| `listarFavoritos()` | `GET /api/usuarios/favoritos` | Sesión (COMPRADOR) | 401, 403, 404 (hasta feature 002) |
| `agregarFavorito(idEvento)` | `PUT /api/usuarios/favoritos/:idEvento` | Sesión (COMPRADOR) | 400, 401, 403, 404 |
| `quitarFavorito(idEvento)` | `DELETE /api/usuarios/favoritos/:idEvento` | Sesión (COMPRADOR) | 400, 401, 403, 404 |

## eventoService.js

| Función | HTTP | Acceso | Status de error |
|---------|------|--------|-----------------|
| `listarEventos({ q, categoriaId, sortBy, order } = {})` | `GET /api/eventos` (`params` sin vacíos) | Pública | 400 |
| `obtenerEvento(idEvento)` | `GET /api/eventos/:idEvento` | Pública | 400, 404 |
| `crearEvento(datos)` | `POST /api/eventos` | Sesión (ORGANIZADOR) | 400, 401, 403, 404 |
| `obtenerComprasEvento(idEvento)` | `GET /api/eventos/:idEvento/compras` | Sesión (ORGANIZADOR dueño) | 400, 401, 403, 404 |

- `sortBy` ∈ `precio | fecha | puntaje`; `order` ∈ `asc | desc`.
- `crearEvento` cuerpo: `{ nombre, descripcion, categoriaId, fecha, tiposEntrada: [{ nombre, descripcion, precio, cupo }], multimedia? }`. El `organizadorId` lo toma el backend del token.
- `obtenerComprasEvento` devuelve `{ compras, disponibilidad }`.

## categoriaService.js

| Función | HTTP | Acceso | Status de error |
|---------|------|--------|-----------------|
| `listarCategorias()` | `GET /api/categorias` | Pública | 0 |
| `crearCategoria({ nombre, descripcion })` | `POST /api/categorias` | Sesión (ORGANIZADOR) | 400, 401, 403 |

## compraService.js

| Función | HTTP | Acceso | Status de error |
|---------|------|--------|-----------------|
| `crearCompra({ eventoId, tipoEntradaId, cantidad })` | `POST /api/compras` | Sesión (COMPRADOR) | 400, 401, 403, 404, 409 |
| `listarMisCompras()` | `GET /api/compras` | Sesión (COMPRADOR) | 401, 403 |
| `cancelarCompra(idCompra)` | `PATCH /api/compras/:idCompra/cancelacion` | Sesión (COMPRADOR dueño u ORGANIZADOR) | 400, 401, 403, 404 |
| `confirmarCompra(idCompra)` | `PATCH /api/compras/:idCompra/confirmacion` | Sesión (ORGANIZADOR) | 400, 401, 403, 404 |
| `reembolsarCompra(idCompra)` | `PATCH /api/compras/:idCompra/reembolso` | Sesión (ORGANIZADOR) | 400, 401, 403, 404 |

## reseniaService.js

| Función | HTTP | Acceso | Status de error |
|---------|------|--------|-----------------|
| `crearResenia({ eventoId, detalle, puntuacion })` | `POST /api/resenias` | Sesión (COMPRADOR) | 400, 401, 403, 409 |
| `listarReseniasEvento(idEvento)` | `GET /api/resenias/:idEvento` | Pública | 404 |

## mensajeService.js

| Función | HTTP | Acceso | Status de error |
|---------|------|--------|-----------------|
| `enviarMensaje(idCompra, mensaje)` | `POST /api/compras/:idCompra/mensajes` cuerpo `{ mensaje }` | Sesión (comprador dueño u organizador) | 400, 401, 403, 404 |
| `listarMensajes(idCompra)` | `GET /api/compras/:idCompra/mensajes` | Sesión (comprador dueño u organizador) | 400, 401, 403, 404 |

Todas las operaciones pueden además rechazar con status 0 (sin conexión) y 5xx.

## Pruebas obligatorias (`__tests__/services/<recurso>Service-test.js`)

Por cada función: método, `url`, `params`/`data` exactos y que devuelve `data` tal cual. Además: filtros vacíos omitidos (US3-1), `PATCH` sin cuerpo y con `Authorization` (US3-2), operaciones públicas sin sesión no envían `Authorization` (US3-3), ID con `/` o espacios codificado, un 409 de `crearCompra` llega como `ApiError` 409 con el mensaje del backend (US2-1).
