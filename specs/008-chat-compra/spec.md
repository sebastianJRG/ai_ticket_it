# Feature Specification: Chat de una compra

**Feature Branch**: `008-chat-compra`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "008 chat-compra: pestaña Chat del detalle de compra, compartida por comprador y organizador: lista de mensajes del más antiguo al más reciente con ChatBubble propias/ajenas, MessageComposer (1–1000 caracteres), actualización periódica mientras la pantalla está visible, sin websockets. CU-05, CU-06."

## Contexto

Traza a **CU-05** (el comprador envía mensajes sobre una compra en cualquier momento) y **CU-06** (el organizador responde en cualquier momento). El backend permite escribir sin importar el estado de la compra ni la fecha. Depende de 001, 006 (detalle de compra del comprador) y 007 (acceso desde las compras del organizador).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El comprador escribe sobre su compra (Priority: P1) — CU-05

Desde el detalle de su compra, pestaña Chat, el comprador ve la conversación y envía un mensaje.

**Why this priority**: CU-05 explícito.

**Independent Test**: Enviar "¿Hay estacionamiento?" lo agrega al final como mensaje propio con su hora.

**Acceptance Scenarios**:

1. **Given** el chat de una compra, **When** se abre, **Then** se ven los mensajes del más antiguo al más reciente, propios a un lado y ajenos al otro, con autor y hora.
2. **Given** un texto válido, **When** envía, **Then** el mensaje aparece al instante como "enviando" y queda confirmado al responder el servidor.
3. **Given** un fallo al enviar, **When** ocurre, **Then** el mensaje queda marcado con error y opción de reintentar, sin perder el texto.
4. **Given** sin mensajes, **When** se abre el chat, **Then** se invita a escribir el primero.

---

### User Story 2 - El organizador responde (Priority: P1) — CU-06

El organizador abre una compra de su evento (desde las compras del evento o la pestaña Mensajes) y responde en el mismo chat.

**Why this priority**: CU-06 explícito.

**Independent Test**: Un mensaje del comprador aparece en el chat del organizador y su respuesta aparece en el del comprador.

**Acceptance Scenarios**:

1. **Given** una compra de su evento, **When** abre el chat, **Then** ve los mensajes del comprador y puede responder.
2. **Given** una compra de un evento ajeno, **When** intenta abrir el chat, **Then** ve "No tenés acceso a esta conversación" (403).

---

### User Story 3 - Ver mensajes nuevos sin salir de la pantalla (Priority: P2)

Mientras el chat está visible, los mensajes nuevos del otro participante aparecen solos en pocos segundos.

**Why this priority**: Hace usable la conversación sin tiempo real.

**Independent Test**: Con el chat abierto, un mensaje nuevo en el servidor aparece en menos de 10 s.

**Acceptance Scenarios**:

1. **Given** el chat visible, **When** llega un mensaje nuevo, **Then** aparece al final y la vista baja si el usuario ya estaba al final.
2. **Given** que la pantalla deja de estar visible, **When** ocurre, **Then** se detienen las consultas.

### Edge Cases

- Texto vacío o solo espacios: no se puede enviar (botón deshabilitado con explicación).
- Más de 1000 caracteres: contador visible e impide enviar.
- Compras en cualquier estado (incluso canceladas o reembolsadas) y eventos pasados: el chat sigue habilitado (regla del backend; el bloqueo "reembolsada" del diseño no aplica).
- Error de red en una actualización periódica: se reintenta en la siguiente sin mostrar error intrusivo.
- Mensajes duplicados entre envío optimista y actualización: se muestran una sola vez.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El chat MUST mostrar los mensajes de la compra en orden cronológico, diferenciando propios y ajenos, con autor y hora.
- **FR-002**: Comprador dueño y organizador del evento MUST poder enviar mensajes de 1 a 1000 caracteres en cualquier momento.
- **FR-003**: El envío MUST mostrarse de inmediato y reflejar éxito o error con reintento.
- **FR-004**: Mientras el chat está visible, la app MUST consultar mensajes nuevos periódicamente (cada ~5 s) y detenerse al salir.
- **FR-005**: La app MUST manejar 400, 403 y 404 con mensajes claros.
- **FR-006**: El chat MUST ser el mismo componente para ambos roles, integrado en el detalle de compra.
- **FR-007**: Pruebas antes de implementar (TDD) y JSDoc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un mensaje enviado se ve en pantalla en menos de 100 ms y lo ve el otro participante en menos de 10 s.
- **SC-002**: 0 mensajes duplicados o perdidos en la conversación visible.
- **SC-003**: 0 consultas al servidor mientras el chat no está visible.

## Assumptions

- Sin tiempo real (websockets) ni notificaciones push (YAGNI).
- Sin "leído/no leído": el backend no lo guarda.
- Sin adjuntos: solo texto.
- Los mensajes de sistema por cambio de estado del diseño quedan fuera de alcance (el backend no expone el historial).
