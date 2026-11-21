# Quickstart: validar el chat de una compra

**Feature**: `008-chat-compra` | **Plan**: [plan.md](./plan.md)

## Requisitos previos

- Node 20 y las dependencias instaladas (`npm install` en la raíz).
- Ninguna dependencia nueva. El único cambio en el backend son los logs de `MensajeService` ([research R11](./research.md#r11-observabilidad-del-chat)).

## 1. Pruebas automáticas

```bash
npm run test --workspace frontend -- mensajes/chat ChatBubble MessageComposer useChatCompra usePantallaActiva ChatCompra detalle-compra
npm run test --workspace frontend     # suite completa en verde
npm run test:backend                  # incluye los logs de MensajeService (T003–T004)
npm run lint                          # incluye el JSDoc de frontend/src/
```

Qué deben probar (ver [research R10](./research.md#r10-pruebas-tdd)):

| Escenario | Dónde |
|-----------|-------|
| Bordes de 0, 1, 1000 y 1001 caracteres y solo espacios | `chat-test.js` |
| Carrera POST/GET: el mensaje se ve una sola vez | `chat-test.js` (`fusionarMensajes`) |
| Con `activo=false` hay 0 llamadas; con `activo=true`, 1 al instante y otra cada 5 s; se detiene al desactivar | `useChatCompra-test.jsx` |
| Sin consultas encimadas con una respuesta lenta | `useChatCompra-test.jsx` (`diferido`) |
| Envío optimista → confirmado; fallo → error → reintento | `useChatCompra-test.jsx`, `ChatCompra-test.jsx` |
| 403 → "No tenés acceso a esta conversación" | `ChatCompra-test.jsx`, `detalle-compra-test.jsx` |
| Ambos roles ven el mismo chat en la pestaña Chat | `detalle-compra-test.jsx` |

## 2. Prueba manual con datos de prueba

```bash
npm run dev:backend:seed
npm run dev:frontend        # web: tecla w; o dos dispositivos/emuladores
```

1. **Preparar la compra** (el seed no trae compras): iniciá sesión como `ana.comprador` / `Prueba123!` y comprá una entrada de un evento de `bruno.organizador`.
2. **CU-05**: en Mis compras, abrí la compra → pestaña **Chat**.
   - Ves "Todavía no hay mensajes" con el composer habilitado.
   - Con espacios solamente, "Enviar" está deshabilitado y tiene la ayuda.
   - Escribí "¿Hay estacionamiento?" y enviá: la burbuja aparece al instante a la derecha con "Enviando…" y pasa a la hora sin aviso.
   - En la consola del backend aparece una línea `{"evento":"mensaje_creado","requestId":…,"rol":"COMPRADOR","estadoCompra":"PENDIENTE",…,"largo":21}` **sin** el texto del mensaje. Con el chat abierto, aparece un `mensajes_listados` cada ~5 s.
3. **CU-06**: en otro navegador o dispositivo, iniciá sesión como `bruno.organizador`. Andá a Mensajes (o Mis eventos → el evento → la compra) → pestaña **Chat**. Ves el mensaje de Ana a la izquierda con su nombre. Respondé.
4. **US3**: en la sesión de Ana, con el chat abierto, la respuesta aparece sola en menos de 10 s y la vista baja. Subí el scroll y pedí otra respuesta: aparece el chip "Mensajes nuevos" y la vista no salta.
5. **SC-003**: con las DevTools → Network abiertas en la sesión de Ana, verificá que hay un `GET …/mensajes` cada ~5 s solo en la pestaña Chat. Cambiá a **Detalle**, volvé a Mis compras o mandá la pestaña del navegador a segundo plano: las peticiones se detienen. Al volver, hay una inmediata.
6. **Error y reintento**: detené el backend y enviá un mensaje. La burbuja queda en "No se envió" con "Reintentar" y el texto intacto. Volvé a levantar el backend (`npm run dev:backend:seed`; los datos en memoria se pierden, así que esperá un 404 → "Esta compra ya no existe"). Para probar el reintento sin perder datos, cortá solo la red del dispositivo y restaurala.
7. **1000 caracteres**: pegá un texto de 1001 caracteres. Se ve el contador `1001/1000` en rojo, el error y "Enviar" deshabilitado. Borrá uno y se puede enviar.
8. **403**: como `sofia.organizadora`, abrí `/compra/<id>?evento=<idEvento>` con los IDs de la compra de Ana: ves "No tenés acceso…".
9. **Cualquier estado**: como Bruno, cancelá la compra desde Compras del evento. El chat de ambos sigue permitiendo escribir.

## 3. Accesibilidad y tema

- Con el lector de pantalla, cada burbuja anuncia el autor, la hora, el texto y el estado ("Vos, 14:05: ¿Hay estacionamiento?. Enviando").
- El botón enviar tiene la etiqueta "Enviar mensaje" y un área táctil de 44 o más. Deshabilitado, explica por qué.
- El estado de error lleva ícono y texto, no solo color.
- En tema claro y oscuro, las burbujas propias usan `bubbleOwn` / `onBubbleOwn` con contraste AA.
