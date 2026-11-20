# Feature Specification: Capa de servicios del frontend hacia el backend

**Feature Branch**: `001-servicios-api-axios`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "001 servicios-api-axios: Capa de servicios del frontend (frontend/src/services/) con todas las llamadas al backend usando axios, refactorizando api.js (fetch) y authService.js. Instancia axios con baseURL (API_URL actual) y timeout; conservar la clase ApiError (message, status; 0 = sin conexión). Interceptor de request que agrega Authorization Bearer desde un proveedor de tokens registrado (configurarSesion({ obtenerTokens, guardarTokens, alExpirar })). Interceptor de response que normaliza errores a ApiError y ante 401 en ruta autenticada hace un único POST /api/refresh (deduplicado entre peticiones concurrentes; el backend rota el refresh token), reintenta y si falla llama alExpirar. Un servicio por recurso: authService, usuarioService, eventoService, categoriaService, compraService, reseniaService, mensajeService. AuthContext registra el proveedor de tokens y persiste los tokens rotados. Tests Jest primero (TDD) mockeando axios; login y registro no deben cambiar de comportamiento. JSDoc completo. Base para CU-01..CU-12 (habilitadora, sin UI nueva)."

## Contexto

Feature **habilitadora**: no agrega pantallas. Deja disponible, para las features de pantallas (003–008), una única puerta de acceso a todas las operaciones que el backend ya expone, con manejo uniforme de errores y de la sesión. Traza a todos los casos de uso CU-01 … CU-12, porque cada uno depende de al menos una de estas operaciones (ver tabla de trazabilidad).

La decisión técnica de usar **axios** como cliente HTTP fue tomada explícitamente por el usuario y es una restricción del alcance, no un detalle a decidir en el plan.

## User Scenarios & Testing *(mandatory)*

Los "usuarios" de esta feature son (a) el comprador u organizador final, que percibe la sesión estable y los mensajes de error, y (b) los desarrolladores de las pantallas, que consumen las operaciones.

### User Story 1 - La sesión sigue activa sin volver a iniciar sesión (Priority: P1)

Un comprador inicia sesión y usa la app durante más tiempo que la vigencia del acceso corto (15 minutos). Cuando el acceso vence, la app lo renueva sola y la acción que estaba haciendo (por ejemplo, ver sus compras) termina bien, sin que el usuario note nada. Si la renovación ya no es posible (sesión revocada o vencida), la app cierra la sesión de forma ordenada.

**Why this priority**: Sin esto, cualquier pantalla autenticada falla a los 15 minutos y obliga a reingresar credenciales; afecta a todos los CU autenticados.

**Independent Test**: Con el backend respondiendo "no autorizado" a una petición autenticada y luego aceptando la renovación, la petición original se completa con éxito y la sesión guardada queda actualizada con las nuevas credenciales.

**Acceptance Scenarios**:

1. **Given** una sesión con acceso vencido y renovación válida, **When** se pide la lista de compras, **Then** se renueva la sesión una sola vez, se reintenta la petición y se devuelven las compras.
2. **Given** tres peticiones autenticadas simultáneas que reciben "no autorizado", **When** se procesan, **Then** se realiza una única renovación y las tres se reintentan con el nuevo acceso.
3. **Given** que la renovación es rechazada, **When** una petición autenticada recibe "no autorizado", **Then** se notifica que la sesión expiró (la app cierra la sesión) y la petición falla con estado 401.
4. **Given** la renovación exitosa, **When** termina, **Then** el nuevo par de credenciales (el backend entrega una renovación nueva en cada uso) queda persistido de forma segura para el próximo arranque.
5. **Given** un intento de inicio de sesión con credenciales incorrectas (401), **When** falla, **Then** NO se intenta renovar la sesión y se muestra el mensaje del backend.

---

### User Story 2 - Errores comprensibles y consistentes (Priority: P1)

Ante cualquier falla (datos inválidos, sin permiso, recurso inexistente, cupo insuficiente, sin conexión), la pantalla recibe siempre el mismo tipo de error con un mensaje legible en español (el del backend cuando existe) y un código que permite decidir qué mostrar.

**Why this priority**: Login y registro ya dependen de este contrato; todas las pantallas futuras también.

**Independent Test**: Simulando respuestas 400/403/404/409/500 y una caída de red, cada operación rechaza con un error que tiene `message` y `status` (0 si no hubo conexión).

**Acceptance Scenarios**:

1. **Given** el backend responde 409 con `{ message: "Cupo insuficiente..." }`, **When** se crea una compra, **Then** el error tiene `status` 409 y ese mensaje.
2. **Given** no hay conexión o se agota el tiempo de espera, **When** se llama cualquier operación, **Then** el error tiene `status` 0 y el mensaje "No pudimos conectar con el servidor. Revisá tu conexión."
3. **Given** una respuesta de error sin cuerpo, **When** se procesa, **Then** el mensaje es "Ocurrió un error inesperado." con el código HTTP real.

---

### User Story 3 - Todas las operaciones del backend disponibles para las pantallas (Priority: P2)

Quien desarrolla una pantalla encuentra, agrupadas por recurso, todas las operaciones necesarias para los casos de uso, sin tener que conocer rutas, métodos ni cómo adjuntar la sesión.

**Why this priority**: Desbloquea las features 003–008, pero cada grupo es útil por separado.

**Independent Test**: Para cada operación, una prueba verifica que envía el método, la ruta y los datos correctos y que devuelve el cuerpo de la respuesta tal cual.

**Acceptance Scenarios**:

1. **Given** filtros de búsqueda con texto vacío y categoría definida, **When** se listan eventos, **Then** solo se envía la categoría (los filtros vacíos se omiten).
2. **Given** un comprador con sesión, **When** cancela una compra, **Then** se envía la cancelación de esa compra sin cuerpo e incluyendo la sesión.
3. **Given** operaciones públicas (listar eventos, categorías, reseñas), **When** no hay sesión, **Then** funcionan sin credenciales.

---

### User Story 4 - Login y registro se comportan igual que hoy (Priority: P1)

Las pantallas existentes de inicio de sesión y registro siguen funcionando exactamente igual tras el cambio de cliente HTTP.

**Why this priority**: Es la única funcionalidad entregada; no puede regresionar.

**Independent Test**: Las pruebas actuales de las pantallas de login y registro pasan sin modificar su comportamiento esperado.

**Acceptance Scenarios**:

1. **Given** credenciales válidas, **When** se inicia sesión, **Then** se guarda la sesión y el usuario queda autenticado como hoy.
2. **Given** un nombre de usuario en uso, **When** se registra, **Then** se muestra el mensaje del backend como hoy.

### Edge Cases

- La propia petición de renovación responde "no autorizado": no se vuelve a intentar renovar (sin bucles) y se notifica la expiración.
- Una petición ya reintentada vuelve a recibir "no autorizado": no se renueva por segunda vez; falla con 401.
- No hay sesión guardada y una ruta autenticada responde 401: no se intenta renovar; falla con 401.
- Cerrar sesión con una renovación ya inválida: el error se ignora (el cierre local siempre ocurre), como hoy.
- Identificadores con caracteres especiales en la ruta: se codifican para no alterar la ruta.
- Respuesta 403 (rol incorrecto o recurso ajeno): no dispara renovación; se informa tal cual.
- Operaciones de favoritos mientras la feature 002 no está desplegada: fallan con 404 de forma controlada.

## Requirements *(mandatory)*

### Functional Requirements

**Cliente y sesión**

- **FR-001**: Todas las llamadas al backend MUST pasar por un único cliente configurado con la dirección base actual (variable de entorno o valor por defecto según plataforma) y un tiempo máximo de espera de 15 segundos.
- **FR-002**: El cliente MUST adjuntar la credencial de acceso vigente a cada petición cuando exista una sesión, sin que las operaciones la reciban como parámetro.
- **FR-003**: La sesión MUST obtenerse de un proveedor registrable (obtener credenciales, guardar credenciales nuevas, avisar expiración), de modo que la capa de servicios no dependa de la capa de interfaz.
- **FR-004**: Ante una respuesta 401 de una petición que llevaba credencial, el cliente MUST renovar la sesión una única vez, guardar las nuevas credenciales y reintentar la petición original una sola vez.
- **FR-005**: Las renovaciones concurrentes MUST deduplicarse: una sola renovación en curso atiende a todas las peticiones que la esperan.
- **FR-006**: Si la renovación falla, el cliente MUST avisar la expiración al proveedor y rechazar las peticiones pendientes con estado 401.
- **FR-007**: Las rutas de inicio de sesión, registro, renovación y cierre de sesión MUST NOT disparar renovación.

**Errores**

- **FR-008**: Toda falla MUST rechazarse con un único tipo de error con `message` y `status`; `status` 0 significa sin conexión o tiempo agotado.
- **FR-009**: El mensaje MUST ser el del backend (`message`) cuando exista; si no, "Ocurrió un error inesperado."; sin conexión, "No pudimos conectar con el servidor. Revisá tu conexión.".
- **FR-010**: Las operaciones exitosas MUST devolver el cuerpo de la respuesta sin transformarlo.

**Operaciones por recurso** (todas MUST existir; entre paréntesis, quién puede usarlas según el backend)

- **FR-011** Autenticación: iniciar sesión, registrarse (público), renovar sesión, cerrar sesión.
- **FR-012** Usuario: obtener el perfil propio (autenticado); listar reseñas de un organizador (público); listar, agregar y quitar favoritos (comprador; dependen de la feature 002).
- **FR-013** Eventos: listar/buscar con texto, categoría, criterio de orden (precio, fecha, puntaje) y sentido, omitiendo filtros vacíos (público); ver detalle (público); crear (organizador); ver compras y disponibilidad de un evento (organizador dueño).
- **FR-014** Categorías: listar (público); crear (organizador).
- **FR-015** Compras: crear con evento, tipo de entrada y cantidad (comprador); listar las propias (comprador); cancelar (comprador u organizador); confirmar y reembolsar (organizador). Las transiciones se envían sin cuerpo.
- **FR-016** Reseñas: crear con evento, detalle y puntuación (comprador); listar las de un evento (público).
- **FR-017** Mensajes: enviar y listar los mensajes del chat de una compra (comprador dueño u organizador del evento).
- **FR-018**: Los identificadores interpolados en rutas MUST codificarse.

**Integración y calidad**

- **FR-019**: El contexto de sesión MUST registrar el proveedor al iniciar la app y persistir de forma segura las credenciales renovadas; ante expiración MUST cerrar la sesión local.
- **FR-020**: El comportamiento visible de login y registro MUST mantenerse (mismos mensajes, mismos estados).
- **FR-021**: Cada operación y comportamiento del cliente MUST tener pruebas escritas y aprobadas antes de implementarse (TDD), sin tocar la red real.
- **FR-022**: Todo elemento exportado MUST documentarse (parámetros, retorno, errores posibles con sus códigos), según la constitución.

### Trazabilidad a casos de uso

| Grupo | Casos de uso que habilita |
|-------|---------------------------|
| Eventos (listar/buscar/detalle), Categorías (listar) | CU-03, CU-11, CU-12 |
| Eventos (crear), Categorías (crear) | CU-04 |
| Eventos (compras del evento), Compras (confirmar/reembolsar/cancelar) | CU-02, CU-08 |
| Compras (crear, listar propias, cancelar) | CU-12, CU-01, CU-07 |
| Mensajes | CU-05, CU-06 |
| Reseñas, reseñas del organizador | CU-09, CU-10 |
| Autenticación, sesión, perfil | Todos los CU autenticados |

### Key Entities *(include if feature involves data)*

- **Sesión**: credencial de acceso (corta), credencial de renovación (larga, cambia en cada renovación) y usuario. Persistida de forma segura en el dispositivo.
- **Error de API**: mensaje legible y código (HTTP o 0 sin conexión).
- **Proveedor de sesión**: contrato que conecta la capa de servicios con el contexto de sesión: obtener credenciales, guardar credenciales nuevas, avisar expiración.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las operaciones expuestas por el backend usadas por los CU-01…CU-12 están disponibles como operaciones de la capa de servicios, cada una con al menos una prueba.
- **SC-002**: Un usuario puede usar la app más de 15 minutos seguidos sin que se le pida volver a iniciar sesión mientras su renovación sea válida.
- **SC-003**: Ante N peticiones simultáneas con acceso vencido se produce exactamente 1 renovación.
- **SC-004**: El 100% de las pruebas existentes de login y registro pasan sin cambiar lo que verifican.
- **SC-005**: El 100% de las fallas llegan a la pantalla con un mensaje en español y un código.

## Assumptions

- Contratos del backend según AGENTS.md y el código en `backend/src/routes`; no se modifica el backend en esta feature.
- Las operaciones de favoritos apuntan a `GET /api/usuarios/favoritos`, `PUT` y `DELETE /api/usuarios/favoritos/:idEvento`, que crea la feature 002; hasta entonces fallan con 404.
- El tiempo de espera de 15 s es un valor razonable para red móvil; puede ajustarse en el plan.
- Validaciones de formulario (`validacion.js`) quedan fuera de alcance; esta feature no valida datos antes de enviarlos (lo hace el backend).
- No se agrega caché, reintentos por red ni modo offline (YAGNI).
- La renovación de sesión se hace solo al recibir 401, no de forma proactiva antes del vencimiento.
