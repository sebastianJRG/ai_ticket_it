# Contrato de pantallas: Eventos del organizador

**Feature**: `007-organizador-eventos` | Ver [data-model.md](../data-model.md) y [research.md](../research.md).

## Rutas y acceso

| Ruta | Archivo | Visitante | COMPRADOR | ORGANIZADOR |
|------|---------|-----------|-----------|-------------|
| `/organizador/eventos` | `src/app/organizador/eventos.jsx` (MOD) | login con `volverA` (ya existe, 003) | `/explorar` (ya existe) | permitir |
| `/organizador/crear` | `src/app/organizador/crear.jsx` (MOD) | ídem | ídem | permitir |
| `/organizador/mensajes` | `src/app/organizador/mensajes.jsx` (MOD) | ídem | ídem | permitir |
| `/evento/[idEvento]/compras` | `src/app/evento/[idEvento]/compras.jsx` (NUEVO), en `RutaProtegida` | `hrefLogin('/evento/<id>/compras')` | `/evento/<id>` | permitir (el 403 del servidor decide la propiedad) |
| `/compra/[idCompra]` | `src/app/compra/[idCompra].jsx` (MOD) | `hrefLogin(ruta)` (sin cambios) | permitir (sin cambios) | **permitir** (antes `/organizador/eventos`) |

Cambios en `reglas.js` (aditivos, salvo la rama del organizador en `DETALLE_COMPRA`, que 006 dejó prevista):

- `hrefComprasEvento(idEvento)` → `/evento/<id codificado>/compras`.
- `hrefCompra(idCompra, { eventoId } = {})` → `/compra/<id>`, o `/compra/<id>?evento=<eventoId codificado>`. La firma de un solo argumento no cambia.
- La rama `COMPRAS_EVENTO` se evalúa **antes** de `DETALLE_EVENTO`.
- Pruebas en `__tests__/navegacion/reglas-test.js`:
  - las 3 ramas por rol para `/evento/x/compras` y para `/compra/x` con ORGANIZADOR;
  - `destinoTrasLogin(organizador, '/evento/x/compras')` → `/evento/x/compras`;
  - `destinoTrasLogin(comprador, '/evento/x/compras')` → `/explorar`;
  - `hrefCompra` con y sin `eventoId`.

---

## `/organizador/eventos` — Mis eventos (US2)

**Peticiones**: `listarEventos({ sortBy: 'fecha', order: 'asc' })` al montar, al enfocar y con el gesto de actualizar.

**Estructura**:

1. `AppHeader` grande "Mis eventos", con la acción "Crear" (ícono `Plus`) que lleva a `/organizador/crear`.
2. Sección "Próximos", con `EventCard` `compact` sin favorito.
3. Sección "Finalizados", con `EventCard` `compact`, que ya muestra el rótulo "Finalizado".

| Estado | UI |
|--------|----|
| Carga inicial | `EsqueletosEventos` |
| Sin eventos propios | `EmptyState` "Todavía no creaste eventos", cuerpo "Creá tu primer evento para empezar a vender entradas." y acción "Crear evento" → `/organizador/crear` |
| Solo finalizados | Se omite la sección "Próximos" |
| Error sin datos | `EmptyState` con `mensajeError(error)` y "Reintentar" |
| Error con datos | La lista sigue visible y se muestra un toast de error |

**Tarjeta**: `router.push(hrefComprasEvento(evento.id))`.

---

## `/organizador/crear` — Crear evento (US1)

**Peticiones**:

- `listarCategorias()` al montar (`useCategorias`).
- `crearCategoria` desde el selector.
- `crearEvento` al publicar.

**Estructura** (en un `ScrollView` dentro de `KeyboardAvoidingView`):

1. `AppHeader` "Crear evento".
2. Banner de error del servidor, solo si lo hay (R13).
3. **Imágenes**: un `TextField` "URL de imagen" por cada una, con papelera; "Agregar imagen" (máx. 5); vista previa de la portada (la primera) con `expo-image`.
4. `TextField` "Nombre del evento" (requerido).
5. `SelectorCategoria` "Categoría" (requerido).
6. Fila con `TextField` "Fecha" (`DD/MM/AAAA`) y "Hora" (`HH:MM`), con la ayuda "Hora local".
7. `TextField` "Descripción" (multilínea, requerido).
8. Sección "Tipos de entrada": un `TicketTypeForm` por tipo, más `AgregarTipoEntrada`.
9. `BarraAccion` con "Publicar evento" (`loading` mientras se envía).

**Validación** (reglas en data-model §2 y research R5):

- **Al perder el foco**: se valida solo ese campo y queda marcado como tocado.
- **Al publicar**: se validan todos los campos; si hay errores, se marcan, se hace scroll al primero y no se envía nada.
- El error se muestra en el `error` de cada `TextField`.

**Resultado de publicar**:

| Respuesta | Efecto |
|-----------|--------|
| 201 | Toast "Evento publicado", reinicio del borrador y `router.push(hrefComprasEvento(evento.id))` |
| 400 | Banner con el mensaje del servidor; el borrador se conserva |
| 404 | Banner "La categoría elegida ya no existe. Elegí otra.", se limpia `categoriaId` y se recargan las categorías |
| 0 | Banner "Sin conexión. Tus datos siguen acá." |
| 401 | Lo maneja la capa de servicios de 001 |

Mientras se envía, un segundo toque no genera otra petición.

**Selector de categoría** (US1-4): toque → `BottomSheet` "Categoría" con la lista, la elegida con check y "+ Crear categoría" al final. "+ Crear categoría" cambia el sheet a un formulario con Nombre y Descripción y los botones "Crear y elegir" y "Volver".

| Resultado | Efecto |
|-----------|--------|
| 201 | Se agrega a la lista, se selecciona, se cierra el sheet y se muestra el toast "Categoría creada" |
| 400 | El mensaje del servidor queda dentro del sheet; se conserva lo escrito |
| Otro | `mensajeError(error)` dentro del sheet |

Sin categorías (o si falla la carga), el sheet muestra solo "+ Crear categoría" y la ayuda "Todavía no hay categorías".

---

## `/evento/[idEvento]/compras` — Compras del evento (US3, US4)

**Peticiones**, en paralelo:

- `obtenerComprasEvento(idEvento)` (`useComprasEvento`), al montar, al enfocar, con el gesto y después de cada acción.
- `obtenerEvento(idEvento)` (`useEvento`) para el encabezado.

**Estructura**:

1. `AppHeader` con volver (a `/organizador/eventos` si no hay historial), el nombre del evento como título y la fecha larga como subtítulo; rótulo "Finalizado" si ya ocurrió.
2. `AvailabilitySummary` con `resumenDisponibilidad(disponibilidad)`.
3. `Tabs` `underline`: Pendientes · Confirmadas · Utilizadas · Canceladas, cada una con contador (el largo de cada grupo). La inicial es Pendientes.
4. Lista de `OrganizerPurchaseRow` de la pestaña elegida, con `acciones = accionesDisponibles(compra, evento.fecha)`.

| Estado | UI |
|--------|----|
| Carga | Esqueleto del resumen y 3 filas esqueleto |
| 403 | `EmptyState` "No tenés acceso a este evento" y "Ver mis eventos" (US3-3) |
| 404 o 400 | `EmptyState` "Este evento no existe" y "Ver mis eventos" |
| Otro error | `EmptyState` con `mensajeError(error)` y "Reintentar" |
| Sin compras | Resumen visible y `EmptyState` "Todavía no hay compras" bajo las pestañas (contadores en 0) |
| Pestaña vacía | `EmptyState` sin acción, con el texto de data-model §4 |
| Evento ocurrido | Ninguna fila muestra acciones (US4-3) |

**Acciones** (US4; detalle en research R11):

| Toque | Efecto |
|-------|--------|
| Confirmar | `ejecutar('confirmar', compra)` directo; spinner en ese botón |
| Reembolsar / Cancelar | `Modal` destructivo con `cuerpoAccion` → al confirmar, `ejecutar(...)`; el modal muestra `cargando` |
| 200 | Se cierra el modal, toast de éxito y `recargar()`. Se actualizan la lista, los contadores y la disponibilidad, y la compra aparece en su nueva pestaña |
| Error (400/403/404/0/otro) | Se cierra el modal, toast `mensajeErrorAccion` y `recargar()` |

Mientras hay una acción en curso, todos los botones de acción de la pantalla quedan deshabilitados (una sola petición). Tocar una fila fuera de los botones lleva a `router.push(hrefCompra(id, { eventoId: idEvento }))`.

---

## `/organizador/mensajes` — Mensajes (US5)

**Peticiones**: `listarEventos(...)`, más `obtenerComprasEvento(id)` por cada evento propio, en paralelo (`useComprasOrganizador`). Se hacen al montar, al enfocar y con el gesto.

**Estructura**: `AppHeader` grande "Mensajes" y una `SectionList`. Cada sección es un evento (encabezado con nombre y fecha corta) y sus filas son `OrganizerPurchaseRow` sin acciones (comprador, "2 × Platea · $ 64.000" y estado).

| Estado | UI |
|--------|----|
| Carga | 3 filas esqueleto |
| Sin eventos o sin compras | `EmptyState` (ícono `message`) "Todavía no hay compras para conversar" y "Cuando alguien compre entradas de tus eventos, vas a poder escribirle desde acá." |
| Algunos eventos fallaron | Secciones cargadas y un aviso "No pudimos cargar las compras de 1 evento" / "de N eventos" con "Reintentar" |
| Todo falló | `EmptyState` con `mensajeError(error)` y "Reintentar" |

**Fila**: `router.push(hrefCompra(compra.id, { eventoId: seccion.evento.id }))`.

---

## `/compra/[idCompra]` — Detalle de compra (MOD, variante ORGANIZADOR)

**Variante COMPRADOR**: sin cambios (006).

**Variante ORGANIZADOR** (`usuario.rol === 'ORGANIZADOR'`):

- **Peticiones**: `obtenerComprasEvento(evento)` con `evento` leído de `?evento=`. La compra se busca por `idCompra`.
- **Estructura**:
  1. `AppHeader` con volver (a `/organizador/mensajes` si no hay historial) y el nombre del evento.
  2. `ResumenCompra`, la línea "Comprador: <nombre apellido>" y `StatusBadge` `sm`.
  3. `Tabs` `segmented`, Detalle · Chat. Detalle muestra `StatusTimeline`; Chat sigue provisorio y lo completa 008.
- **Sin acciones de estado**: se gestionan desde las compras del evento.

| Estado | UI |
|--------|----|
| Sin `?evento` o compra no encontrada | `EmptyState` "No encontramos esta compra" y "Ver mis eventos" |
| 403 | `EmptyState` "No tenés acceso a esta compra" y "Ver mis eventos" |
| Otro error | `EmptyState` con `mensajeError(error)` y "Reintentar" |
