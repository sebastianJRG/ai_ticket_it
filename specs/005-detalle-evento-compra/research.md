# Research: Detalle de evento y compra de entradas

**Feature**: 005-detalle-evento-compra | **Fecha**: 2026-11-21 | **Plan**: [plan.md](./plan.md)

Todas las incógnitas del Technical Context quedan resueltas acá. Cada decisión sigue el formato *Decisión / Justificación / Alternativas*.

---

## R1. Qué devuelve el backend y qué deriva la app

**Decisión**: La app consume, sin cambios en `backend/`:

- `GET /api/eventos/:idEvento` (vía `obtenerEvento` de 001): `{ id, nombre, descripcion, categoria: { id, nombre, descripcion }, fecha, tiposEntrada: [{ id, nombre, descripcion, precio, cupo }], multimedia: string[], organizador: { id, nombre, apellido, rol }, puntajeOrganizador: number|null }`. 400 (ID inválido), 404 (no existe).
- `GET /api/usuarios/:idOrganizador/resenias` (vía `listarReseniasOrganizador` de 001): `[{ id, comprador: { id, nombre, apellido }, eventoId, detalle, puntuacion }]` en orden de creación. **No trae fecha, nombre del evento ni tipo de entrada.**
- `POST /api/compras` (vía `crearCompra` de 001): cuerpo `{ eventoId, tipoEntradaId, cantidad }`; 201 con `{ id, comprador, evento: { id, nombre, fecha }, tipoEntrada: { id, nombre, precio }, cantidad, total, estado: 'PENDIENTE' }`. Errores 400 (datos inválidos o evento ya ocurrido), 401, 403 (no es COMPRADOR), 404 (comprador, evento o tipo inexistente), 409 (cupo insuficiente; el mensaje dice cuántas quedan: "Cupo insuficiente: quedan 3 entradas disponibles.").

La app **solo deriva para presentar**: fecha larga, precio desde, textos de precio ("Gratis"), si el evento ya ocurrió, modo del CTA, total estimado (precio × cantidad) y tope del selector (cupo total). El total definitivo es el `total` de la respuesta (FR-005).

**Justificación**: La spec (Assumptions) fija que no se modifica el backend y que el control real del cupo lo hace el servidor. Los servicios de 001 ya cubren las tres llamadas.

**Alternativas**: Agregar un endpoint público de disponibles (descartado por la spec); calcular el total solo en el cliente (contradice FR-005).

## R2. Rutas: detalle y checkout

**Decisión**:
- El detalle sigue en **`/evento/[idEvento]`** (público, 003). El archivo pasa de `src/app/evento/[idEvento].jsx` a `src/app/evento/[idEvento]/index.jsx` para poder anidar el checkout; la URL no cambia.
- Nueva ruta **`/evento/[idEvento]/comprar`** (`src/app/evento/[idEvento]/comprar.jsx`), apilada en el Stack raíz sobre el detalle, sin pestañas.
- Regla nueva en `src/navegacion/reglas.js` (con su prueba en `reglas-test.js`, como exige AGENTS.md): `^/evento/[^/]+/comprar$` → visitante: `redirigir(hrefLogin(ruta))`; ORGANIZADOR: `redirigir('/evento/<id>')`; COMPRADOR: `permitir`. Se agregan los helpers puros `hrefEvento(id)` y `hrefCheckout(id)` (codifican el ID).
- La pantalla de checkout aplica la regla con un guardia pequeño (`RutaProtegida`, mismo patrón `Redirect`/`router.replace` que `AreaConPestanas`), porque esta ruta no vive dentro de un área con pestañas.

**Justificación**: Una ruta propia permite el regreso tras login (`volverA=/evento/<id>/comprar`, US3-5): `destinoTrasLogin` ya devuelve `volverA` solo si `decidirAcceso` lo permite, así que un COMPRADOR vuelve al checkout y un ORGANIZADOR que llegue por enlace va a su ruta inicial, sin cambiar esas funciones. Mantener la URL del detalle no rompe enlaces de 004 (`EventoConFavorito`).

**Alternativas**: Checkout como BottomSheet dentro del detalle (no tiene URL → no hay `volverA` posible y el sheet se pierde al volver del login); ruta `/comprar/[idEvento]` fuera de `evento/` (rompe la jerarquía y la regla quedaría menos obvia).

## R3. Carga del detalle y de las reseñas

**Decisión**: Dos hooks independientes:
- `useEvento(idEvento)` → `{ evento, cargando, error, noEncontrado, recargar }`. `noEncontrado` es `true` ante 404 **o 400** (un ID inválido es, para el usuario, un evento que no existe → US1-3). Descarta respuestas si cambia el ID o se desmonta (secuencia, como `useEventos` de 004).
- `useReseniasOrganizador(idOrganizador)` → `{ resenias, cargando, error, recargar }`; no pide nada mientras `idOrganizador` sea vacío (se llama con `evento?.organizador?.id`).

Un error en reseñas **no** bloquea el detalle: la sección muestra su propio error con "Reintentar". El checkout reutiliza `useEvento` (vuelve a pedir el evento: datos frescos y funciona al entrar por enlace o tras login).

**Justificación**: Las reseñas dependen del ID del organizador, que llega con el evento; separarlas permite mostrar el detalle apenas está y aislar fallos. Volver a pedir el evento en el checkout es más simple que compartir estado entre rutas y siempre es correcto.

**Alternativas**: Un solo hook que encadena ambas peticiones (un error de reseñas tumbaría el detalle); pasar el evento por parámetros de navegación (no sobrevive a un enlace profundo ni al login).

## R4. Reseñas: promedio, cantidad y "más recientes"

**Decisión**:
- **Promedio**: `evento.puntajeOrganizador` (lo calcula el servidor con las mismas reseñas). **Cantidad**: `resenias.length`.
- **Más recientes**: como la reseña no tiene fecha, "más recientes" = últimas en orden de creación (la lista se invierte). Se muestran **2** (design system › ReviewCard) y, si hay más, "Ver todas las N reseñas", que **expande la lista en el lugar** (y "Ver menos" la contrae).
- **ReviewCard**: Avatar con iniciales, nombre del comprador ("Nombre A."), estrellas de solo lectura y comentario (hasta 6 líneas; "Leer más" si se corta). Se omiten fecha y "Asistió con …" porque el backend no los expone.
- Sin reseñas: "Este organizador todavía no tiene reseñas" (US2-2). Con `puntajeOrganizador` en `null` pero reseñas en la lista (no debería pasar), se calcula el promedio en el cliente como respaldo.

**Justificación**: US2-1 pide promedio, cantidad, las más recientes y "Ver todas". Expandir en el lugar evita una ruta y una regla de acceso nuevas (YAGNI) y la lista es pública y chica (sin paginación en el backend).

**Alternativas**: Pantalla `/evento/[id]/resenias` (ruta, regla y pruebas extra para una lista); BottomSheet con todas (scroll anidado dentro de un modal, peor accesibilidad).

## R5. CTA del detalle según sesión y estado del evento

**Decisión**: Función pura `modoCta(evento, usuario, ahora)`:

| Caso | Modo | Barra inferior |
|------|------|----------------|
| ORGANIZADOR (cualquiera) | `oculto` | Sin barra (edge case) |
| Evento ya ocurrido (`fecha <= ahora`) | `finalizado` | Botón deshabilitado "Evento finalizado" (US1-2) |
| Sin tipos de entrada (o todos con cupo 0) | `sinEntradas` | Botón deshabilitado "Sin entradas a la venta" |
| Visitante | `pedirSesion` | "Comprar entradas · desde $ X" → `router.push(hrefLogin(hrefCheckout(id)))` |
| COMPRADOR | `comprar` | "Comprar entradas · desde $ X" → `router.push(hrefCheckout(id))` |

El precio desde usa la misma regla que la tarjeta de 004: "desde $ 25.000"; si todos son 0, "Gratis"; si el mínimo es 0 y hay otros mayores, "desde $ 0". Cada tipo de entrada muestra "Gratis" si su precio es 0 (edge case). El detalle muestra el corazón de favoritos en el header con el mismo `modoFavorito` de 004 (reusa `useFavoritos`).

**Justificación**: FR-003 (requiere COMPRADOR y deshabilitado si ocurrió) y edge cases. El visitante va directo a login con `volverA` del checkout (sin pasar por un `Redirect` intermedio); el guardia del checkout cubre igual los enlaces profundos.

**Alternativas**: Ocultar la barra en eventos finalizados (la spec pide *indicarlo*); mostrar el botón al organizador deshabilitado (ruido; el edge case dice "sin botón").

## R6. Checkout: elegir exactamente un tipo y una cantidad

**Decisión**:
- Los tipos de entrada se muestran como `TicketTypeRow` `interactive`, que funcionan como **grupo de radio** (`accessibilityRole="radio"`, `accessibilityState.checked`). Elegir uno lo marca (borde `primary-text`) y muestra **en esa fila** su `QuantityStepper`; los demás no tienen stepper. Cambiar de tipo reinicia la cantidad a 1.
- Con un único tipo de entrada se preselecciona; con varios, ninguno (el botón dice "Elegí un tipo de entrada", deshabilitado) para no comprar un tipo por accidente.
- `QuantityStepper`: `min = 1`, `max = cupo` del tipo (spec: tope en el cupo total; sin máximo por compra). Al llegar a `max` el "+" se deshabilita y el hint pasa a "Máximo N" en `warning` (US3-2). La cantidad nunca se tipea.
- Un tipo con `cupo` 0 se muestra **Agotado** (precio tachado, sin stepper, no seleccionable).
- Resumen (`ResumenCompra`): tipo × cantidad, precio unitario y total estimado `price-lg`; sin cargo por servicio ni "pago protegido" (Assumptions: sin pago). Botón fijo "Confirmar compra · $ 50.000" (o "Confirmar compra · Gratis").

Interacciones (SC-001): con varios tipos y 2 entradas → "Comprar entradas", elegir tipo, "+", "Confirmar" = **4**; con un tipo y 1 entrada → 2.

**Justificación**: FR-004 exige exactamente un tipo (el contrato del backend compra un solo tipo por compra). Un stepper por fila con mínimo 0 (diseño original) permitiría cantidades en dos tipos y obligaría a reglas de "mover la selección" difíciles de entender. El radio + stepper en la fila elegida conserva la estética del design system y hace imposible un estado inválido.

**Alternativas**: Stepper en todas las filas que resetea los demás al tocar otro (sorpresivo); Select de tipo + stepper aparte (más toques, se aleja del diseño); máximo por compra fijo (p. ej. 10) — no pedido por la spec.

## R7. Confirmar: una sola compra y manejo de errores

**Decisión**:
- Hook `useCrearCompra()` → `{ confirmar(datos), enviando, error, compra }`. Un **`useRef` de "en curso"** se marca *antes* de llamar al servicio: un segundo `confirmar` mientras hay una petición pendiente se ignora (no espera al re-render). El botón pasa a `loading` (sin handler). SC-003.
- Mapeo puro `mensajeErrorCompra(error)` → `{ titulo, cuerpo, tipo }`, mostrado en un aviso **en línea** (`accessibilityRole="alert"`, `accessibilityLiveRegion="polite"`) arriba del resumen; la pantalla sigue editable:

| Status | Título | Cuerpo | Efecto |
|--------|--------|--------|--------|
| 409 | "No quedan suficientes entradas de este tipo" | Mensaje del servidor ("Cupo insuficiente: quedan 3 …") | Sigue en el checkout; se puede cambiar cantidad o tipo (US3-3). |
| 400 | "No pudimos crear la compra" | Mensaje del servidor (p. ej. "El evento ya ocurrió.") | Si el evento ya ocurrió según el reloj del cliente, el botón queda "Evento finalizado" (US3-4). |
| 403 | "Solo los compradores pueden comprar entradas" | — | Botón deshabilitado. |
| 404 | "Este evento o tipo de entrada ya no existe" | — | Acción "Volver a Explorar". |
| 0 | "Sin conexión" | "Revisá tu conexión e intentá de nuevo." | Reintentable. |
| otro | "No pudimos crear la compra" | "Intentá de nuevo en unos segundos." | Reintentable. |

- 401 lo resuelve el flujo de 003: `AuthContext` cierra la sesión y avisa; el guardia del checkout redirige a login con `volverA`.
- Cambiar tipo o cantidad borra el aviso.

**Justificación**: FR-006 y US3-3/US3-4. El aviso en línea persiste (un toast desaparece y el usuario puede no leerlo) y queda junto al control que hay que corregir. El texto de 409 que pide la spec va como título; el del servidor aporta cuántas quedan sin parsearlo.

**Alternativas**: Parsear el número del mensaje de 409 para bajar el `max` (frágil: depende del texto); toast para todos los errores (efímero); deshabilitar el botón por un tiempo fijo (no garantiza una sola petición).

## R8. Después de crear la compra

**Decisión**: Con 201, el checkout cambia a un **estado de éxito** en la misma pantalla (no hay ruta nueva): ícono ticket, "Compra creada", "Quedó pendiente de confirmación del organizador." y el resumen con el `total` y la `cantidad` **de la respuesta**. Acciones: "Ver mis compras" (`router.replace('/compras')`, primaria) y "Volver al evento" (`router.back()` o `replace` al detalle si no hay historial). El header pierde "Volver" a la pantalla de compra ya enviada (no se puede reenviar).

**Justificación**: FR-007 y US3-6. Un estado persistente muestra el monto definitivo del servidor (FR-005) y no se pierde como un toast. `replace` evita que "atrás" desde Mis compras vuelva a un checkout ya usado. La pestaña Compras la completa la feature 006; hoy es la provisoria de 003, pero la ruta ya existe.

**Alternativas**: Volver al detalle con un toast con acción "Ver" (efímero; el total del servidor no se ve); navegar directo a Mis compras (el usuario no ve la confirmación).

## R9. Componentes del design system que se agregan

**Decisión**: Presentacionales (sin servicios ni contextos), en `src/components/`:
- `TicketTypeRow` (`interactive` false | true): nombre, descripción, precio ("Gratis"), agotado; en interactivo, radio + `QuantityStepper` cuando está elegido. Sin "Quedan N": el detalle público no trae vendidas (Assumptions).
- `QuantityStepper`: −/+ de 44 × 44, `min`/`max`, hint "Máximo N", valor con `accessibilityLiveRegion="polite"`, `accessibilityLabel` "Cantidad de <tipo>".
- `ReviewCard` y `Avatar` (iniciales + color determinístico; tamaño 32/40).
- `Rating`: se **agrega** la variante `estrellas` (solo lectura, 5 estrellas + valor con coma + "(N)"); `compact` no cambia.
- `ResumenCompra` (resumen troquelado) y `BarraAccion` (barra inferior fija con safe area, para los CTA de ambas pantallas).

`ArteCategoria`, `AppHeader` (`transparent` en el hero), `Button`, `EmptyState`, `Skeleton` y `useFavoritos` se reutilizan de 003/004.

**Justificación**: Son los componentes que nombran `ScreenDetalleEvento` y `ScreenCheckout`; agregar una variante a `Rating` es retrocompatible.

**Alternativas**: Implementar todo dentro de las pantallas (pantallas gigantes, sin pruebas aisladas).

## R10. Pruebas (TDD)

**Decisión**: Igual que 004: Jest 30 + `jest-expo` + `@testing-library/react-native`; pantallas con `renderRouter` de `expo-router/testing-library`; servicios simulados con `jest.mock`; promesas diferidas (`__tests__/helpers/diferido.js`) para probar el doble toque y el estado "enviando"; `ahora` inyectable en las funciones puras para "finalizado". Orden: módulos puros → hooks → componentes → reglas → pantallas. Se actualiza `navegacion/rutas-test.jsx` (el detalle ya no es provisorio: simular `obtenerEvento` y `listarReseniasOrganizador`) y se agregan casos de `/evento/:id/comprar` a `reglas-test.js`. Gate de aprobación de las pruebas por el usuario antes del rojo (principio 2).

**Justificación**: Reutiliza helpers existentes (`adaptadorFalso`, `authFalso`, `eventosEjemplo`, `renderConTema`).

**Alternativas**: Pruebas E2E (no hay infraestructura; fuera de alcance).
