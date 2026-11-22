# VIDEO — Qué mostrar en pantalla

Recorrido paso a paso de la imagen del video "Ciclo de vida de una compra". Se graba **sin audio**. El texto de cada toma está en [`AUDIO.md`](AUDIO.md), con el mismo ID (`T2.3`, `T3.4`…). El contexto y las alternativas siguen en [`GUION.md`](GUION.md).

**Duración objetivo:** ≈9:20 (el TP pide entre 5 y 10 min).

| Sección | Tomas | Duración |
|---|---|---|
| 1. Introducción | T1 | 0:35 |
| 2. Recorrido en la interfaz | T2.1 – T2.11 | 3:00 |
| 3. Back-end | T3.1 – T3.9 | 2:30 |
| 4. Front-end | T4.1 – T4.7 | 1:55 |
| 5. Conclusión | T5 | 1:20 |

---

## Preparación

1. Reiniciar el backend con datos de prueba para que todo esté limpio: `npm run dev:backend:seed`. Si ya hiciste un ensayo, **reiniciá**, porque la compra, el chat y la reseña del ensayo quedan en memoria.
2. `npm run dev:frontend` → `w` para abrir en web.
3. **Ventana A (normal):** login como `ana.comprador` / `Prueba123!`. Queda en Explorar.
4. **Ventana B (privada):** login como `bruno.organizador` / `Prueba123!`. Queda en Mis eventos.
5. Las dos ventanas del mismo tamaño. Si querés que se vea como en un celular, usá el modo dispositivo de las DevTools (por ejemplo, 390 × 844) y cerrá el panel de DevTools.
6. Editor: tema claro u oscuro con buen contraste, zoom alto (Ctrl + +, que se lean unas 30 líneas) y la barra lateral cerrada. Dejá abiertos en pestañas, en este orden, los archivos de las secciones 3 y 4.
7. Terminal del backend visible en otra pestaña o en el editor (para T3.9).
8. Silenciar notificaciones del sistema y cerrar pestañas que no se usen.

**Reglas generales al grabar:**
- Mover el mouse despacio y sin dar vueltas. Quedarse **2–3 s quieto** después de cada clic importante y en cada línea de código que se nombra.
- Para señalar código, **seleccionar las líneas** (queda resaltado) en vez de mover el cursor encima.
- Cada toma es un clip aparte. Si algo sale mal, repetir solo esa toma.

---

## 1. Introducción

### T1 — Portada (0:35)
- Imagen fija: la pantalla de Explorar de la ventana A, o una diapositiva con el título "Al Ticket It — Ciclo de vida de una compra", tu nombre y la materia. Si usás cámara, va acá.
- Se graba **después** del audio: alcanza con unos segundos de imagen, que se estiran en la edición.

---

## 2. Recorrido en la interfaz

### T2.1 — Explorar y abrir el evento (0:20) · Ventana A (ana)
1. Mostrar **Explorar** con las tarjetas de eventos (bajar un poco y volver arriba).
2. Tocar **"Noche de jazz en el Bajo"** (de Bruno).
3. En el detalle, bajar despacio: imagen, fecha, **tipos de entrada** (General y Platea, con las disponibles) y **reseñas del organizador**. Quedarse 2 s en las disponibles.

### T2.2 — Checkout (0:20) · Ventana A
1. Tocar el botón de **comprar**.
2. Elegir **General**.
3. Subir la cantidad a **2** con el stepper. Quedarse en el total estimado.
4. (Opcional, 3 s) Elegir **Platea** e intentar subir a 3: el stepper se frena en 2. Volver a General × 2.

### T2.3 — Confirmar y ver Mis compras (0:15) · Ventana A
1. Tocar **Confirmar**.
2. Mostrar la pantalla de éxito 2 s.
3. Ir a **Mis compras** → pestaña **Activas**: la compra del jazz aparece como **PENDIENTE**.

### T2.4 — Evento sin cupo (0:15) · Ventana A
1. Volver a **Explorar** y abrir **"Sin cupo"** (de Sofía).
2. Ir a comprar, elegir General y confirmar.
3. Quedarse 3 s en el **mensaje de cupo agotado**.
> Es la primera toma a recortar si el video se pasa de tiempo.

### T2.5 — El comprador escribe en el chat (0:15) · Ventana A
1. **Mis compras** → abrir la compra PENDIENTE del jazz.
2. Pestaña **Chat**.
3. Escribir: `Hola, ¿hasta qué hora se puede entrar?` y enviar. Quedarse hasta que la burbuja quede como enviada.

### T2.6 — El organizador ve las compras del evento (0:20) · Ventana B (bruno)
1. **Mis eventos** → tocar **"Noche de jazz en el Bajo"** → **Compras del evento**.
2. Quedarse 2 s en el **resumen de disponibilidad** (vendidas / disponibles por tipo).
3. Mostrar la compra de ana en la pestaña **Pendientes**.

### T2.7 — El organizador responde (0:15) · Ventana B
1. Abrir la compra de ana → pestaña **Chat**.
2. Esperar a que aparezca el mensaje de ana (máximo 5 s; se recorta en la edición).
3. Escribir: `Hola Ana, la puerta cierra a las 22:30. ¡Te esperamos!` y enviar.

### T2.8 — Confirmar la compra (0:10) · Ventana B
1. Volver a **Compras del evento**.
2. Tocar **Confirmar** en la compra de ana (no pide diálogo).
3. Mostrar el toast y la compra en la pestaña **Confirmadas**.

### T2.9 — El comprador ve la respuesta y el nuevo estado (0:15) · Ventana A
1. Volver a la ventana de ana, que quedó en el chat: la respuesta de bruno **aparece sola**, sin recargar (si tarda, se recorta).
2. Ir a **Mis compras** → **Activas**: la compra figura **CONFIRMADA**.
3. Abrir el detalle: mostrar la **línea de estado** y los **días que faltan** para el evento.

### T2.10 — Calificar un evento ya ocurrido (0:20) · Ventana A
1. **Mis compras** → pestaña **Pasadas**.
2. Abrir la compra **UTILIZADA** de **"Noche de blues en el Abasto"**.
3. En la sección de calificación: elegir **5 estrellas**, escribir `Excelente show, muy buen sonido.` y enviar.
4. Mostrar el toast y que la calificación **ya no se ofrece** de nuevo.

### T2.11 — La reseña aparece en el detalle (0:15) · Ventana A
1. Ir a **Explorar** → abrir de nuevo **"Noche de jazz en el Bajo"**.
2. Bajar a **reseñas del organizador**: aparece la reseña nueva y el puntaje de Bruno cambió. Quedarse 3 s.

---

## 3. Back-end

Todas las tomas en el editor. En cada una: abrir la pestaña, ir a la línea (Ctrl + G) y seleccionar el bloque indicado.

### T3.1 — Arquitectura en capas (0:15)
- Mostrar el árbol de `backend/src/` en la barra lateral, con las carpetas `routes`, `controllers`, `services`, `repositories` y `models` (abrir la barra solo para esta toma).

### T3.2 — Composición e inyección (0:15)
- `backend/src/app.js`, seleccionar **líneas 70–122**: primero los repositorios, después los servicios (que los reciben por constructor) y por último los controladores.

### T3.3 — Ruta (0:10)
- `backend/src/routes/comprasRoutes.js`, seleccionar **líneas 21–26**: `router.post` con `authMiddleware` y `requerirRol('COMPRADOR')`.

### T3.4 — Controller (0:15)
- `backend/src/controllers/compraController.js`, seleccionar **líneas 30–40**. Resaltar `compradorId: req.user.id` y `next(error)`.

### T3.5 — Service: validaciones (0:20)
- `backend/src/services/compraService.js`, seleccionar **líneas 90–118**: `crearCompraSchema.safeParse`, comprador, evento, `_exigirEventoFuturo` (línea 111) y tipo de entrada.

### T3.6 — Service: cupo transaccional (0:30)
- Mismo archivo, seleccionar **líneas 120–150**: `this.exclusion.ejecutar(...)`, el cálculo de disponibles, el `ConflictError`, la creación en PENDIENTE y el `CambioEstadoCompra`.
- Cambiar a `backend/src/utils/exclusionMutua.js` y seleccionar el método `ejecutar` (**línea 30** en adelante).

### T3.7 — Modelo y máquina de estados (0:20)
- `backend/src/models/compra.js`, seleccionar **líneas 11–21** (`TRANSICIONES_PERMITIDAS`).
- Bajar a **línea 79** (`actualizarEstado`) y seleccionar el `throw new ConflictError`.
- (2 s) `backend/src/models/estadoCompra.js`, **línea 18** (`ESTADOS_QUE_RESERVAN`).

### T3.8 — Errores y resto del ciclo (0:20)
- `backend/src/utils/manejoErrores.js`, **línea 53** (`crearManejadorErrores`) y la **línea 62** (`instanceof AppError`).
- `backend/src/index.js`, **líneas 11–13** (`programarTarea` → `marcarComprasUtilizadas`).
- `backend/src/services/reseniaService.js`, **líneas 95, 104 y 113** (400, 403 y 409).

### T3.9 — Tests (0:05 + lo que dure la corrida, acelerada)
- Mostrar `backend/tests/compras.estado.test.js` 2 s.
- En la terminal: `npm run test:backend` y quedarse en el resumen final en verde. La corrida se acelera o se corta en la edición.

---

## 4. Front-end

### T4.1 — Rutas y capas (0:15)
- Árbol de `frontend/src/app/` en la barra lateral, abrir `evento/[idEvento]/comprar.jsx` y mostrar dónde usa `useCrearCompra`.

### T4.2 — Hook, servicio y cliente (0:20)
- `frontend/src/hooks/useCrearCompra.js`, seleccionar **líneas 31–57** (`enCurso`).
- `frontend/src/services/compraService.js`, **línea 25** (`crearCompra`).
- `frontend/src/services/api.js`, **líneas 200–201** (interceptores).

### T4.3 — Acceso por rol (0:15)
- `frontend/src/navegacion/reglas.js`, **línea 204** (`decidirAcceso`); bajar hasta la regla del checkout.

### T4.4 — Lógica pura del checkout (0:20)
- `frontend/src/compras/checkout.js`: **líneas 54** (`limitesCantidad`), **76** (`totalEstimado`) y **96** (`mensajeErrorCompra`).

### T4.5 — Mis compras y organizador (0:20)
- `frontend/src/compras/misCompras.js`, **líneas 74** (`agruparPorPestana`) y **110** (`esCancelable`).
- `frontend/src/compras/gestionCompras.js`, **línea 189** (`accionesDisponibles`).

### T4.6 — Chat (0:10)
- `frontend/src/hooks/useChatCompra.js`, **línea 40** (`intervaloMs = 5000`) y **línea 114** (`setTimeout(ciclo, …)`).

### T4.7 — Componentes (0:15)
- Carpeta `frontend/src/components/` en la barra lateral. Abrir 2 s `QuantityStepper` y `ChatBubble`.
- Opcional: volver a la app y mostrar esos componentes en pantalla.

---

## 5. Conclusión

### T5 — Cierre (1:20)
- Imagen fija o cámara. Opcional: unos segundos de la carpeta `specs/` (001…008), de `.specify/memory/constitution.md` y de `AGENTS.md`, mientras hablás de spec-kit.
- Se graba **después** del audio, como T1.

---

## Checklist al terminar de grabar
- [ ] T1 y T5 con imagen suficiente para cubrir su audio.
- [ ] T2.1 – T2.11 completas, sin errores visibles (si fallan, regrabar solo esa toma).
- [ ] T3.1 – T3.9 y T4.1 – T4.7, con el código legible.
- [ ] Esperas del chat y de las cargas recortadas.
- [ ] Si se pasa de 10 min, recortar en este orden: T2.4 ("Sin cupo"), el opcional de T2.2 (Platea), T4.7 y T3.9.
