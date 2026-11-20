# Research: Navegación por rol y sesión

**Feature**: `003-navegacion-sesion` | **Fecha**: 2026-11-20

No quedaron `NEEDS CLARIFICATION` en el Technical Context. Cada decisión se verificó contra el código actual (`frontend/src`) y la API instalada de `expo-router` 58.0.32 (`node_modules/expo-router/build`).

---

## R1. Estructura de rutas

- **Decision**: `src/app/(auth)/{login,registro}`, `src/app/(comprador)/{explorar,buscar,favoritos,compras,perfil}` (Tabs) y `src/app/organizador/{eventos,crear,mensajes,perfil}` (Tabs, segmento real). `src/app/index.jsx` queda como `<Redirect>`. El detalle público se reserva en `src/app/evento/[idEvento].jsx` (placeholder; lo completa 005).
- **Rationale**: los grupos `(…)` no agregan segmento, así `/login`, `/registro`, `/explorar`… se mantienen cortas y los enlaces actuales a `/login` y `/registro` siguen andando. El organizador usa un segmento real (`/organizador/perfil`) porque dos grupos con `perfil.jsx` resolverían ambos a `/perfil` (ruta duplicada). El detalle va fuera de los Tabs para apilarse sobre ellos en el Stack raíz y ser alcanzable por visitante, comprador y organizador.
- **Alternatives considered**: (a) los tres como grupos y perfil del organizador con otro nombre (`perfil-organizador`) — URL inconsistente; (b) `comprador/` también como segmento real — alarga URLs públicas (`/comprador/explorar`) sin beneficio; (c) un único Tabs que cambia ítems según el rol — mezcla rutas de ambos roles en un navegador (el doc de BottomNav prohíbe mezclar ítems) y complica las guardias.

## R2. Guardias: reglas puras + `<Redirect>` en cada layout de área

- **Decision**: un módulo puro `src/navegacion/reglas.js` con `decidirAcceso({ usuario, ruta })` → `{ tipo: 'permitir' } | { tipo: 'redirigir', href }`. Cada `_layout.jsx` de área llama a la regla con `usePathname()` y, si corresponde, devuelve `<Redirect href={…} />`. El layout raíz no renderiza el Stack mientras `cargando` ([R5](#r5-estado-de-carga-al-restaurar-la-sesión)).
- **Rationale**: la matriz sesión × rol × ruta (SC-001) queda probada con pruebas unitarias simples, sin montar navegación; los layouts solo traducen la decisión. Cubre enlaces profundos (edge case) porque la guardia corre al montar el área, venga de donde venga la navegación.
- **Alternatives considered**: `Stack.Protected guard={…}` (disponible en 58.0.32) — redirige al *anchor* del navegador y no permite adjuntar `volverA`, que FR-004 necesita; además el comprador visitante debe ver parte del área (Explorar/Buscar), lo que `Protected` no modela por pantalla dentro de Tabs. Se descarta. Un `useEffect` con `router.replace` en el raíz — produce un frame de la pantalla equivocada y es más difícil de probar.

## R3. Retorno tras iniciar sesión (`volverA`)

- **Decision**: al pedir sesión se navega a `/login?volverA=<ruta>` (`hrefLogin(ruta)`). Login (y registro, que recibe el parámetro si el usuario va desde login) calcula el destino con `destinoTrasLogin(usuario, volverA)`: si `volverA` es una ruta interna (empieza con `/`, sin `//` ni esquema) y `decidirAcceso({ usuario, ruta: volverA })` la permite, va ahí; si no, a `rutaInicial(usuario)`. Se navega con `router.replace` (login no queda en el historial).
- **Rationale**: cumple FR-004 y US2-3 (un ORGANIZADOR que venía de una acción de comprador termina en su sección porque la regla rechaza la ruta). Reusar `decidirAcceso` evita una segunda lista de permisos. Validar que sea interna evita redirecciones abiertas desde enlaces profundos. Según Assumptions, solo se vuelve a la pantalla; la acción no se re-ejecuta.
- **Alternatives considered**: guardar la ruta pendiente en un contexto — se pierde con un enlace profundo directo a login y suma estado; `router.back()` tras login — no funciona si login fue la primera pantalla ni distingue el rol.

## R4. Visitante en pestañas protegidas

- **Decision**: en `(comprador)/_layout.jsx`, las pestañas Favoritos, Compras y Perfil declaran `listeners.tabPress`: si no hay sesión, `e.preventDefault()` y `router.push(hrefLogin('/compras'))` (la pestaña correspondiente). Además, la guardia de área ([R2](#r2-guardias-reglas-puras--redirect-en-cada-layout-de-área)) redirige con `replace` si se llega por enlace profundo.
- **Rationale**: con `push` el visitante que cancela login (back) vuelve a la pestaña donde estaba, en lugar de quedar en una pestaña vacía; con la guardia de área, ninguna ruta protegida se renderiza sin sesión. Las pestañas siguen visibles para el visitante (descubrimiento de funciones, US2).
- **Alternatives considered**: ocultar las pestañas protegidas al visitante — contradice el diseño (5 ítems fijos) y la prueba independiente de US2 ("tocar Compras lleva a login"); solo la guardia de área — el back desde login volvería a la ruta protegida y rebotaría.

## R5. Estado de carga al restaurar la sesión

- **Decision**: el layout raíz, mientras `useAuth().cargando` sea `true`, renderiza `<PantallaCarga />` (fondo `bg`, logotipo "Al Ticket It" y `accessibilityLabel="Cargando sesión"`) en lugar del Stack. Las fuentes siguen cargándose antes (el raíz devuelve `null` hasta tenerlas, como hoy).
- **Rationale**: si no se monta ninguna ruta hasta conocer la sesión, ninguna guardia decide con datos incompletos y no hay parpadeo de login (US1-3). `SecureStore` responde en milisegundos, por eso basta una vista de marca estática.
- **Alternatives considered**: `expo-splash-screen` (`preventAutoHideAsync`) — dependencia nueva para el mismo efecto (YAGNI); spinner a pantalla completa — el doc de Skeleton desaconseja spinners a pantalla completa.

## R6. Aviso de sesión expirada inyectado en `AuthProvider`

- **Decision**: `AuthProvider` acepta la prop opcional `alExpirar?: () => void`, que llama después de limpiar la sesión cuando el cliente HTTP avisa la expiración (rama `alExpirar` ya registrada con `configurarSesion`). El layout raíz monta `ToastProvider` por fuera y pasa `alExpirar={() => mostrar({ tono: 'warning', titulo: 'Tu sesión expiró', mensaje: 'Iniciá sesión de nuevo para continuar.' })}`. La redirección la hacen las guardias al quedar `usuario = null`.
- **Rationale**: FR-006 y US3-3 sin acoplar la sesión a la UI (inyección de dependencias, como `configurarSesion` en 001). Si el usuario estaba en una pestaña pública queda ahí como visitante; si estaba en una protegida, la guardia lo lleva a login con `volverA`.
- **Alternatives considered**: que `AuthProvider` use `useToast` — invierte la dependencia (sesión → UI); exponer un flag `sesionExpirada` en el contexto — obliga a un componente observador y a "consumir" el flag.

## R7. Perfil: datos del servidor con respaldo de la sesión

- **Decision**: `usePerfil()` llama a `usuarioService.obtenerPerfil()` al montar la pantalla y devuelve `{ perfil, cargando, error, recargar }`. Mientras carga se muestra `Skeleton` con la forma de las filas; con éxito, los datos del servidor. Errores: `status 0` → se muestran los datos de `usuario` de la sesión y un toast `warning` "No pudimos actualizar tu perfil" con acción "Reintentar"; `404` → `cerrarSesion()` + toast `info` "Tu cuenta ya no existe"; `401` → lo resuelve el cliente/expiración ([R6](#r6-aviso-de-sesión-expirada-inyectado-en-authprovider)); otro → datos de la sesión + toast `error`. El rol se muestra con su etiqueta legible ("Comprador"/"Organizador"). "Cerrar sesión" llama a `cerrarSesion()` y `router.replace('/explorar')`.
- **Rationale**: cubre US3-1, los dos edge cases de perfil y US3-2 (volver a Explorar sin cuenta). Una sola pantalla `PantallaPerfil` sirve a ambos roles; las rutas de cada área solo la montan.
- **Alternatives considered**: actualizar la sesión guardada con el perfil nuevo — no lo pide la spec (YAGNI); pedir confirmación con Modal antes de cerrar sesión — no es destructivo ni irreversible (el doc reserva Modal para eso).

## R8. Toast: provider propio sin librería

- **Decision**: `ToastProvider` mantiene una cola y muestra **un** aviso por vez sobre la BottomNav (`bottom = insets.bottom + sizes.bottomNavHeight + spacing[2]`), con entrada `duration.base`; se oculta solo a los 4 s (6 s si tiene acción) o al tocar la acción. `useToast()` devuelve `{ mostrar(aviso), ocultar() }`. `Toast` es presentacional: ícono por tono, título de una línea, mensaje opcional, acción `ghost`; `accessibilityRole="alert"` para `error` y `accessibilityLiveRegion="polite"` + `AccessibilityInfo.announceForAccessibility` para el resto.
- **Rationale**: lo que pide el doc de Toast es acotado; una librería agregaría API y dependencia nativa sin necesidad. Los temporizadores se prueban con `jest.useFakeTimers()`.
- **Alternatives considered**: `react-native-toast-message` u otra — dependencia nueva (YAGNI); varios toasts apilados — el doc no lo pide.

## R9. Modal sobre `Modal` de React Native

- **Decision**: `Modal` usa el `Modal` nativo de RN (`transparent`, `animationType="fade"`, fondo `scrimModal`), con `onRequestClose = onCancelar` (back de Android = cancelar), contenedor con `accessibilityViewIsModal` y `accessibilityRole` de diálogo, título como encabezado, cuerpo, botón de confirmación (`destructive` si corresponde, `loading`) y botón secundario `secondary` ("Volver" por defecto).
- **Rationale**: cubre US4-1 y el doc de Modal con APIs incluidas en RN (sin dependencias); el `Modal` nativo maneja el foco del lector de pantalla en iOS/Android.
- **Alternatives considered**: ruta modal de Expo Router (`presentation: 'modal'`) — sirve para pantallas, no para un diálogo de confirmación con callbacks; vista absoluta propia — no captura el back de Android ni aísla el foco.

## R10. Skeleton: `Animated` nativo y "reducir movimiento"

- **Decision**: `Skeleton` es un bloque (`width`, `height`, `radius`) con fondo `surfaceRaised` que pulsa la opacidad entre `opacity.skeletonMin` y 1 en un ciclo `duration.skeleton` (`Animated.loop`, `useNativeDriver`). Lee `AccessibilityInfo.isReduceMotionEnabled()` y su evento `reduceMotionChanged`; con reducir movimiento, sin animación. Es decorativo (`accessible={false}`); el contenedor que lo usa anuncia "Cargando…".
- **Rationale**: tokens ya presentes en `theme.js`; sin dependencias. `EventCardSkeleton` (variantes feature/compact) se compone en 004, que es quien tiene `EventCard`.
- **Alternatives considered**: `react-native-reanimated` o shimmer con gradiente — dependencias o complejidad extra para el mismo resultado.

## R11. Estrategia de pruebas

- **Decision**:
  - `reglas.js`: pruebas unitarias de la matriz completa visitante/COMPRADOR/ORGANIZADOR × cada ruta, `rutaInicial`, `destinoTrasLogin`/`destinoTrasRegistro` (incluye `volverA` externo, inválido o de otro rol).
  - Navegación integrada: `renderRouter` de `expo-router/testing-library` con los layouts reales y `AuthContext` simulado (sesión de cada rol, visitante, `cargando`), verificando con `screen` la ruta (`toHavePathname`) y la BottomNav visible (SC-001, SC-003, US1-4, US2).
  - Componentes: render + interacción + accesibilidad (roles, labels) con `ThemeProvider` en dark y light.
  - `ToastProvider`: `jest.useFakeTimers()` para 4 s / 6 s y la cola.
  - Perfil: `usuarioService` simulado (éxito, 0, 404) y `useAuth` simulado.
  - Login/registro: se actualizan la ruta de import (`src/app/(auth)/…`) y el destino esperado; el resto de los casos queda igual (SC-004).
- **Rationale**: misma herramienta que 001 (sin dependencias de pruebas nuevas; `expo-router/testing-library` ya viene con expo-router). Las reglas puras cargan el peso combinatorio; `renderRouter` verifica el cableado.
- **Alternatives considered**: solo pruebas de componentes con `expo-router` simulado (como las de login actuales) — no verifican que los layouts realmente redirijan; pruebas E2E (Detox/Maestro) — fuera del stack.

## R12. Destinos tras login y registro

- **Decision**: `rutaInicial(COMPRADOR) = '/explorar'`, `rutaInicial(ORGANIZADOR) = '/organizador/eventos'`, `rutaInicial(null) = '/explorar'` (visitante). Login → `destinoTrasLogin(usuario, volverA)`. Registro → `destinoTrasRegistro(usuario, volverA)`: igual que login para COMPRADOR; ORGANIZADOR → `volverA` válido o, si no hay, `'/organizador/crear'` (ScreenRegistro: "organizador → Crear evento"). "Explorar eventos sin cuenta" → `router.replace('/explorar')`. El link "Creá una cuenta" propaga `volverA`.
- **Rationale**: US1-1/US1-2 piden Explorar / Mis eventos al abrir con sesión; el doc de registro pide Crear evento para un organizador nuevo (no tiene eventos que ver). Visitante sin sesión abre la app en Explorar (CU-03 no requiere sesión; SC-002 se cumple igual desde login).
- **Alternatives considered**: abrir la app sin sesión en login — obliga a un toque extra para explorar; organizador → Crear también en login — un organizador con eventos espera ver los suyos (US1-2).

## R13. Observabilidad en el frontend

- **Decision**: no se agrega logging en el cliente.
- **Rationale**: igual que 001 R10: el logging estructurado que exige el principio 5 es el de la capa de servicios del backend (con `requestId`), que esta feature no toca; los errores relevantes para el usuario se comunican con Toast.
- **Alternatives considered**: un logger de navegación — sin consumidor ni destino (YAGNI).
