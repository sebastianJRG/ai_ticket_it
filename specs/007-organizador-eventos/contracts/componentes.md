# Contrato de componentes, hooks y módulos: Eventos del organizador

**Feature**: `007-organizador-eventos` | Ver [data-model.md](../data-model.md) y [pantallas.md](./pantallas.md).

Reglas generales, las mismas que en 004–006:

- Los componentes de `src/components/` son **presentacionales**: solo usan `useTheme` y no importan servicios ni contextos.
- Los compuestos viven junto a su dominio (`src/eventos/`, `src/compras/`).
- Los hooks de datos viven en `src/hooks/` y nunca lanzan.
- Los módulos puros no importan React.
- Cada export lleva JSDoc (`@file` con owner y licencia, `@param` con tipo, `@returns`, y `@typedef` con `@property` para las props).

---

## Módulos puros

### `src/eventos/formularioEvento.js` (NUEVO)

Exports: `MAX_IMAGENES` (5), `borradorInicial`, `agregarTipo`, `quitarTipo`, `actualizarTipo`, `agregarImagen`, `quitarImagen`, `actualizarImagen`, `enmascararFecha`, `enmascararHora`, `aFechaLocal`, `aNumeroPrecio`, `validarCampo`, `validarFormulario`, `aCuerpoEvento`, `mensajeErrorPublicar` y `validarCategoria`. Las firmas están en data-model §2 y las reglas y mensajes en research R5.

Garantías a probar:

- Paridad con `dto/evento.js` campo por campo, incluidos los bordes:
  - precio `0` válido y `-1` inválido;
  - cupo `1` válido; `0`, `1.5` y `abc` inválidos;
  - fecha `31/02/2027` inválida;
  - fecha igual a `ahora` inválida.
- `quitarTipo` sobre un único tipo devuelve el borrador igual.
- `aCuerpoEvento`:
  - no incluye las URLs vacías;
  - aplica trim a los textos;
  - convierte la fecha local en ISO con `Z`.

### `src/eventos/misEventos.js` (NUEVO)

`separarMisEventos(eventos, organizadorId, ahora)` (data-model §3).

### `src/compras/gestionCompras.js` (NUEVO)

Exports: `PESTANAS_ORGANIZADOR`, `agruparPorEstado`, `accionesDisponibles`, `cuerpoAccion`, `mensajeErrorAccion`, `nombreComprador`, `resumenDisponibilidad` y `agruparComprasPorEvento` (data-model §4).

Garantías a probar:

- La matriz de `accionesDisponibles` tiene 5 estados por 2 fechas (SC-004).
- Las 5 compras de estados distintos caen en la pestaña correcta.
- Los niveles `casi` y `agotado` se marcan en sus bordes: 89%, 90% y 100%.

### `src/navegacion/reglas.js` (MOD, aditivo)

Se suman `hrefComprasEvento` y el segundo parámetro de `hrefCompra`, la rama `COMPRAS_EVENTO` y la rama ORGANIZADOR → permitir en `DETALLE_COMPRA` (pantallas.md › Rutas y acceso).

---

## Hooks (`src/hooks/`)

| Hook | Servicios | Contrato |
|------|-----------|----------|
| `useMisEventos()` (NUEVO) | `listarEventos` | data-model §5; aplica `separarMisEventos` con `useAuth().usuario.id` |
| `useCrearEvento()` (NUEVO) | `crearEvento` | Una ref síncrona impide dos peticiones; `publicar` resuelve `{ ok, evento \| error }`; no actualiza estado si se desmontó |
| `useCrearCategoria()` (NUEVO) | `crearCategoria` | Igual que `useCrearEvento` |
| `useCategorias()` (MOD) | `listarCategorias` | Suma `agregar(categoria)` (al final, sin duplicar por `id`) y `recargar()`; `categorias` no cambia de forma |
| `useComprasEvento(idEvento)` (NUEVO) | `obtenerComprasEvento` | Descarta respuestas viejas por número de secuencia; `recargar` devuelve una promesa; con `idEvento` vacío no pide nada y queda en `{ datos: null, cargando: false, error: null }` |
| `useAccionCompra({ alTerminar })` (NUEVO) | `confirmarCompra`, `reembolsarCompra`, `cancelarCompra` | `ejecutar(accion, compra)`; ignora llamadas con una en curso; `enCurso` = `{ accion, idCompra } \| null`; `alTerminar({ ok, accion, compra, error })` |
| `useComprasOrganizador()` (NUEVO) | `listarEventos`, `obtenerComprasEvento` × N | `Promise.allSettled`; devuelve `agruparComprasPorEvento` |

---

## Componentes presentacionales (`src/components/`)

### `Select` (NUEVO), doc `design-system/docs/componentes/Select.md`

| Prop | Tipo | Notas |
|------|------|-------|
| `label` | string | Siempre visible |
| `valor` | string \| null | Clave elegida |
| `opciones` | `{ clave, etiqueta }[]` | |
| `placeholder` | string | Texto con `valor` nulo |
| `error` | string | Igual que en `TextField` |
| `required` | boolean | Sin él, el label muestra "(opcional)" |
| `abierto` | boolean | Lo controla el padre |
| `alAbrir`, `alCerrar` | `() → void` | |
| `alElegir` | `(clave) → void` | |
| `pie` | ReactNode | Contenido fijo al final del sheet (ej. "+ Crear categoría") |
| `children` | ReactNode | Si se pasa, reemplaza la lista dentro del sheet (formulario de alta) |

Accesibilidad:

- El campo usa `accessibilityRole="button"`, con la etiqueta "Categoría, <valor o sin elegir>" y el error como `accessibilityHint`.
- Cada opción usa `accessibilityRole="radio"` y `accessibilityState={{ checked }}`.

### `TicketTypeForm` (NUEVO), doc `TicketTypeForm.md`

| Prop | Tipo | Notas |
|------|------|-------|
| `numero` | number | "Tipo de entrada N" |
| `tipo` | `TipoEntradaBorrador` | |
| `errores` | `{ nombre?, descripcion?, precio?, cupo? }` | |
| `quitable` | boolean | Muestra la papelera (`IconButton` con la etiqueta "Quitar tipo de entrada N") |
| `alCambiar` | `(campo, valor) → void` | |
| `alPerderFoco` | `(campo) → void` | |
| `alQuitar` | `() → void` | La confirmación con datos la decide el padre |

Campos:

- "Nombre", con el placeholder General, Platea o VIP según el número.
- "Descripción".
- "Precio", con prefijo `$`, `decimal-pad` y la ayuda "0 = gratis".
- "Cupo", con `number-pad` y sufijo "entradas".

### `AgregarTipoEntrada` (NUEVO)

Botón de ancho completo con borde punteado, ícono `Plus` y el texto "Agregar tipo de entrada". Props: `alPresionar` y `disabled`.

### `AvailabilitySummary` (NUEVO), doc `AvailabilitySummary.md`

| Prop | Tipo |
|------|------|
| `resumen` | `ResumenDisponibilidad` (data-model §4) |

Muestra el encabezado "Vendidas 12 de 300 (4%)" y, por tipo, nombre, `formatPrice(precio)`, "vendidas / cupo", la barra y `textoRestantes`.

Colores por nivel:

- `normal`: `primary`.
- `casi`: `secondary`, con `secondary-text` en el texto.
- `agotado`: `status-used`.

Accesibilidad:

- Cada barra usa `accessibilityRole="progressbar"` y `accessibilityValue={{ min: 0, max: cupo, now: vendidas }}`, con la etiqueta "Platea: 12 de 100 vendidas, quedan 88".
- El porcentaje nunca es la única información.

### `OrganizerPurchaseRow` (NUEVO), doc `OrganizerPurchaseRow.md`

| Prop | Tipo | Notas |
|------|------|-------|
| `compra` | Compra del organizador | |
| `acciones` | `AccionCompra[]` | `[]` o ausente: sin botones (Mensajes y estados terminales) |
| `enCurso` | `AccionCompra \| null` | Acción de esta fila en curso (spinner) |
| `deshabilitada` | boolean | Hay otra acción en curso en la pantalla |
| `alPresionar` | `() → void` | Abre el detalle |
| `alAccion` | `(accion) → void` | |

Muestra `Avatar` 40, `nombreComprador`, "2 × Platea · $ 64.000", `StatusBadge` `sm` y botones `sm` ("Confirmar" `primary`; "Reembolsar" y "Cancelar" `secondary`). Las acciones son hermanas del área táctil de la fila (no anidadas), para no disparar el detalle. La altura mínima es 72 y lleva un divisor `border`.

---

## Componentes compuestos

### `src/eventos/SelectorCategoria.jsx` (NUEVO)

- **Props**: `valor`, `error`, `alElegir(id)` y `alPerderFoco()`.
- **Usa**: `useCategorias`, `useCrearCategoria`, `useToast`, `Select` y `TextField`.
- **Estados internos**: `abierto` y `modo` (`'lista' | 'alta'`, más el borrador de la categoría y el error del servidor).
- **Flujo**: research R8 y pantallas.md › Selector de categoría.

### `src/compras/ConfirmarAccionCompra.jsx` (NUEVO)

- **Props**: `pedido` (`{ accion, compra } | null`; `null` cierra el diálogo), `cargando`, `alConfirmar()` y `alCerrar()`.
- **Muestra**: `Modal` `destructivo` con el título "¿Reembolsar esta compra?" o "¿Cancelar esta compra?", `cuerpoAccion` y las etiquetas exactas de data-model §4.
- **Alcance**: solo se usa con `reembolsar` y `cancelar`.

---

## Pantallas

Las pantallas se describen en [pantallas.md](./pantallas.md):

- `organizador/eventos.jsx`, `organizador/crear.jsx` y `organizador/mensajes.jsx` (MOD; reemplazan a `PantallaProvisoria`).
- `evento/[idEvento]/compras.jsx` (NUEVO).
- `compra/[idCompra].jsx` (MOD, variante del organizador).
