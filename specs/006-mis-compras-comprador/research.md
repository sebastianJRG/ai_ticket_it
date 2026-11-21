# Research: Mis compras del comprador

**Feature**: `006-mis-compras-comprador` | **Fecha**: 2026-11-21 | **Plan**: [plan.md](./plan.md)

Todas las incógnitas del Technical Context quedan resueltas acá. No hay dependencias nuevas ni cambios en `backend/`: la API ya expone todo lo necesario (`GET /api/compras` con `diasRestantes`, `PATCH /api/compras/:id/cancelacion`, `POST /api/resenias`, `GET /api/resenias/:idEvento`) y los servicios de 001 ya la envuelven (`listarMisCompras`, `cancelarCompra`, `crearResenia`, `listarReseniasEvento`).

---

## R1. Ruta del detalle de compra

- **Decision**: ruta nueva **`/compra/[idCompra]`** (`frontend/src/app/compra/[idCompra].jsx`), apilada sobre las pestañas igual que `/evento/[idEvento]`, envuelta en `RutaProtegida`. En `reglas.js` se agrega `hrefCompra(idCompra)` y una rama en `decidirAcceso`: visitante → `hrefLogin(ruta)`; COMPRADOR → permitir; ORGANIZADOR → `/organizador/eventos`. La regla para el organizador la abre la feature 007/008 (que reutilizan este detalle con la pestaña Chat); hoy 006 solo la necesita para el comprador.
- **Rationale**: dentro de `(comprador)/` cualquier archivo nuevo se volvería pestaña o exigiría convertir `compras` en un Stack anidado; una ruta de primer nivel repite el patrón ya probado del detalle de evento y deja el detalle compartible por ambos roles más adelante. Singular (`/compra/…`) evita chocar con la pestaña `/compras`.
- **Alternatives considered**: `(comprador)/compras/[idCompra].jsx` con Stack anidado en la pestaña (más layouts, la barra inferior queda visible y 008 tendría que duplicarlo para el organizador); modal/BottomSheet en la lista (no admite pestañas Detalle/Chat ni enlace directo).

## R2. Fuente de datos: listado único, sin detalle individual

- **Decision**: un hook **`useMisCompras()`** llama a `listarMisCompras()` y lo usan **ambas** pantallas. El detalle busca la compra por `idCompra` dentro del listado; si no está → estado "Compra no encontrada". Las respuestas viejas se descartan con un contador de petición (patrón de `useEventos`). El listado se pide al montar, al **enfocar** la pantalla (`useFocusEffect`, así aparece la compra recién creada en el checkout y los pasos automáticos a UTILIZADA) y con el gesto de actualizar (`RefreshControl`).
- **Rationale**: la spec asume que no hay `GET /api/compras/:id`; pedir el listado completo es 1 petición, siempre fresca, y evita un contexto global que haya que invalidar. YAGNI.
- **Alternatives considered**: `MisComprasProvider` en el layout raíz (estado compartido entre lista y detalle; más superficie y riesgo de datos viejos sin ganancia real); pasar la compra por parámetros de ruta (se pierde al recargar en web y queda desactualizada).

## R3. Agrupación por pestañas y orden

- **Decision**: módulo puro `compras/misCompras.js` con `PESTANAS_COMPRAS` = `activas` (PENDIENTE, CONFIRMADA), `pasadas` (UTILIZADA), `canceladas` (CANCELADA, REEMBOLSADA). `agruparPorPestana(compras)` devuelve `{ activas, pasadas, canceladas }` con cada lista **invertida** (el servidor responde en orden de creación ascendente; FR-001 pide más reciente primero). Los contadores son el largo de cada lista. Un estado desconocido no cae en ninguna pestaña (defensivo; el backend no lo produce). Pestaña inicial: Activas; la pestaña elegida es estado local de la pantalla.
- **Rationale**: SC-001 (100% en la pestaña correcta) se verifica con una prueba pura sobre los 5 estados.
- **Alternatives considered**: filtrar por estado en el servidor (no hay parámetro); ordenar por fecha del evento (la spec pide orden de creación).

## R4. Estado y días restantes en la tarjeta

- **Decision**: la tarjeta usa `StatusBadge` con `daysLeft={compra.diasRestantes}` (valor del servidor, FR-002) y `size="sm"`; además, si está CONFIRMADA, muestra la cuenta regresiva destacada con `formatDaysLeft(diasRestantes)` ("Faltan 3 días", "Es mañana", "Es hoy"). Resultado: badge "Confirmada · faltan 3 días" (escenario US1-1) y el destacado "Es hoy" (US1-2). PENDIENTE muestra la ayuda "Esperando la confirmación del organizador".
- **Rationale**: `size="sm"` usa el texto corto "Pendiente" en vez de "Pendiente de pago" (no hay pago en el alcance) sin tocar los tokens del design system, que también usa el organizador. Color + ícono + texto cumplen "no solo color".
- **Alternatives considered**: recalcular días en el cliente con `daysUntil` (puede discrepar del servidor, que redondea hacia arriba); cambiar la etiqueta del token PENDIENTE (afecta `design-system/` y la prueba de `StatusBadge`).

## R5. Cuándo se ofrece cancelar

- **Decision**: función pura `esCancelable(compra, ahora = new Date())` → `true` solo si `estado ∈ {PENDIENTE, CONFIRMADA}` y `new Date(compra.evento.fecha) > ahora`. Se usa en la tarjeta (acción "Cancelar") y en el detalle ("Cancelar compra"). La regla real la aplica el backend (400); la función solo decide si mostrar la acción (SC-004).
- **Rationale**: refleja el principio 4 de la constitución y CU-08; `ahora` inyectable para pruebas.
- **Alternatives considered**: ofrecer siempre y depender del 400 (viola SC-004).

## R6. Flujo de cancelación

- **Decision**: hook **`useCancelarCompra({ alTerminar })`** con una ref síncrona que impide una segunda petición mientras hay una en curso (patrón de `useCrearCompra`). Un componente **`ConfirmarCancelacion`** (`src/compras/`) compone el `Modal` existente: título "¿Cancelar esta compra?", cuerpo con impacto concreto (`cuerpoCancelacion`: "Vas a cancelar 2 × Platea de «Evento» por $ 80.000. El organizador gestiona el reembolso."), botón destructivo "Sí, cancelar compra", secundario "No, conservar entradas", `cargando` mientras se envía. Al confirmar:
  - **200** → cierra el diálogo, toast de éxito "Compra cancelada", y `recargar()` del listado (la respuesta del PATCH no trae `diasRestantes`, así que se usa el listado como verdad). La compra pasa a la pestaña Canceladas.
  - **Error** → cierra el diálogo, toast de error con `mensajeErrorCancelacion(error)` y `recargar()` (US2-4): 400 → "No se puede cancelar esta compra" + mensaje del servidor; 403 → "No podés cancelar esta compra"; 404 → "Esta compra ya no existe"; 0 → "Sin conexión"; otro → genérico. 401 lo maneja la capa de servicios (001).
  - El botón "Cancelar" de la tarjeta es un botón propio (no dispara la apertura del detalle). Total: 2 toques (SC-003).
- **Rationale**: reutiliza `Modal`, `useToast` y el patrón anti doble toque ya probados.
- **Alternatives considered**: actualización optimista (el resultado depende de la fecha del evento en el servidor; revertir complica sin valor); error dentro del modal (la spec pide que la lista se actualice, y la compra puede haber cambiado de estado).

## R7. Pestañas (Tabs)

- **Decision**: componente presentacional nuevo **`Tabs`** con variantes `underline` (lista, con contador en pill) y `segmented` (Detalle/Chat), `accessibilityRole="tablist"` en el contenedor y `"tab"` + `accessibilityState={{ selected }}` en cada una; la etiqueta accesible incluye el contador ("Activas, 2").
- **Rationale**: doc `design-system/docs/componentes/Tabs.md`; lo reutiliza 007 (filtros de compras del evento).
- **Alternatives considered**: `material-top-tabs` (dependencia nueva, YAGNI).

## R8. Tarjeta de compra (PurchaseCard)

- **Decision**: componente presentacional **`PurchaseCard`** con forma de ticket troquelado (doc `PurchaseCard.md`): parte superior con nombre del evento y fecha (`formatDate(fecha)`); troquel con línea punteada; talón con "2 × Platea", total (`formatPrice`), `StatusBadge` y detalle por estado (R4). CANCELADA/REEMBOLSADA se atenúan (opacidad). Sin thumbnail ni lugar: el DTO de compra solo trae `evento { id, nombre, fecha }`. Props: `compra`, `cancelable`, `alPresionar`, `alCancelar`. Toda la tarjeta abre el detalle; "Cancelar" solo si `cancelable`. La acción "Pagar ahora" queda fuera (sin pago).
- **Rationale**: presentacional (no importa servicios ni contextos), como el resto de `src/components/`.
- **Alternatives considered**: pedir cada evento para mostrar imagen/lugar (N peticiones por lista, YAGNI); ofrecer "Dejar reseña" en la tarjeta (exigiría pedir las reseñas de cada evento para no ofrecerla dos veces; se ofrece en el detalle, R11).

## R9. Línea de estado (StatusTimeline) sin historial

- **Decision**: función pura `pasosLinea(estado)` y componente **`StatusTimeline`** que la dibuja. Sin fechas (el backend no expone `CambioEstadoCompra`). Cada paso `{ estado, situacion: 'hecho'|'actual'|'pendiente' }`:
  - PENDIENTE → P(actual), C(pendiente), U(pendiente)
  - CONFIRMADA → P(hecho), C(actual), U(pendiente)
  - UTILIZADA → P(hecho), C(hecho), U(actual)
  - CANCELADA → P(hecho), Cancelada(actual) — toda compra nace PENDIENTE; no se sabe si llegó a confirmarse, así que no se lo afirma.
  - REEMBOLSADA → P(hecho), C(hecho), Reembolsada(actual) — solo se reembolsa desde CONFIRMADA.
- **Rationale**: escenario US3-2; no inventa pasos que no se pueden afirmar.
- **Alternatives considered**: mostrar solo el estado actual (pierde el recorrido); agregar historial al backend (fuera de alcance; la spec lo asume ausente).

## R10. Pestañas Detalle / Chat del detalle

- **Decision**: `Tabs` `segmented` con Detalle (por defecto) y Chat. Detalle: `ResumenCompra` existente (evento, fecha, tipo, cantidad, total), `StatusBadge` con días, `StatusTimeline`, "Cancelar compra" (si `esCancelable`) y la sección de calificación (R11). Chat: `EmptyState` provisorio (ícono `message`, "Chat de la compra", "Muy pronto vas a poder escribirle al organizador desde acá."), que la feature 008 reemplaza por el chat real.
- **Rationale**: FR-004 pide ambas pestañas; 008 depende de este contenedor.
- **Alternatives considered**: ocultar la pestaña Chat hasta 008 (contradice FR-004 y US3-1).

## R11. Calificar el evento (una vez por evento)

- **Decision**: solo si `compra.estado === 'UTILIZADA'` (el paso a UTILIZADA ya implica evento ocurrido). Hook **`useCalificarEvento(eventoId, usuarioId)`**:
  1. Pide `listarReseniasEvento(eventoId)` y marca `yaCalificado` si alguna reseña tiene `comprador?.id === usuarioId` (`yaCalifico`). Si esa petición falla, se ofrece igual: el 409 es el respaldo (spec › Assumptions).
  2. `enviar({ puntuacion, detalle })` con una sola petición en curso → `crearResenia({ eventoId, detalle: detalle.trim(), puntuacion })`.
  - **201** → `yaCalificado = true`, toast "¡Gracias por tu reseña!" (US4-4).
  - **409** → `yaCalificado = true`, aviso "Ya calificaste este evento" (US4-3).
  - **400/403/0** → aviso en línea con `mensajeErrorResenia` (400: mensaje del servidor; 403: "Necesitás una entrada utilizada de este evento para calificarlo"; 0: sin conexión); se puede reintentar.
  - Dos compras del mismo evento: el estado depende del evento, así que ambas reflejan `yaCalificado`.
- La sección **`SeccionCalificacion`** (`src/resenias/`) muestra el botón "Calificar evento" y, al tocarlo, el formulario inline: **`RatingInput`** (nuevo, 5 estrellas 52×52 con `accessibilityRole="radio"`, caption "4/5 · Muy bueno" con la escala 1 Malo … 5 Excelente) y `TextField` multilínea con `maxLength={1000}` (contador). Validación pura `validarResenia` antes de enviar: sin puntuación → "Elegí de 1 a 5 estrellas" (US4-2); comentario vacío o solo espacios → "Escribí un comentario"; > 1000 → "Máximo 1000 caracteres". Si `yaCalificado`, la sección muestra "Ya calificaste este evento" sin acción.
- **Rationale**: el backend exige `detalle` 1–1000 tras `trim` y puntuación entera 1–5; validar igual en el cliente evita viajes inútiles. Formulario inline: evita una ruta nueva y el manejo de teclado en un BottomSheet; la pantalla usa `KeyboardAvoidingView`.
- **Alternatives considered**: ruta `/compra/[id]/calificar` (más navegación y otra regla de acceso, YAGNI); BottomSheet (problemas de teclado en Android); depender solo del 409 (el usuario vería la acción aunque ya reseñó).

## R12. Estados de carga, vacío y error (FR-006)

- **Decision**: lista: esqueletos de tarjeta (`Skeleton`) en la carga inicial; `EmptyState` sin compras (ícono `ticket`, "Todavía no compraste entradas", acción "Explorar eventos" → `/explorar`) (US1-4); pestaña vacía con compras en otras → `EmptyState` sin acción ("No tenés compras activas/pasadas/canceladas"); error → `EmptyState` con `mensajeError` de `eventos/presentacion.js` y acción "Reintentar". Con datos ya cargados, un error al actualizar mantiene la lista y muestra un toast. Detalle: esqueleto, "Compra no encontrada" con acción "Ver mis compras", y error con reintento.
- **Rationale**: mismos componentes y textos que 004/005.

## R13. Pruebas (TDD)

- **Decision**: Jest + `@testing-library/react-native`; pantallas con `expo-router/testing-library` (`renderRouter`) y servicios simulados con `jest.mock('../../src/services/compraService')` / `reseniaService`; `diferido.js` para "en curso" y doble toque; `ahora` inyectable en `misCompras.js`. Datos de ejemplo: ampliar `__tests__/helpers/comprasEjemplo.js` con `crearCompraListado(parcial)` y `COMPRAS_POR_ESTADO` (una por estado + una CONFIRMADA con `diasRestantes: 0` y otra con 3). Orden: módulos puros → componentes → hooks → reglas → pantallas. Las pruebas se escriben primero y el usuario las aprueba antes de implementar (constitución §2).
