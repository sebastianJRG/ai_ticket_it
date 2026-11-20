# Feature Specification: Explorar, buscar y favoritos

**Feature Branch**: `004-explorar-busqueda-favoritos`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "004 explorar-busqueda-favoritos: pantallas Explorar y Búsqueda del comprador (ScreenExplorar, ScreenBusqueda) con SearchBar, CategoryChips, SortSelector (precio, fecha, puntaje del organizador, asc/desc), EventCard con puntaje del organizador y esqueletos de carga; pestaña Favoritos con lista y corazón en EventCard (rutas de la feature 002). CU-03, CU-11."

## Contexto

Traza a **CU-03** (buscar por texto o explorar por categorías) y **CU-11** (ordenar por precio, fecha y puntaje del organizador), y muestra el puntaje del organizador que alimenta **CU-10**. Depende de 001 (servicios), 003 (navegación) y, para favoritos, de 002.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar eventos por categoría (Priority: P1) — CU-03

En Explorar, el comprador (o visitante) ve las categorías como chips, eventos destacados en un carrusel y una lista "Muy pronto" con los próximos eventos. Al tocar una categoría, ve solo esos eventos.

**Why this priority**: Es la pantalla de entrada del comprador.

**Independent Test**: Con categorías y eventos cargados, Explorar los muestra y filtrar por una categoría deja solo sus eventos.

**Acceptance Scenarios**:

1. **Given** eventos de varias categorías, **When** abre Explorar, **Then** ve el chip "Todo" seleccionado, las categorías del servidor y los eventos.
2. **Given** Explorar abierto, **When** toca una categoría, **Then** la lista muestra solo eventos de esa categoría.
3. **Given** la carga en curso, **When** se espera la respuesta, **Then** se muestran esqueletos de tarjetas.
4. **Given** "Muy pronto", **When** se muestra, **Then** contiene eventos futuros ordenados por fecha ascendente.

---

### User Story 2 - Buscar por texto (Priority: P1) — CU-03

Desde la barra de búsqueda, el comprador escribe un texto y ve los eventos que coinciden, con el contador de resultados y los filtros activos como chips removibles.

**Why this priority**: Búsqueda específica es la mitad de CU-03.

**Independent Test**: Buscar "jazz" muestra solo los eventos que devuelve el servidor para ese texto, con el contador correcto.

**Acceptance Scenarios**:

1. **Given** Búsqueda abierta, **When** escribe un texto, **Then** tras una breve pausa se consultan y muestran los resultados.
2. **Given** filtros de texto y categoría, **When** quita el chip de categoría, **Then** los resultados se actualizan sin ese filtro.
3. **Given** sin coincidencias, **When** termina la búsqueda, **Then** se muestra un estado vacío con sugerencia de quitar filtros.

---

### User Story 3 - Ordenar resultados (Priority: P1) — CU-11

El comprador ordena por precio, fecha del evento o puntaje del organizador, ascendente o descendente.

**Why this priority**: CU-11 explícito.

**Independent Test**: Elegir "Puntaje" muestra primero los organizadores mejor puntuados y al final los que no tienen reseñas.

**Acceptance Scenarios**:

1. **Given** resultados, **When** elige ordenar por precio ascendente, **Then** se muestran del más barato al más caro.
2. **Given** resultados, **When** elige puntaje, **Then** el orden por defecto es descendente y los organizadores sin reseñas quedan al final.
3. **Given** cada tarjeta, **When** se muestra, **Then** incluye el puntaje del organizador (o "Sin reseñas").

---

### User Story 4 - Favoritos (Priority: P2)

El comprador marca eventos con el corazón y los ve en la pestaña Favoritos.

**Why this priority**: Complementa la exploración; depende de 002.

**Independent Test**: Marcar un evento con el corazón lo agrega a Favoritos; desmarcarlo lo quita.

**Acceptance Scenarios**:

1. **Given** un comprador con sesión, **When** toca el corazón, **Then** el cambio se ve al instante y se confirma con el servidor; si falla, se revierte con un aviso.
2. **Given** un visitante, **When** toca el corazón, **Then** se le pide iniciar sesión.
3. **Given** la pestaña Favoritos sin elementos, **When** se abre, **Then** ve un estado vacío con acción "Explorar eventos".

### Edge Cases

- Eventos que ya ocurrieron: se muestran marcados como finalizados y no aparecen en "Muy pronto".
- Error de red: estado de error con "Reintentar".
- Sin categorías: no se muestran chips de categoría (solo "Todo").
- Respuestas de búsqueda que llegan fuera de orden: se muestra solo la del último texto escrito.
- Organizador: no ve corazón (favoritos es solo de comprador).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Explorar MUST mostrar categorías del servidor como chips con opción "Todo" y filtrar eventos por categoría.
- **FR-002**: Explorar MUST mostrar eventos destacados y una lista de próximos eventos futuros por fecha.
- **FR-003**: Búsqueda MUST consultar por texto con espera tras dejar de escribir (~300 ms), mostrar contador de resultados y filtros activos removibles.
- **FR-004**: Los resultados MUST poder ordenarse por precio, fecha o puntaje del organizador, en sentido ascendente o descendente.
- **FR-005**: Cada tarjeta MUST mostrar nombre, fecha, categoría, precio desde (mínimo de sus tipos de entrada), imagen (primera de multimedia o arte por categoría) y puntaje del organizador.
- **FR-006**: Tocar una tarjeta MUST abrir el detalle del evento (feature 005).
- **FR-007**: Los compradores MUST poder agregar/quitar favoritos desde la tarjeta y ver la lista en la pestaña Favoritos.
- **FR-008**: MUST existir estados de carga (esqueletos), vacío y error con reintento.
- **FR-009**: Explorar y Búsqueda MUST funcionar sin sesión.
- **FR-010**: Pruebas antes de implementar (TDD), con servicios simulados; JSDoc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un comprador encuentra un evento por nombre en menos de 3 interacciones desde Explorar.
- **SC-002**: El 100% de las combinaciones de orden (3 criterios × 2 sentidos) muestran el orden esperado.
- **SC-003**: El resultado de búsqueda visible corresponde siempre al último texto escrito.
- **SC-004**: Marcar/desmarcar favorito se refleja en pantalla en menos de 100 ms (antes de la respuesta del servidor).

## Assumptions

- El filtrado y orden los hace el servidor; la app no reordena salvo separar "Muy pronto".
- Sin paginación (el backend no pagina); los esqueletos se usan solo en la carga.
- "Destacados" = los próximos eventos futuros (no hay criterio de destacado en el backend).
- El backend no expone ubicación del evento ni de la persona: fuera de alcance.
