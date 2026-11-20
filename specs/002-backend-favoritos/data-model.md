# Data Model: Favoritos del comprador (backend)

**Feature**: `002-backend-favoritos` | **Fecha**: 2026-11-20 | **Plan**: [plan.md](./plan.md)

No se crean entidades nuevas ni se cambia la forma de `Usuario`. Favorito es una relación comprador ↔ evento guardada dentro del usuario.

## Favorito (relación, embebida en `Usuario.favoritos`)

| Campo | Tipo | Regla |
|-------|------|-------|
| `id` | `string` | ID de un `Evento` que existía al agregarlo. Texto no vacío tras `trim`. |

- **Contenedor**: `Usuario.favoritos: Array<{ id: string }>` (el modelo ya existe; el JSDoc del modelo se ajusta para reflejar referencias mínimas en lugar de `Evento[]`).
- **Orden**: orden de agregado (al final del arreglo). Volver a agregar uno existente **no** lo mueve.
- **Unicidad**: a lo sumo una entrada por `id` (SC-002).
- **Sin datos propios**: no hay fecha de alta ni otros campos (YAGNI).
- **Persistencia**: en memoria, a través de `UsuarioRepository.actualizar` con un arreglo nuevo (ver [research R2](./research.md#r2-mutación-compartida-por-el-clon-superficial-del-repositorio)). Se pierde al reiniciar.
- **Visibilidad**: nunca se expone en `aUsuarioPerfil` ni en `aUsuarioPublico` (ya excluidos; se mantiene la prueba existente).

### Relaciones

```text
Usuario (rol COMPRADOR) 1 ── * Favorito * ── 1 Evento
```

Solo el COMPRADOR usa favoritos (el ORGANIZADOR recibe 403 en las rutas). El arreglo de un ORGANIZADOR queda vacío.

### Reglas de validación

| Regla | Dónde | Error |
|-------|-------|-------|
| ID de evento texto no vacío (trim) | `UsuarioService` (`idEventoSchema`) | 400 |
| Usuario del token existe | `UsuarioService` | 404 |
| Evento existe al **agregar** | `UsuarioService` vía `EventoRepository.buscarPorId` | 404 |
| Evento existe al **quitar** | no se verifica (idempotente) | — |
| Evento existe al **listar** | `EventoService.obtenerPorIds` lo omite si no existe | — |

### Transiciones

```text
agregar(e):  e ∉ favoritos → favoritos + [e]       |  e ∈ favoritos → sin cambio
quitar(e):   e ∈ favoritos → favoritos − [e]       |  e ∉ favoritos → sin cambio
```

No afecta `EstadoCompra` ni el cupo (principio 4 no aplica a esta relación). Se permite marcar eventos que ya ocurrieron.

## Representación de respuesta: Evento público

Lo que devuelven las tres rutas es `Array<EventoRespuesta>`, el mismo formato que cada elemento de `GET /api/eventos`, producido por `aEventoRespuesta` (`backend/src/dto/evento.js`):

- todos los campos del `Evento` (`id`, `nombre`, `descripcion`, `fecha`, `categoria`, `tiposEntrada`, `multimedia`, …);
- `organizador`: versión pública `{ id, nombre, apellido, rol }` (sin hashes, permisos ni favoritos);
- `puntajeOrganizador`: `number | null`.

## Cambios de firma (servicios y wiring)

| Elemento | Antes | Después |
|----------|-------|---------|
| `UsuarioService` constructor | `(usuarioRepository)` | `(usuarioRepository, eventoRepository?, logger = console)` |
| `UsuarioService.agregarAFavoritos(usuarioId, eventoId)` | alterna; devuelve `Usuario`; `Error` 400 | `(usuarioId, eventoId, contexto = {})`; idempotente; valida; devuelve `string[]` (IDs); `ErrorHttp` 400/404; log `favorito_agregado` |
| `UsuarioService.removerDeFavoritos(usuarioId, eventoId)` | lanza si no estaba; devuelve `Usuario` | `(usuarioId, eventoId, contexto = {})`; idempotente; valida ID; devuelve `string[]`; `ErrorHttp` 400/404; log `favorito_quitado` |
| `UsuarioService.listarFavoritos` | — | nuevo `(usuarioId, contexto = {})`; devuelve `string[]`; `ErrorHttp` 404; log `favoritos_listados` |
| `EventoService` constructor | `(eventoRepository, categoriaRepository, usuarioRepository, tipoEntradaRepository, reseniaRepository?)` | `+ logger = console` (6.º parámetro, opcional) |
| `EventoService.obtenerPorIds` | — | nuevo `(ids, contexto = {})`; devuelve `Array<Evento & { puntajeOrganizador }>` en el orden recibido, omitiendo inexistentes; log `eventos_resueltos` |
| `FavoritoController` | — | nuevo: `listar`, `agregar`, `quitar`; pasan `{ requestId: req.id }` a los servicios |
| `asignarRequestId` (middleware) | — | nuevo; `req.id` = `X-Request-Id` válido (1–128 de `[A-Za-z0-9_-]`) o `randomUUID()` |

`contexto` es `{ requestId?: string }`; si falta, los logs llevan `requestId: null`. Formato de cada log: [research R6](./research.md#r6-logging-estructurado-con-id-de-petición).
| `UsuariosRoutes.init` | `(app, usuarioController, authMiddleware, reseniaController)` | `+ favoritoController` |
