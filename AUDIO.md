# AUDIO — Qué decir

Texto para leer en el video "Ciclo de vida de una compra". Cada bloque tiene el mismo ID que su toma en [`VIDEO.md`](VIDEO.md). La duración entre paréntesis es la de la toma; el texto está calculado a unas 150 palabras por minuto (un ritmo tranquilo).

## Cómo grabarlo
1. **T1 y T5 primero**: su imagen es fija y se adapta a la voz.
2. El resto **después de recortar el video**: reproducir la toma, leer el bloque y grabar. Una toma por archivo de audio facilita la edición.
3. Si el texto no entra en la toma, recortar la frase marcada con *(opcional)*. Si sobra imagen, congelar un cuadro.
4. Las partes entre `[completar: …]` son tu opinión: reemplazalas antes de grabar.

---

## 1. Introducción

### T1 — Portada (~0:35)
> Hola, soy Sebastián. Les presento **Al Ticket It**, una aplicación de venta de entradas para eventos. El back-end está hecho con Node y Express, con persistencia en memoria, y el front-end con React Native y Expo, así que corre en web y en el celular. Hay dos roles: comprador y organizador.
>
> El flujo que elegí es el **ciclo de vida de una compra**: desde que se elige una entrada hasta la reseña del evento. Primero lo muestro funcionando, después explico el back y el front, y cierro con una reflexión sobre el uso de IA.

---

## 2. Recorrido en la interfaz

### T2.1 — Explorar y abrir el evento (~0:20)
> Estoy con la sesión de Ana, que es compradora. En Explorar veo los eventos publicados. Abro "Noche de jazz en el Bajo", de Bruno. El detalle es público: muestra los tipos de entrada, con las disponibles que calcula el servidor, y las reseñas del organizador.

### T2.2 — Checkout (~0:20)
> Voy a comprar. Elijo la entrada General y subo la cantidad a dos. La cantidad se topa en las entradas disponibles, y el total que veo es una estimación: el total real lo calcula el servidor. *(opcional)* Si elijo Platea, que tiene solo dos lugares, el contador no me deja pasar de dos.

### T2.3 — Confirmar y ver Mis compras (~0:15)
> Confirmo. La compra se creó, y en Mis compras aparece en la pestaña Activas, en estado **pendiente**: todavía la tiene que confirmar el organizador.

### T2.4 — Evento sin cupo (~0:15)
> Ahora pruebo un caso de error. Este evento tiene todas sus entradas vendidas. Si intento comprar, aparece el aviso de cupo agotado. Eso es un 409 del servidor: el front avisa, pero quien controla de verdad es el back.

### T2.5 — El comprador escribe en el chat (~0:15)
> Cada compra tiene un chat entre el comprador y el organizador del evento. Abro mi compra pendiente, voy a la pestaña Chat y le pregunto a Bruno hasta qué hora se puede entrar.

### T2.6 — El organizador ve las compras del evento (~0:20)
> Paso a la otra ventana, donde tengo la sesión de Bruno, el organizador. En Mis eventos abro el evento de jazz y entro a sus compras. Arriba está el resumen de disponibilidad por tipo de entrada, y abajo la compra de Ana, en Pendientes.

### T2.7 — El organizador responde (~0:15)
> Abro la compra y voy al chat. Ya me llegó la pregunta de Ana, así que le respondo que la puerta cierra a las diez y media.

### T2.8 — Confirmar la compra (~0:10)
> Vuelvo a la lista y confirmo la compra. Ahora aparece en Confirmadas.

### T2.9 — El comprador ve la respuesta y el nuevo estado (~0:15)
> En la ventana de Ana, la respuesta aparece sola, sin recargar, porque el chat se consulta cada cinco segundos. Y en Mis compras la compra ya figura **confirmada**, con su línea de estado y los días que faltan para el evento.

### T2.10 — Calificar un evento ya ocurrido (~0:20)
> El último paso del ciclo es la reseña. Una tarea periódica del back pasa a **utilizada** las compras confirmadas de eventos que ya ocurrieron. En Pasadas tengo una de un evento de Bruno: solo con una compra utilizada puedo calificar. Pongo cinco estrellas, un comentario, y envío. La calificación ya no se ofrece de nuevo.

### T2.11 — La reseña aparece en el detalle (~0:15)
> Si vuelvo al detalle de un evento de Bruno, la reseña nueva aparece entre las del organizador, y su puntaje cambió. Ese es el ciclo completo. Ahora veamos cómo está hecho.

---

## 3. Back-end

### T3.1 — Arquitectura en capas (~0:15)
> El back sigue una arquitectura en capas, en un solo sentido: rutas, controladores, servicios, repositorios y modelos. Ninguna capa llama a una de más arriba, y las dependencias se inyectan.

### T3.2 — Composición e inyección (~0:15)
> En `app.js` se arma todo: se crean los repositorios en memoria, se pasan a los servicios y los servicios a los controladores. Gracias a esto, en los tests puedo reemplazar los repositorios por versiones de prueba.

### T3.3 — Ruta (~0:10)
> La compra entra por `POST /api/compras`. La ruta exige un token válido y el rol de comprador antes de llegar al controlador.

### T3.4 — Controller (~0:15)
> El controlador es mínimo. El comprador sale del token, nunca del cuerpo de la petición, así que nadie puede comprar a nombre de otro. Y no escribe códigos de error: si algo falla, lo pasa a `next`.

### T3.5 — Service: validaciones (~0:20)
> La lógica está en el servicio. Primero valido los datos con un esquema de zod. Después compruebo que el comprador exista y tenga ese rol, que el evento exista y todavía no haya ocurrido, y que el tipo de entrada pertenezca a ese evento. Cada falla lanza un error con su tipo: datos inválidos, no encontrado o prohibido.

### T3.6 — Service: cupo transaccional (~0:30)
> Esta es la parte más importante. Leer las reservadas, validar el cupo y crear la compra tiene que ser atómico. Si no, dos compras simultáneas podrían vender la misma última entrada. Por eso todo corre en una exclusión mutua: cada tarea se encadena a una promesa y espera a la anterior. Sin cupo, lanzo un conflicto, el 409. Con cupo, creo la compra en pendiente, con el total del servidor, y registro el cambio de estado.

### T3.7 — Modelo y máquina de estados (~0:20)
> Los estados de la compra son una máquina de estados que vive en el modelo. Desde pendiente se puede confirmar o cancelar; desde confirmada, pasar a utilizada, cancelada o reembolsada; y esas tres son terminales. Si alguien intenta una transición inválida, `actualizarEstado` lanza un conflicto. Además, acá se define qué estados ocupan cupo.

### T3.8 — Errores y resto del ciclo (~0:20)
> Todos esos errores se traducen a una respuesta HTTP en un único lugar, y cualquier error inesperado responde 500 sin mostrar detalles. Del resto del ciclo: una tarea programada marca las compras utilizadas, y el servicio de reseñas exige que el evento haya ocurrido, que haya una compra utilizada y que no exista una reseña previa.

### T3.9 — Tests (~0:05 + corrida)
> Todo esto se desarrolló con TDD: los tests se escribieron antes que la implementación, y la suite completa pasa.

---

## 4. Front-end

### T4.1 — Rutas y capas (~0:15)
> En el front uso Expo Router: cada archivo de la carpeta `app` es una ruta. Esta es la pantalla de compra. Las pantallas no llaman directamente a la API: usan hooks, que usan servicios, que usan un cliente común.

### T4.2 — Hook, servicio y cliente (~0:20)
> El hook de crear compra guarda en una referencia si ya hay una petición en curso. Así, un doble toque en el botón no crea dos compras, incluso antes de que se vuelva a dibujar la pantalla. El servicio hace la petición, y el cliente común agrega el token y renueva la sesión cuando vence.

### T4.3 — Acceso por rol (~0:15)
> Las reglas de acceso están todas en un solo archivo. Por ejemplo, si un visitante entra al checkout, lo mando al login y después lo traigo de vuelta; si entra un organizador, lo mando al detalle del evento.

### T4.4 — Lógica pura del checkout (~0:20)
> Separé la lógica de los componentes en funciones puras: los límites de la cantidad, el total estimado y la traducción de errores del servidor, como el 409, a un mensaje para el usuario. Así las pruebo con Jest sin necesidad de renderizar nada.

### T4.5 — Mis compras y organizador (~0:20)
> Lo mismo en Mis compras: una función agrupa las compras por pestaña y otra decide si se pueden cancelar. Del lado del organizador, las acciones disponibles reflejan la misma máquina de estados del back: confirmar o cancelar una pendiente, y reembolsar o cancelar una confirmada.

### T4.6 — Chat (~0:10)
> El chat consulta los mensajes cada cinco segundos, solo mientras la pantalla está activa, y envía de forma optimista, con reintento si falla.

### T4.7 — Componentes (~0:15)
> Por último, la interfaz está armada con componentes presentacionales reutilizables, como el selector de cantidad, la tarjeta de compra o la burbuja del chat. No conocen servicios ni contexto: solo reciben datos.

---

## 5. Conclusión: desarrollo con IA

### T5 — Cierre (~1:30)
> Para terminar, cómo usé la inteligencia artificial. Trabajé con desarrollo guiado por especificaciones, con spec-kit: cada funcionalidad tiene especificación, plan y tareas, y la implementó un agente siguiendo una constitución y un archivo de reglas del proyecto: capas, TDD, documentación obligatoria y español.
>
> La ventaja más clara fue la velocidad en el código repetitivo, como DTOs, tests y documentación, y la consistencia entre funcionalidades. También ayudó a detectar casos borde, como la concurrencia del cupo o el doble toque.
>
> En cuanto a las desventajas, la primera es que hay que revisar con detenimiento todo lo que genera. Por ejemplo, la sesión no se guardaba en web, y al centralizar los errores cambiaron códigos de respuesta.
>
> La segunda es que al principio retrasó mucho el proyecto. Antes de escribir código tuve que armar todo el contexto: la constitución, las reglas del proyecto y las skills. Y aun así, al comienzo el agente a veces no respetaba la constitución porque directamente no la leía, así que tuve que dejar explícito en las reglas que la leyera antes de cada tarea. Una vez armado ese harness, todo fluyó bien, pero hubo que pasar por esa etapa.
>
> Como conclusión, diría que la IA retrasa bastante el inicio de un proyecto, pero lo acelera mucho una vez que tiene una buena base. Esa inversión inicial en contexto es lo que la vuelve confiable, y el criterio de diseño y la revisión siguen siendo responsabilidad del desarrollador. Gracias.
