# Feature Specification: Mis compras del comprador

**Feature Branch**: `006-mis-compras-comprador`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "006 mis-compras-comprador: ScreenMisCompras (Tabs Activas/Pasadas/Canceladas con contadores, PurchaseCard con StatusBadge y días restantes si está CONFIRMADA), ScreenDetalleCompra pestaña Detalle (resumen, StatusTimeline con el estado actual, cancelar con Modal), y reseñar el evento cuando la compra está UTILIZADA (RatingInput + comentario). CU-01, CU-07, CU-09, CU-08."

## Contexto

Traza a **CU-01** (ver mis compras diferenciando el estado y los días restantes si está confirmada), **CU-07** (cancelar una compra), **CU-08** (cancelar solo si no está utilizada y el evento no ocurrió) y **CU-09** (puntuar y comentar una vez utilizada la entrada). La pestaña Chat del detalle la agrega la 008. Depende de 001 y 003.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver mis compras por estado (Priority: P1) — CU-01

El comprador ve sus compras agrupadas en Activas (PENDIENTE, CONFIRMADA), Pasadas (UTILIZADA) y Canceladas (CANCELADA, REEMBOLSADA), con contadores. Cada tarjeta muestra evento, tipo de entrada, cantidad, total y un distintivo del estado con color e ícono; si está CONFIRMADA, cuántos días faltan.

**Why this priority**: CU-01 explícito.

**Independent Test**: Con compras en los 5 estados, cada una aparece en su pestaña con el distintivo correcto y las confirmadas muestran los días restantes.

**Acceptance Scenarios**:

1. **Given** una compra CONFIRMADA con evento en 3 días, **When** ve Activas, **Then** la tarjeta dice "Confirmada · faltan 3 días".
2. **Given** una CONFIRMADA cuyo evento es hoy, **When** la ve, **Then** dice "Es hoy".
3. **Given** compras en cada estado, **When** cambia de pestaña, **Then** ve solo las de esa pestaña y los contadores coinciden.
4. **Given** sin compras, **When** abre Mis compras, **Then** ve un estado vacío con acción "Explorar eventos".
5. **Given** la lista, **When** desliza hacia abajo, **Then** se actualiza desde el servidor.

---

### User Story 2 - Cancelar una compra (Priority: P1) — CU-07, CU-08

Desde la tarjeta o el detalle, el comprador cancela una compra PENDIENTE o CONFIRMADA de un evento que aún no ocurrió, confirmando en un diálogo.

**Why this priority**: CU-07 explícito.

**Independent Test**: Cancelar una compra CONFIRMADA futura la pasa a CANCELADA y la mueve a la pestaña Canceladas.

**Acceptance Scenarios**:

1. **Given** una compra cancelable, **When** toca Cancelar, **Then** ve un diálogo destructivo que explica la acción.
2. **Given** el diálogo, **When** confirma, **Then** la compra pasa a CANCELADA, se mueve de pestaña y se muestra un aviso.
3. **Given** una compra UTILIZADA, CANCELADA o REEMBOLSADA, o un evento ya ocurrido, **When** la ve, **Then** no se ofrece cancelar.
4. **Given** el servidor rechaza (400 evento ocurrido), **When** confirma, **Then** ve el mensaje y la lista se actualiza.

---

### User Story 3 - Ver el detalle de una compra (Priority: P2) — CU-01

El comprador abre una compra y ve el resumen (evento, fecha, tipo, cantidad, total), el estado con días restantes y una línea de estado.

**Why this priority**: Contenedor del chat (008) y de la reseña.

**Independent Test**: Abrir una compra muestra su resumen y estado; la línea de estado marca el estado actual.

**Acceptance Scenarios**:

1. **Given** una compra, **When** abre su detalle, **Then** ve el resumen y las pestañas Detalle y Chat.
2. **Given** la línea de estado, **When** se muestra, **Then** marca los pasos del recorrido normal (Pendiente → Confirmada → Utilizada) hasta el estado actual, o el estado terminal (Cancelada/Reembolsada) si corresponde.

---

### User Story 4 - Reseñar un evento al que asistí (Priority: P2) — CU-09

Con una compra UTILIZADA de un evento ya ocurrido, el comprador puntúa de 1 a 5 estrellas y deja un comentario (hasta 1000 caracteres). Solo una vez por evento.

**Why this priority**: CU-09 explícito; alimenta CU-10.

**Independent Test**: Con una compra UTILIZADA, enviar 4 estrellas y un comentario crea la reseña y la acción desaparece.

**Acceptance Scenarios**:

1. **Given** una compra UTILIZADA, **When** la ve, **Then** se ofrece "Calificar evento".
2. **Given** el formulario, **When** envía sin puntuación, **Then** se indica que debe elegir de 1 a 5 estrellas.
3. **Given** que ya reseñó ese evento (409), **When** envía, **Then** ve "Ya calificaste este evento" y la acción se oculta.
4. **Given** la reseña creada, **When** termina, **Then** ve un aviso de agradecimiento.

### Edge Cases

- El paso a UTILIZADA es automático en el servidor (cada ~60 s tras el evento): al actualizar, la compra puede cambiar de pestaña.
- Dos compras del mismo evento: la reseña se ofrece una sola vez por evento.
- Comentario con solo espacios: inválido.
- Sesión expirada durante la cancelación: la maneja la capa de servicios (001).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mis compras MUST listar las compras del comprador agrupadas en Activas, Pasadas y Canceladas con contadores, en orden de creación (más reciente primero).
- **FR-002**: Cada compra MUST mostrar su estado con color, ícono y texto (no solo color) y, si está CONFIRMADA, los días restantes que informa el servidor.
- **FR-003**: La app MUST ofrecer cancelar solo compras PENDIENTE o CONFIRMADA de eventos futuros, con confirmación previa, y reflejar el nuevo estado.
- **FR-004**: El detalle de compra MUST mostrar resumen, estado y línea de estado, con pestañas Detalle y Chat.
- **FR-005**: La app MUST ofrecer reseñar (1–5 estrellas, comentario 1–1000 caracteres) solo para compras UTILIZADA y una vez por evento; manejar 400, 403 y 409.
- **FR-006**: Estados de carga, vacío, error con reintento y actualización por gesto.
- **FR-007**: Pruebas antes de implementar (TDD) y JSDoc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las compras aparecen en la pestaña correcta según su estado.
- **SC-002**: Un comprador identifica el estado y los días restantes de una compra sin abrirla.
- **SC-003**: Cancelar requiere exactamente 2 toques (Cancelar + confirmar).
- **SC-004**: 0 ofertas de cancelación para compras no cancelables.

## Assumptions

- **Sin historial**: el backend no expone los cambios de estado; la línea de estado se arma solo con el estado actual (sin fechas por paso).
- **Sin detalle individual**: no hay ruta para una sola compra; el detalle usa los datos del listado y se actualiza recargando el listado.
- **Sin pago**: la acción "Pagar ahora" del diseño queda fuera de alcance; las PENDIENTE esperan la confirmación del organizador.
- "Ya reseñado" se detecta por la respuesta 409 (no hay ruta "mis reseñas"); opcionalmente se cruza con las reseñas públicas del evento.
