# Contrato de módulos, hooks y componentes

**Feature**: 005-detalle-evento-compra | **Plan**: [../plan.md](../plan.md) | **Modelo**: [../data-model.md](../data-model.md)

Reglas comunes: cada archivo lleva docstring `@file` / `@owner` / `@license`; cada export, JSDoc con `@param` tipado, `@returns` y `@throws` si aplica; props como `@typedef` + `@property` (verificado por `npm run lint`, `eslint-plugin-jsdoc`). Los componentes de `src/components/` son **presentacionales**: no importan servicios, hooks de datos ni contextos (salvo `useTheme`).

## Módulos puros

### `src/eventos/detalle.js`

| Export | Firma | Notas |
|--------|-------|-------|
| `aDetalle` | `(evento, { ahora? }) → DetalleEvento` | Extiende `aTarjeta`; no lanza |
| `aTipoEntradaVista` | `(tipo) → TipoEntradaVista` | `agotado = cupo <= 0` |
| `textoPrecioDesde` | `(tipos) → string` | "desde $ X" · "Gratis" · "desde $ 0" · `''` |
| `modoCta` | `(evento, usuario, ahora?) → ModoCta` | Prioridad del data-model §7 |
| `textoCta` | `(modo, precioDesdeTexto) → string` | "Comprar entradas · desde $ 25.000", "Evento finalizado", "Sin entradas a la venta" |

### `src/compras/checkout.js`

| Export | Firma |
|--------|-------|
| `seleccionInicial` | `(tipos: TipoEntradaVista[]) → { tipoId: string\|null, cantidad: 1 }` |
| `limitesCantidad` | `(tipo) → { min: 1, max: number }` |
| `ajustarCantidad` | `(cantidad, { min, max }) → number` |
| `totalEstimado` | `(tipo\|null, cantidad) → number` |
| `textoConfirmar` | `({ tipo, cantidad, finalizado }) → string` |
| `mensajeErrorCompra` | `(error: { status?, message? }) → { titulo: string, cuerpo: string, bloquea: boolean }` |

### `src/resenias/presentacion.js`

| Export | Firma |
|--------|-------|
| `recientes` | `(resenias, n = 2) → object[]` |
| `ordenRecientes` | `(resenias) → object[]` |
| `promedio` | `(resenias, puntajeServidor) → number\|null` |
| `aResenia` | `(resenia) → { id, autor, iniciales, puntuacion, detalle }` |

### `src/navegacion/reglas.js` (MOD, aditivo)

`hrefEvento(id)`, `hrefCheckout(id)` y la rama del checkout en `decidirAcceso` ([pantallas.md › Rutas](./pantallas.md#rutas)).

## Hooks (`src/hooks/`)

| Hook | Firma | Comportamiento |
|------|-------|----------------|
| `useEvento` | `(idEvento: string) → EstadoEvento` | Pide al montar y al cambiar el ID; descarta respuestas viejas o tras desmontar; `noEncontrado` con 404/400; nunca lanza |
| `useReseniasOrganizador` | `(idOrganizador?: string) → EstadoResenias` | No pide sin ID; mismo descarte; nunca lanza |
| `useCrearCompra` | `() → { confirmar, enviando, error, compra, limpiarError }` | `confirmar({ eventoId, tipoEntradaId, cantidad })` llama a `crearCompra` **solo si no hay otra en curso** (ref síncrona); devuelve la compra o `null`; guarda el `ApiError` en `error` |

## Componente de navegación

### `src/navegacion/RutaProtegida.jsx` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `children` | ReactNode | Se renderiza si `decidirAcceso` permite |

Lee `usuario` de `useAuth` y la ruta de `usePathname`; `<Redirect>` al montar, `router.replace` si cambia después (mismo patrón que `AreaConPestanas`).

## Componentes presentacionales (`src/components/`)

### `TicketTypeRow` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `nombre` | string | — |
| `descripcion` | string | Opcional |
| `precioTexto` | string | "Gratis" o "$ 25.000" |
| `agotado` | boolean | Tag "Agotado", precio tachado, "Sin cupo"; no seleccionable |
| `interactive` | boolean | `false` (detalle): solo informa. `true` (checkout): radio |
| `seleccionado` | boolean | Solo interactivo; borde `primary-text` |
| `alSeleccionar` | `() → void` | Solo interactivo |
| `deshabilitado` | boolean | Durante el envío |
| `children` | ReactNode | Contenido bajo la fila cuando está seleccionada (el `QuantityStepper`) |

### `QuantityStepper` (NUEVO)

| Prop | Tipo | Notas |
|------|------|-------|
| `valor` | number | — |
| `min` | number | "−" deshabilitado en `min` |
| `max` | number | "+" deshabilitado en `max`; hint "Máximo N" en `warning` |
| `alCambiar` | `(n: number) → void` | Nunca recibe valores fuera de `[min, max]` |
| `etiqueta` | string | `accessibilityLabel` del grupo ("Cantidad de Campo general") |
| `deshabilitado` | boolean | Ambos botones |

Botones 44 × 44; "+" relleno `primary`; valor con `accessibilityLiveRegion="polite"`; sin entrada de texto.

### `ReviewCard` (NUEVO)

Props: `autor`, `iniciales`, `puntuacion` (1–5), `detalle`. Comentario con `numberOfLines={6}` y "Leer más"/"Leer menos" si se corta. Incluye `Avatar` (32) y `Rating variante="estrellas"` sin cantidad. Label accesible: "<autor>, <n> de 5 estrellas: <detalle>".

### `Avatar` (NUEVO)

Props: `nombre`, `iniciales`, `tamano` (32 | 40 | 64, por defecto 32). Color determinístico por hash del nombre (paleta del theme). `accessible={false}`.

### `Rating` (MOD, aditivo)

Nueva `variante="estrellas"`: 5 estrellas (`rating` / `rating-empty`, media estrella por redondeo a 0,5) + valor "4,6" + `cantidad` opcional "(12)". Nueva prop `cantidad?: number`. `compact` (por defecto) sin cambios. Label: "Puntaje 4,6 de 5, 12 reseñas".

### `ResumenCompra` (NUEVO)

Props: `lineas: { etiqueta: string, valor: string }[]`, `total: string`, `titulo?: string`. Borde troquelado del design system; total `price-lg`.

### `BarraAccion` (NUEVO)

Props: `children`. Barra fija inferior con fondo `surface`, borde superior y `paddingBottom` = safe area. Contiene el `Button` del CTA.

## Pruebas de unidad (resumen)

| Archivo | Cubre |
|---------|-------|
| `__tests__/eventos/detalle-test.js` | `aDetalle`, `textoPrecioDesde` (0, mixto, vacío), `modoCta` (5 modos y prioridad), `textoCta` |
| `__tests__/compras/checkout-test.js` | selección inicial (1 tipo / varios / agotados), límites y `ajustarCantidad` (SC-002), total, `textoConfirmar`, `mensajeErrorCompra` (409, 400, 403, 404, 0, otro) |
| `__tests__/resenias/presentacion-test.js` | `recientes`, `ordenRecientes`, `promedio` (servidor, respaldo, vacío), `aResenia` (comprador null) |
| `__tests__/hooks/{useEvento,useReseniasOrganizador,useCrearCompra}-test.jsx` | estados, descarte de respuestas viejas, `noEncontrado`, doble `confirmar` → 1 llamada |
| `__tests__/components/{TicketTypeRow,QuantityStepper,ReviewCard,Avatar,ResumenCompra,BarraAccion}-test.jsx`, `Rating-test.jsx` (MOD) | render, roles/estados accesibles, límites del stepper, agotado, "Leer más" |
| `__tests__/navegacion/RutaProtegida-test.jsx` | permitir, redirigir al montar, `replace` al cambiar la sesión |
| `__tests__/navegacion/reglas-test.js` (MOD) | `hrefEvento`, `hrefCheckout`, rama del checkout × 3 roles, `destinoTrasLogin` con `volverA` del checkout |
