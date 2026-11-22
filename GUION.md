# Guion del video — "Ciclo de vida de una compra" (≈9:30 min)

## Contexto
El TP pide un video de 5–10 min que explique un flujo de punta a punta: back-end, front-end, recorrido en la interfaz y una conclusión sobre el uso de IA. El flujo elegido es **realizar una compra**, con el chat y la reseña como continuación natural.

**Recomendación:** mantener la compra como flujo, pero presentarla como **"el ciclo de vida de una compra"**: comprar → PENDIENTE → chat → el organizador confirma → UTILIZADA → reseña. Así el chat y la reseña forman parte del mismo hilo y no parecen agregados sueltos. El código se explica en detalle solo para la compra. El chat y la reseña se nombran en una frase cada uno. Si se explican a fondo los tres, no entra en 10 minutos.

Alternativas, por si se prefiere otra:
- **Organizador: crear un evento y gestionar sus compras** (feature 007). Tiene validación compartida entre el front y el DTO de zod, y también la máquina de estados, pero se ve menos al comprador.
- **Solo el chat** (feature 008). Es técnicamente interesante (polling encadenado, envío optimista con cola FIFO, deduplicación), pero el recorrido en la interfaz es corto.

## Preparación (antes de grabar)
1. `npm run dev:backend:seed` y `npm run dev:frontend`, y abrir en web (`w`).
2. Dos ventanas del navegador: una normal (**ana.comprador**) y una privada (**bruno.organizador**). La sesión vive en `localStorage`, así que no se pisan. Contraseña: `Prueba123!`.
3. Tener abiertos en el editor los archivos de las secciones 3 y 4, con las líneas indicadas visibles.
4. Opcional: dejar visible la terminal del backend para mostrar los logs JSON con `requestId`.

---

## 1. Introducción (0:00 – 0:40)
> "Hola, soy Sebastián. Les presento **Al Ticket It**, una app de venta de entradas para eventos. El back-end está hecho con Node y Express, con persistencia en memoria, y el front-end con React Native y Expo, que corre en web y en el celular. Hay dos roles: comprador y organizador. El flujo que elegí es el **ciclo de vida de una compra**: desde que el comprador elige una entrada hasta que puede reseñar el evento, pasando por la confirmación del organizador y el chat entre los dos. Primero lo muestro funcionando, después explico cómo está hecho en el back y en el front, y cierro con una reflexión sobre el uso de IA."

## 2. Recorrido en la interfaz (0:40 – 3:40)
**Ventana de ana (comprador):**
1. **Explorar** → abrir un evento futuro de Bruno. "El detalle es público: muestra los tipos de entrada con las disponibles calculadas por el servidor y las reseñas del organizador."
2. **Comprar** → elegir un tipo de entrada y subir la cantidad con el stepper. "La cantidad se topa en las disponibles y el total es una estimación: el total real lo calcula el servidor."
3. Confirmar → pantalla de éxito → **Mis compras**: la compra aparece en *Activas* como **PENDIENTE**.
4. (15 s) Volver a Explorar, abrir el evento **"Sin cupo"** de Sofía e intentar comprar. Aparece el mensaje de cupo agotado. "Esto es el 409 del servidor: el front avisa, pero quien controla es el back."
5. Abrir la compra pendiente → pestaña **Chat** → escribir: "Hola, ¿hasta qué hora se puede entrar?"

**Ventana de bruno (organizador):**
6. **Mis eventos** → el evento → **Compras del evento**: se ve el resumen de disponibilidad y la compra de ana en *Pendientes*.
7. Abrir la compra → **Chat**: aparece el mensaje de ana → responder.
8. Volver y tocar **Confirmar**. La compra pasa a *Confirmadas*.

**Ventana de ana:**
9. El chat ya muestra la respuesta, porque se consulta cada 5 s. En Mis compras la compra figura **CONFIRMADA**, con la línea de estado y los días que faltan para el evento.
10. Pestaña **Pasadas** → la compra **UTILIZADA** que trae el seed (un evento de Bruno que ya ocurrió) → **calificar** con estrellas y comentario → enviar. "Una tarea periódica del back pasa a UTILIZADA las compras confirmadas de eventos que ya ocurrieron, y solo con una compra UTILIZADA se puede reseñar."
11. Volver a mostrar el detalle del organizador: la reseña nueva aparece y cambia el puntaje.

## 3. Back-end (3:40 – 6:20)
> "El back sigue una arquitectura en capas en un solo sentido: **Router → Controller → Service → Repository → Model**. Ninguna capa llama a una de arriba y las dependencias se inyectan."

- **Composición** — `backend/src/app.js:70-122`: se crean los repositorios en memoria y se inyectan en los servicios, y los servicios en los controladores. "Gracias a esto, en los tests puedo usar repositorios mockeados."
- **Ruta** — `backend/src/routes/comprasRoutes.js:21`: `POST /api/compras` con `authMiddleware` (JWT) y `requerirRol('COMPRADOR')`.
- **Controller** — `backend/src/controllers/compraController.js:32`: "El comprador sale del token y nunca del cuerpo. El controller no escribe códigos de error: delega con `next(error)`."
- **Service** — `backend/src/services/compraService.js:90-150` (lo más importante):
  1. Validación con zod (`dto/compra.js`, `crearCompraSchema`).
  2. Comprobaciones de que el comprador existe y tiene ese rol, de que el evento existe y todavía no ocurrió (`_exigirEventoFuturo`) y de que el tipo de entrada pertenece al evento.
  3. **Validación transaccional del cupo** (línea 120): `this.exclusion.ejecutar(...)`, con `utils/exclusionMutua.js`. "Leer las reservadas, validar y crear tienen que ser atómicos. Si no, dos compras simultáneas podrían vender la misma última entrada. Cada tarea se encadena a una promesa y espera a la anterior."
  4. Crea la compra en PENDIENTE con el total que calcula el servidor y registra un `CambioEstadoCompra` para el historial.
- **Modelo / máquina de estados** — `backend/src/models/compra.js:11-25` (`TRANSICIONES_PERMITIDAS`): PENDIENTE → {CONFIRMADA, CANCELADA}, CONFIRMADA → {UTILIZADA, CANCELADA, REEMBOLSADA}, y los demás son terminales. "La invariante vive en el modelo: `actualizarEstado` lanza `ConflictError` si la transición no es válida." `estadoCompra.js` define `ESTADOS_QUE_RESERVAN`, los estados que ocupan cupo.
- **Errores** — `utils/manejoErrores.js`: las subclases de `AppError` (400/401/403/404/409) se traducen a `{ message }` en un único lugar, y cualquier otro error responde 500 sin detalles.
- **Resto del ciclo, una frase cada uno**: `marcarComprasUtilizadas` lo ejecuta `programarTarea` desde `index.js`. `reseniaService.crearResenia` exige que el evento haya ocurrido (400), que exista una compra UTILIZADA (403) y que no haya una reseña previa (409). `mensajeService` solo permite el chat al comprador dueño y al organizador del evento (403).
- **Tests** (15 s): `backend/tests/compras.estado.test.js` y `compras.*.test.js`. "Se trabajó con TDD: los tests se escribieron antes que la implementación." Si hay tiempo, correr `npm run test:backend` en vivo.

## 4. Front-end (6:20 – 8:20)
> "El front usa Expo Router: cada archivo de `src/app/` es una ruta. Las pantallas no llaman a axios directamente: usan hooks, que usan servicios, que usan un cliente común."

- **Capas**: pantalla `src/app/evento/[idEvento]/comprar.jsx` → hook `src/hooks/useCrearCompra.js` → `src/services/compraService.js` (`crearCompra`) → `src/services/api.js` (interceptores que agregan el token y renuevan la sesión con el refresh token).
- **Acceso por rol** — `src/navegacion/reglas.js` (`decidirAcceso`) y `RutaProtegida`: un visitante va a login con `volverA` y después vuelve al checkout. Un organizador es enviado al detalle del evento.
- **Una sola petición en curso** — `useCrearCompra.js`: el `useRef` `enCurso` evita la doble compra por doble toque, incluso antes del re-render.
- **Lógica pura y testeable** — `src/compras/checkout.js`: `limitesCantidad`, `totalEstimado` y `mensajeErrorCompra`, que traduce el 409 o el 400 a un mensaje para el usuario. "Separé la lógica de los componentes para poder probarla con Jest sin renderizar."
- **Mis compras** — `src/compras/misCompras.js`: agrupa por pestaña y decide `esCancelable`.
- **Organizador** — `src/compras/gestionCompras.js` (`accionesDisponibles`, que refleja la misma máquina de estados) + `useAccionCompra`.
- **Chat, una frase** — `src/hooks/useChatCompra.js`: polling cada 5 s con `setTimeout` encadenado solo mientras la pantalla está activa, y envío optimista con reintento.
- **Componentes presentacionales reutilizables**: `TicketTypeRow`, `QuantityStepper`, `PurchaseCard`, `StatusTimeline`, `ChatBubble`, `RatingInput`.

## 5. Conclusión: desarrollo con IA (8:20 – 9:40)
Completar con experiencias propias; esto es una base:
- **Cómo la usé**: desarrollo guiado por especificaciones (spec-kit), con `specs/001…008`, una constitución (`.specify/memory/constitution.md`) y un `AGENTS.md` con las reglas del proyecto: capas, TDD, JSDoc obligatorio y español. Para cada feature: spec → plan → tasks → implementación con agente.
- **Ventajas**: mucha velocidad en código repetitivo (CRUD, DTOs, tests, JSDoc), consistencia entre features gracias a la constitución, y ayuda para detectar casos borde (concurrencia del cupo, doble toque, deduplicación en el chat).
- **Desventajas y dificultades**: hay que revisar todo lo que genera. Ejemplos concretos posibles: el aviso `ROUTE_NAMES_CHANGED` al cerrar sesión, SecureStore sin soporte web (commit `1b6dceb`) y la migración de `ErrorHttp` a `AppError`, que cambió códigos (de 400 a 409/404). Además, la IA tiende a agregar más de lo pedido (YAGNI) y, si el contexto no está bien definido, no respeta la arquitectura.
- **Aprendizajes**: la calidad del resultado depende de la calidad de la especificación, y los tests escritos primero sirven como contrato para validar lo que genera la IA.
- **Valoración personal**: impacto en productividad y en calidad, con una opinión honesta sobre qué partes se entienden en profundidad y cuáles hubo que estudiar después.

> Cierre: "En resumen, la IA multiplicó mi productividad, pero el criterio de diseño y la revisión siguen siendo responsabilidad del desarrollador. Gracias."

---

## Consejos para la grabación
- Grabar el recorrido primero y la explicación del código aparte, y después editar. Si algo falla en vivo, se repite solo esa parte.
- Llevar la cuenta del tiempo por sección. Si el video se pasa de 10 min, recortar primero el error de "Sin cupo" y la parte de Mis compras del organizador.
- Hacer zoom en el editor (Ctrl + +) para que el código se lea en el video.

## Verificación
- Hacer un ensayo completo con el seed antes de grabar. Revisar que el chat actualice sin recargar y que, después de reseñar la compra UTILIZADA de ana, la calificación ya no se ofrezca.
- Medir el ensayo con cronómetro: tiene que quedar entre 8:30 y 9:45.
