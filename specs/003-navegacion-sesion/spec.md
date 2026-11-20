# Feature Specification: Navegación por rol y sesión

**Feature Branch**: `003-navegacion-sesion`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "003 navegacion-sesion: estructura de navegación de la app con Expo Router: grupos de autenticación, comprador y organizador con barra inferior según NAV_BUYER (Explorar, Buscar, Favoritos, Compras, Perfil) y NAV_ORGANIZER (Mis eventos, Crear, Mensajes, Perfil); redirección por sesión y rol; explorar sin cuenta; pantalla Perfil para ambos roles con cerrar sesión; componentes compartidos AppHeader, BottomNav, EmptyState, Skeleton, Toast y Modal. Reemplaza el index provisorio."

## Contexto

Hoy la app tiene login, registro y una pantalla inicial provisoria. Esta feature arma el "esqueleto" sobre el que se montan las pantallas de las features 004–008 y los componentes compartidos que todas usan. Depende de 001 (sesión y perfil). Habilita todos los CU porque define cómo se llega a cada pantalla.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar a la sección de mi rol (Priority: P1)

Al abrir la app con sesión, el comprador ve su navegación (Explorar, Buscar, Favoritos, Compras, Perfil) y el organizador la suya (Mis eventos, Crear, Mensajes, Perfil). Al iniciar sesión o registrarse se lo lleva a su sección: el comprador a Explorar; el organizador que inicia sesión a Mis eventos y el que recién se registra a Crear evento (según el diseño de registro, porque todavía no tiene eventos).

**Why this priority**: Sin esto no se puede llegar a ninguna pantalla nueva.

**Independent Test**: Con una sesión de cada rol guardada, abrir la app y verificar la barra inferior y la pantalla inicial correctas.

**Acceptance Scenarios**:

1. **Given** una sesión de COMPRADOR guardada, **When** se abre la app, **Then** se muestra Explorar con la navegación de comprador.
2. **Given** una sesión de ORGANIZADOR guardada, **When** se abre la app, **Then** se muestra Mis eventos con la navegación de organizador.
3. **Given** que la sesión se está restaurando, **When** se abre la app, **Then** se muestra un estado de carga (no un parpadeo de login).
4. **Given** un organizador, **When** intenta abrir una pantalla de comprador (o viceversa), **Then** se lo redirige a su sección.

---

### User Story 2 - Explorar sin cuenta y pedir sesión solo cuando hace falta (Priority: P1)

Un visitante sin cuenta puede explorar y buscar eventos y ver su detalle. Al intentar comprar, guardar un favorito o entrar a Compras/Favoritos/Perfil, se le pide iniciar sesión y, al terminar, vuelve a donde estaba.

**Why this priority**: Lo exige el diseño de login ("Explorar eventos sin cuenta") y CU-03 no requiere sesión.

**Independent Test**: Sin sesión, navegar a Explorar; tocar Compras lleva a login; tras iniciar sesión vuelve a Compras.

**Acceptance Scenarios**:

1. **Given** sin sesión, **When** toca "Explorar eventos sin cuenta" en login, **Then** ve Explorar.
2. **Given** sin sesión, **When** toca una acción que requiere cuenta, **Then** va a login y, al iniciar sesión, vuelve a esa acción.
3. **Given** sin sesión, **When** inicia sesión un ORGANIZADOR desde una acción de comprador, **Then** va a su propia sección (no a la acción de comprador).

---

### User Story 3 - Perfil y cerrar sesión (Priority: P2)

Cualquier usuario ve su nombre, apellido, nombre de usuario y rol, y puede cerrar sesión.

**Why this priority**: Necesario para cambiar de cuenta; poco valor de negocio adicional.

**Independent Test**: Abrir Perfil muestra los datos del usuario; cerrar sesión vuelve a Explorar como visitante.

**Acceptance Scenarios**:

1. **Given** una sesión válida, **When** abre Perfil, **Then** ve sus datos actualizados desde el servidor.
2. **Given** Perfil abierto, **When** toca cerrar sesión, **Then** se borra la sesión y vuelve a Explorar sin cuenta.
3. **Given** la sesión expiró y no se pudo renovar, **When** ocurre, **Then** la app vuelve al estado sin sesión y se informa con un aviso.

---

### User Story 4 - Componentes compartidos consistentes (Priority: P2)

Las pantallas usan el mismo encabezado, barra inferior, estados vacíos, esqueletos de carga, avisos (toast) y diálogos de confirmación del design system, en modo claro y oscuro.

**Why this priority**: Evita que cada feature 004–008 los reimplemente.

**Independent Test**: Cada componente tiene pruebas de render y de interacción básicas y respeta los docs de `design-system/docs/componentes`.

**Acceptance Scenarios**:

1. **Given** un diálogo de confirmación destructiva, **When** se abre, **Then** muestra título, cuerpo, confirmar y volver, y es accesible por lector de pantalla.
2. **Given** una lista vacía, **When** se renderiza, **Then** se muestra EmptyState con mensaje y acción opcional.

### Edge Cases

- La pestaña "Mensajes" del organizador no tiene bandeja en el backend: en esta feature se muestra un EmptyState provisorio; su comportamiento final lo define la 007.
- Error al cargar el perfil (sin red): se muestran los datos de la sesión guardada y un aviso.
- Perfil devuelve 404 (usuario eliminado): se cierra la sesión.
- Enlaces profundos a pantallas protegidas sin sesión: van a login con retorno.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app MUST tener tres áreas: autenticación (login, registro), comprador y organizador, cada una con su navegación según el design system.
- **FR-002**: La app MUST redirigir según la sesión y el rol, y mostrar un estado de carga mientras restaura la sesión.
- **FR-003**: Explorar, Buscar y el detalle de evento MUST ser accesibles sin sesión; Compras, Favoritos, Perfil, comprar y todo el área de organizador MUST requerir sesión.
- **FR-004**: Al pedir sesión por una acción, la app MUST volver a esa acción tras iniciar sesión si el rol lo permite.
- **FR-005**: La pantalla Perfil MUST mostrar nombre, apellido, nombre de usuario y rol, y permitir cerrar sesión.
- **FR-006**: Ante expiración de sesión notificada por la capa de servicios, la app MUST volver al estado visitante y avisar al usuario.
- **FR-007**: MUST existir los componentes compartidos AppHeader, BottomNav, EmptyState, Skeleton, Toast y Modal, alineados a sus docs del design system, con tema claro/oscuro y accesibilidad.
- **FR-008**: La pantalla inicial provisoria MUST eliminarse; login y registro MUST conservar su comportamiento salvo el destino tras éxito.
- **FR-009**: Pruebas antes de implementar (TDD) y JSDoc en cada exportado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las combinaciones sesión/rol (visitante, comprador, organizador) llevan a la pantalla inicial correcta.
- **SC-002**: Un visitante llega a ver eventos en 1 toque desde login.
- **SC-003**: Tras iniciar sesión desde una acción protegida, el usuario vuelve a ella en el 100% de los casos permitidos por su rol.
- **SC-004**: 0 regresiones en las pruebas de login y registro.

## Assumptions

- Las pantallas de las pestañas se crean vacías (placeholders) y las completan 004–008.
- El "volver a la acción" se limita a volver a la pantalla de origen (no se re-ejecuta la acción automáticamente).
- Esta feature protege pestañas y rutas (Favoritos, Compras, Perfil y el área de organizador) y entrega el mecanismo de login con retorno. Las acciones dentro de una pantalla (comprar en el detalle, guardar un favorito desde una card) las protegen 004 y 005 con ese mismo mecanismo; acá no hay pantallas con esas acciones.
- La ubicación mostrada en Explorar (diseño) queda fuera de alcance: el backend no tiene ubicación.
- Solo se usa navegación de Expo Router (restricción de la constitución).
