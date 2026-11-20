# Contrato: Componentes compartidos

**Feature**: `003-navegacion-sesion` | Fuente de diseño: `design-system/docs/componentes/*.md` y `design-system/referencia-web/index.jsx`. Todos leen colores, tipografías y tamaños de `useTheme()` (dark y light) y respetan `design-system/docs/accesibilidad.md` (áreas táctiles ≥ 44, íconos decorativos `accessible={false}`, `IconButton` con `label`).

## AppHeader — `src/components/AppHeader.jsx`

| Prop | Tipo | Default | Notas |
|------|------|---------|-------|
| `titulo` | `string` | — | En `transparent` no se muestra |
| `subtitulo` | `string?` | — | Contexto (p. ej. nombre del evento) |
| `variante` | `'default' \| 'large' \| 'transparent'` | `'default'` | `default`: 56 + safe area superior; `large`: raíz de tab con `displayLg`; `transparent`: sobre imagen, botones `onImage` |
| `alVolver` | `(() => void) \| false` | `false` | Botón "Volver" (`ChevronLeft`) solo si es función; no aplica a `large` |
| `acciones` | `{ icono, label, alPresionar }[]` | `[]` | Máximo 2 (las demás se ignoran; el menú "más" queda fuera de alcance) |

A11y: título con `accessibilityRole="header"`.

## BottomNav — `src/components/BottomNav.jsx`

| Prop | Tipo | Default | Notas |
|------|------|---------|-------|
| `items` | `TabDef[]` | — | `TABS_COMPRADOR` o `TABS_ORGANIZADOR`, nunca mezclados |
| `activo` | `string` | — | `clave` del ítem activo; pill `primary` |
| `dots` | `string[]` | `[]` | Claves con novedad (punto `secondary`); 003 no las alimenta |
| `alSeleccionar` | `(clave: string) => void` | — | — |

Alto `sizes.bottomNavHeight` + `insets.bottom`; etiquetas siempre visibles. Cada ítem: `accessibilityRole="tab"`, `accessibilityState={{ selected }}`, `accessibilityLabel` = etiqueta (+ ", novedades" con dot). Contenedor `accessibilityRole="tablist"`. Adaptador de `tabBar` en los layouts: traduce `BottomTabBarProps` (en expo-router 58: `state`, `emitter`, `navigateToTab`) a estas props, emitiendo `tabPress` para respetar los `listeners`.

## EmptyState — `src/components/EmptyState.jsx`

| Prop | Tipo | Default | Notas |
|------|------|---------|-------|
| `icono` | `'ticket' \| 'search' \| 'heart' \| 'message'` | `'ticket'` | Ícono dentro del ticket troquelado |
| `titulo` | `string` | — | Describe la situación |
| `cuerpo` | `string?` | — | Qué va a aparecer |
| `accion` | `{ etiqueta: string, alPresionar: () => void }?` | — | Botón `primary` |

## Skeleton — `src/components/Skeleton.jsx`

| Prop | Tipo | Default | Notas |
|------|------|---------|-------|
| `ancho` | `number \| string` | `'100%'` | — |
| `alto` | `number` | `16` | — |
| `radio` | `keyof theme.radius` | `'sm'` | — |
| `estilo` | `ViewStyle?` | — | Para componer formas |

Pulso de opacidad `opacity.skeletonMin`↔1 en `duration.skeleton`; sin animación con "reducir movimiento". Decorativo (`accessible={false}`).

## Toast — `src/components/Toast.jsx` (presentacional)

Props = `Aviso` ([data-model.md](../data-model.md#aviso-toast)) + `alCerrar?: () => void`. Ícono por tono (`CircleCheck` success, `CircleAlert` error/warning, `Info` info). `error` → `accessibilityRole="alert"`; el resto `accessibilityLiveRegion="polite"`.

## ToastProvider / useToast — `src/feedback/ToastContext.jsx`

```js
<ToastProvider>{children}</ToastProvider>
const { mostrar, ocultar } = useToast();
mostrar(aviso: Aviso): void   // encola; uno visible por vez
ocultar(): void               // oculta el visible y pasa al siguiente
```

- Duración 4 s, 6 s con `accion`; tocar la acción la ejecuta y oculta el aviso.
- Posición: sobre la BottomNav (`insets.bottom + sizes.bottomNavHeight + spacing[2]`).
- `useToast` fuera del provider lanza `Error('useToast debe usarse dentro de ToastProvider.')`.

## Modal — `src/components/Modal.jsx`

| Prop | Tipo | Default | Notas |
|------|------|---------|-------|
| `visible` | `boolean` | — | — |
| `titulo` | `string` | — | Como pregunta; `accessibilityRole="header"` |
| `cuerpo` | `string?` | — | Impacto concreto |
| `icono` | `string?` | — | Nombre Lucide |
| `etiquetaConfirmar` | `string` | `'Confirmar'` | Verbo exacto |
| `etiquetaCancelar` | `string` | `'Volver'` | Conserva |
| `destructivo` | `boolean` | `false` | Botón `destructive` |
| `cargando` | `boolean` | `false` | `loading` en confirmar; deshabilita cancelar |
| `alConfirmar` | `() => void` | — | — |
| `alCancelar` | `() => void` | — | También en back de Android (`onRequestClose`) |

Fondo `scrimModal`; contenedor con `accessibilityViewIsModal`.

## PantallaCarga — `src/components/PantallaCarga.jsx`

Sin props. Fondo `bg`, logotipo de texto, `accessibilityLabel="Cargando sesión"`.

## PantallaPerfil — `src/pantallas/PantallaPerfil.jsx`

Sin props (usa `useAuth`, `usePerfil`, `useToast`, `useRouter`). AppHeader `large` "Perfil"; filas Nombre, Apellido, Nombre de usuario (`@…`), Rol; Skeleton mientras carga, dentro de un contenedor con `testID="perfil-cargando"` y `accessibilityLabel="Cargando perfil"` (los Skeleton son decorativos); botón `secondary` "Cerrar sesión" → `cerrarSesion()` + `router.replace('/explorar')`. Manejo de errores según [research R7](../research.md#r7-perfil-datos-del-servidor-con-respaldo-de-la-sesión).

## usePerfil — `src/hooks/usePerfil.js`

```js
usePerfil(): { perfil: Perfil|null, cargando: boolean, error: ApiError|null, recargar: () => Promise<void> }
```

Carga al montar; ante `404` llama a `cerrarSesion()`; no lanza.
