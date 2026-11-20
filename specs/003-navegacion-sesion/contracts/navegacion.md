# Contrato: Navegación y acceso

**Feature**: `003-navegacion-sesion` | Consumidores: features 004–008 (enlazan a estas rutas y usan `hrefLogin` para acciones que requieren cuenta).

## Rutas

| URL | Archivo | Área | Pantalla | Completa |
|-----|---------|------|----------|----------|
| `/` | `app/index.jsx` | — | `<Redirect href={rutaInicial(usuario)} />` | 003 |
| `/login` | `app/(auth)/login.jsx` | auth | Login (param `volverA?`) | existente |
| `/registro` | `app/(auth)/registro.jsx` | auth | Registro (param `volverA?`) | existente |
| `/explorar` | `app/(comprador)/explorar.jsx` | publica | Explorar | 004 |
| `/buscar` | `app/(comprador)/buscar.jsx` | publica | Buscar | 004 |
| `/favoritos` | `app/(comprador)/favoritos.jsx` | comprador | Favoritos | 004 |
| `/compras` | `app/(comprador)/compras.jsx` | comprador | Mis compras | 006 |
| `/perfil` | `app/(comprador)/perfil.jsx` | comprador | `PantallaPerfil` | 003 |
| `/organizador/eventos` | `app/organizador/eventos.jsx` | organizador | Mis eventos | 007 |
| `/organizador/crear` | `app/organizador/crear.jsx` | organizador | Crear evento | 007 |
| `/organizador/mensajes` | `app/organizador/mensajes.jsx` | organizador | EmptyState provisorio | 007 |
| `/organizador/perfil` | `app/organizador/perfil.jsx` | organizador | `PantallaPerfil` | 003 |
| `/evento/[idEvento]` | `app/evento/[idEvento].jsx` | publica | Detalle de evento | 005 |

Las features siguientes **agregan** rutas dentro de estas áreas (p. ej. `/organizador/eventos/[idEvento]/compras` en 007, chat en 008) y deben registrar su área en `reglas.js` con su prueba.

## Matriz de acceso

Ver [data-model.md › Area](../data-model.md#area). Cualquier redirección hacia login lleva `volverA` con la ruta pedida.

## API de `src/navegacion/reglas.js` (pura, sin React)

```js
/** @typedef {{ rol: 'COMPRADOR'|'ORGANIZADOR' }|null} UsuarioSesion */

RUTAS                     // { explorar: '/explorar', …, organizador: { eventos: '/organizador/eventos', … } }
TABS_COMPRADOR            // TabDef[] (data-model.md)
TABS_ORGANIZADOR          // TabDef[]

rutaInicial(usuario: UsuarioSesion): string
decidirAcceso({ usuario: UsuarioSesion, ruta: string }): { tipo: 'permitir' } | { tipo: 'redirigir', href: string }
hrefLogin(volverA?: string): string                    // '/login' o '/login?volverA=%2Fcompras'
destinoTrasLogin(usuario: UsuarioSesion, volverA?: string): string
destinoTrasRegistro(usuario: UsuarioSesion, volverA?: string): string
```

Garantías:

- `decidirAcceso` nunca devuelve `redirigir` hacia la misma `ruta` (sin bucles).
- `destinoTrasLogin`/`destinoTrasRegistro` solo devuelven rutas internas permitidas para `usuario`; un `volverA` inválido, externo o de otra área cae en `rutaInicial` (registro de ORGANIZADOR: `/organizador/crear`).
- Ninguna función lanza; entradas `undefined`/vacías equivalen a "sin `volverA`".

## Comportamiento de los layouts

| Layout | Mientras restaura | Regla |
|--------|-------------------|-------|
| `app/_layout.jsx` | `PantallaCarga` (no monta rutas) | Providers: `SafeAreaProvider` → `ThemeProvider` → `ToastProvider` → `AuthProvider alExpirar={…}` → `Stack` (sin header) |
| `app/(auth)/_layout.jsx` | — | Con sesión → `<Redirect href={rutaInicial(usuario)} />` |
| `app/(comprador)/_layout.jsx` | — | `decidirAcceso` por ruta; `Tabs` con `tabBar` = `BottomNav` (`TABS_COMPRADOR`); `tabPress` en tabs con `requiereSesion` sin sesión → `router.push(hrefLogin(ruta))` |
| `app/organizador/_layout.jsx` | — | `decidirAcceso` por ruta; `Tabs` con `tabBar` = `BottomNav` (`TABS_ORGANIZADOR`) |

## Cambios en pantallas existentes

| Pantalla | Antes | Después |
|----------|-------|---------|
| Login, éxito | `router.replace('/')` | `router.replace(destinoTrasLogin(usuario, volverA))` |
| Login, "Explorar eventos sin cuenta" | `router.replace('/')` | `router.replace('/explorar')` |
| Login, "Creá una cuenta" | `router.push('/registro')` | `router.push({ pathname: '/registro', params: { volverA } })` (sin `volverA` si no hay) |
| Registro, éxito | `router.replace('/')` | `router.replace(destinoTrasRegistro(usuario, volverA))` |
| Index | Pantalla provisoria | `<Redirect>` |

Validaciones, mensajes de error y llamadas a servicios de login/registro no cambian (FR-008, SC-004).

## `AuthProvider` (aditivo)

```js
<AuthProvider alExpirar={() => void}>  // opcional; se llama una vez por expiración, después de limpiar la sesión
```

`useAuth()` conserva su forma: `{ usuario, accessToken, cargando, iniciarSesion, cerrarSesion }`.
