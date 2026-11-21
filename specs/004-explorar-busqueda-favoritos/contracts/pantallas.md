# Contrato: Pantallas Explorar, Búsqueda y Favoritos

**Feature**: 004-explorar-busqueda-favoritos | Rutas y acceso definidos en `specs/003-navegacion-sesion/contracts/navegacion.md` (no cambian).

Formato de los eventos: [data-model.md §1](../data-model.md#1-evento-respuesta-de-la-api-solo-lectura). Servicios: los de la feature 001 (`frontend/src/services/`), sin cambios.

---

## `/explorar` — `src/app/(comprador)/explorar.jsx` (pública)

**Acceso**: visitante y COMPRADOR (ORGANIZADOR → `/organizador/eventos`, regla existente).

**Peticiones al montar**

| Servicio | Parámetros | Cuándo |
|---|---|---|
| `listarCategorias()` | — | Una vez |
| `listarEventos(f)` | `{ sortBy: 'fecha', order: 'asc' }` + `categoriaId` si hay chip ≠ "Todo" | Al montar y al cambiar de chip |

**Contenido** (de arriba hacia abajo)

1. Título de bienvenida ("Hola, <nombre>" con sesión; "Descubrí eventos" sin sesión).
2. `SearchBar` en modo **disparador**: al tocar → `router.push('/buscar')`, o `/buscar?categoriaId=<id>` con una categoría elegida.
3. `CategoryChips`: "Todo" (seleccionado al abrir) + categorías del servidor en su orden. Sin categorías o con error al cargarlas → solo "Todo".
4. "Destacados": carrusel horizontal de hasta 5 `EventCard variant="feature"`.
5. "Muy pronto": lista de `EventCard variant="compact"`, eventos futuros por fecha ascendente.

**Estados**

| Estado | Se muestra |
|---|---|
| Cargando eventos (carga inicial o al cambiar de chip, aunque haya eventos previos) | 2 `EventCardSkeleton feature` + 3 `compact` (nunca los eventos de la categoría anterior) |
| Error | `EmptyState` (`Sin conexión` si `status 0`; si no, `No pudimos cargar los eventos`) + "Reintentar" |
| Sin eventos futuros | `EmptyState icono="search"` "No hay eventos próximos" (+ "Ver todas las categorías" si hay chip ≠ "Todo") |

**Navegación**: tocar una tarjeta → `router.push('/evento/<id>')` (FR-006).

## `/buscar` — `src/app/(comprador)/buscar.jsx` (pública)

**Parámetros de entrada** (`useLocalSearchParams`, todos opcionales): `q`, `categoriaId`. Inicializan el estado; luego la pantalla es dueña del estado (no reescribe la URL).

**Petición**: `listarEventos({ q, categoriaId, sortBy, order })` (los vacíos no se envían; `sortBy` y `order` siempre).

| Cambio | Espera |
|---|---|
| Texto | 300 ms sin escribir (debounce) |
| Categoría, orden, quitar chip, "Quitar filtros", "Reintentar" | Inmediato |

Solo se muestra la respuesta de la **última** petición emitida (SC-003).

**Contenido**

1. `SearchBar` editable con foco automático al entrar, botón "Borrar búsqueda" si hay texto.
2. `CategoryChips` (igual que Explorar; selección única, "Todo" = sin categoría).
3. Fila de filtros activos: `Chip variant="filter" removable` para el texto (`"jazz"`) y la categoría. Quitar texto → texto vacío; quitar categoría → "Todo".
4. Contador "N eventos" (`1 evento`) a la izquierda y `SortSelector` a la derecha ("Ordenar: Fecha ↑" por defecto).
5. Lista de `EventCard variant="compact"` en el orden del servidor (incluye finalizados, marcados).

**Estados**

| Estado | Se muestra |
|---|---|
| Cargando | 4 `EventCardSkeleton compact` (también al re-consultar con resultados previos); el contador se oculta |
| Error | `EmptyState` con mensaje según status + "Reintentar" |
| Sin coincidencias | `EmptyState icono="search"` "No encontramos eventos" · "Probá con otras palabras o quitá filtros." + acción "Quitar filtros" si hay alguno activo |

## `/favoritos` — `src/app/(comprador)/favoritos.jsx` (COMPRADOR)

**Acceso**: solo COMPRADOR (regla existente de 003; visitante → login con `volverA=/favoritos`).

**Datos**: `useFavoritos()` (el contexto ya cargó `GET /api/usuarios/favoritos` al iniciar sesión). Al enfocar la pestaña se llama `recargar()`.

**Contenido**: lista de `EventCard variant="compact"` en orden de agregado; el corazón aparece lleno; desmarcarlo lo quita de la lista al instante (y vuelve si el servidor falla).

| Estado | Se muestra |
|---|---|
| Cargando (sin datos) | 3 `EventCardSkeleton compact` |
| Error | `EmptyState` + "Reintentar" (`recargar`) |
| Vacío | `EmptyState icono="heart"` "Todavía no tenés favoritos" · "Tocá el corazón de un evento para guardarlo acá." + acción "Explorar eventos" → `router.navigate('/explorar')` |

## Corazón (todas las pantallas)

| Sesión | Corazón | Al tocar |
|---|---|---|
| COMPRADOR | Visible; lleno si `esFavorito(id)` | `alternar(evento)`: cambia al instante; error → revierte + toast `error` "No pudimos actualizar tus favoritos" |
| Visitante | Visible, vacío | `router.push(hrefLogin(<ruta actual con query>))` |
| ORGANIZADOR | Oculto | — |

Llamadas: `agregarFavorito(id)` → `PUT /api/usuarios/favoritos/:id`; `quitarFavorito(id)` → `DELETE …/:id`. Ambas devuelven la lista completa (contrato de 002).

## Trazabilidad

| Requisito | Dónde |
|---|---|
| FR-001, US1-1/2, edge "sin categorías" | Explorar §3, Búsqueda §2 |
| FR-002, US1-4, edge "ya ocurrieron" | Explorar §4–5, [data-model §4](../data-model.md#4-seccionesexplorar-derivada) |
| FR-003, US2, SC-003, edge "fuera de orden" | Búsqueda |
| FR-004, US3, SC-002 | `SortSelector`, [data-model §6](../data-model.md#6-opcionorden-srceventosordenjs-constante-congelada) |
| FR-005, US3-3 | [componentes.md › EventCard](./componentes.md#eventcard) |
| FR-006 | Navegación a `/evento/<id>` |
| FR-007, US4, SC-004, edge "organizador" | Favoritos + Corazón |
| FR-008, edge "error de red" | Tablas de estados |
| FR-009 | Explorar y Búsqueda públicas |
