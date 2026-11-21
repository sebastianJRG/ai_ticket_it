# Research: Explorar, buscar y favoritos

**Feature**: 004-explorar-busqueda-favoritos | **Fecha**: 2026-11-20 | **Plan**: [plan.md](./plan.md)

Todas las incógnitas del Technical Context quedan resueltas acá. Cada decisión sigue el formato *Decisión / Justificación / Alternativas*.

---

## R1. Qué devuelve el backend y qué calcula la app

**Decisión**: La app consume `GET /api/eventos` (vía `listarEventos` de 001) tal cual. Cada evento trae `{ id, nombre, descripcion, categoria: { id, nombre, descripcion }, fecha, tiposEntrada: [{ id, nombre, descripcion, precio, cupo }], multimedia: string[], organizador: { id, nombre, apellido, rol }, puntajeOrganizador: number|null }`. La app **solo deriva para presentar**: precio desde/hasta (mín./máx. de `tiposEntrada[].precio`), imagen (`multimedia[0]` o arte por categoría), si ya ocurrió (`fecha <= ahora`) y la separación "Muy pronto". Filtrar (`q`, `categoriaId`) y ordenar (`sortBy`, `order`) lo hace siempre el servidor.

**Justificación**: La spec (Assumptions) dice que el servidor filtra y ordena; el backend ya implementa los 3 criterios × 2 sentidos (incluido "sin reseñas al final" en puntaje, en ambos sentidos). Reordenar en el cliente duplicaría reglas y podría divergir (SC-002).

**Alternativas**: Traer todo una vez y filtrar/ordenar en el cliente (menos peticiones, pero duplica la lógica de dominio y contradice la spec).

## R2. Explorar: destacados y "Muy pronto"

**Decisión**: Explorar hace **una** petición `listarEventos({ categoriaId, sortBy: 'fecha', order: 'asc' })` (sin `categoriaId` con "Todo"). Del resultado (ya ordenado por el servidor) se descartan los eventos que ya ocurrieron; los primeros **5** futuros son el carrusel "Destacados" (EventCard `feature`) y la lista "Muy pronto" (EventCard `compact`) muestra **todos** los futuros en ese mismo orden. Los eventos finalizados no aparecen en Explorar; se ven (marcados "Finalizado") en Búsqueda y Favoritos.

**Justificación**: "Destacados = próximos eventos futuros" (Assumptions) y "Muy pronto = futuros por fecha ascendente" (US1-4, edge case). Una sola petición evita estados de carga dobles y respuestas inconsistentes entre secciones. Repetir los primeros eventos en el carrusel y en la lista es el patrón habitual "destacados + todo", y evita que la lista quede vacía con pocos eventos.

**Alternativas**: "Muy pronto" = futuros desde el 6.º (lista vacía con ≤ 5 eventos); ventana de 30 días (criterio no pedido); dos peticiones separadas (doble carga).

## R3. Búsqueda: estado de filtros, debounce y respuestas fuera de orden

**Decisión**:
- El estado de la búsqueda (`{ q, categoriaId, sortBy, order }`) vive en la pantalla, **inicializado desde los parámetros de la URL** (`useLocalSearchParams`): Explorar navega a `/buscar` (o `/buscar?categoriaId=<id>` si hay categoría elegida) y abre con el teclado en foco.
- El texto pasa por `useDebounce(texto, 300)`; categoría y orden se aplican **sin espera**.
- Un hook `useEventos(filtros)` hace la consulta y lleva un **número de secuencia** (`useRef`): solo la respuesta de la última petición emitida actualiza el estado; las anteriores se descartan (también si fallan). Se descarta igual al desmontar.

**Justificación**: FR-003 (~300 ms), SC-003 (siempre el último texto escrito) y el edge case de respuestas fuera de orden. La secuencia es más simple que `AbortController` (axios lo soporta, pero cancelar no garantiza por sí solo el orden si la respuesta ya llegó) y es fácil de probar con promesas diferidas. Inicializar desde la URL permite que Explorar pase la categoría sin estado global.

**Alternativas**: `AbortController` por petición (más código, misma garantía); estado en la URL con `router.setParams` en cada tecla (re-render de navegación por tecla); librería de datos (React Query/SWR — dependencia nueva, YAGNI).

## R4. Filtros activos removibles

**Decisión**: Arriba de los resultados se muestran como Chips `filter` `removable` los filtros activos: texto (`"jazz"`) y categoría (nombre). Quitar el de texto vacía la SearchBar; quitar el de categoría vuelve a "Todo". El orden no es un "filtro" (no tiene chip; se ve en el SortSelector). La categoría se elige en Búsqueda con la misma fila `CategoryChips` que Explorar. El estado vacío ofrece "Quitar filtros" (limpia texto y categoría) cuando hay alguno activo.

**Justificación**: US2-2 y US2-3. Reusar `CategoryChips` evita un BottomSheet de filtros; el backend solo filtra por texto y categoría, así que no hay más filtros que agregar (YAGNI). El botón de filtros de la `SearchBar` del design system se omite por eso.

**Alternativas**: Sheet de filtros con contador en la SearchBar (sin filtros extra que mostrar en él).

## R5. Opciones de orden

**Decisión**: Seis opciones explícitas en un módulo puro (`src/eventos/orden.js`): Fecha más próxima (`fecha asc`, **por defecto**), Fecha más lejana (`fecha desc`), Precio menor a mayor (`precio asc`), Precio mayor a menor (`precio desc`), Mejor puntaje del organizador (`puntaje desc`), Menor puntaje del organizador (`puntaje asc`). Siempre se envían `sortBy` **y** `order` explícitos. El disparador muestra "Ordenar: Precio ↑". Elegir una opción la aplica y cierra el sheet (sin "Aplicar").

**Justificación**: FR-004 y SC-002 piden 3 × 2 combinaciones; el design system lista cuatro, que se amplían a seis. Al elegir "puntaje" el sentido por defecto es descendente (US3-2): la opción "Mejor puntaje" es `desc`. Enviar `order` explícito evita depender de los defaults del servidor.

**Alternativas**: Selector de criterio + toggle de sentido (dos controles, más toques, y el "↑/↓" en puntaje es ambiguo para el usuario).

## R6. BottomSheet sin dependencia nueva

**Decisión**: Componente `BottomSheet` propio sobre `Modal` de React Native (`transparent`, `animationType="slide"`, fondo `scrim-modal`, grabber, título + cerrar, safe area inferior, cierre con back de Android y tocando el fondo). Se usa solo para `SortOptions` (radio).

**Justificación**: El design system sugiere `@gorhom/bottom-sheet`, que exige `react-native-reanimated` y `react-native-gesture-handler` (no instalados) para una sola lista de 6 opciones. El `Modal` de RN ya resuelve accesibilidad y back. Mismo criterio que 003 (R8: sin librería de toast).

**Alternativas**: `@gorhom/bottom-sheet` (2–3 dependencias nativas nuevas); reusar el `Modal` de confirmación de 003 (es un diálogo de confirmación, no de elección).

## R7. Favoritos: estado compartido y actualización optimista

**Decisión**: `FavoritosProvider` (`src/favoritos/FavoritosContext.jsx`) montado en el layout raíz **dentro** de `AuthProvider`, con `useFavoritos()` → `{ eventos, ids, cargando, error, esFavorito(id), alternar(evento), recargar() }`.
- Con sesión de COMPRADOR carga `listarFavoritos()` al iniciar/cambiar sesión; con visitante u ORGANIZADOR queda vacío y no pide nada; al cerrar sesión se limpia.
- `alternar(evento)`: cambia `ids`/`eventos` **en el mismo render** (agrega al final o quita) y luego llama `agregarFavorito`/`quitarFavorito`. Éxito: se adopta la lista que devuelve el servidor **solo si no hay otra petición de favoritos en curso** (si la hay, se conserva el estado optimista). Error: se revierte **ese** evento a su estado previo y se muestra un toast `error` "No pudimos actualizar tus favoritos".
- Mientras hay una petición en curso para un evento, otro toque sobre el mismo corazón se ignora (el corazón expone `accessibilityState.busy`).

**Justificación**: El corazón aparece en Explorar, Búsqueda, Favoritos y (en 005) en el detalle: un contexto evita que cada pantalla tenga su copia y se desincronice. SC-004 (< 100 ms) se cumple porque el cambio es síncrono, antes de la red. El backend es idempotente (PUT/DELETE) y devuelve la lista completa, lo que permite reconciliar. Ignorar toques mientras hay una petición del mismo evento evita carreras agregar/quitar sin cola.

**Alternativas**: Estado local por tarjeta (se desincroniza entre pestañas); cola de intenciones por evento (más compleja; el caso es raro); provider solo en `(comprador)/_layout` (005 monta `/evento/[id]` fuera de ese grupo y también necesita el corazón).

## R8. Quién ve el corazón

**Decisión**: `EventCard` recibe el corazón según el rol de la sesión: **COMPRADOR** → alterna favorito; **visitante** → `router.push(hrefLogin(rutaActual))` (vuelve a la misma pantalla tras login, sin re-ejecutar la acción, igual que 003); **ORGANIZADOR** → no se muestra. La decisión vive en un helper puro `modoFavorito(usuario)` → `'alternar' | 'pedirSesion' | 'oculto'`.

**Justificación**: US4-2 y edge case "Organizador: no ve corazón". 003 ya define que tras login se vuelve a la pantalla y no se re-ejecuta la acción.

**Alternativas**: Agregar el favorito automáticamente tras login (re-ejecuta la acción; 003 lo descartó).

## R9. Imagen de la tarjeta y arte por categoría

**Decisión**: Si `multimedia[0]` existe se muestra con `expo-image` (`contentFit="cover"`, `transition`), y si falla al cargar se cae al arte. Si no hay imagen, `ArteCategoria`: degradé (`expo-linear-gradient`, ya instalado) con la paleta de `PosterArt` del design system (recitales, teatro, festivales, conferencias, deportes) elegida por **nombre de categoría normalizado** (minúsculas, sin acentos); para nombres desconocidos, una de las 5 paletas por hash estable del `categoria.id`. El ícono de la categoría (chips y arte) sale de `iconoCategoria(nombre)` con el mismo mapeo y `Tag` por defecto; "Todo" usa `LayoutGrid`.

**Justificación**: FR-005 ("primera de multimedia o arte por categoría"). Las categorías las crea el organizador (son dinámicas), así que el mapeo debe tolerar nombres arbitrarios. Hash estable → el mismo evento siempre se ve igual.

**Alternativas**: Portar las formas SVG de `PosterArt` (más código; el degradé alcanza como placeholder); imagen gris genérica (no cumple "arte por categoría").

## R10. Estados de carga, vacío y error

**Decisión**: Cada lista tiene cuatro estados derivados de `useEventos`/`useFavoritos`: **cargando** (sin datos aún) → `EventCardSkeleton` (3 compact; en Explorar además 2 feature); **error** → `EmptyState` con mensaje según `ApiError.status` (0: "Sin conexión", otro: "No pudimos cargar los eventos") y acción "Reintentar"; **vacío** → `EmptyState` contextual (Explorar sin eventos futuros, Búsqueda sin coincidencias con "Quitar filtros", Favoritos con "Explorar eventos" → `/explorar`); **listo**. En Búsqueda, una nueva consulta con resultados previos mantiene los resultados y muestra los esqueletos (no spinner) hasta la respuesta. Sin categorías (lista vacía o error de categorías) se muestra solo el chip "Todo" (no bloquea los eventos).

**Justificación**: FR-008, edge cases (red, sin categorías). Sin paginación (Assumptions): los esqueletos se usan solo en carga.

**Alternativas**: Spinner (el design system lo desaconseja); bloquear Explorar si fallan las categorías (la categoría no es imprescindible para explorar).

## R11. Puntaje del organizador en la tarjeta

**Decisión**: Componente `Rating` en variante `compact` de solo lectura: una estrella + valor con coma (`formatRating`, "★ 4,7") + nombre del organizador; si `puntajeOrganizador === null`, el texto "Sin reseñas". El label accesible incluye "Puntaje del organizador 4,7 de 5". La variante completa (estrellas + cantidad) y `RatingInput` quedan para 005/006.

**Justificación**: US3-3, FR-005 y CU-10. El listado no trae cantidad de reseñas, por eso solo `compact`.

## R12. Fechas, precios y "Finalizado"

**Decisión**: Fechas con `formatDate(fecha, 'short')` ("sáb 12 dic · 21:00") y el bloque día/mes en `feature`; precio con `formatPriceFrom(min, max)` (0 → "Gratis", mín. = máx. → sin "Desde"). Evento con `fecha <= ahora` → tag "Finalizado" e imagen con `opacity-muted-image`; la tarjeta sigue abriendo el detalle. "Ahora" se inyecta (`ahora = new Date()` por defecto) en los helpers puros para probarlos. La hora se muestra en la zona del dispositivo: el backend no expone zona ni ubicación del evento (Assumptions).

**Justificación**: design-system/docs/formatos.md y edge case de eventos ocurridos. Los flags `lowStock`/`soldOut` del design system no se implementan: el listado no trae vendidas (fuera de alcance).

## R13. Pruebas (TDD)

**Decisión**:
- **Unitarias puras**: `src/eventos/presentacion.js` (precios, imagen, `esPasado`, `separarExplorar`, `iconoCategoria`, `paletaCategoria`, `modoFavorito`) y `src/eventos/orden.js` (6 opciones → parámetros; SC-002).
- **Hooks**: `useDebounce` y `useEventos` con `jest.useFakeTimers()` y promesas diferidas (respuesta vieja que llega después → se ignora; SC-003).
- **Contexto**: `FavoritosContext` con `usuarioService` simulado (optimista, reversión + toast, ignora doble toque, visitante/organizador no piden nada).
- **Componentes**: `SearchBar`, `Chip`/`CategoryChips`, `SortSelector`+`BottomSheet`, `EventCard` (feature/compact, finalizado, sin reseñas, corazón por rol), `EventCardSkeleton`, `Rating`.
- **Pantallas**: Explorar, Búsqueda y Favoritos con `renderRouter` (`expo-router/testing-library`), `authFalso` y servicios simulados con `jest.mock` (`eventoService`, `categoriaService`, `usuarioService`).
- Primero las pruebas → aprobación del usuario → rojo → implementación → refactor.

**Justificación**: Constitución (principio 2) y FR-010; mismas herramientas que 001–003, sin dependencias nuevas.

## R14. Observabilidad

**Decisión**: Sin logging nuevo en el cliente (igual que 001 R10 y 003). El `X-Request-Id` lo sigue resolviendo el backend; los errores se muestran al usuario con estados/toasts.

**Justificación**: La observabilidad estructurada exigida aplica al service layer del backend, que no se modifica.
