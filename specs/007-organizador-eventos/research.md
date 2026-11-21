# Research: Eventos del organizador

**Feature**: `007-organizador-eventos` | **Fecha**: 2026-11-21 | **Plan**: [plan.md](./plan.md)

Todas las incógnitas del Technical Context quedan resueltas acá. **No hay dependencias nuevas ni cambios en `backend/`**: la API ya expone todo (`GET /api/eventos`, `POST /api/eventos`, `GET/POST /api/categorias`, `GET /api/eventos/:id/compras`, `PATCH /api/compras/:id/{confirmacion,reembolso,cancelacion}`) y los servicios de 001 ya la envuelven (`listarEventos`, `crearEvento`, `obtenerComprasEvento`, `listarCategorias`, `crearCategoria`, `confirmarCompra`, `reembolsarCompra`, `cancelarCompra`).

---

## R1. Rutas nuevas y acceso

- **Decision**:
  - Las pestañas `/organizador/eventos`, `/organizador/crear` y `/organizador/mensajes` reemplazan sus pantallas provisorias (003). Su acceso ya lo resuelve `AreaConPestanas` y no cambia.
  - **Compras de un evento**: ruta nueva **`/evento/[idEvento]/compras`** (`src/app/evento/[idEvento]/compras.jsx`), apilada sobre las pestañas igual que el checkout y envuelta en `RutaProtegida`. En `reglas.js` se agregan `hrefComprasEvento(idEvento)` y la rama `COMPRAS_EVENTO = /^\/evento\/([^/]+)\/compras$/`: visitante → `hrefLogin(ruta)`; ORGANIZADOR → permitir; COMPRADOR → `/evento/<id>` (como el checkout al revés). La regla tiene que ir **antes** de `DETALLE_EVENTO`.
  - **Detalle de compra para el organizador**: la rama `DETALLE_COMPRA` pasa a **permitir al ORGANIZADOR** (hoy lo redirige a `/organizador/eventos`; 006 lo dejó así a propósito para que 007/008 lo abran). `hrefCompra(idCompra, { eventoId })` suma el parámetro opcional `?evento=<id>`, que el organizador necesita porque la única ruta que le devuelve compras es la del evento (R9).
- **Rationale**: un archivo nuevo dentro de `organizador/` se convertiría en una pestaña más de `Tabs`, sin pila y fuera de la guardia de `AreaConPestanas` (esa guardia solo decide sobre las rutas de las pestañas). Colgar las compras del evento de `/evento/<id>/…` repite el patrón ya probado del checkout. Además deja la URL compartible y protegida por `RutaProtegida`.
- **Alternatives considered**: `organizador/eventos/[idEvento].jsx` con un Stack anidado en la pestaña (más layouts y la guardia hay que replicarla); un BottomSheet sobre Mis eventos (no admite pestañas por estado ni un enlace directo después de publicar).

## R2. Mis eventos: filtrado en el cliente

- **Decision**: hook **`useMisEventos()`** que reutiliza `listarEventos({ sortBy: 'fecha', order: 'asc' })` y filtra con `evento.organizador?.id === usuario.id` (el `usuario` sale de `useAuth()`). La función pura `separarMisEventos(eventos, organizadorId, ahora)` en `eventos/misEventos.js` devuelve `{ proximos, finalizados }`. Los próximos van por fecha ascendente (el más cercano primero) y los finalizados por fecha descendente (el más reciente primero). La pantalla los muestra en ese orden, con un subtítulo por sección: "Próximos" y "Finalizados". Recarga al **enfocar** la pestaña (así aparece el evento recién creado) y con el gesto de actualizar.
- **Rationale**: la spec asume que no hay una ruta propia. `GET /api/eventos` devuelve también los eventos ya ocurridos (el repositorio no filtra por fecha). Con pocos eventos alcanza una sola petición.
- **Alternatives considered**: agregar `GET /api/usuarios/:id/eventos` al backend (fuera de alcance); filtrar con `useEventos` (ese hook no recarga al enfocar ni conoce al usuario, y sumarle esa lógica mezcla dos responsabilidades).

## R3. Tarjeta de Mis eventos

- **Decision**: reutilizar **`EventCard` `compact`** sin favorito (el organizador no ve el corazón), con `alPresionar` → `router.push(hrefComprasEvento(id))`. La tarjeta ya muestra la fecha y el rótulo "Finalizado" (`aTarjeta` → `finalizado`), que cubren "fecha y estado (próximo/finalizado)" de US2-1.
  - **Vacío**: `EmptyState` con el título "Todavía no creaste eventos" y la acción "Crear evento" → `RUTAS.organizador.crear`.
  - **Error sin datos**: `EmptyState` con `mensajeError(error)` y "Reintentar".
  - **Carga**: `EsqueletosEventos`.
- **Rationale**: cero componentes nuevos para US2; el design system ya define la tarjeta.
- **Alternatives considered**: una fila propia con contadores de ventas (necesitaría N peticiones a `/compras` por evento; YAGNI).

## R4. Fecha y hora sin selector nativo

- **Decision**: dos `TextField` con `keyboardType="number-pad"`, **Fecha** (`DD/MM/AAAA`) y **Hora** (`HH:MM`, 24 h). Una función pura **`aFechaLocal(fecha, hora)`** en `eventos/formularioEvento.js` valida el formato y el calendario (por ejemplo, rechaza el 31/02) y arma un `Date` local (`new Date(a, m - 1, d, hh, mm)`). Al servidor se envía `toISOString()`, que es UTC con `Z` (spec › Edge Cases: "formato estándar con zona horaria"). Mientras se escribe se insertan solos `/` y `:` (`enmascararFecha`, `enmascararHora`, también puras). La validación "en el futuro" usa un `ahora` inyectable.
- **Rationale**: `@react-native-community/datetimepicker` no funciona en web (el proyecto apunta a Android, iOS y web) y sería una dependencia nueva. Además, su UI distinta en cada plataforma complica las pruebas con Testing Library. Dos campos de texto con máscara son accesibles, se pueden probar y funcionan igual en todas las plataformas.
- **Alternatives considered**: el datetimepicker con `<input type="datetime-local">` en web (dos implementaciones por plataforma); un único campo `DD/MM/AAAA HH:MM` (más errores al tipear y un mensaje menos preciso).

## R5. Validación del formulario igual a la del servidor

- **Decision**: módulo puro **`eventos/formularioEvento.js`** con un validador por campo, que devuelve el mensaje o `null`, y `validarFormulario(borrador, ahora)` → `{ valido, errores }`. Las reglas replican `backend/src/dto/evento.js`:

  | Campo | Regla (servidor) | Mensaje accionable (cliente) |
  |-------|------------------|------------------------------|
  | nombre | trim, mín. 1 | "Escribí el nombre del evento." |
  | descripción | trim, mín. 1 | "Contá de qué se trata el evento." |
  | categoría | ID no vacío (404 si no existe) | "Elegí una categoría o creá una nueva." |
  | fecha + hora | fecha válida y `> ahora` | "Usá el formato DD/MM/AAAA." / "Usá el formato HH:MM (24 h)." / "La fecha no existe." / "Elegí una fecha y hora futuras." |
  | tiposEntrada | arreglo con mín. 1 | garantizado por la UI (el único no se puede quitar) |
  | tipo.nombre | trim, mín. 1 | "Poné un nombre, por ejemplo General o VIP." |
  | tipo.descripción | trim, mín. 1 | "Describí qué incluye esta entrada." |
  | tipo.precio | número ≥ 0 | "Ingresá un precio (0 si es gratis)." / "El precio no puede ser negativo." / "Escribí el precio solo con números, sin puntos de miles (por ejemplo 1500 o 1500,50)." |
  | tipo.cupo | entero > 0 | "El cupo tiene que ser un número entero mayor a 0." |
  | multimedia | arreglo de textos (opcional) | ver R7 |

  El precio se escribe como texto. `aNumeroPrecio` acepta un signo `-` opcional, dígitos y, opcionalmente, un separador decimal (coma o punto) seguido de 1 o 2 dígitos (`1500`, `1500,50`, `1500.5`). Así, `1.500` (punto de miles, común en Argentina) devuelve `null` en lugar de 1,5, y el usuario ve el mensaje de formato. Lo mismo pasa con `1.500,00` y con más de 2 decimales. El cupo solo acepta dígitos. Se valida al **perder el foco** (solo ese campo, una vez tocado) y al **publicar** (todo; los campos con error quedan marcados y no se envía nada). `aCuerpoEvento(borrador)` arma el JSON exacto de `crearEvento`: hace trim, convierte números, arma la fecha ISO y quita las URLs vacías.
- **Rationale**: SC-002 (el 100% de los errores del servidor detectados antes de enviar) se prueba con pruebas puras tabla por tabla. Los mensajes siguen el tono de `validacion.js` (dicen cómo resolver el error).
- **Alternatives considered**: zod en el frontend (dependencia nueva); validar solo en el servidor (viola FR-002).

## R6. Tipos de entrada repetibles

- **Decision**: el borrador guarda `tiposEntrada: TipoEntradaBorrador[]` con una `clave` local estable (un contador, no el índice) para las `key` de React y los errores. Las funciones puras son `agregarTipo(borrador)`, `quitarTipo(borrador, clave)` (no hace nada si queda uno solo) y `actualizarTipo(borrador, clave, cambios)`. El componente presentacional **`TicketTypeForm`** muestra "Tipo de entrada N", los cuatro campos (precio con prefijo `$` y la ayuda "0 = gratis") y la papelera solo si `quitable`. Si el bloque ya tiene datos, la papelera pide confirmación con `Modal`: título "¿Quitar «VIP»?" (o "¿Quitar este tipo de entrada?" si no tiene nombre), cuerpo "Se borran los datos cargados de este tipo de entrada." y botones "Sí, quitar" y "Volver". Si el bloque está vacío, se quita sin diálogo. Debajo del último bloque va **`AgregarTipoEntrada`** (botón con borde punteado). Los nombres sugeridos para un tipo nuevo vacío son General, Platea y VIP (placeholder).
- **Rationale**: US1-1 (agregar un tercero, quitar el segundo, mínimo 1) se cubre con pruebas puras. La clave estable evita que los errores "salten" de bloque al quitar uno del medio.
- **Alternatives considered**: usar el índice como clave (los errores y el foco se desplazan al quitar).

## R7. Multimedia por URL

- **Decision**: una lista de campos "URL de imagen", con "Agregar imagen" (máximo 5) y una papelera por campo. El primero es la **portada** y se previsualiza con `expo-image` (ya está instalado) cuando la URL es válida; si la imagen no carga, se muestra `ArteCategoria`. Validación del cliente: los campos vacíos se ignoran y los no vacíos tienen que empezar con `http://` o `https://` ("Pegá una dirección que empiece con https://"). Es la única regla **más estricta** que el servidor (que acepta cualquier texto) y es deliberada: una URL que no es web nunca se mostraría.
- **Rationale**: la spec deja afuera la subida de archivos. La tarjeta ya usa `multimedia[0]` como imagen.
- **Alternatives considered**: `expo-image-picker` (subir archivos queda fuera de alcance y el backend no guarda binarios).

## R8. Categoría con alta rápida (Select + BottomSheet)

- **Decision**: componente presentacional nuevo **`Select`** (doc `Select.md`), con el mismo alto y estilo que `TextField`. Al tocarlo abre un `BottomSheet` con las opciones. La opción elegida se muestra con `primary-soft` y check, y al final hay una fila fija "+ Crear categoría". Ese "Crear" lo resuelve el componente compuesto **`SelectorCategoria`** (`src/eventos/`): cambia el contenido del sheet a un mini formulario (nombre y descripción, ambos obligatorios, con las mismas reglas que `dto/categoria.js`). Al guardar llama a `crearCategoria` mediante el hook `useCrearCategoria` (una sola petición en curso). Si la respuesta es **201**, agrega la categoría a la lista local, la **selecciona**, cierra el sheet y muestra el toast "Categoría creada" (US1-4). Si hay **error**, el mensaje queda dentro del sheet y conserva lo escrito. `useCategorias` crece de forma aditiva y expone `agregar(categoria)` y `recargar()`, sin romper a sus consumidores de 004.
- **Rationale**: con 5 o más categorías, el doc pide un BottomSheet y no un dropdown. El alta inline evita perder el formulario del evento.
- **Alternatives considered**: navegar a una pantalla de categoría (se pierde el contexto); `Chip`s (el doc los reserva para filtros con 6 opciones o menos).

## R9. Detalle de compra para el organizador (acceso al chat)

- **Decision**: `/compra/[idCompra]` (006) pasa a ser compartido.
  - Para el **ORGANIZADOR**, la pantalla lee `?evento=<id>`, carga `obtenerComprasEvento(evento)` mediante `useComprasEvento` y busca la compra por ID.
  - Muestra: `ResumenCompra`, el comprador ("Comprador: Ana Pérez"), `StatusBadge` `sm`, `StatusTimeline` y `Tabs` `segmented` Detalle · Chat. La pestaña Chat sigue provisoria, igual que en 006, y la completa 008.
  - Si falta `?evento`, no se hace ninguna petición (`useComprasEvento` no pide nada con un ID vacío). Si falta `?evento` o la compra no aparece, muestra "No encontramos esta compra" con la acción "Ver mis eventos".
  - El detalle del organizador **no** tiene acciones de estado: viven solo en las compras del evento (R11), para que la regla esté en un solo lugar.
  - La variante del COMPRADOR no cambia.
  - Las filas de compras (R10, R12) navegan con `router.push(hrefCompra(id, { eventoId }))`.
- **Rationale**: FR-007 y US5 piden que Mensajes abra el chat. 008 espera un único contenedor de detalle compartido por los dos roles. No existe `GET /api/compras/:id`.
- **Alternatives considered**: una ruta aparte `/organizador/compra/[id]` (008 tendría que duplicar el chat); pasar la compra serializada por parámetros (se pierde al recargar en web y queda vieja).

## R10. Compras del evento: disponibilidad y pestañas

- **Decision**: hook **`useComprasEvento(idEvento)`** sobre `obtenerComprasEvento`. Descarta respuestas viejas, recarga al enfocar y con el gesto, y expone `{ datos: { compras, disponibilidad } | null, cargando, error, recargar }`. Para el encabezado (nombre y fecha del evento, y saber si ya ocurrió) se usa además **`useEvento(idEvento)`** (público, de 005). Son 2 peticiones en paralelo. Si `useEvento` falla, se usa como respaldo el nombre y la fecha de `compras[0].evento`.

  Módulo puro **`compras/gestionCompras.js`**:
  - `PESTANAS_ORGANIZADOR`: `pendientes` (PENDIENTE), `confirmadas` (CONFIRMADA), `utilizadas` (UTILIZADA) y `canceladas` (CANCELADA, REEMBOLSADA). Son 4 pestañas, el máximo visible de `Tabs`; el `StatusBadge` distingue Cancelada de Reembolsada. `agruparPorEstado(compras)` devuelve listas con la más reciente primero, y los contadores son el largo de cada lista. La pestaña inicial es Pendientes: es lo que el organizador tiene que resolver.
  - `resumenDisponibilidad(disponibilidad)` devuelve `{ totalVendidas, totalCupo, porcentaje, tipos: [{ …, porcentaje, nivel: 'normal'|'casi'|'agotado', textoRestantes }] }`. Los niveles son: `casi` con ≥ 90%, `agotado` con `disponibles === 0`, y `textoRestantes` "Quedan N" o "Agotado". **Los números son siempre los del servidor**: el cliente no recalcula vendidas (SC-003).

  Componente presentacional **`AvailabilitySummary`** (doc `AvailabilitySummary.md`): encabezado "Vendidas 12 de 300 (4%)" y, por tipo, nombre, precio (`formatPrice`), "vendidas / cupo", la barra (`accessibilityRole="progressbar"`, `accessibilityValue={{ min: 0, max: cupo, now: vendidas }}`) y "Quedan N".

  **403** → `EmptyState` "No tenés acceso a este evento" (US3-3), con la acción "Ver mis eventos". **404** → "Este evento no existe". **0 u otro** → `mensajeError` con "Reintentar".
- **Rationale**: CU-02 y FR-005. La disponibilidad del servidor ya descuenta PENDIENTE, CONFIRMADA y UTILIZADA.
- **Alternatives considered**: una pestaña "Todas" (serían 5 pestañas, más de las 4 visibles); calcular la disponibilidad en el cliente (puede no coincidir con el servidor).

## R11. Acciones de estado sobre una compra

- **Decision**: función pura **`accionesDisponibles(compra, fechaEvento, ahora = new Date())`**:
  - Si el evento ya ocurrió (`new Date(fechaEvento) <= ahora`), o la fecha es inválida o desconocida → `[]`.
  - PENDIENTE → `['confirmar', 'cancelar']`.
  - CONFIRMADA → `['reembolsar', 'cancelar']`.
  - Cualquier otro estado → `[]`.

  Replica la tabla del principio 4 y los 400 por "evento ya ocurrido" de las tres rutas, así que SC-004 se cumple con una prueba pura sobre 5 estados por 2 fechas.

  Hook **`useAccionCompra({ alTerminar })`** generaliza el patrón de `useCancelarCompra`: `ejecutar(accion, compra)` llama a `confirmarCompra`, `reembolsarCompra` o `cancelarCompra`, con **una sola petición en curso para toda la pantalla** (una ref síncrona), y expone `enCurso: { accion, idCompra } | null` para el spinner de la fila. `useCancelarCompra` (006) no se toca.

  Componente **`OrganizerPurchaseRow`** (doc `OrganizerPurchaseRow.md`): `Avatar` 40, nombre y apellido del comprador, "2 × Platea · $ 64.000" y `StatusBadge` `sm`. Sin antigüedad relativa (el DTO no trae fecha de creación) y sin la pill de no leídos (spec › Assumptions). Debajo van los botones de `acciones` en tamaño `sm` (Confirmar `primary`; Reembolsar y Cancelar `secondary`). Tocar la fila (fuera de los botones) abre `hrefCompra(id, { eventoId })`.

  Flujo:
  - **Confirmar** → se ejecuta directo, sin diálogo (no es destructivo; US4-4 solo pide diálogo para reembolsar y cancelar).
  - **Reembolsar** o **Cancelar** → abren `Modal` `destructivo` con el impacto concreto (`cuerpoAccion`: reembolsar → "Vas a reembolsar 2 × Platea a Ana Pérez por $ 64.000. No se puede deshacer."; cancelar → "Vas a cancelar 2 × Platea de Ana Pérez por $ 64.000. Se libera el cupo y no se puede deshacer."). La etiqueta exacta es "Sí, reembolsar" o "Sí, cancelar compra", la secundaria es "Volver" y se pasa `cargando` mientras se envía.
  - **200** → toast de éxito ("Compra confirmada", "Compra reembolsada", "Compra cancelada") y `recargar()` de `useComprasEvento`, que trae la lista, los contadores y la disponibilidad nuevos (US4-5, SC-003). **Sin actualización optimista.**
  - **Error** → toast con `mensajeErrorAccion(accion, error)` y `recargar()` (spec › Edge Cases):
    - 400 → "No se pudo <confirmar/reembolsar/cancelar> la compra" + mensaje del servidor.
    - 403 → "No podés gestionar esta compra".
    - 404 → "Esta compra ya no existe".
    - 0 → "Sin conexión".
    - Otro → mensaje genérico.
    - 401 lo maneja la capa de servicios de 001.
- **Rationale**: FR-006 y US4. Al recargar, el servidor es la única fuente de verdad para el estado y el cupo.
- **Alternatives considered**: actualización optimista (habría que recalcular la disponibilidad en el cliente y revertirla si falla); pedir confirmación también para Confirmar (un paso más sin riesgo: se puede cancelar después); reutilizar `useCancelarCompra` con un parámetro (cambia una API que ya tiene consumidores).

## R12. Pestaña Mensajes

- **Decision**: hook **`useComprasOrganizador()`** que reutiliza `useMisEventos` (los eventos propios) y pide `obtenerComprasEvento(id)` por cada uno, en paralelo y con `Promise.allSettled`. La función pura `agruparComprasPorEvento(eventos, resultados)` devuelve secciones `[{ evento: { id, nombre, fecha }, compras }]` que siguen el orden de Mis eventos (próximos y luego finalizados) y omiten los eventos sin compras. Si alguna petición falla, se muestran las secciones que sí respondieron y un aviso "No pudimos cargar las compras de 1 evento" (o "de N eventos" si son varios) con "Reintentar". Si fallan todas, se muestra `EmptyState` de error.
  - **UI**: `SectionList` con el encabezado del evento (nombre y fecha corta) y filas `OrganizerPurchaseRow` **sin acciones** (comprador, tipo y estado, como pide US5-1). Tocar una fila abre `hrefCompra(id, { eventoId })`, cuya pestaña Chat completa 008.
  - **Vacío**: "Todavía no hay compras para conversar" (ícono `message`).
  - **Recarga**: al enfocar la pestaña y con el gesto.
- **Rationale**: la spec acepta N + 1 peticiones con pocos eventos. No hay bandeja en el backend.
- **Alternatives considered**: una bandeja en el backend (fuera de alcance); pedir los mensajes de cada compra para ordenarlas por actividad (N × M peticiones; los no leídos están fuera de alcance).

## R13. Publicar y doble toque

- **Decision**: hook **`useCrearEvento()`** con una ref síncrona (patrón de `useCrearCompra`): `publicar(cuerpo)` devuelve `{ ok, evento } | { ok, error }` e ignora una segunda llamada mientras hay otra en curso. El botón "Publicar evento" va en `BarraAccion` con `loading`. El flujo es:
  1. `validarFormulario` → si hay errores, se marcan y se hace scroll al primero; no se envía nada.
  2. `publicar(aCuerpoEvento(borrador))`.
  3. Si es **201**: toast "Evento publicado", reinicio del borrador y `router.push(hrefComprasEvento(evento.id))` (US1-3).
  4. Si es **400**: banner arriba del formulario con el mensaje del servidor ("Revisá los datos: <mensaje>"); **el borrador se conserva** (US1-5). **404** (categoría eliminada): "La categoría elegida ya no existe. Elegí otra." y `recargar()` de las categorías. **0**: "Sin conexión. Tus datos siguen acá.".

  "Borrador" no se ofrece (spec › Assumptions). El borrador vive en el estado de la pantalla (`useReducer` sobre las funciones puras de R5 y R6).
- **Rationale**: spec › Edge Cases (una sola petición) y FR-002 (conservar lo cargado).
- **Alternatives considered**: guardar el borrador en `localStorage` o SecureStore (persistencia nueva en el cliente; YAGNI).

## R14. Pruebas (TDD)

- **Decision**: el mismo andamiaje que 004–006: Jest 30, `jest-expo`, Testing Library y `renderRouter` de `expo-router/testing-library` para las pantallas. Los servicios se simulan con `jest.mock` y las promesas diferidas (`helpers/diferido.js`) prueban "en curso" y el doble toque. `ahora` se inyecta en toda la lógica pura. Orden de escritura:
  1. Módulos puros: `formularioEvento`, `misEventos`, `gestionCompras`.
  2. Componentes presentacionales: `Select`, `TicketTypeForm`, `AgregarTipoEntrada`, `AvailabilitySummary`, `OrganizerPurchaseRow`.
  3. Hooks: `useMisEventos`, `useCrearEvento`, `useCrearCategoria`, `useComprasEvento`, `useAccionCompra`, `useComprasOrganizador` y la extensión de `useCategorias`.
  4. `reglas-test.js`.
  5. Pantallas: mis-eventos, crear-evento, compras-evento, mensajes-organizador y la extensión de detalle-compra.

  Los helpers nuevos o extendidos son `helpers/eventosEjemplo.js` (`crearEventoDe(organizadorId, { fecha })`) y `helpers/comprasEjemplo.js` (`crearCompraOrganizador`, `DISPONIBILIDAD_EJEMPLO`). Las pruebas se escriben primero y el usuario las aprueba antes de implementar (constitución, principio 2).
- **Rationale**: es el principio 2 de la constitución y repite el patrón de las features anteriores.
