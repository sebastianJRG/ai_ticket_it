# Quickstart: validar Explorar, buscar y favoritos

**Feature**: `004-explorar-busqueda-favoritos`

## Prerrequisitos

- Node 20 y dependencias instaladas en la raíz: `npm install`. Sin dependencias nuevas de runtime (`expo-image` y `expo-linear-gradient` ya están); solo la devDependency `eslint-plugin-jsdoc` para el lint de JSDoc.
- `frontend/.env` con `EXPO_PUBLIC_API_URL` apuntando al backend (ver `frontend/.env.example`).
- Backend con la feature 002 (favoritos) — ya está en `main`.

## 1. Pruebas automatizadas

```bash
cd frontend
npx jest __tests__/eventos          # presentacion.js y orden.js (precios, Muy pronto, 6 órdenes → SC-002)
npx jest __tests__/hooks            # useDebounce, useEventos (fuera de orden → SC-003), useCategorias
npx jest __tests__/favoritos        # FavoritosContext: optimista, reversión + toast, roles (SC-004)
npx jest __tests__/components       # SearchBar, Chip, CategoryChips, BottomSheet, SortSelector, Rating, EventCard, EventCardSkeleton (+ existentes)
npx jest __tests__/screens          # explorar, buscar, favoritos con renderRouter y servicios simulados
npm test                            # suite completa: sin regresiones (incluye navegacion/rutas-test de 003)
```

Resultado esperado: todo en verde. Las pruebas de navegación de 003 siguen pasando: las rutas y el acceso no cambian ([contracts/pantallas.md](./contracts/pantallas.md)).

## 2. Lint y formato

```bash
npm run lint && npm run format   # desde la raíz
```

## 3. Datos para la validación manual

El backend es en memoria y arranca vacío. Con la app o con `curl`:

1. Registrar un ORGANIZADOR y un COMPRADOR.
2. Como ORGANIZADOR, crear categorías **Recitales**, **Teatro** y una con nombre libre (p. ej. **Stand-up**) para ver el arte por hash.
3. Crear al menos 7 eventos futuros en varias categorías, con precios distintos, uno con `multimedia: ["https://…jpg"]`, uno con un único tipo de entrada a `0` (→ "Gratis") y uno con nombre que contenga "jazz".
4. *(Opcional, para "Finalizado" y puntaje)*: crear un evento con fecha ~2 minutos en el futuro; como COMPRADOR, comprarlo; como ORGANIZADOR, confirmarlo; esperar a que pase la fecha y a que la tarea periódica (`INTERVALO_UTILIZADAS_MS`, 60 s) la marque UTILIZADA; como COMPRADOR, `POST /api/resenias` con `puntuacion: 5`.

## 4. Validación manual

```bash
npm run dev:backend      # terminal 1
npm run dev:frontend     # terminal 2 (Android/iOS/web)
```

| # | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | Explorar sin sesión (US1, FR-009) | Abrir la app como visitante | Chip "Todo" seleccionado + categorías; carrusel de hasta 5 destacados; "Muy pronto" por fecha ascendente; sin eventos finalizados |
| 2 | Esqueletos (US1-3) | Recargar con red lenta (DevTools → throttling en web) | Siluetas de tarjetas, sin spinner |
| 3 | Filtrar por categoría (US1-2) | Tocar "Teatro" | Solo eventos de Teatro; "Todo" vuelve a mostrar todos |
| 4 | Buscar en < 3 interacciones (SC-001) | Tocar la barra → escribir "jazz" → tocar la tarjeta | Resultados tras ~300 ms sin escribir; contador "1 evento"; abre `/evento/<id>` |
| 5 | Último texto gana (SC-003) | Escribir rápido "ja", borrar, escribir "teatro" | La lista corresponde a "teatro" |
| 6 | Quitar filtros (US2-2/3) | Con texto + categoría, quitar el chip de categoría; luego buscar "zzzz" | Resultados sin categoría; luego estado vacío con "Quitar filtros" |
| 7 | Orden (US3, SC-002) | Recorrer las 6 opciones del SortSelector | Precio ↑/↓, Fecha ↑/↓ y Puntaje ↓/↑ ordenan según el servidor; en puntaje los organizadores sin reseñas quedan al final |
| 8 | Tarjeta (FR-005, US3-3) | Mirar las tarjetas | Nombre, fecha corta, categoría, "Desde $ …"/"Gratis", imagen o arte por categoría, "★ 4,7" o "Sin reseñas" |
| 9 | Finalizado (edge) | Buscar el evento del paso 3.4 | Tag "Finalizado", imagen atenuada; no aparece en Explorar |
| 10 | Corazón visitante (US4-2) | Sin sesión, tocar el corazón | Va a login; tras iniciar sesión vuelve a la misma pantalla |
| 11 | Favorito optimista (US4-1, SC-004) | Como COMPRADOR, tocar el corazón; abrir Favoritos | Se llena al instante; el evento está en Favoritos; desmarcarlo lo quita |
| 12 | Reversión (US4-1) | Detener el backend y tocar un corazón | Cambia y vuelve a su estado + toast "No pudimos actualizar tus favoritos" |
| 13 | Favoritos vacío (US4-3) | COMPRADOR sin favoritos → pestaña Favoritos | Estado vacío con "Explorar eventos" que lleva a Explorar |
| 14 | Error de red (edge) | Backend detenido → abrir Explorar | Estado de error con "Reintentar"; al levantar el backend y reintentar, carga |
| 15 | Sin categorías (edge) | Backend recién iniciado, sin datos → abrir Explorar | Solo el chip "Todo" y el estado vacío "No hay eventos próximos" (un evento siempre exige categoría, así que el caso con eventos se cubre con pruebas automatizadas) |
| 16 | Organizador (edge) | Iniciar sesión como ORGANIZADOR | No accede a Explorar (va a Mis eventos); nunca ve el corazón |

## 5. Accesibilidad

- Con lector de pantalla: cada tarjeta se anuncia como botón con nombre, fecha y precio; el corazón es un botón aparte ("Agregar a favoritos"); los chips anuncian "seleccionado"; el SortSelector anuncia la opción actual y las opciones son radios.
- Tema oscuro: repetir 1, 7 y 8 con el sistema en modo oscuro.
