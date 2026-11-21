# Data Model: Explorar, buscar y favoritos

**Feature**: 004-explorar-busqueda-favoritos | **Plan**: [plan.md](./plan.md)

La feature no crea entidades de dominio ni toca el backend: consume `Evento`, `Categoria` y los favoritos del `Usuario` tal como los expone la API, y define estructuras **de vista** en el frontend.

---

## 1. Evento (respuesta de la API, solo lectura)

Fuente: `GET /api/eventos`, `GET /api/usuarios/favoritos` (mismo formato; ver `AGENTS.md` › Eventos y `specs/002-backend-favoritos/contracts/favoritos.md`).

| Campo | Tipo | Uso en la feature |
|---|---|---|
| `id` | string | Clave de listas, favoritos y ruta `/evento/[idEvento]` |
| `nombre` | string | Título de la tarjeta (2 líneas máx.) |
| `descripcion` | string | No se muestra (el servidor busca `q` en nombre y descripción) |
| `categoria` | `{ id, nombre, descripcion }` | Etiqueta, ícono y arte por categoría |
| `fecha` | string ISO | Fecha corta, bloque día/mes, `esPasado` |
| `tiposEntrada` | `{ id, nombre, descripcion, precio, cupo }[]` (≥ 1) | Precio desde/hasta |
| `multimedia` | string[] | `multimedia[0]` como imagen |
| `organizador` | `{ id, nombre, apellido, rol }` | Nombre junto al puntaje |
| `puntajeOrganizador` | number \| null | `Rating compact` o "Sin reseñas" |

## 2. Categoria (respuesta de la API)

Fuente: `GET /api/categorias` → `{ id, nombre, descripcion }[]` en orden de creación (`[]` si no hay).

## 3. TarjetaEvento (derivada, `src/eventos/presentacion.js`)

Vista calculada por `aTarjeta(evento, { ahora })`; función pura, sin React.

| Campo | Regla |
|---|---|
| `id`, `nombre` | Copia |
| `categoria` | `evento.categoria?.nombre ?? ''` |
| `fechaCorta` | `formatDate(fecha, 'short')` |
| `dia`, `mes` | Día del mes y mes abreviado en mayúsculas (bloque de `feature`) |
| `precioMin`, `precioMax` | Mín./máx. de `tiposEntrada[].precio` |
| `precioTexto` | `formatPriceFrom(precioMin, precioMax)` → "Desde $ 32.000", "$ 25.000" o "Gratis" |
| `imagen` | `multimedia[0]` si es string no vacío; si no, `null` |
| `paleta` | `paletaCategoria(categoria)` (R9) |
| `finalizado` | `new Date(fecha) <= ahora` |
| `puntaje` | `puntajeOrganizador` (number \| null) |
| `organizadorNombre` | `"nombre apellido"` (recortado), o `''` |
| `etiquetaAccesible` | `"<nombre>, <fechaCorta>, <precioTexto>"` (+ ", finalizado") |

**Validación**: un evento sin `tiposEntrada` (no debería ocurrir: el backend exige ≥ 1) da `precioTexto = ''` y no rompe.

## 4. SeccionesExplorar (derivada)

`separarExplorar(eventos, { ahora, maxDestacados = 5 })` → `{ destacados, muyPronto }`.

- `muyPronto` = eventos con `finalizado === false`, **en el orden recibido** (el servidor ya ordenó por `fecha asc`).
- `destacados` = los primeros `maxDestacados` de `muyPronto`.
- Los finalizados se descartan.

## 5. FiltrosBusqueda (estado de la pantalla Búsqueda)

| Campo | Tipo | Inicial | Regla |
|---|---|---|---|
| `texto` | string | `params.q ?? ''` | Se envía como `q` tras 300 ms sin cambios (`useDebounce`); recortado, vacío → no se envía |
| `categoriaId` | string \| null | `params.categoriaId ?? null` | `null` = "Todo"; se aplica sin espera |
| `orden` | `ClaveOrden` | `'fecha-asc'` | Ver §6; se aplica sin espera |

**Filtros activos** (chips removibles): `texto` recortado no vacío → chip `"<texto>"`; `categoriaId` con categoría conocida → chip con su nombre. Contador de resultados: `"1 evento"` / `"N eventos"`.

## 6. OpcionOrden (`src/eventos/orden.js`, constante congelada)

| `clave` | Etiqueta (lista) | Disparador | `sortBy` | `order` |
|---|---|---|---|---|
| `fecha-asc` *(defecto)* | Fecha más próxima | Fecha ↑ | `fecha` | `asc` |
| `fecha-desc` | Fecha más lejana | Fecha ↓ | `fecha` | `desc` |
| `precio-asc` | Precio menor a mayor | Precio ↑ | `precio` | `asc` |
| `precio-desc` | Precio mayor a menor | Precio ↓ | `precio` | `desc` |
| `puntaje-desc` | Mejor puntaje del organizador | Puntaje ↓ | `puntaje` | `desc` |
| `puntaje-asc` | Menor puntaje del organizador | Puntaje ↑ | `puntaje` | `asc` |

`paramsOrden(clave)` → `{ sortBy, order }`; una clave desconocida devuelve la de defecto. En ambos sentidos de puntaje, el servidor deja a los organizadores sin reseñas al final.

## 7. EstadoConsulta (`useEventos`)

```
{ eventos: object[] | null, cargando: boolean, error: ApiError | null, recargar(): void }
```

Transiciones (por cada cambio de filtros o `recargar`):

```
            emitir petición n
 (cualquiera) ───────────────▶ cargando=true (eventos previos se conservan)
 respuesta n == última ──────▶ cargando=false, eventos=resultado, error=null
 error n == última ──────────▶ cargando=false, error=e (eventos previos se conservan)
 respuesta/error n < última ─▶ se ignora (SC-003)
 desmontado ─────────────────▶ se ignora
```

Estado visible derivado (Explorar y Búsqueda): `cargando` → esqueletos (también con resultados previos, en lugar de la lista); `error` → error con "Reintentar"; `eventos.length === 0` → vacío; si no, lista. El hook conserva `eventos` previos, pero las pantallas no los muestran mientras `cargando` es `true`.

## 8. EstadoFavoritos (`FavoritosContext`)

| Campo | Tipo | Descripción |
|---|---|---|
| `eventos` | object[] | Favoritos en orden de agregado (formato §1) |
| `ids` | `Set<string>` | Derivado de `eventos`, para `esFavorito` O(1) |
| `cargando` | boolean | Carga inicial o `recargar` en curso |
| `error` | ApiError \| null | Error de la última carga |
| `pendientes` | `Set<string>` | IDs con PUT/DELETE en curso (interno; expone `estaPendiente(id)`) |

Reglas:

- Sesión ≠ COMPRADOR → `eventos = []`, sin peticiones. Cambio de usuario → se descarta todo y se recarga.
- `alternar(evento)` con `id ∈ pendientes` → no hace nada.
- Si no: `eventos` pasa a `[...eventos, evento]` (agregar) o sin ese `id` (quitar) **antes** de la red; `id` entra en `pendientes`.
  - Éxito → sale de `pendientes`; si `pendientes` quedó vacío, `eventos = respuesta del servidor`.
  - Error → sale de `pendientes`; se revierte solo ese `id` (se reinserta en su posición previa o se quita) y se muestra un toast `error`.

## 9. ModoFavorito (derivado)

`modoFavorito(usuario)`: `rol === 'COMPRADOR'` → `'alternar'`; sin usuario → `'pedirSesion'`; `rol === 'ORGANIZADOR'` → `'oculto'`.
