# Implementation Plan: Explorar, buscar y favoritos

**Branch**: `004-explorar-busqueda-favoritos` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-explorar-busqueda-favoritos/spec.md`

## Summary

Reemplazar las pantallas provisorias de **Explorar**, **Buscar** y **Favoritos** (creadas en 003) por las definitivas, trazando a CU-03 y CU-11. Explorar hace una sola consulta `GET /api/eventos?sortBy=fecha&order=asc` (con `categoriaId` según el chip) y separa en el cliente los futuros en "Destacados" (primeros 5) y "Muy pronto" ([R2](./research.md#r2-explorar-destacados-y-muy-pronto)). Búsqueda mantiene `{ texto, categoriaId, orden }`, consulta con debounce de 300 ms para el texto y descarta respuestas viejas con un número de secuencia en `useEventos` ([R3](./research.md#r3-búsqueda-estado-de-filtros-debounce-y-respuestas-fuera-de-orden)); el orden ofrece 3 criterios × 2 sentidos que el **servidor** aplica ([R5](./research.md#r5-opciones-de-orden)). Favoritos usa un `FavoritosProvider` en el layout raíz con actualización optimista y reversión con toast ([R7](./research.md#r7-favoritos-estado-compartido-y-actualización-optimista)); el corazón se muestra según el rol ([R8](./research.md#r8-quién-ve-el-corazón)). Se agregan los componentes del design system necesarios (SearchBar, Chip/CategoryChips, SortSelector + BottomSheet propio, EventCard feature/compact, EventCardSkeleton, Rating compact, ArteCategoria), dos módulos puros (`presentacion.js`, `orden.js`) y tres hooks. Sin dependencias nuevas y sin cambios en `backend/`. Todo con TDD.

## Technical Context

**Language/Version**: JavaScript (ES2022, módulos ES vía Babel de Expo); React 19.3 / React Native 0.88

**Primary Dependencies**: Expo SDK ~58, `expo-router` 58 (`useLocalSearchParams`, `useFocusEffect`, `usePathname`), `expo-image` (imagen de la tarjeta), `expo-linear-gradient` (arte por categoría), `lucide-react-native` (vía `Icon`), `axios` (vía servicios de 001). **Sin dependencias nuevas de runtime** ([R6](./research.md#r6-bottomsheet-sin-dependencia-nueva)). Única devDependency nueva: `eslint-plugin-jsdoc` en la raíz, para que el lint verifique el JSDoc como exige el principio 6 (tasks T057).

**Storage**: N/A. El estado de favoritos vive en memoria del cliente (contexto) y se sincroniza con `GET/PUT/DELETE /api/usuarios/favoritos`; backend en memoria, sin cambios.

**Testing**: Jest 30 + `jest-expo` + `@testing-library/react-native`; pantallas con `expo-router/testing-library` (`renderRouter`); servicios simulados con `jest.mock`; `jest.useFakeTimers()` para el debounce; promesas diferidas para respuestas fuera de orden ([R13](./research.md#r13-pruebas-tdd))

**Target Platform**: Android, iOS y web (Expo)

**Project Type**: mobile-app (monorepo con API Express existente)

**Performance Goals**: favorito reflejado en pantalla < 100 ms, antes de la respuesta (SC-004: cambio síncrono); búsqueda a los 300 ms sin escribir; encontrar un evento por nombre en < 3 interacciones desde Explorar (SC-001)

**Constraints**: filtrar y ordenar solo en el servidor (la app solo separa "Muy pronto"); la respuesta visible siempre es la del último filtro emitido (SC-003); sin paginación; Explorar y Búsqueda sin sesión (FR-009); sin cambios en `backend/` ni en las reglas de acceso de 003; WCAG 2.2 AA y tema claro/oscuro

**Scale/Scope**: 3 pantallas (reemplazan placeholders); 9 componentes nuevos + 1 conectado (`EventoConFavorito`); 1 contexto; 3 hooks; 2 módulos puros; 1 modificación de `_layout.jsx` raíz (monta `FavoritosProvider`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio / regla | Evaluación | Estado |
|---|-------------------|-----------|--------|
| 1 | Arquitectura unidireccional (NON-NEGOTIABLE) | Backend sin cambios. Frontend: pantallas → componentes conectados/hooks/contextos (`useEventos`, `useCategorias`, `FavoritosContext`) → servicios de 001 → `api.js`. Componentes presentacionales (`EventCard`, `SortSelector`, …) no importan servicios ni contextos; `presentacion.js` y `orden.js` son puros. `FavoritosContext` depende de `AuthContext` y `ToastContext` (hacia abajo/lateral), nunca al revés. | ✅ |
| 2 | TDD (NON-NEGOTIABLE) | Pruebas primero para módulos puros, hooks, contexto, componentes y pantallas → aprobación del usuario → rojo → implementación → refactor (FR-010). `tasks.md` debe incluir el gate de aprobación. | ✅ |
| 3 | Persistencia en memoria (NON-NEGOTIABLE) | Sin persistencia nueva en el cliente (ni `SecureStore` ni `AsyncStorage` para favoritos); la fuente de verdad es el backend en memoria. | ✅ |
| 4 | Integridad de entidades (NON-NEGOTIABLE) | No toca `Compra`/`EstadoCompra` ni cupos. Solo lee `Evento`/`Categoria` y usa las rutas idempotentes de favoritos de 002. | ✅ |
| 5 | Calidad, observabilidad, simplicidad | YAGNI: sin librería de datos, sin `@gorhom/bottom-sheet`, sin sheet de filtros (el backend solo filtra texto/categoría), sin flags `lowStock`/`soldOut` (el listado no trae vendidas), `Rating` solo `compact`. Observabilidad: sin logging en cliente (como 001/003; el exigido es el del service layer del backend). Compatibilidad: rutas y acceso de 003 intactos; `_layout.jsx` suma un provider sin cambiar a los consumidores. | ✅ |
| 6 | JSDoc obligatorio | Docstring de archivo (propósito, owner, licencia) en cada archivo nuevo/modificado; `@param`/`@returns`/`@throws` en cada export; `@typedef` + `@property` para props, `TarjetaEvento`, `OpcionOrden`, `EstadoConsulta` y `EstadoFavoritos`. "Linted by the build gate": hasta ahora ESLint no revisaba JSDoc; esta feature agrega `eslint-plugin-jsdoc` para `frontend/src/` (T057), así que `npm run lint` lo hace cumplir. Extenderlo a `backend/` queda fuera de este workspace. | ✅ |
| — | Stack fijo | Expo SDK 58 + Expo Router + Jest. | ✅ |
| — | Casos de uso | CU-03 (texto y categorías), CU-11 (precio, fecha, puntaje); muestra el puntaje que alimenta CU-10. | ✅ |
| — | Workspaces | Cambios localizados en `frontend/`. | ✅ |
| — | Lint/format | `npm run lint` y `npm run format` antes de cada commit. | ✅ |

**Resultado**: sin violaciones. **Re-check post-diseño**: los contratos ([pantallas.md](./contracts/pantallas.md), [componentes.md](./contracts/componentes.md)) y el [modelo de datos](./data-model.md) no agregan dependencias, ni lógica de dominio en el cliente (orden y filtro quedan en el servidor), ni llamadas de componentes presentacionales a servicios; la única modificación de un archivo con consumidores (`app/_layout.jsx`) es aditiva → sigue ✅.

## Project Structure

### Documentation (this feature)

```text
specs/004-explorar-busqueda-favoritos/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones R1–R14
├── data-model.md        # Fase 1: Evento, Categoria, TarjetaEvento, SeccionesExplorar, FiltrosBusqueda, OpcionOrden, EstadoConsulta, EstadoFavoritos, ModoFavorito
├── quickstart.md        # Fase 1: cómo validar
├── contracts/
│   ├── pantallas.md     # /explorar, /buscar, /favoritos: peticiones, contenido, estados, corazón
│   └── componentes.md   # Módulos puros, hooks, FavoritosContext y props de componentes
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; no lo crea este comando)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── _layout.jsx                     # MOD: monta <FavoritosProvider> dentro de AuthProvider/ToastProvider
│   │   └── (comprador)/
│   │       ├── explorar.jsx                # MOD: pantalla definitiva (reemplaza PantallaProvisoria)
│   │       ├── buscar.jsx                  # MOD: pantalla definitiva
│   │       └── favoritos.jsx               # MOD: pantalla definitiva
│   ├── eventos/
│   │   ├── presentacion.js                 # NUEVO (puro): aTarjeta, precioDesde, esPasado, separarExplorar, iconoCategoria, paletaCategoria, modoFavorito
│   │   ├── orden.js                        # NUEVO (puro): OPCIONES_ORDEN, ORDEN_POR_DEFECTO, paramsOrden
│   │   └── EventoConFavorito.jsx           # NUEVO (conectado): EventCard + sesión + favoritos + navegación
│   ├── favoritos/
│   │   └── FavoritosContext.jsx            # NUEVO: FavoritosProvider + useFavoritos
│   ├── hooks/
│   │   ├── useDebounce.js                  # NUEVO
│   │   ├── useEventos.js                   # NUEVO: consulta con secuencia (descarta respuestas viejas)
│   │   └── useCategorias.js                # NUEVO
│   └── components/
│       ├── SearchBar.jsx                   # NUEVO
│       ├── Chip.jsx                        # NUEVO
│       ├── CategoryChips.jsx               # NUEVO
│       ├── BottomSheet.jsx                 # NUEVO (sobre Modal de RN)
│       ├── SortSelector.jsx                # NUEVO
│       ├── Rating.jsx                      # NUEVO (compact)
│       ├── ArteCategoria.jsx               # NUEVO
│       ├── EventCard.jsx                   # NUEVO (feature | compact)
│       └── EventCardSkeleton.jsx           # NUEVO
└── __tests__/
    ├── eventos/{presentacion,orden}-test.js                     # NUEVOS
    ├── hooks/{useDebounce,useEventos,useCategorias}-test.jsx    # NUEVOS
    ├── favoritos/FavoritosContext-test.jsx                      # NUEVO
    ├── components/{SearchBar,Chip,CategoryChips,BottomSheet,SortSelector,Rating,EventCard,EventCardSkeleton}-test.jsx  # NUEVOS
    ├── screens/{explorar,buscar,favoritos}-test.jsx             # NUEVOS
    └── navegacion/rutas-test.jsx                                # MOD (si hace falta): simular servicios que ahora llaman las pantallas reales
```

**Structure Decision**: monorepo existente; todo el cambio vive en `frontend/`. Las rutas ya existen (003) y solo cambia su contenido. El código que no es ruta queda fuera de `src/app/`: lógica pura y el componente conectado de eventos en `src/eventos/`, el estado de favoritos en `src/favoritos/` (igual que `src/auth/` y `src/feedback/`), hooks en `src/hooks/` y componentes presentacionales del design system en `src/components/`, reutilizables por 005 (detalle con corazón) y 007.

## Complexity Tracking

> Sin violaciones de la constitución: no aplica.
