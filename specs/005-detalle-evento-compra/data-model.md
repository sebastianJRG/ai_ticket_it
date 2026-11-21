# Data Model: Detalle de evento y compra de entradas

**Feature**: 005-detalle-evento-compra | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

La app no persiste nada nuevo: todo sale del backend en memoria o se deriva para presentar. Las entidades de dominio (`Evento`, `TipoEntrada`, `Compra`, `Resenia`) y sus invariantes viven en el backend; acá se documenta **lo que la app recibe** (§1–§3) y **lo que deriva** (§4–§9).

---

## 1. Evento (respuesta de `GET /api/eventos/:idEvento`)

Igual que en [004 › data-model §1](../004-explorar-busqueda-favoritos/data-model.md).

| Campo | Tipo | Uso en esta feature |
|-------|------|---------------------|
| `id` | string | Rutas `/evento/<id>` y `/evento/<id>/comprar`; `eventoId` de la compra |
| `nombre` | string | Título `display-xl` |
| `descripcion` | string | Cuerpo del detalle |
| `categoria` | `{ id, nombre, descripcion }` | Chip de categoría; arte por categoría sin imagen |
| `fecha` | string ISO | Fecha larga; `finalizado` si `fecha <= ahora` |
| `tiposEntrada` | `TipoEntrada[]` | Filas informativas e interactivas; precio desde |
| `multimedia` | string[] | `multimedia[0]` = imagen hero; vacío → `ArteCategoria` |
| `organizador` | `{ id, nombre, apellido, rol }` | Nombre; `id` para pedir sus reseñas |
| `puntajeOrganizador` | number \| null | Promedio mostrado (null → sin reseñas) |

## 2. TipoEntrada

| Campo | Tipo | Regla en la app |
|-------|------|-----------------|
| `id` | string | `tipoEntradaId` de la compra |
| `nombre` | string | — |
| `descripcion` | string | Puede ser vacía |
| `precio` | number ≥ 0 | 0 → "Gratis" |
| `cupo` | entero ≥ 0 | **Cupo total** (no disponibles). Tope del stepper; 0 → Agotado |

## 3. Resenia (elemento de `GET /api/usuarios/:idOrganizador/resenias`)

| Campo | Tipo | Uso |
|-------|------|-----|
| `id` | string | `key` |
| `comprador` | `{ id, nombre, apellido }` \| null | Nombre "Nombre A." y avatar; null → "Comprador" |
| `eventoId` | string | No se usa para mostrar (no hay nombre de evento) |
| `detalle` | string (1–1000) | Comentario |
| `puntuacion` | entero 1–5 | Estrellas |

Orden recibido: creación ascendente. Sin fecha ni tipo de entrada.

## 4. Compra (respuesta de `POST /api/compras`, 201)

| Campo | Tipo | Uso |
|-------|------|-----|
| `id` | string | — |
| `evento` | `{ id, nombre, fecha }` | Resumen del éxito |
| `tipoEntrada` | `{ id, nombre, precio }` | Resumen del éxito |
| `cantidad` | entero ≥ 1 | Resumen del éxito |
| `total` | number | **Monto definitivo** (FR-005) |
| `estado` | `'PENDIENTE'` | Siempre PENDIENTE al crearse; la app no transiciona estados |

Petición: `{ eventoId: string, tipoEntradaId: string, cantidad: entero ≥ 1 }`. El comprador lo toma el backend del token.

---

## 5. DetalleEvento (derivado; `src/eventos/detalle.js › aDetalle`)

Extiende `TarjetaEvento` de 004 (`aTarjeta`: `imagen`, `paleta`, `categoria`, `finalizado`, `puntaje`, `organizadorNombre`).

| Campo | Tipo | Regla |
|-------|------|-------|
| `fechaLarga` | string | `formatDate(fecha, 'long')` → "Sábado 12 de diciembre de 2026 · 21:00 h"; `''` si inválida |
| `descripcion` | string | `evento.descripcion ?? ''` |
| `tipos` | `TipoEntradaVista[]` | Ver §6, en el orden recibido |
| `precioDesdeTexto` | string | "desde $ 25.000" · "Gratis" (todos 0) · "desde $ 0" (mín. 0 y otros > 0) · `''` sin tipos |
| `organizadorId` | string \| null | `evento.organizador?.id` |

No lanza con datos incompletos (mismo criterio que `aTarjeta`).

## 6. TipoEntradaVista (derivado)

| Campo | Tipo | Regla |
|-------|------|-------|
| `id`, `nombre`, `descripcion` | string | Del tipo |
| `precio` | number | — |
| `precioTexto` | string | `formatPrice(precio)` ("Gratis" si 0) |
| `cupo` | number | — |
| `agotado` | boolean | `cupo <= 0` |

## 7. ModoCta (derivado; `modoCta(evento, usuario, ahora)`)

`'oculto' | 'finalizado' | 'sinEntradas' | 'pedirSesion' | 'comprar'`, evaluado en ese orden de prioridad:

1. `usuario?.rol === 'ORGANIZADOR'` → `oculto`
2. `esPasado(evento, ahora)` → `finalizado`
3. sin tipos de entrada (o todos agotados) → `sinEntradas`
4. sin usuario → `pedirSesion`
5. COMPRADOR → `comprar`

## 8. SeleccionCheckout (estado de la pantalla; `src/compras/checkout.js`)

| Campo | Tipo | Regla |
|-------|------|-------|
| `tipoId` | string \| null | Preseleccionado si hay **un solo** tipo no agotado; si no, `null` |
| `cantidad` | entero | 1 al elegir un tipo; reinicia a 1 al cambiar de tipo |

Funciones puras:

- `seleccionInicial(tipos)` → `{ tipoId, cantidad: 1 }`.
- `limitesCantidad(tipo)` → `{ min: 1, max: tipo.cupo }`.
- `ajustarCantidad(cantidad, limites)` → entero dentro de `[min, max]` (nunca supera el cupo; SC-002).
- `totalEstimado(tipo, cantidad)` → `precio × cantidad` (0 sin tipo).
- `textoConfirmar({ tipo, cantidad, finalizado })` → "Elegí un tipo de entrada" · "Evento finalizado" · "Confirmar compra · $ 50.000" · "Confirmar compra · Gratis".
- `mensajeErrorCompra(error)` → `{ titulo, cuerpo, bloquea }` según la tabla de [research R7](./research.md#r7-confirmar-una-sola-compra-y-manejo-de-errores). `bloquea` indica que no tiene sentido reintentar sin cambiar algo (403, 404, 400 con evento ocurrido).

Invariantes de la pantalla: exactamente un tipo elegido para poder confirmar; `1 ≤ cantidad ≤ cupo`; a lo sumo **una** petición de compra en curso.

## 9. Resúmenes de reseñas (derivado; `src/resenias/presentacion.js`)

| Función | Resultado |
|---------|-----------|
| `recientes(resenias, n = 2)` | Últimas `n` en orden inverso de creación |
| `ordenRecientes(resenias)` | Todas, de la más nueva a la más vieja (para "Ver todas") |
| `promedio(resenias, puntajeServidor)` | `puntajeServidor` si es número; si no, promedio local (o `null` sin reseñas) |
| `aResenia(resenia)` | `{ id, autor: "Nombre A.", iniciales: "NA", puntuacion, detalle }` |

## 10. Estados de las consultas (hooks)

| Hook | Estado |
|------|--------|
| `useEvento(idEvento)` | `{ evento: object\|null, cargando: boolean, error: ApiError\|null, noEncontrado: boolean, recargar() }` — `noEncontrado` con 404 o 400 |
| `useReseniasOrganizador(idOrganizador)` | `{ resenias: object[], cargando, error, recargar() }` — inactivo si `idOrganizador` es vacío |
| `useCrearCompra()` | `{ confirmar(datos): Promise<object\|null>, enviando: boolean, error: ApiError\|null, compra: object\|null, limpiarError() }` — ignora llamadas mientras `enviando` (ref síncrona) |

## 11. Transiciones de la pantalla de checkout

```text
cargando ──ok──▶ eligiendo ──confirmar──▶ enviando ──201──▶ exito
   │                ▲                        │
   │                └──── 409/400/0/otro ────┘ (aviso en línea; sigue editable)
   ├──404/400──▶ noEncontrado
   └──error───▶ errorCarga (Reintentar)
```

`EstadoCompra` no se transiciona en esta feature: la compra nace PENDIENTE en el backend; la confirma el organizador (007).
