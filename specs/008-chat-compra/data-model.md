# Data Model: Chat de una compra

**Feature**: `008-chat-compra` | **Fecha**: 2026-11-21 | **Plan**: [plan.md](./plan.md)

Sin entidades nuevas en el backend. Este documento describe lo que la app recibe y el estado del cliente.

## 1. Entidad de la API (sin cambios)

### Mensaje (`GET /api/compras/:idCompra/mensajes` → `[]`, respuesta de `POST`)

Lo arma `aMensajeRespuesta` en `backend/src/dto/mensaje.js`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `string` | Lo asigna el repositorio en memoria. Es la clave para deduplicar. |
| `compraId` | `string` | ID de la compra. |
| `usuario` | `{ id, nombre, apellido, rol }` | Remitente en versión pública (`aUsuarioPublico`). `rol` es `COMPRADOR` u `ORGANIZADOR`. |
| `mensaje` | `string` | Texto ya recortado, de 1 a 1000 caracteres. |
| `enviado` | `string` (ISO) | Fecha del servidor. Define el orden. |

El listado viene del más antiguo al más reciente. El cliente igual ordena por `enviado` y luego por `id`, por robustez.

### Cuerpo de `POST`

`{ mensaje: string }`: el texto recortado (R5). El remitente sale del token.

## 2. Mensaje local (`src/mensajes/chat.js`)

### MensajeLocal

| Campo | Tipo | Notas |
|-------|------|-------|
| `claveLocal` | `string` | Única en la sesión del chat (contador). Es la `key` del ítem mientras no tiene `id`. |
| `mensaje` | `string` | Texto recortado que se envía y se reintenta. |
| `estado` | `'enviando' \| 'error' \| 'confirmado'` | Ciclo de abajo. |
| `creado` | `Date` | Momento del envío local. Sirve para la tolerancia de R4. |
| `id` | `string?` | Solo en `confirmado`. |
| `enviado` | `string?` | Solo en `confirmado` (la fecha del servidor). |
| `error` | `Error?` | Solo en `error` (un `ApiError` con `status`). |

### Ciclo de un mensaje local

```text
(enviar) → enviando ──ok──▶ confirmado ──(aparece su id en el servidor)──▶ se descarta
              │
              └─fallo─▶ error ──(reintentar)──▶ enviando
```

No hay otro camino. `confirmado` nunca vuelve atrás.

### Invariantes

- Un mismo `id` aparece **una sola vez** en la lista visible (SC-002).
- Un local `enviando` o `error` nunca se pierde por una consulta periódica: solo desaparece al confirmarse o cuando su gemelo del servidor lo reclama (R4).
- La cola de envío tiene como máximo **una** petición POST en curso.

## 3. Ítems visibles (`agruparMensajes`)

```text
ItemChat =
  | { tipo: 'dia', clave: 'dia-AAAA-MM-DD', etiqueta: 'Hoy' | 'Ayer' | '10 nov' }
  | { tipo: 'mensaje', clave: id | claveLocal, propio: boolean, autor: string,
      mostrarAutor: boolean, hora: string, texto: string,
      estado: 'enviado' | 'enviando' | 'error', error?: string /* textoErrorEnvio(MensajeLocal.error) */ }
```

- `propio`: es `usuario.id === miId`. Los locales siempre son propios.
- `mostrarAutor`: solo en un mensaje ajeno cuyo anterior (sin contar los separadores de día) es de otro autor o es un separador.
- `autor`: es `"nombre apellido"`, o "Vos" si es propio (este solo se usa en el `accessibilityLabel`).
- Los días se calculan en hora local. Los locales sin `enviado` usan `creado`.

## 4. Validación (`validarMensaje`)

`validarMensaje(texto) → { valido: boolean, largo: number, error: string | null }`

| Texto (después de `trim`) | `valido` | `error` |
|---------------------------|----------|---------|
| largo 0 | `false` | `null` (botón deshabilitado con la ayuda "Escribí un mensaje para enviar") |
| largo 1 a 1000 | `true` | `null` |
| largo > 1000 | `false` | "El mensaje no puede superar los 1000 caracteres." |

`LIMITE_MENSAJE = 1000`. El contador se ve con `largo >= 800`.

## 5. Estados de los hooks

### `useChatCompra(idCompra, { activo, intervaloMs = 5000 })`

| Campo | Tipo | Notas |
|-------|------|-------|
| `mensajes` | `Array<Mensaje \| MensajeLocal>` | Resultado de `fusionarMensajes(servidor, locales, miId)`. |
| `cargando` | `boolean` | `true` solo hasta la primera respuesta (o error) de la carga inicial. |
| `error` | `Error \| null` | Error **bloqueante**: el de una carga inicial sin datos, o un 403/404 en cualquier momento. Los errores periódicos con datos no se exponen (R6). |
| `enviar(texto)` | `function(string): void` | Agrega un local y lo encola. Ignora textos inválidos. |
| `reintentar(claveLocal)` | `function(string): void` | Pasa un local de `error` a `enviando` y lo encola. |
| `recargar()` | `function(): Promise<void>` | Consulta ya (botón "Reintentar" del estado de error). No hace nada si ya hay una consulta GET en curso. |

Reglas:

- Con un ID vacío no pide nada.
- Con `activo=false` no hay consultas, y un temporizador pendiente se cancela.
- Con `activo=true` consulta al instante y después cada `intervaloMs` tras cada respuesta.
- Descarta las respuestas viejas por secuencia.
- Al desmontar no actualiza estado.
- Nunca lanza.

### `usePantallaActiva()`

Devuelve `boolean`: la pantalla está enfocada (`useFocusEffect`) **y** `AppState.currentState === 'active'`. Escucha `AppState.addEventListener('change')` y limpia la suscripción.

## 6. Transiciones de estado de la compra

Sin cambios ni interacción: el chat no lee ni pide transiciones de `EstadoCompra`, y está habilitado en cualquier estado (CU-05 y CU-06).
