# Feature Specification: Detalle de evento y compra de entradas

**Feature Branch**: `005-detalle-evento-compra`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "005 detalle-evento-compra: ScreenDetalleEvento (imagen, nombre, fecha, organizador con puntaje, tipos de entrada informativos, reseñas de eventos anteriores del organizador, CTA Comprar entradas con precio desde) y ScreenCheckout (elegir tipo de entrada y cantidad sin superar el cupo, resumen con total, crear compra; manejo de 409 cupo insuficiente y 400 evento ocurrido). CU-12, CU-10."

## Contexto

Traza a **CU-12** (comprar seleccionando tipo de entrada y cantidad sin superar el cupo) y **CU-10** (ver reseñas de eventos anteriores del organizador antes de comprar). Depende de 001 y 003. La compra se crea en estado PENDIENTE; la confirma el organizador (feature 007).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el detalle de un evento (Priority: P1)

El comprador (o visitante) abre un evento y ve imagen, nombre, fecha larga, categoría, descripción, organizador con su puntaje, los tipos de entrada con precio y descripción, y un botón fijo "Comprar entradas" con el precio desde.

**Why this priority**: Paso previo obligatorio de toda compra.

**Independent Test**: Abrir un evento existente muestra todos sus datos; un ID inexistente muestra "Evento no encontrado".

**Acceptance Scenarios**:

1. **Given** un evento futuro, **When** abre el detalle, **Then** ve sus datos y el botón "Comprar entradas · desde $X".
2. **Given** un evento ya ocurrido, **When** abre el detalle, **Then** se indica "Evento finalizado" y no se puede comprar.
3. **Given** un ID inexistente, **When** abre el detalle, **Then** ve un estado de "Evento no encontrado" con vuelta a Explorar.

---

### User Story 2 - Leer reseñas del organizador antes de comprar (Priority: P1) — CU-10

En el detalle, el comprador ve el puntaje promedio del organizador y las reseñas (puntuación y comentario) de sus eventos anteriores.

**Why this priority**: CU-10 explícito; ayuda a decidir la compra.

**Independent Test**: Un organizador con reseñas en eventos pasados muestra esas reseñas en el detalle de un evento nuevo suyo.

**Acceptance Scenarios**:

1. **Given** un organizador con reseñas, **When** se ve el detalle, **Then** se muestran el promedio, la cantidad y las reseñas más recientes, con opción "Ver todas".
2. **Given** un organizador sin reseñas, **When** se ve el detalle, **Then** se muestra "Este organizador todavía no tiene reseñas".

---

### User Story 3 - Comprar entradas (Priority: P1) — CU-12

El comprador elige un tipo de entrada y la cantidad, ve el total y confirma. La compra queda PENDIENTE y se le muestra un aviso con acceso a Mis compras.

**Why this priority**: CU-12 explícito; núcleo del negocio.

**Independent Test**: Elegir 2 entradas de un tipo y confirmar crea una compra PENDIENTE con total = precio × 2 calculado por el servidor.

**Acceptance Scenarios**:

1. **Given** el checkout, **When** elige un tipo y una cantidad, **Then** ve el total (precio × cantidad) y el botón de confirmar con ese monto.
2. **Given** una cantidad, **When** intenta superar el cupo del tipo, **Then** el selector no lo permite e informa el máximo.
3. **Given** el servidor rechaza por cupo insuficiente (409), **When** confirma, **Then** ve "No quedan suficientes entradas de este tipo" y puede elegir otra cantidad.
4. **Given** el evento ya ocurrió (400), **When** confirma, **Then** ve el mensaje y no se crea la compra.
5. **Given** un visitante, **When** toca "Comprar entradas", **Then** se le pide iniciar sesión y vuelve al checkout.
6. **Given** la compra creada, **When** termina, **Then** ve un aviso "Compra creada, pendiente de confirmación del organizador" con acceso a Mis compras.

### Edge Cases

- Doble toque en confirmar: se envía una sola compra (botón en estado cargando).
- Organizador que abre el detalle: ve el detalle sin botón de compra.
- Evento sin imagen: arte por categoría del design system.
- Tipo de entrada con precio 0: se muestra "Gratis".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El detalle MUST mostrar imagen, nombre, fecha, categoría, descripción, organizador con puntaje, tipos de entrada (nombre, descripción, precio) y el precio desde.
- **FR-002**: El detalle MUST mostrar las reseñas de los eventos del organizador y su promedio (CU-10).
- **FR-003**: Comprar MUST requerir sesión de COMPRADOR y estar deshabilitado para eventos ocurridos.
- **FR-004**: El checkout MUST permitir elegir exactamente un tipo de entrada y una cantidad entera ≥ 1, con tope en el cupo del tipo.
- **FR-005**: El checkout MUST mostrar el total (precio × cantidad) antes de confirmar; el monto definitivo es el que devuelve el servidor.
- **FR-006**: Al confirmar, la app MUST crear la compra y manejar 400, 403, 404 y 409 con mensajes claros.
- **FR-007**: Tras crear la compra, la app MUST avisar que quedó pendiente y ofrecer ir a Mis compras.
- **FR-008**: Pruebas antes de implementar (TDD) y JSDoc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un comprador completa una compra desde el detalle en 4 interacciones o menos.
- **SC-002**: El 100% de los intentos de superar el cupo se impiden en el selector o se explican tras la respuesta del servidor.
- **SC-003**: 0 compras duplicadas por doble toque.
- **SC-004**: El 100% de los detalles de eventos de organizadores con reseñas muestran esas reseñas.

## Assumptions

- **Cupo**: el detalle público solo expone el cupo total de cada tipo, no lo vendido. El selector topa en el cupo total y el control real lo hace el servidor (409). No se modifica el backend para exponer disponibles.
- **Sin pago**: el backend no tiene pasarela; el diseño ("Pagar", "cargo por servicio", "pago protegido") se adapta a "Confirmar compra" sin cargos extra.
- Lugar del evento: el backend no lo tiene; fuera de alcance.
- Se compra un solo tipo de entrada por compra (contrato del backend).
