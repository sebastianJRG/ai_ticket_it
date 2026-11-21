# Contrato de pantallas y rutas: Detalle de evento y checkout

**Feature**: 005-detalle-evento-compra | **Plan**: [../plan.md](../plan.md) | **Modelo**: [../data-model.md](../data-model.md)

## Rutas

| Ruta | Archivo | Acceso (`decidirAcceso`) | Apilada sobre |
|------|---------|--------------------------|---------------|
| `/evento/[idEvento]` | `src/app/evento/[idEvento]/index.jsx` (se mueve desde `evento/[idEvento].jsx`) | Pública para todos (sin cambios, 003) | Pestañas |
| `/evento/[idEvento]/comprar` | `src/app/evento/[idEvento]/comprar.jsx` (**nueva**) | Visitante → `/login?volverA=%2Fevento%2F<id>%2Fcomprar`; ORGANIZADOR → `/evento/<id>`; COMPRADOR → permitir | Detalle |

Cambios en `src/navegacion/reglas.js` (con pruebas en `__tests__/navegacion/reglas-test.js`):

- `hrefEvento(id)` → `/evento/<id codificado>`; `hrefCheckout(id)` → `/evento/<id codificado>/comprar`.
- `decidirAcceso`: nueva rama `^/evento/[^/]+/comprar$` con la tabla de arriba. El resto de las decisiones no cambia.
- `destinoTrasLogin(COMPRADOR, '/evento/x/comprar')` → `'/evento/x/comprar'`; `destinoTrasLogin(ORGANIZADOR, '/evento/x/comprar')` → `'/organizador/eventos'` (consecuencia de la regla, sin tocar la función).

---

## `/evento/[idEvento]` — Detalle del evento (US1, US2)

**Peticiones**: `obtenerEvento(idEvento)` al montar; cuando hay `evento.organizador.id`, `listarReseniasOrganizador(id)`. Ninguna requiere sesión.

**Estados**

| Estado | Contenido |
|--------|-----------|
| Cargando | Esqueleto: hero 4:3, título, 3 líneas, 2 filas de tipo. `AppHeader transparent` con "Volver". |
| No encontrado (404/400) | `EmptyState` icono `search`, "Evento no encontrado", "Puede que lo hayan quitado o que el enlace esté mal.", acción "Volver a Explorar" → `router.replace('/explorar')` (organizador: `/organizador/eventos`). |
| Error (0 u otro) | `EmptyState` con `mensajeError` de 004 + acción "Reintentar" (`recargar`). |
| Listo | Ver abajo. |

**Contenido (listo)**, de arriba hacia abajo:

1. Hero 4:3: `multimedia[0]` (`expo-image`) o `ArteCategoria` con la paleta de la categoría. `AppHeader variante="transparent"` con "Volver" (si hay historial) y, si `modoFavorito(usuario) !== 'oculto'`, la acción corazón (`useFavoritos`; visitante → login con `volverA=/evento/<id>`).
2. Hoja superpuesta (`radius-xl`): chip de categoría; título `display-xl` (rol `header`); fecha larga; si `finalizado`, etiqueta "Evento finalizado".
3. Descripción.
4. Organizador: nombre + `Rating compact` con `puntajeOrganizador` (sin reseñas: "Sin reseñas").
5. "Entradas": `TicketTypeRow interactive={false}` por tipo (nombre, descripción, precio o "Gratis", "Agotado" si `cupo` 0).
6. "Reseñas del organizador" (CU-10):
   - Cargando: 2 esqueletos de `ReviewCard`.
   - Error: texto "No pudimos cargar las reseñas" + "Reintentar".
   - Vacío: "Este organizador todavía no tiene reseñas".
   - Con reseñas: `Rating variante="estrellas"` con promedio y cantidad ("4,6 (12)"), las 2 más recientes en `ReviewCard` y, si hay más de 2, "Ver todas las N reseñas" (expande en el lugar; luego "Ver menos").
7. `BarraAccion` fija según `modoCta`:

| `modoCta` | Barra |
|-----------|-------|
| `oculto` | No se renderiza |
| `finalizado` | `Button` deshabilitado "Evento finalizado" |
| `sinEntradas` | `Button` deshabilitado "Sin entradas a la venta" |
| `pedirSesion` | "Comprar entradas · desde $ X" → `router.push(hrefLogin(hrefCheckout(id)))` |
| `comprar` | "Comprar entradas · desde $ X" → `router.push(hrefCheckout(id))` |

**Accesibilidad**: título con rol `header` (nombre del evento); hero decorativo con `accessibilityLabel` "Imagen de <nombre>" si hay foto; las secciones con encabezados; el CTA anuncia el precio completo.

---

## `/evento/[idEvento]/comprar` — Checkout (US3)

**Guardia**: `RutaProtegida` aplica `decidirAcceso({ usuario, ruta })`; al montar redirige con `<Redirect>`; si la sesión cambia ya montada (p. ej. 401 → sesión expirada) usa `router.replace`.

**Peticiones**: `obtenerEvento(idEvento)` al montar; al confirmar, `crearCompra({ eventoId, tipoEntradaId, cantidad })` **una sola vez** por intento.

**Header**: `AppHeader` "Comprar entradas", subtítulo = nombre del evento, "Volver" (en éxito, sin "Volver").

**Estados**

| Estado | Contenido |
|--------|-----------|
| Cargando | Esqueleto de 2 filas y resumen |
| No encontrado | Igual que el detalle |
| Error de carga | `EmptyState` + "Reintentar" |
| Evento finalizado (al cargar) | Filas informativas, aviso "Este evento ya ocurrió" y botón deshabilitado "Evento finalizado" |
| Eligiendo | Ver abajo |
| Enviando | Botón `loading`; filas y stepper deshabilitados |
| Error al confirmar | Aviso en línea (`role="alert"`) con `mensajeErrorCompra`; vuelve a "Eligiendo" |
| Éxito | Ver abajo |

**Eligiendo**

1. "Elegí tu entrada": `TicketTypeRow interactive` por tipo (grupo de radio). El elegido muestra `QuantityStepper` (`min` 1, `max` cupo; en el tope, "+" deshabilitado y hint "Máximo N"). Agotados visibles y no seleccionables. Un solo tipo disponible → preseleccionado.
2. `ResumenCompra`: "<tipo> × <cantidad>", precio unitario, **Total** estimado (`price-lg`); sin tipo elegido, "Elegí un tipo de entrada".
3. Aviso de error en línea (si hay).
4. `BarraAccion`: `Button` primario con `textoConfirmar` ("Confirmar compra · $ 50.000"); deshabilitado sin tipo elegido, con evento finalizado o con error `bloquea`.

Cambiar tipo o cantidad limpia el aviso de error.

**Errores al confirmar**: tabla de [research R7](../research.md#r7-confirmar-una-sola-compra-y-manejo-de-errores). 409 → título exacto "No quedan suficientes entradas de este tipo" + mensaje del servidor. 400 → mensaje del servidor; si `esPasado(evento)` el botón pasa a "Evento finalizado". 404 → acción "Volver a Explorar".

**Éxito (201)**: `EmptyState`-like con icono `ticket`, título "Compra creada", cuerpo "Quedó pendiente de confirmación del organizador."; `ResumenCompra` con `tipoEntrada.nombre`, `cantidad` y `total` **de la respuesta**; acciones "Ver mis compras" (`router.replace('/compras')`) y "Volver al evento" (`router.back()` si se puede; si no, `router.replace(hrefEvento(id))`).

**Accesibilidad**: filas con `accessibilityRole="radio"` y `accessibilityState={{ checked, disabled }}`, label "<nombre>, <precio>[, agotado]"; stepper con label "Cantidad de <nombre>" y valor en live region; el aviso de error y el éxito se anuncian (`accessibilityLiveRegion="polite"`).

---

## Pruebas de pantalla (resumen de casos)

| Archivo | Casos |
|---------|-------|
| `__tests__/screens/detalle-evento-test.jsx` | datos completos + CTA "desde" (US1-1); finalizado (US1-2); no encontrado 404 y 400 (US1-3); sin imagen → arte; tipo 0 → "Gratis"; organizador sin CTA; visitante → login con `volverA` del checkout; reseñas: 2 recientes + "Ver todas" expande (US2-1), vacío (US2-2), error con reintento sin tapar el detalle |
| `__tests__/screens/checkout-test.jsx` | total = precio × cantidad y texto del botón (US3-1); "+" deshabilitado en el cupo + "Máximo N" (US3-2); 409 (US3-3); 400 (US3-4); éxito con total del servidor y "Ver mis compras" (US3-6); doble toque → `crearCompra` llamado 1 vez (SC-003); 403/404/0; un solo tipo preseleccionado |
| `__tests__/navegacion/rutas-test.jsx` (MOD) | visitante en `/evento/x/comprar` → login con `volverA`, y tras login como COMPRADOR vuelve al checkout (US3-5); ORGANIZADOR en el checkout → detalle; el caso existente del detalle simula `obtenerEvento` |
