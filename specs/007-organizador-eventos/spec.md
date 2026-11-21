# Feature Specification: Eventos del organizador

**Feature Branch**: `007-organizador-eventos`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "007 organizador-eventos: Mis eventos del organizador (filtrado en cliente), ScreenCrearEvento (multimedia por URL, nombre, categoría con alta rápida, fecha y hora, descripción, tipos de entrada repetibles con nombre, descripción, precio y cupo), ScreenComprasEvento (disponibilidad por tipo, Tabs por estado con contadores, OrganizerPurchaseRow, acciones confirmar, reembolsar y cancelar) y definición de la pestaña Mensajes. CU-04, CU-02, CU-08."

## Contexto

Traza a **CU-04** (crear evento con distintos tipos de entrada, cada uno con precio y cupo), **CU-02** (ver las compras de un evento diferenciando estados y cuántas entradas quedan por tipo) y **CU-08** (cancelación permitida si no está utilizada y el evento no ocurrió). Depende de 001 y 003.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear un evento con varios tipos de entrada (Priority: P1) — CU-04

El organizador completa nombre, categoría, fecha y hora, descripción, imágenes (URLs) y uno o más tipos de entrada (nombre, descripción, precio, cupo), y publica.

**Why this priority**: CU-04 explícito; sin eventos no hay compras.

**Independent Test**: Completar un evento con 2 tipos de entrada y publicar lo crea y aparece en Mis eventos y en Explorar.

**Acceptance Scenarios**:

1. **Given** el formulario, **When** agrega un tercer tipo de entrada y quita el segundo, **Then** quedan los tipos esperados (mínimo 1, el único no se puede quitar).
2. **Given** campos inválidos (vacíos, fecha pasada, precio negativo, cupo no entero o ≤ 0), **When** pierde el foco o publica, **Then** ve errores que explican cómo corregirlos, iguales a las reglas del servidor.
3. **Given** datos válidos, **When** publica, **Then** el evento se crea, ve un aviso y va a Compras del evento.
4. **Given** que no existe la categoría deseada, **When** la crea desde el selector (nombre y descripción), **Then** queda disponible y seleccionada.
5. **Given** el servidor rechaza (400), **When** publica, **Then** ve el mensaje del servidor y conserva lo cargado.

---

### User Story 2 - Ver mis eventos (Priority: P1)

El organizador ve la lista de sus eventos (próximos primero, luego finalizados) y entra a cada uno.

**Why this priority**: Puerta de entrada a CU-02.

**Independent Test**: Con eventos de dos organizadores, cada uno ve solo los suyos.

**Acceptance Scenarios**:

1. **Given** un organizador con eventos, **When** abre Mis eventos, **Then** ve solo los propios, con fecha y estado (próximo/finalizado).
2. **Given** sin eventos, **When** abre Mis eventos, **Then** ve un estado vacío con acción "Crear evento".

---

### User Story 3 - Ver compras y disponibilidad de un evento (Priority: P1) — CU-02

En el evento, el organizador ve por tipo de entrada vendidas/cupo y disponibles con barra de progreso, y la lista de compras con pestañas por estado y contadores.

**Why this priority**: CU-02 explícito.

**Independent Test**: Un evento con compras en varios estados muestra los contadores correctos y la disponibilidad que informa el servidor.

**Acceptance Scenarios**:

1. **Given** un evento con compras, **When** lo abre, **Then** ve por tipo: nombre, precio, vendidas, cupo y disponibles.
2. **Given** compras en varios estados, **When** cambia de pestaña, **Then** ve las de ese estado con comprador, tipo, cantidad, total y distintivo de estado.
3. **Given** un evento de otro organizador, **When** intenta abrirlo, **Then** ve "No tenés acceso a este evento" (403).

---

### User Story 4 - Gestionar el estado de una compra (Priority: P2) — CU-08

Sobre una compra, el organizador confirma (PENDIENTE → CONFIRMADA), reembolsa (CONFIRMADA → REEMBOLSADA) o cancela (PENDIENTE/CONFIRMADA → CANCELADA), siempre que el evento no haya ocurrido.

**Why this priority**: Sin confirmar, ninguna compra avanza; CU-08 define cuándo se puede cancelar.

**Independent Test**: Confirmar una compra PENDIENTE la mueve a Confirmadas y actualiza la disponibilidad.

**Acceptance Scenarios**:

1. **Given** una PENDIENTE, **When** la ve, **Then** se ofrecen Confirmar y Cancelar.
2. **Given** una CONFIRMADA, **When** la ve, **Then** se ofrecen Reembolsar y Cancelar.
3. **Given** UTILIZADA, CANCELADA, REEMBOLSADA o un evento ocurrido, **When** la ve, **Then** no se ofrecen acciones.
4. **Given** reembolsar o cancelar, **When** lo toca, **Then** debe confirmar en un diálogo destructivo.
5. **Given** la acción exitosa, **When** termina, **Then** se actualizan la lista, los contadores y la disponibilidad.

---

### User Story 5 - Pestaña Mensajes del organizador (Priority: P3) — CU-06

El organizador accede desde la pestaña Mensajes a las compras de sus eventos para abrir su chat (008).

**Why this priority**: Atajo; el chat también es accesible desde cada compra.

**Independent Test**: La pestaña lista las compras de los eventos del organizador agrupadas por evento y abre el chat de la elegida.

**Acceptance Scenarios**:

1. **Given** eventos con compras, **When** abre Mensajes, **Then** ve las compras agrupadas por evento (comprador, tipo, estado) y al tocar una abre su chat.
2. **Given** una compra elegida (desde Mensajes o desde Compras del evento), **When** se abre, **Then** ve el detalle compartido de la compra (resumen, comprador, estado) con las pestañas Detalle y Chat; el contenido del chat lo completa la feature 008.

### Edge Cases

- Fecha y hora del formulario en hora local; se envía en formato estándar con zona horaria.
- Precio 0 permitido ("Gratis"); cupo entero > 0.
- Doble toque en publicar o en una acción: una sola petición.
- Error en una acción (400 evento ocurrido): mensaje y recarga.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El organizador MUST poder crear un evento con nombre, descripción, categoría, fecha futura, multimedia opcional (URLs) y al menos un tipo de entrada con nombre, descripción, precio ≥ 0 y cupo entero > 0.
- **FR-002**: El formulario MUST validar con las mismas reglas que el servidor y mostrar errores accionables, conservando lo cargado ante errores.
- **FR-003**: El organizador MUST poder crear una categoría desde el formulario.
- **FR-004**: Mis eventos MUST listar solo los eventos del organizador, próximos primero.
- **FR-005**: La vista de compras MUST mostrar disponibilidad por tipo (vendidas, cupo, disponibles) y compras por estado con contadores (CU-02).
- **FR-006**: El organizador MUST poder confirmar, reembolsar y cancelar según las transiciones permitidas y solo si el evento no ocurrió, con confirmación para las destructivas (CU-08).
- **FR-007**: La pestaña Mensajes MUST listar las compras de sus eventos agrupadas por evento como acceso al chat.
- **FR-008**: Estados de carga, vacío y error; pruebas antes de implementar (TDD); JSDoc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un organizador crea un evento con 2 tipos de entrada en menos de 3 minutos.
- **SC-002**: El 100% de los errores de validación del servidor se detectan antes de enviar.
- **SC-003**: Disponibilidad y contadores coinciden al 100% con el servidor tras cada acción.
- **SC-004**: 0 acciones ofrecidas que el servidor rechazaría por transición inválida.

## Assumptions

- **Mis eventos**: no hay ruta propia; se filtra el listado público por organizador en el dispositivo.
- **Mensajes**: no hay bandeja ni "no leídos" en el backend; la pestaña se arma consultando las compras de cada evento propio (aceptable con pocos eventos). Los contadores de no leídos del diseño quedan fuera de alcance.
- **Borrador**: el backend no guarda borradores; solo "Publicar".
- **Multimedia**: URLs de imagen escritas por el organizador; subir archivos queda fuera de alcance.
- No hay edición ni borrado de eventos en esta feature.
- **URLs de imagen**: las URLs no vacías deben empezar con `http://` o `https://`. Es la única regla del formulario más estricta que el servidor (que acepta cualquier texto) y es deliberada, porque otra URL nunca se mostraría.
- **Pestañas de Compras del evento**: Pendientes, Confirmadas, Utilizadas y Canceladas. "Canceladas" agrupa CANCELADA y REEMBOLSADA (el distintivo de estado las diferencia), para no superar las 4 pestañas visibles.
