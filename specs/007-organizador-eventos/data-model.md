# Modelo de datos: Eventos del organizador

**Feature**: `007-organizador-eventos` | Ver [research.md](./research.md) y los contratos en [contracts/](./contracts/).

Esta feature no crea entidades nuevas en el backend. Lo que sigue describe las formas de la API que consume el cliente y los tipos que agrega el frontend (borradores, vistas y estados de hooks). Los tipos se documentan con `@typedef` en el código (principio 6).

---

## 1. Entidades de la API (sin cambios)

### Evento (`GET /api/eventos`, `GET /api/eventos/:id`, respuesta de `POST /api/eventos`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | |
| `nombre`, `descripcion` | string | |
| `categoria` | `{ id, nombre, descripcion }` | |
| `fecha` | string ISO | El cliente la compara con `ahora` para separar próximo de finalizado |
| `tiposEntrada` | `{ id, nombre, descripcion, precio, cupo }[]` | |
| `multimedia` | string[] | `[0]` es la portada |
| `organizador` | `{ id, nombre, apellido, … }` público | **Mis eventos filtra por `organizador.id === usuario.id`** (R2) |
| `puntajeOrganizador` | number \| null | |

### Cuerpo de `POST /api/eventos` (lo arma `aCuerpoEvento`)

```json
{
  "nombre": "Noche de jazz",
  "descripcion": "…",
  "categoriaId": "c1",
  "fecha": "2026-12-20T00:30:00.000Z",
  "tiposEntrada": [
    { "nombre": "General", "descripcion": "De pie", "precio": 0, "cupo": 200 },
    { "nombre": "VIP", "descripcion": "Mesa", "precio": 15000.5, "cupo": 20 }
  ],
  "multimedia": ["https://…/portada.jpg"]
}
```

El organizador lo toma el backend del token; el cliente nunca envía `organizadorId`.

### Categoría

`{ id, nombre, descripcion }`. El alta envía `{ nombre, descripcion }` (ambos con trim y mín. 1).

### Compra del organizador (`GET /api/eventos/:id/compras` → `compras[]`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | string | |
| `comprador` | `{ id, nombre, apellido }` | Sin hashes |
| `evento` | `{ id, nombre, fecha }` | |
| `tipoEntrada` | `{ id, nombre, precio }` | |
| `cantidad`, `total` | number | |
| `estado` | `PENDIENTE` \| `CONFIRMADA` \| `UTILIZADA` \| `CANCELADA` \| `REEMBOLSADA` | |

No trae fecha de creación ni `diasRestantes`. La lista llega en orden de creación ascendente.

### DisponibilidadTipo (`GET /api/eventos/:id/compras` → `disponibilidad[]`)

`{ tipoEntradaId, nombre, precio, cupo, vendidas, disponibles }`. Las compras PENDIENTE, CONFIRMADA y UTILIZADA ocupan cupo. **Es la fuente de verdad** para la disponibilidad (SC-003).

---

## 2. Borrador del formulario (`eventos/formularioEvento.js`)

### BorradorEvento

| Campo | Tipo | Inicial |
|-------|------|---------|
| `nombre` | string | `''` |
| `descripcion` | string | `''` |
| `categoriaId` | string \| null | `null` |
| `fecha` | string `DD/MM/AAAA` | `''` |
| `hora` | string `HH:MM` | `''` |
| `multimedia` | `{ clave, url }[]` | `[]` (máx. 5) |
| `tiposEntrada` | `TipoEntradaBorrador[]` | 1 tipo vacío |
| `tocados` | `Set<string>` de rutas de campo | vacío; se completa al perder el foco o al publicar |

### TipoEntradaBorrador

`{ clave: string, nombre: string, descripcion: string, precio: string, cupo: string }`. `clave` es estable (`t1`, `t2`, …) y nunca se reutiliza (R6).

### Invariantes del borrador

- `tiposEntrada.length >= 1`: `quitarTipo` no quita el último.
- `multimedia.length <= 5`.
- Las rutas de campo para errores y `tocados` son `nombre`, `descripcion`, `categoriaId`, `fecha`, `hora`, `multimedia.<clave>` y `tiposEntrada.<clave>.<campo>`.

### ErroresFormulario

`Record<rutaCampo, string>` con el mensaje accionable (R5). `validarFormulario(borrador, ahora)` → `{ valido: boolean, errores }`. Se considera que hay un error de fecha en el futuro solo si `fecha` y `hora` tienen formato válido.

### Funciones puras

| Función | Firma | Resultado |
|---------|-------|-----------|
| `borradorInicial()` | `() → BorradorEvento` | |
| `agregarTipo` / `quitarTipo` / `actualizarTipo` | `(borrador, …) → BorradorEvento` | Inmutables |
| `agregarImagen` / `quitarImagen` / `actualizarImagen` | `(borrador, …) → BorradorEvento` | |
| `enmascararFecha` / `enmascararHora` | `(texto) → string` | Insertan `/` y `:` |
| `aFechaLocal` | `(fecha, hora) → Date \| null` | `null` si el formato o el calendario son inválidos |
| `aNumeroPrecio` | `(texto) → number \| null` | Acepta `-?\d+([.,]\d{1,2})?` (con trim); `null` en otro caso (`'1.500'`, `'1.500,00'`, `'abc'`) |
| `validarCampo` | `(borrador, ruta, ahora) → string \| null` | |
| `validarFormulario` | `(borrador, ahora) → { valido, errores }` | |
| `aCuerpoEvento` | `(borrador) → CuerpoCrearEvento` | Requiere un borrador válido |
| `mensajeErrorPublicar` | `(error) → string` | 400, 404, 0 y genérico (R13) |
| `validarCategoria` | `({ nombre, descripcion }) → { nombre?, descripcion? }` | |

---

## 3. Mis eventos (`eventos/misEventos.js`)

`separarMisEventos(eventos, organizadorId, ahora = new Date())` → `{ proximos: object[], finalizados: object[] }`:

- Conserva solo los eventos con `organizador?.id === organizadorId`.
- `proximos` contiene los eventos con `fecha > ahora`, ordenados por fecha ascendente.
- `finalizados` contiene los eventos con `fecha <= ahora`, ordenados por fecha descendente.
- Si la fecha es inválida, el evento va a `finalizados`. No lanza.

---

## 4. Gestión de compras (`compras/gestionCompras.js`)

### PestanaOrganizador

| Clave | Etiqueta | Estados | Vacío |
|-------|----------|---------|-------|
| `pendientes` | Pendientes | PENDIENTE | "No hay compras pendientes de confirmar" |
| `confirmadas` | Confirmadas | CONFIRMADA | "No hay compras confirmadas" |
| `utilizadas` | Utilizadas | UTILIZADA | "Todavía no se usaron entradas" |
| `canceladas` | Canceladas | CANCELADA, REEMBOLSADA | "No hay compras canceladas ni reembolsadas" |

`agruparPorEstado(compras)` → `{ pendientes, confirmadas, utilizadas, canceladas }`, cada lista con la más reciente primero (invertida). Un estado desconocido se ignora.

### AccionCompra

`'confirmar' | 'reembolsar' | 'cancelar'`

| Acción | Servicio | Transición | Diálogo | Toast de éxito |
|--------|----------|-----------|---------|----------------|
| `confirmar` | `confirmarCompra` | PENDIENTE → CONFIRMADA | No | "Compra confirmada" |
| `reembolsar` | `reembolsarCompra` | CONFIRMADA → REEMBOLSADA | Destructivo, "Sí, reembolsar" | "Compra reembolsada" |
| `cancelar` | `cancelarCompra` | PENDIENTE \| CONFIRMADA → CANCELADA | Destructivo, "Sí, cancelar compra" | "Compra cancelada" |

`accionesDisponibles(compra, fechaEvento, ahora)`:

| Estado | Evento futuro | Evento ocurrido o fecha inválida |
|--------|---------------|----------------------------------|
| PENDIENTE | `['confirmar', 'cancelar']` | `[]` |
| CONFIRMADA | `['reembolsar', 'cancelar']` | `[]` |
| UTILIZADA / CANCELADA / REEMBOLSADA | `[]` | `[]` |

Otras funciones: `cuerpoAccion(accion, compra)` → texto del Modal:

- reembolsar → "Vas a reembolsar {cantidad} × {tipo} a {comprador} por {total}. No se puede deshacer.";
- cancelar → "Vas a cancelar {cantidad} × {tipo} de {comprador} por {total}. Se libera el cupo y no se puede deshacer.".

También: `mensajeErrorAccion(accion, error)` → texto del toast (R11); `nombreComprador(compra)` → "Ana Pérez" ("Comprador" si falta).

### ResumenDisponibilidad

`resumenDisponibilidad(disponibilidad)` →

```text
{
  totalVendidas: number, totalCupo: number, porcentaje: number,  // entero 0–100, redondeado hacia abajo
  tipos: [{ tipoEntradaId, nombre, precio, cupo, vendidas, disponibles,
            porcentaje, nivel: 'normal'|'casi'|'agotado', textoRestantes }]
}
```

- `nivel` es `agotado` si `disponibles === 0`, `casi` si `vendidas / cupo >= 0.9` y `normal` en otro caso.
- `textoRestantes` es "Agotado" o "Quedan N".
- Con `cupo === 0` (no debería pasar), el porcentaje es 0.

### Agrupación de Mensajes

`agruparComprasPorEvento(eventos, resultados)`:

- **Entradas**: `eventos` en el orden de Mis eventos y `resultados` de `Promise.allSettled`, alineados por índice.
- **Salida**: `{ secciones: [{ evento: { id, nombre, fecha }, compras }], fallidos: number }`.
- Las compras de cada sección van de la más reciente a la más antigua.
- Las secciones sin compras se omiten.

---

## 5. Estados de los hooks

| Hook | Estado expuesto | Notas |
|------|-----------------|-------|
| `useMisEventos()` | `{ proximos, finalizados, eventos, cargando, error, recargar }` | Usa `useAuth().usuario.id`; descarta respuestas viejas |
| `useCrearEvento()` | `{ publicar(cuerpo) → Promise<Resultado>, enviando }` | Una sola petición en curso; nunca lanza |
| `useCrearCategoria()` | `{ crear(datos) → Promise<Resultado>, enviando }` | Igual |
| `useCategorias()` (MOD) | `{ categorias, agregar(cat), recargar() }` | Aditivo: `categorias` sigue igual para 004 |
| `useComprasEvento(idEvento)` | `{ datos: { compras, disponibilidad } \| null, cargando, error, recargar }` | Descarta respuestas viejas; con ID vacío no pide nada (`cargando: false`, `datos: null`, `error: null`) |
| `useAccionCompra({ alTerminar })` | `{ ejecutar(accion, compra), enCurso: { accion, idCompra } \| null }` | Una sola petición en toda la pantalla; `alTerminar({ ok, accion, compra \| error })` |
| `useComprasOrganizador()` | `{ secciones, fallidos, cargando, error, recargar }` | N + 1 peticiones en paralelo |

`Resultado` = `{ ok: true, <entidad> } | { ok: false, error: ApiError }`.

---

## 6. Transiciones de estado (sin cambios, principio 4)

El cliente **no** transiciona estados: solo pide la transición y vuelve a leer del servidor. `accionesDisponibles` es una réplica de lectura de esta tabla, que solo decide qué botones mostrar:

```text
PENDIENTE  ──confirmar──▶ CONFIRMADA ──(sistema)──▶ UTILIZADA
    │                        │  └──reembolsar──▶ REEMBOLSADA
    └──cancelar──▶ CANCELADA ◀──cancelar──┘
(todas las acciones del organizador: solo si el evento no ocurrió)
```
