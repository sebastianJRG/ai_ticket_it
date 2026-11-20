---

description: "Lista de tareas: navegación por rol y sesión (Expo Router) y componentes compartidos"
---

# Tasks: Navegación por rol y sesión

**Input**: Documentos de diseño en `/specs/003-navegacion-sesion/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/navegacion.md](./contracts/navegacion.md), [contracts/componentes.md](./contracts/componentes.md), [quickstart.md](./quickstart.md)

**Tests**: OBLIGATORIOS. La constitución (principio 2) y FR-009 exigen TDD: escribir la prueba, **el usuario la aprueba**, correrla en rojo, implementar lo mínimo y refactorizar. Cada fase tiene una tarea de aprobación explícita (⛔ GATE): no se implementa nada de esa fase antes de la aprobación.

**Organization**: Tareas agrupadas por historia de usuario. Rutas relativas a la raíz del repo; los comandos de Jest se corren desde `frontend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede hacer en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3, US4)

## Convenciones para todas las tareas

- Cada archivo nuevo o modificado en `frontend/src/` lleva docstring de archivo (`@file`, `@owner Equipo Al Ticket It — frontend`, `@license MIT`) y JSDoc completo en cada export (`@param`, `@returns`, `@throws`; `@typedef` con `@property` para props y formas) (principio 6, FR-009).
- Colores, tipografías, tamaños y duraciones salen siempre de `useTheme()` (`frontend/src/theme/ThemeContext.jsx`); íconos con `frontend/src/components/Icon.jsx`; nada de `fontWeight` (design-system/docs/react-native.md).
- Las pruebas de componentes se renderizan dentro de `ThemeProvider` en `scheme="dark"` y `scheme="light"` con el helper de T003.
- Toda navegación usa Expo Router (`Redirect`, `useRouter`, `usePathname`, `useLocalSearchParams`, `Tabs`). Las reglas de acceso se toman **solo** de `frontend/src/navegacion/reglas.js`; ningún layout ni pantalla repite la matriz.
- Los textos visibles van en español rioplatense, como las pantallas existentes.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Soporte de pruebas de navegación (sin dependencias nuevas)

- [X] T001 Verificar que Jest resuelve `expo-router/testing-library` con una prueba mínima temporal en `frontend/__tests__/navegacion/humo-test.jsx` (`renderRouter({ index: () => <Text>hola</Text> })` y `expect(screen).toHavePathname('/')`); si falla por transformación, ajustar `transformIgnorePatterns`/`moduleNameMapper` de `frontend/package.json`. Borrar la prueba al terminar (research R11)
- [X] T002 [P] Crear el helper `frontend/__tests__/helpers/authFalso.js` con JSDoc: exporta `crearAuthFalso({ usuario = null, cargando = false } = {})`, que devuelve el objeto de `useAuth()` de [contracts/navegacion.md › AuthProvider](./contracts/navegacion.md#authprovider-aditivo) con `iniciarSesion` y `cerrarSesion` como `jest.fn()`, y constantes `COMPRADOR` y `ORGANIZADOR` (usuarios de ejemplo con `id`, `nombre`, `apellido`, `nombreUsuario`, `rol`) para usar con `jest.mock('../../src/auth/AuthContext', …)`
- [X] T003 [P] Crear el helper `frontend/__tests__/helpers/renderConTema.jsx` con JSDoc: exporta `renderConTema(ui, { scheme = 'dark' } = {})` que envuelve en `SafeAreaProvider` (con `initialMetrics` fijos) y `ThemeProvider scheme={scheme}` y delega en `render` de `@testing-library/react-native`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reglas de acceso puras, componentes que necesita la navegación (BottomNav, EmptyState, PantallaCarga) y el grupo `(auth)`

**⚠️ CRITICAL**: Ninguna historia empieza hasta completar esta fase

### Pruebas (escribir primero)

- [X] T004 [P] Escribir `frontend/__tests__/navegacion/reglas-test.js` según [contracts/navegacion.md › API de reglas.js](./contracts/navegacion.md#api-de-srcnavegacionreglasjs-pura-sin-react): `rutaInicial` para visitante, COMPRADOR y ORGANIZADOR ([data-model.md › EstadoSesion](./data-model.md#estadosesion-derivado-de-authcontext)); `decidirAcceso` para **cada** ruta de cada área de la matriz [data-model.md › Area](./data-model.md#area) × los tres estados (`/evento/abc123` como ejemplo del parámetro), verificando `DecisionAcceso.tipo` y `DecisionAcceso.href` ([data-model.md › DecisionAcceso](./data-model.md#decisionacceso)); que ninguna decisión redirige a la misma ruta; `hrefLogin()` → `'/login'` y `hrefLogin('/compras')` → `'/login?volverA=%2Fcompras'`; `destinoTrasLogin` y `destinoTrasRegistro` con `volverA` válido, ausente, vacío, de otra área, `'//evil.com'`, `'https://evil.com'` y `'compras'` (sin `/`) según la validación de `volverA` en [data-model.md › DecisionAcceso](./data-model.md#decisionacceso) y research R12 (registro de ORGANIZADOR sin `volverA` → `'/organizador/crear'`); `TABS_COMPRADOR` y `TABS_ORGANIZADOR` con las claves, etiquetas, íconos y `requiereSesion` de [data-model.md › TabDef](./data-model.md#tabdef) (`TabDef.clave` único por lista)
- [X] T005 [P] Escribir `frontend/__tests__/components/BottomNav-test.jsx` según [contracts/componentes.md › BottomNav](./contracts/componentes.md#bottomnav--srccomponentsbottomnavjsx): renderiza todas las etiquetas de `TABS_COMPRADOR` (5) y de `TABS_ORGANIZADOR` (4); contenedor `tablist`; cada ítem `tab` con `accessibilityState.selected` solo en `activo`; tocar un ítem llama `alSeleccionar(clave)`; un ítem en `dots` agrega ", novedades" a su label; respeta `insets.bottom` en el alto; en dark y light
- [X] T006 [P] Escribir `frontend/__tests__/components/EmptyState-test.jsx` según [contracts/componentes.md › EmptyState](./contracts/componentes.md#emptystate--srccomponentsemptystatejsx): muestra título y cuerpo; sin `accion` no hay botón; con `accion` muestra el botón y al tocarlo llama `alPresionar`; acepta los cuatro valores de `icono`; título con `accessibilityRole="header"`; en dark y light (cubre US4-2)
- [X] T007 [P] Escribir `frontend/__tests__/components/PantallaCarga-test.jsx` según [contracts/componentes.md › PantallaCarga](./contracts/componentes.md#pantallacarga--srccomponentspantallacargajsx): se encuentra por `accessibilityLabel` "Cargando sesión", muestra "Al Ticket It" y no muestra ningún campo de login
- [X] T008 ⛔ GATE: presentar T004–T007 al usuario y esperar su **aprobación**; luego correr `npx jest __tests__/navegacion/reglas-test.js __tests__/components/BottomNav-test.jsx __tests__/components/EmptyState-test.jsx __tests__/components/PantallaCarga-test.jsx` y confirmar que fallan (rojo)

### Implementación

- [X] T009 [P] Implementar `frontend/src/navegacion/reglas.js` (puro, sin importar React ni servicios): `RUTAS`; `TABS_COMPRADOR` y `TABS_ORGANIZADOR` con `TabDef.clave` (único por lista), `TabDef.etiqueta`, `TabDef.icono` y `TabDef.requiereSesion` según [data-model.md › TabDef](./data-model.md#tabdef); `rutaInicial` según [data-model.md › EstadoSesion](./data-model.md#estadosesion-derivado-de-authcontext); `decidirAcceso` con la matriz de [data-model.md › Area](./data-model.md#area) (normalizar la ruta: sin query ni barra final; `/evento/<id>` como área pública), que devuelve `DecisionAcceso.tipo` y, solo al redirigir, `DecisionAcceso.href` según [data-model.md › DecisionAcceso](./data-model.md#decisionacceso); `hrefLogin`; `destinoTrasLogin` y `destinoTrasRegistro` con la validación de `volverA` de [data-model.md › DecisionAcceso](./data-model.md#decisionacceso) (research R2, R3, R12). Ninguna función lanza
- [X] T010 [P] Implementar `frontend/src/components/BottomNav.jsx` según [contracts/componentes.md › BottomNav](./contracts/componentes.md#bottomnav--srccomponentsbottomnavjsx) y `design-system/docs/componentes/BottomNav.md` (pill `primary` en el activo, punto `secondary`, alto `sizes.bottomNavHeight` + `useSafeAreaInsets().bottom`, áreas táctiles ≥ `sizes.touchMin`, `Heart` relleno cuando Favoritos está activo como en `design-system/referencia-web/index.jsx`)
- [X] T011 [P] Implementar `frontend/src/components/EmptyState.jsx` según [contracts/componentes.md › EmptyState](./contracts/componentes.md#emptystate--srccomponentsemptystatejsx) y `design-system/docs/componentes/EmptyState.md` (ticket troquelado con el ícono `Ticket`/`Search`/`Heart`/`MessageCircle` según `icono`, acción con `Button` primary)
- [X] T012 [P] Implementar `frontend/src/components/PantallaCarga.jsx` (research R5): fondo `colors.bg`, "Al Ticket It" en `typography.displayLg` con `maxFontSizeMultiplier={1.4}`, contenedor `accessible` con `accessibilityLabel="Cargando sesión"`, sin spinner
- [X] T013 Crear la carpeta con `mkdir -p "frontend/src/app/(auth)"` y mover las pantallas de autenticación al grupo con `git mv frontend/src/app/login.jsx frontend/src/app/\(auth\)/login.jsx` y `git mv frontend/src/app/registro.jsx frontend/src/app/\(auth\)/registro.jsx`; ajustar sus imports relativos (`../../theme/…`, `../../auth/…`, etc.); crear `frontend/src/app/(auth)/_layout.jsx` con un `Stack` sin header (`headerShown: false`, fondo `colors.bg`); actualizar los imports de `frontend/__tests__/screens/login-test.jsx` y `frontend/__tests__/screens/registro-test.jsx` a `../../src/app/(auth)/…` (research R1). Sin cambiar comportamiento todavía
- [X] T014 Correr `npm test` en `frontend/`: T004–T007 en verde y login/registro siguen pasando sin cambios en sus aserciones

**Checkpoint**: reglas y componentes base listos; login y registro funcionan en su nuevo grupo.

---

## Phase 3: User Story 1 - Entrar a la sección de mi rol (Priority: P1) 🎯 MVP

**Goal**: Con sesión, cada rol abre en su sección con su BottomNav; mientras se restaura la sesión se ve la carga; los cruces de rol redirigen; login y registro llevan a la sección del rol.

**Independent Test**: Con una sesión de cada rol simulada, `renderRouter` en `/` termina en `/explorar` (5 pestañas) o `/organizador/eventos` (4 pestañas); con `cargando` solo se ve `PantallaCarga`.

### Pruebas (escribir primero)

- [X] T015 [P] [US1] Escribir `frontend/__tests__/navegacion/rutas-test.jsx` con `renderRouter` de `expo-router/testing-library` montando los layouts y pantallas reales de `frontend/src/app/` y `useAuth` simulado con T002: (a) `cargando: true` → se ve `PantallaCarga` y no "Iniciar sesión" (US1-3); (b) COMPRADOR en `/` → `toHavePathname('/explorar')` y las 5 etiquetas de `TABS_COMPRADOR` (US1-1); (c) ORGANIZADOR en `/` → `/organizador/eventos` y las 4 de `TABS_ORGANIZADOR` (US1-2); (d) ORGANIZADOR en `/compras`, `/explorar` y `/perfil` → `/organizador/eventos`; COMPRADOR en `/organizador/crear` → `/explorar` (US1-4); (e) con sesión en `/login` → ruta inicial del rol; (f) tocar cada pestaña con sesión navega a su ruta; (g) ORGANIZADOR en `/organizador/mensajes` ve el EmptyState provisorio (edge case). Cada caso de la matriz [data-model.md › Area](./data-model.md#area) con sesión queda cubierto (SC-001)
- [X] T016 [P] [US1] Actualizar `frontend/__tests__/screens/login-test.jsx`: tras éxito con `iniciarSesion` resolviendo un COMPRADOR se espera `mockReplace('/explorar')`, y con un ORGANIZADOR `mockReplace('/organizador/eventos')` (contracts/navegacion.md › Cambios en pantallas existentes). El resto de los casos queda igual (SC-004)
- [X] T017 [P] [US1] Actualizar `frontend/__tests__/screens/registro-test.jsx` (el `iniciarSesion` simulado resuelve el usuario con su `rol`, como en login): tras éxito de COMPRADOR `mockReplace('/explorar')` y de ORGANIZADOR `mockReplace('/organizador/crear')` (research R12). El resto de los casos queda igual (SC-004)
- [X] T018 [US1] ⛔ GATE: presentar T015–T017 al usuario y esperar su **aprobación**; correr `npx jest __tests__/navegacion/rutas-test.jsx __tests__/screens` y confirmar rojo en los casos nuevos

### Implementación

- [X] T019 [US1] Modificar `frontend/src/app/_layout.jsx`: el componente interno lee `useAuth().cargando` y, si es `true`, renderiza `<PantallaCarga />` en vez del `Stack` (research R5); se conserva la carga de fuentes, `SafeAreaProvider`, `ThemeProvider`, `AuthProvider` y el `StatusBar`
- [X] T020 [US1] Reemplazar `frontend/src/app/index.jsx` (pantalla provisoria, FR-008) por un componente que devuelve `<Redirect href={rutaInicial(usuario)} />`
- [X] T021 [US1] En `frontend/src/app/(auth)/_layout.jsx`, con sesión devolver `<Redirect href={rutaInicial(usuario)} />` (contracts/navegacion.md › Comportamiento de los layouts)
- [X] T022 [US1] Crear `frontend/src/app/(comprador)/_layout.jsx`: guardia con `decidirAcceso({ usuario, ruta: usePathname() })` → `<Redirect>` si corresponde; `Tabs` con `screenOptions={{ headerShown: false }}`, una `Tabs.Screen` por `TABS_COMPRADOR` en ese orden y `tabBar` que adapta `BottomTabBarProps` a `<BottomNav items={TABS_COMPRADOR} activo={…} alSeleccionar={…} />`, emitiendo `emitter.emit({ type: 'tabPress', target, canPreventDefault: true })` y navegando con `navigateToTab` solo si no se previno (expo-router 58 no pasa `navigation` al `tabBar`) (contracts/componentes.md › BottomNav)
- [X] T023 [P] [US1] Crear las pantallas provisorias del comprador `frontend/src/app/(comprador)/explorar.jsx`, `buscar.jsx`, `favoritos.jsx`, `compras.jsx` y `perfil.jsx`: cada una con su título (Explorar, Buscar, Favoritos, Mis compras, Perfil) como `header` y un `EmptyState` "Próximamente" (Assumptions; las completan 004/006 y US3)
- [X] T024 [US1] Crear `frontend/src/app/organizador/_layout.jsx` igual que T022 con `TABS_ORGANIZADOR` (guardia con `decidirAcceso`)
- [X] T025 [P] [US1] Crear las pantallas provisorias del organizador `frontend/src/app/organizador/eventos.jsx` ("Mis eventos"), `crear.jsx` ("Crear evento"), `perfil.jsx` (provisoria, la reemplaza US3) y `mensajes.jsx` con `EmptyState icono="message"` explicando que los mensajes de cada compra se abren desde sus eventos (edge case; comportamiento final en 007)
- [X] T026 [US1] Modificar `frontend/src/app/(auth)/login.jsx` para navegar con `router.replace(destinoTrasLogin(usuario))` usando el usuario que devuelve `iniciarSesion`, y `frontend/src/app/(auth)/registro.jsx` con `router.replace(destinoTrasRegistro(usuario))`, también con el usuario que devuelve su llamada a `iniciarSesion` (no con el `rol` elegido en el formulario) (research R12). Validaciones y mensajes sin cambios (FR-008)
- [X] T027 [US1] Correr `npm test` en `frontend/`: T015–T017 en verde y sin regresiones

**Checkpoint**: MVP — cada rol entra a su sección y no hay parpadeo de login.

---

## Phase 4: User Story 2 - Explorar sin cuenta y pedir sesión solo cuando hace falta (Priority: P1)

**Goal**: El visitante usa Explorar, Buscar y el detalle; las pestañas y rutas protegidas lo mandan a login con `volverA` y, tras iniciar sesión, vuelve si su rol lo permite.

**Independent Test**: Sin sesión, `renderRouter` en `/explorar`; tocar Compras lleva a `/login` con `volverA=/compras`; iniciar sesión como COMPRADOR termina en `/compras`.

**Depende de**: US1 (layouts de área y pantallas provisorias).

### Pruebas (escribir primero)

- [X] T028 [P] [US2] Agregar a `frontend/__tests__/navegacion/rutas-test.jsx` los casos de visitante: `/` → `/explorar`; `/buscar` y `/evento/abc123` se muestran (FR-003); tocar Favoritos, Compras y Perfil hace `push` a `/login` con `volverA` de esa pestaña y "atrás" vuelve a la pestaña anterior (research R4); enlace profundo a `/compras` y a `/organizador/crear` termina en `/login` con su `volverA` (edge case); toda la matriz de visitante de [data-model.md › Area](./data-model.md#area) queda cubierta (SC-001)
- [X] T029 [P] [US2] Agregar a `frontend/__tests__/screens/login-test.jsx` (simulando `useLocalSearchParams`): "Explorar eventos sin cuenta" → `mockReplace('/explorar')` (US2-1, SC-002); con `volverA: '/compras'` y COMPRADOR → `mockReplace('/compras')` (US2-2, SC-003); con `volverA: '/compras'` y ORGANIZADOR → `mockReplace('/organizador/eventos')` (US2-3); con `volverA: 'https://evil.com'` → ruta inicial; "Creá una cuenta" hace `push` a `/registro` con `params: { volverA }` cuando hay y sin params cuando no
- [X] T030 [P] [US2] Agregar a `frontend/__tests__/screens/registro-test.jsx` (simulando `useLocalSearchParams`): con `volverA: '/favoritos'` y COMPRADOR → `mockReplace('/favoritos')`; con `volverA: '/favoritos'` y ORGANIZADOR → `mockReplace('/organizador/crear')`
- [X] T031 [US2] ⛔ GATE: presentar T028–T030 al usuario y esperar su **aprobación**; correr las pruebas y confirmar rojo en los casos nuevos

### Implementación

- [X] T032 [P] [US2] Crear `frontend/src/app/evento/[idEvento].jsx`: pantalla provisoria pública que lee `idEvento` con `useLocalSearchParams`, muestra título "Detalle del evento" y un `EmptyState` "Próximamente" (la completa 005)
- [X] T033 [US2] En `frontend/src/app/(comprador)/_layout.jsx`, agregar `listeners.tabPress` a las `Tabs.Screen` cuyo `TabDef.requiereSesion` es `true` ([data-model.md › TabDef](./data-model.md#tabdef)): sin sesión, `e.preventDefault()` y `router.push(hrefLogin(<ruta de la pestaña>))` (research R4). La redirección de visitante por enlace profundo ya la da `decidirAcceso` (verificar que use `hrefLogin`)
- [X] T034 [US2] Verificar en `frontend/src/app/organizador/_layout.jsx` que la guardia redirige al visitante a `hrefLogin(ruta)` (ajustar si T024 no lo cubría)
- [X] T035 [US2] Modificar `frontend/src/app/(auth)/login.jsx`: leer `volverA` con `useLocalSearchParams`, navegar con `destinoTrasLogin(usuario, volverA)`, "Explorar eventos sin cuenta" → `router.replace('/explorar')`, "Creá una cuenta" → `router.push` a `/registro` propagando `volverA` (contracts/navegacion.md › Cambios en pantallas existentes)
- [X] T036 [US2] Modificar `frontend/src/app/(auth)/registro.jsx`: leer `volverA` y navegar con `destinoTrasRegistro(usuario, volverA)`; "Iniciá sesión" conserva `volverA` al volver a `/login`
- [X] T037 [US2] Correr `npm test` en `frontend/`: T028–T030 en verde y sin regresiones

**Checkpoint**: US1 y US2 completas — toda la matriz sesión/rol/ruta funciona (SC-001, SC-003).

---

## Phase 5: User Story 4 - Componentes compartidos consistentes (Priority: P2)

**Goal**: AppHeader, Skeleton, Toast (+ `ToastProvider`/`useToast`) y Modal disponibles para 004–008, alineados al design system, en claro/oscuro y accesibles (BottomNav y EmptyState ya se hicieron en Phase 2).

**Independent Test**: Cada componente pasa sus pruebas de render, interacción y accesibilidad en ambos temas.

**Orden**: se hace antes que US3 (misma prioridad P2) porque US3 usa Toast, Skeleton y AppHeader.

### Pruebas (escribir primero)

- [X] T038 [P] [US4] Escribir `frontend/__tests__/components/AppHeader-test.jsx` según [contracts/componentes.md › AppHeader](./contracts/componentes.md#appheader--srccomponentsappheaderjsx): `default` con título, subtítulo y botón "Volver" solo si `alVolver` es función (al tocarlo lo llama); `large` con título `header` y sin "Volver"; `transparent` sin título visible; como máximo 2 acciones renderizadas con su `label`; en dark y light
- [X] T039 [P] [US4] Escribir `frontend/__tests__/components/Skeleton-test.jsx` según [contracts/componentes.md › Skeleton](./contracts/componentes.md#skeleton--srccomponentsskeletonjsx): aplica `ancho`, `alto` y `radio`; no es accesible; con `AccessibilityInfo.isReduceMotionEnabled` simulado en `true` no arranca `Animated.loop`, y en `false` sí (research R10); en dark y light usa `colors.surfaceRaised` de cada tema
- [X] T040 [P] [US4] Escribir `frontend/__tests__/components/Toast-test.jsx` según [contracts/componentes.md › Toast](./contracts/componentes.md#toast--srccomponentstoastjsx): cada valor de [data-model.md › Aviso](./data-model.md#aviso-toast) `Aviso.tono` renderiza; `error` tiene `accessibilityRole="alert"` y el resto `accessibilityLiveRegion="polite"`; `Aviso.mensaje` es opcional; `Aviso.accion` muestra el botón y al tocarlo llama `alPresionar`; en dark y light
- [X] T041 [P] [US4] Escribir `frontend/__tests__/feedback/ToastContext-test.jsx` con `jest.useFakeTimers()` según [contracts/componentes.md › ToastProvider](./contracts/componentes.md#toastprovider--usetoast--srcfeedbacktoastcontextjsx): `mostrar` muestra el aviso y desaparece a los 4 s; con `accion` a los 6 s; dos `mostrar` seguidos se ven de a uno en orden (FIFO, [data-model.md › Aviso](./data-model.md#aviso-toast)); `ocultar` pasa al siguiente; tocar la acción la ejecuta y oculta; `useToast` fuera del provider lanza el error del contrato; el aviso se renderiza en dark y light
- [X] T042 [P] [US4] Escribir `frontend/__tests__/components/Modal-test.jsx` según [contracts/componentes.md › Modal](./contracts/componentes.md#modal--srccomponentsmodaljsx): con `visible` muestra título (`header`), cuerpo, confirmar y "Volver" (US4-1); etiquetas por defecto y personalizadas; confirmar llama `alConfirmar` y "Volver" `alCancelar`; `onRequestClose` (back de Android) llama `alCancelar`; `destructivo` usa la variante destructive; `cargando` deshabilita cancelar; contenedor con `accessibilityViewIsModal`; con `visible={false}` no renderiza contenido; en dark y light
- [X] T043 [US4] ⛔ GATE: presentar T038–T042 al usuario y esperar su **aprobación**; correrlas y confirmar rojo

### Implementación

- [X] T044 [P] [US4] Implementar `frontend/src/components/AppHeader.jsx` según el contrato y `design-system/docs/componentes/AppHeader.md` (usar `IconButton` existente; alto 56 + `insets.top` en `default`; `typography.displayLg` en `large`; variante `onImage` de botones en `transparent`)
- [X] T045 [P] [US4] Implementar `frontend/src/components/Skeleton.jsx` según el contrato y `design-system/docs/componentes/Skeleton.md` (fondo `colors.surfaceRaised`, opacidad `opacity.skeletonMin`↔1, ciclo `duration.skeleton`, `useNativeDriver`, escucha `reduceMotionChanged`)
- [X] T046 [P] [US4] Implementar `frontend/src/components/Toast.jsx` según el contrato y `design-system/docs/componentes/Toast.md`, con props de [data-model.md › Aviso](./data-model.md#aviso-toast) (`Aviso.tono`, `Aviso.titulo`, `Aviso.mensaje`, `Aviso.accion`); acción con `Button` `ghost` `sm`
- [X] T047 [US4] Implementar `frontend/src/feedback/ToastContext.jsx` (depende de T046): cola FIFO y un aviso visible ([data-model.md › Aviso](./data-model.md#aviso-toast)), temporizadores 4 s / 6 s limpiados al desmontar, posición `insets.bottom + sizes.bottomNavHeight + spacing[2]`, entrada con `duration.base`, `AccessibilityInfo.announceForAccessibility` para tonos no `error` (research R8)
- [X] T048 [P] [US4] Implementar `frontend/src/components/Modal.jsx` según el contrato y `design-system/docs/componentes/Modal.md` sobre `Modal` de `react-native` (`transparent`, `animationType="fade"`, fondo `colors.scrimModal`, `onRequestClose={alCancelar}`) usando `Button` existente (research R9)
- [X] T049 [US4] Montar `ToastProvider` en `frontend/src/app/_layout.jsx` entre `ThemeProvider` y `AuthProvider` (contracts/navegacion.md › Comportamiento de los layouts) y cambiar el título de las pantallas provisorias de T023, T025 y T032 (salvo los dos `perfil.jsx`, que reemplaza T060) por `<AppHeader variante="large" titulo=… />` (en el detalle: `variante="default"` con `alVolver={router.back}`)
- [X] T050 [US4] Correr `npm test` en `frontend/`: T038–T042 en verde y sin regresiones

**Checkpoint**: los seis componentes compartidos listos para 004–008.

---

## Phase 6: User Story 3 - Perfil y cerrar sesión (Priority: P2)

**Goal**: Ambos roles ven su perfil desde el servidor y pueden cerrar sesión; ante sesión expirada se vuelve a visitante con aviso.

**Independent Test**: Con COMPRADOR simulado, `/perfil` muestra nombre, apellido, `@usuario` y "Comprador"; "Cerrar sesión" llama `cerrarSesion` y termina en `/explorar`.

**Depende de**: US1 (layouts y rutas de perfil) y US4 (Toast, Skeleton, AppHeader).

### Pruebas (escribir primero)

- [X] T051 [P] [US3] Agregar a `frontend/__tests__/auth-AuthContext-test.jsx`: con `AuthProvider alExpirar={fn}`, cuando el proveedor registrado en `configurarSesion` recibe `alExpirar()`, la sesión queda en `null`, se borra `SecureStore` y `fn` se llama **una** vez después de limpiar; sin la prop no falla (research R6, contracts/navegacion.md › AuthProvider)
- [X] T052 [P] [US3] Escribir `frontend/__tests__/hooks/usePerfil-test.jsx` con `renderHook` y `usuarioService.obtenerPerfil` simulado: éxito → `perfil` con los campos de [data-model.md › Perfil](./data-model.md#perfil-lectura-get-apiusuarios) y `cargando` pasa a `false`; `ApiError` status 0 → `error` y `perfil` `null`; 404 → llama `cerrarSesion`; `recargar` vuelve a pedir; nunca lanza (contracts/componentes.md › usePerfil)
- [X] T053 [P] [US3] Escribir `frontend/__tests__/screens/perfil-test.jsx` para `frontend/src/pantallas/PantallaPerfil.jsx` (con `useAuth`, `useRouter` y `usuarioService` simulados, dentro de `ToastProvider`): mientras carga se ve el contenedor `testID="perfil-cargando"` (contracts/componentes.md › PantallaPerfil) y desaparece al terminar; con éxito muestra `Perfil.nombre`, `Perfil.apellido`, `@` + `Perfil.nombreUsuario` y `Perfil.rol` como "Comprador"/"Organizador" ([data-model.md › Perfil](./data-model.md#perfil-lectura-get-apiusuarios)) (US3-1); status 0 → datos de la sesión + toast "No pudimos actualizar tu perfil" con "Reintentar" que vuelve a pedir; 404 → toast "Tu cuenta ya no existe" y `cerrarSesion`; otro error → datos de la sesión + toast `error` con el mensaje; "Cerrar sesión" → `cerrarSesion()` y `replace('/explorar')` (US3-2) (research R7)
- [X] T054 [P] [US3] Agregar a `frontend/__tests__/navegacion/rutas-test.jsx`: COMPRADOR en `/perfil` y ORGANIZADOR en `/organizador/perfil` muestran la pantalla de perfil; al pasar `usuario` a `null` estando en `/compras` (simula expiración) la guardia lleva a `/login?volverA=%2Fcompras`, y estando en `/explorar` se queda en `/explorar` como visitante (US3-3)
- [X] T055 [P] [US3] Escribir `frontend/__tests__/navegacion/expiracion-test.jsx` que monta el layout raíz real `frontend/src/app/_layout.jsx` con `renderRouter`, `expo-secure-store` simulado con una sesión de COMPRADOR y `configurarSesion` espiado para capturar el proveedor: al invocar `proveedor.alExpirar()` se ve el toast `warning` "Tu sesión expiró" ([data-model.md › Aviso](./data-model.md#aviso-toast)) y la app queda como visitante (FR-006, US3-3)
- [X] T056 [US3] ⛔ GATE: presentar T051–T055 al usuario y esperar su **aprobación**; correrlas y confirmar rojo

### Implementación

- [X] T057 [US3] Modificar `frontend/src/auth/AuthContext.jsx`: prop opcional `alExpirar` (guardada en un `ref` para no reconfigurar el cliente en cada render) que se llama al final del `alExpirar` registrado en `configurarSesion`; actualizar el JSDoc de `AuthProvider`. `useAuth()` no cambia de forma (research R6)
- [X] T058 [US3] Implementar `frontend/src/hooks/usePerfil.js` según [contracts/componentes.md › usePerfil](./contracts/componentes.md#useperfil--srchooksuseperfiljs) (cancelar la actualización de estado si se desmonta)
- [X] T059 [US3] Implementar `frontend/src/pantallas/PantallaPerfil.jsx` según [contracts/componentes.md › PantallaPerfil](./contracts/componentes.md#pantallaperfil--srcpantallaspantallaperfiljsx) y research R7, con `AppHeader variante="large" titulo="Perfil"`, `Skeleton` dentro del contenedor `testID="perfil-cargando"`, `useToast` y `Button variant="secondary"` "Cerrar sesión"; mostrar `Perfil.rol` con su etiqueta legible ([data-model.md › Perfil](./data-model.md#perfil-lectura-get-apiusuarios))
- [X] T060 [P] [US3] Reemplazar las pantallas provisorias `frontend/src/app/(comprador)/perfil.jsx` y `frontend/src/app/organizador/perfil.jsx` por `export default` que renderiza `<PantallaPerfil />`
- [X] T061 [US3] En `frontend/src/app/_layout.jsx`, pasar a `AuthProvider` `alExpirar={() => mostrar({ tono: 'warning', titulo: 'Tu sesión expiró', mensaje: 'Iniciá sesión de nuevo para continuar.' })}` usando `useToast()` desde un componente interno bajo `ToastProvider` ([data-model.md › Aviso](./data-model.md#aviso-toast), FR-006)
- [X] T062 [US3] Correr `npm test` en `frontend/`: T051–T055 en verde y sin regresiones

**Checkpoint**: las cuatro historias completas.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T063 [P] Revisar JSDoc y docstrings de archivo en todos los archivos nuevos o modificados de `frontend/src/app/`, `frontend/src/navegacion/`, `frontend/src/feedback/`, `frontend/src/hooks/`, `frontend/src/pantallas/`, `frontend/src/components/` y `frontend/src/auth/AuthContext.jsx` (principio 6): cada export con `@param`/`@returns`/`@throws` y `@typedef` con `@property` para props, `TabDef`, `DecisionAcceso` y `Aviso`
- [X] T064 [P] Buscar restos del flujo viejo con `grep -rn "replace('/')\|app/login\|app/registro" frontend/src frontend/__tests__` y corregir lo que aparezca (FR-008)
- [X] T065 [P] Actualizar la sección "Navigation (Frontend)" de `AGENTS.md` con el mapa de rutas por área, el parámetro `volverA` y la regla de registrar nuevas rutas en `frontend/src/navegacion/reglas.js` (contracts/navegacion.md › Rutas)
- [X] T066 Correr `npm run lint` y `npm run format` desde la raíz y corregir lo que marquen
- [X] T067 Correr la suite completa `npm test` en `frontend/` y confirmar 0 regresiones (SC-004)
- [ ] T068 Ejecutar la validación manual de [quickstart.md](./quickstart.md) (escenarios 1–16) en Android o web y anotar cualquier desvío

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational.
- **US2 (Phase 4)**: depende de US1 (extiende sus layouts, `login.jsx` y `registro.jsx`).
- **US4 (Phase 5)**: depende solo de Foundational; puede hacerse en paralelo con US1/US2, salvo T049, que toca `_layout.jsx` y las pantallas provisorias (después de T019, T023, T025 y T032).
- **US3 (Phase 6)**: depende de US1 y US4.
- **Polish (Phase 7)**: depende de todas las historias.

### Dentro de cada fase

- Pruebas → ⛔ GATE (aprobación del usuario + rojo) → implementación → corrida en verde.
- `reglas.js` (T009) antes que cualquier layout; `Toast.jsx` (T046) antes que `ToastContext.jsx` (T047); `ToastProvider` montado (T049) antes que T061.
- Tareas que tocan el mismo archivo no van en paralelo: `frontend/src/app/_layout.jsx` (T019 → T049 → T061), `(comprador)/_layout.jsx` (T022 → T033), `login.jsx` (T013 → T026 → T035), `registro.jsx` (T013 → T026 → T036), `rutas-test.jsx` (T015 → T028 → T054).

### Orden sugerido

```text
Setup → Foundational → US1 (MVP) → US2 → US4 → US3 → Polish
                         └──── US4 (T038–T048) puede ir en paralelo ────┘
```

---

## Parallel Examples

### Foundational

```text
Pruebas en paralelo: T004 reglas-test.js · T005 BottomNav-test.jsx · T006 EmptyState-test.jsx · T007 PantallaCarga-test.jsx
Tras el GATE:        T009 reglas.js · T010 BottomNav.jsx · T011 EmptyState.jsx · T012 PantallaCarga.jsx
```

### US1

```text
Pruebas: T015 rutas-test.jsx · T016 login-test.jsx · T017 registro-test.jsx
Impl.:   T023 pantallas del comprador ∥ T025 pantallas del organizador (tras T022/T024)
```

### US2

```text
Pruebas: T028 rutas-test.jsx · T029 login-test.jsx · T030 registro-test.jsx
Impl.:   T032 evento/[idEvento].jsx ∥ T033 (comprador)/_layout.jsx ∥ T035 login.jsx ∥ T036 registro.jsx
```

### US4

```text
Pruebas: T038 AppHeader · T039 Skeleton · T040 Toast · T041 ToastContext · T042 Modal
Impl.:   T044 AppHeader ∥ T045 Skeleton ∥ T046 Toast ∥ T048 Modal; luego T047 ToastContext
```

### US3

```text
Pruebas: T051 AuthContext · T052 usePerfil · T053 perfil · T054 rutas · T055 expiración
Impl.:   T057 AuthContext ∥ T058 usePerfil; luego T059 PantallaPerfil → T060 rutas de perfil ∥ T061 _layout
```

---

## Implementation Strategy

### MVP primero (US1)

1. Setup + Foundational.
2. US1: cada rol entra a su sección con su BottomNav, sin parpadeo de login.
3. **Parar y validar**: escenarios 1–4 de [quickstart.md](./quickstart.md) y `npm test`.

### Entrega incremental

1. + US2 → visitante explora y vuelve tras login (SC-002, SC-003); con US1 cubre toda la matriz (SC-001). Las features 004 y 005 ya pueden empezar.
2. + US4 → componentes compartidos disponibles; 006–008 pueden empezar.
3. + US3 → perfil, cerrar sesión y aviso de expiración.
4. Polish → JSDoc, lint, suite completa y validación manual.

### Notas

- Cada ⛔ GATE es una parada real: se muestran las pruebas al usuario y no se implementa hasta su aprobación (principio 2).
- Hacer commit al final de cada fase (después de lint y formato).
