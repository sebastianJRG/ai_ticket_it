# Data Model: Navegación por rol y sesión

**Feature**: `003-navegacion-sesion` | **Fecha**: 2026-11-20

Esta feature no agrega entidades de dominio ni cambia el backend. Modela el **estado de cliente** que decide qué pantalla se ve. Todo vive en `frontend/src`.

## EstadoSesion (derivado de `AuthContext`)

| Valor | Condición | Pantalla inicial (`rutaInicial`) |
|-------|-----------|----------------------------------|
| `restaurando` | `cargando === true` | `PantallaCarga` (no se monta ninguna ruta) |
| `visitante` | `cargando === false && usuario === null` | `/explorar` |
| `comprador` | `usuario.rol === 'COMPRADOR'` | `/explorar` |
| `organizador` | `usuario.rol === 'ORGANIZADOR'` | `/organizador/eventos` |

Transiciones:

```text
restaurando ──(SecureStore sin sesión)──▶ visitante
restaurando ──(SecureStore con sesión)──▶ comprador | organizador
visitante ──(login / registro)──▶ comprador | organizador
comprador | organizador ──(cerrar sesión | refresh fallido | perfil 404)──▶ visitante
```

No hay transición entre `comprador` y `organizador` sin pasar por `visitante` (cada usuario tiene un solo rol).

## Area

Agrupa rutas con la misma regla de acceso. Constantes en `src/navegacion/reglas.js`.

| Area | Rutas | Visitante | COMPRADOR | ORGANIZADOR |
|------|-------|-----------|-----------|-------------|
| `auth` | `/login`, `/registro` | permitir | → `rutaInicial` | → `rutaInicial` |
| `publica` | `/explorar`, `/buscar`, `/evento/[idEvento]` | permitir | permitir | `/explorar`, `/buscar` → `/organizador/eventos`; `/evento/[idEvento]` permitir |
| `comprador` | `/favoritos`, `/compras`, `/perfil` | → `hrefLogin(ruta)` | permitir | → `/organizador/eventos` |
| `organizador` | `/organizador/eventos`, `/organizador/crear`, `/organizador/mensajes`, `/organizador/perfil` | → `hrefLogin(ruta)` | → `/explorar` | permitir |

Ruta desconocida: la maneja el "not found" de Expo Router (sin regla propia).

Nota: `publica` significa "no requiere sesión", no "abierta a todos los roles". Explorar y Buscar son pantallas del comprador, así que el ORGANIZADOR se redirige a su sección; el detalle de evento sí queda abierto a los tres estados.

## TabDef

Ítem de la BottomNav (equivale a `NAV_BUYER`/`NAV_ORGANIZER` de `design-system/referencia-web`).

| Campo | Tipo | Regla |
|-------|------|-------|
| `clave` | `string` | Nombre de la ruta dentro del layout (`explorar`, `eventos`…); único por lista |
| `etiqueta` | `string` | Texto visible siempre (doc BottomNav) |
| `icono` | `string` | Nombre Lucide para `Icon` |
| `requiereSesion` | `boolean` | Si `true`, el visitante es enviado a login al tocarla ([R4](./research.md#r4-visitante-en-pestañas-protegidas)) |

- `TABS_COMPRADOR`: `explorar` Explorar `Compass` (no) · `buscar` Buscar `Search` (no) · `favoritos` Favoritos `Heart` (sí) · `compras` Compras `Ticket` (sí) · `perfil` Perfil `User` (sí).
- `TABS_ORGANIZADOR`: `eventos` Mis eventos `Calendar` · `crear` Crear `Plus` · `mensajes` Mensajes `MessageCircle` · `perfil` Perfil `User` (todas requieren sesión; la guardia de área ya lo garantiza).

## DecisionAcceso

Resultado de `decidirAcceso({ usuario, ruta })`.

| Campo | Tipo | Regla |
|-------|------|-------|
| `tipo` | `'permitir' \| 'redirigir'` | — |
| `href` | `string` | Solo si `tipo === 'redirigir'`; siempre ruta interna |

Validación de `volverA` (para `destinoTrasLogin`/`destinoTrasRegistro`): string que empieza con `/`, no con `//`, sin `:` antes del primer `/` y para el que `decidirAcceso` devuelve `permitir` con el usuario recién autenticado. Cualquier otro valor se ignora.

## Perfil (lectura, `GET /api/usuarios`)

| Campo | Tipo | Se muestra |
|-------|------|-----------|
| `id` | `string` | no |
| `nombre` | `string` | sí |
| `apellido` | `string` | sí |
| `nombreUsuario` | `string` | sí (con `@`) |
| `rol` | `'COMPRADOR' \| 'ORGANIZADOR'` | sí, como "Comprador" / "Organizador" |
| `permissions` | `string[]` | no |

Fuente: servidor; respaldo: `usuario` de la sesión cuando la petición falla sin respuesta (`status 0`) o con error no manejado. Estado de `usePerfil`: `{ perfil, cargando, error, recargar }`.

## Aviso (Toast)

| Campo | Tipo | Regla |
|-------|------|-------|
| `tono` | `'success' \| 'error' \| 'info' \| 'warning'` | Define ícono y colores |
| `titulo` | `string` | Obligatorio, una línea |
| `mensaje` | `string?` | Opcional, una línea |
| `accion` | `{ etiqueta: string, alPresionar: () => void }?` | Una palabra; extiende la duración a 6 s |

Estado de `ToastProvider`: `cola: Aviso[]`, `visible: Aviso | null`. Se muestra uno por vez en orden FIFO; duración 4 s (6 s con acción).

Avisos que emite esta feature:

| Situación | Tono | Título |
|-----------|------|--------|
| Sesión expirada (FR-006) | `warning` | Tu sesión expiró |
| Perfil sin conexión | `warning` | No pudimos actualizar tu perfil (acción "Reintentar") |
| Perfil 404 | `info` | Tu cuenta ya no existe |
| Perfil, otro error | `error` | mensaje del `ApiError` |
