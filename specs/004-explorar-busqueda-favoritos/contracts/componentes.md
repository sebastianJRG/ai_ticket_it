# Contrato: Componentes, hooks y módulos

**Feature**: 004-explorar-busqueda-favoritos | Diseño: `design-system/docs/componentes/*.md` | Accesibilidad: `design-system/docs/accesibilidad.md` (WCAG 2.2 AA, áreas táctiles ≥ 44, tema claro/oscuro).

Todos los componentes son presentacionales (no llaman servicios) salvo que se indique. Cada export lleva JSDoc con `@typedef`/`@property` de props.

---

## Módulos puros

### `src/eventos/presentacion.js`

| Export | Firma | Contrato |
|---|---|---|
| `precioDesde` | `(evento) → number \| null` | Mín. de `tiposEntrada[].precio`; `null` sin tipos |
| `aTarjeta` | `(evento, { ahora? }) → TarjetaEvento` | [data-model §3](../data-model.md#3-tarjetaevento-derivada-srceventospresentacionjs) |
| `esPasado` | `(evento, ahora = new Date()) → boolean` | `fecha <= ahora` |
| `separarExplorar` | `(eventos, { ahora?, maxDestacados = 5 }) → { destacados, muyPronto }` | [data-model §4](../data-model.md#4-seccionesexplorar-derivada) |
| `iconoCategoria` | `(nombre) → string` | Ícono Lucide por nombre normalizado; `Tag` si es desconocido |
| `paletaCategoria` | `(categoria) → { fondo, a, b }` | Paleta por nombre; desconocido → hash estable de `id` |
| `modoFavorito` | `(usuario) → 'alternar' \| 'pedirSesion' \| 'oculto'` | [data-model §9](../data-model.md#9-modofavorito-derivado) |

### `src/eventos/orden.js`

| Export | Contrato |
|---|---|
| `OPCIONES_ORDEN` | Array congelado de 6 `{ clave, etiqueta, corta, sortBy, order }` ([data-model §6](../data-model.md#6-opcionorden-srceventosordenjs-constante-congelada)) |
| `ORDEN_POR_DEFECTO` | `'fecha-asc'` |
| `paramsOrden(clave)` | `{ sortBy, order }`; clave desconocida → la de defecto |

## Hooks

### `useDebounce(valor, ms = 300)` — `src/hooks/useDebounce.js`

Devuelve `valor` después de `ms` sin cambios; el valor inicial se devuelve de inmediato. Limpia el temporizador al desmontar.

### `useEventos(filtros)` — `src/hooks/useEventos.js` (llama `listarEventos`)

- Entrada: `{ q?, categoriaId?, sortBy?, order? }`. Re-consulta cuando cambia cualquier valor (comparación por valor, no por identidad del objeto).
- Salida: `{ eventos: object[] | null, cargando, error, recargar }` ([data-model §7](../data-model.md#7-estadoconsulta-useeventos)).
- Garantía: solo la última petición emitida actualiza el estado; nada se actualiza tras desmontar.

### `useCategorias()` — `src/hooks/useCategorias.js` (llama `listarCategorias`)

`{ categorias: object[] }`: `[]` mientras carga o si falla (no expone error: sin categorías se muestra solo "Todo").

## Contexto de favoritos — `src/favoritos/FavoritosContext.jsx`

`<FavoritosProvider>` (en `src/app/_layout.jsx`, dentro de `SesionConAviso`/`AuthProvider` y de `ToastProvider`). Lee `useAuth().usuario`; llama `listarFavoritos`, `agregarFavorito`, `quitarFavorito`; usa `useToast().mostrar` para el error.

`useFavoritos()` → `{ eventos, cargando, error, esFavorito(id), estaPendiente(id), alternar(evento): Promise<void>, recargar(): Promise<void> }`. Fuera del provider lanza `Error`. Reglas en [data-model §8](../data-model.md#8-estadofavoritos-favoritoscontext).

## Componentes — `src/components/`

### `SearchBar`

| Prop | Tipo | Descripción |
|---|---|---|
| `valor` | string | Texto (controlado) |
| `alCambiar` | `(texto) → void` | Cambio de texto (no se usa en modo disparador) |
| `alPresionar` | `() → void` | Si se pasa, la barra es **disparador** (no editable, `accessibilityRole="search"`/`button`) |
| `autoFoco` | boolean | Abre el teclado al montar |
| `placeholder` | string | Por defecto "Buscá artistas, obras, eventos…" |

Botón "Borrar búsqueda" (44 × 44) visible si `valor !== ''` → `alCambiar('')`. Sin botón de filtros ([R4](../research.md#r4-filtros-activos-removibles)).

### `Chip`

| Prop | Tipo | Descripción |
|---|---|---|
| `etiqueta` | string | 1–3 palabras |
| `variante` | `'category' \| 'filter'` | Ver design system |
| `icono` | string | Ícono Lucide (category) |
| `seleccionado` | boolean | `accessibilityState.selected` |
| `removible` | boolean | Muestra ✕; label "Quitar filtro <etiqueta>" |
| `alPresionar` | `() → void` | Toque (o quitar, si `removible`) |

### `CategoryChips`

Props: `categorias: {id, nombre}[]`, `seleccionada: string | null` (`null` = "Todo"), `alCambiar(id | null)`. Fila horizontal con scroll; "Todo" (`LayoutGrid`) primero; cada chip con `iconoCategoria(nombre)`; `accessibilityRole="tablist"` en la fila y `tab` en cada chip.

### `BottomSheet`

Props: `visible`, `titulo`, `alCerrar()`, `children`. Sobre `Modal` de RN ([R6](../research.md#r6-bottomsheet-sin-dependencia-nueva)); cierra con back de Android, botón "Cerrar" y toque en el fondo.

### `SortSelector`

Props: `valor: ClaveOrden`, `alCambiar(clave)`. Disparador "Ordenar: <corta>" (label "Ordenar resultados, actual: <etiqueta>"); abre `BottomSheet` "Ordenar por" con las 6 opciones como `radio` (`accessibilityState.checked`). Elegir → `alCambiar(clave)` + cierra.

### `Rating`

Props: `valor: number | null`, `variante?: 'compact'` (única en esta feature), `nombre?: string`. `null` → "Sin reseñas". Si no: ★ + `formatRating(valor)` (+ `· nombre`). Label "Puntaje del organizador 4,7 de 5" / "Organizador sin reseñas".

### `ArteCategoria`

Props: `categoria: {id, nombre}`, `estilo?`. Degradé de `paletaCategoria` + ícono de `iconoCategoria` (decorativo, `accessible={false}`).

### `EventCard`

| Prop | Tipo | Descripción |
|---|---|---|
| `evento` | object | Formato API ([data-model §1](../data-model.md#1-evento-respuesta-de-la-api-solo-lectura)); se presenta con `aTarjeta` |
| `variante` | `'feature' \| 'compact'` | `feature`: 300 de ancho, imagen 16:10, bloque día/mes; `compact`: thumbnail 104 × 104 |
| `alPresionar` | `() → void` | Abre el detalle |
| `favorito` | `{ modo: 'alternar' \| 'pedirSesion' \| 'oculto', activo: boolean, ocupado?: boolean, alPresionar: () → void }` | Corazón (target separado ≥ 44) |
| `ahora` | Date | Inyectable para pruebas |

Muestra: imagen (`expo-image`, fallback `ArteCategoria` si no hay o falla), nombre (2 líneas), `fechaCorta`, categoría, `precioTexto`, `Rating compact` con el organizador, tag "Finalizado" + imagen atenuada si `finalizado`. Toda la tarjeta: `accessibilityRole="button"`, label `etiquetaAccesible`. Corazón: `accessibilityRole="button"`, label "Agregar a favoritos" / "Quitar de favoritos", `accessibilityState.busy = ocupado`; `modo: 'oculto'` → no se renderiza.

### `EventCardSkeleton`

Props: `variante: 'feature' \| 'compact'`. Compone `Skeleton` (003) con la silueta de la tarjeta; `accessibilityLabel="Cargando eventos"` en el contenedor de la lista (no por tarjeta).

### `EventoConFavorito` (`src/eventos/EventoConFavorito.jsx`, conectado)

Envuelve `EventCard` con `useAuth`, `useFavoritos`, `useRouter`/`usePathname`/`useGlobalSearchParams`: calcula `favorito` con `modoFavorito`, `alPresionar` → `/evento/<id>`, y en `pedirSesion` hace `router.push(hrefLogin(rutaActual))`. Las pantallas usan este componente; `EventCard` queda puro y reutilizable por 005.
