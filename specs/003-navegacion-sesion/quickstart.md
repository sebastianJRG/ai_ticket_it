# Quickstart: validar Navegación por rol y sesión

**Feature**: `003-navegacion-sesion`

## Prerrequisitos

- Node 20 y dependencias instaladas en la raíz: `npm install`.
- `frontend/.env` con `EXPO_PUBLIC_API_URL` apuntando al backend (ver `frontend/.env.example`).
- Sin dependencias nuevas que instalar.

## 1. Pruebas automatizadas

```bash
cd frontend
npx jest __tests__/navegacion                # reglas puras + navegación integrada (SC-001, SC-003)
npx jest __tests__/components                # AppHeader, BottomNav, EmptyState, Skeleton, Toast, Modal (+ existentes)
npx jest __tests__/feedback __tests__/screens # ToastProvider, Perfil, login y registro (SC-004)
npm test                                     # suite completa: debe pasar sin regresiones
```

Resultado esperado: todo en verde. En particular, las pruebas de login/registro solo cambian la ruta de import y el destino esperado ([contracts/navegacion.md › Cambios en pantallas existentes](./contracts/navegacion.md#cambios-en-pantallas-existentes)).

## 2. Lint y formato

```bash
npm run lint && npm run format   # desde la raíz
```

## 3. Validación manual

Levantar backend y app:

```bash
npm run dev:backend      # terminal 1
npm run dev:frontend     # terminal 2 (abrir en Android/iOS/web)
```

Crear previamente un COMPRADOR y un ORGANIZADOR desde Registro.

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 1 | Restauración (US1-3) | Con sesión guardada, recargar la app | Se ve `PantallaCarga`, nunca login, y luego la sección del rol |
| 2 | Comprador (US1-1) | Iniciar sesión como COMPRADOR, recargar | Explorar + BottomNav de 5 ítems |
| 3 | Organizador (US1-2) | Iniciar sesión como ORGANIZADOR, recargar | Mis eventos + BottomNav de 4 ítems |
| 4 | Cruce de rol (US1-4) | Como ORGANIZADOR, abrir `/compras` (web: barra de direcciones) | Redirige a `/organizador/eventos` |
| 5 | Visitante (US2-1, SC-002) | Sin sesión, en login tocar "Explorar eventos sin cuenta" | Explorar en 1 toque |
| 6 | Retorno (US2-2, SC-003) | Visitante toca Compras → inicia sesión como COMPRADOR | Termina en Compras |
| 7 | Retorno con otro rol (US2-3) | Visitante toca Compras → inicia sesión como ORGANIZADOR | Termina en Mis eventos |
| 8 | Enlace profundo | Sin sesión, abrir `/organizador/crear` | Login; tras iniciar como ORGANIZADOR, Crear evento |
| 9 | Registro de organizador | Registrar un ORGANIZADOR nuevo | Crear evento |
| 10 | Perfil (US3-1) | Abrir Perfil en cada rol | Nombre, apellido, `@usuario` y rol |
| 11 | Cerrar sesión (US3-2) | Perfil → Cerrar sesión | Explorar como visitante |
| 12 | Sin red en perfil | Con sesión, apagar backend, abrir Perfil | Datos de la sesión + toast "No pudimos actualizar tu perfil" |
| 13 | Sesión expirada (US3-3) | Dejar que venza el access token y que la renovación falle (p. ej. reiniciar el backend, que pierde los refresh tokens en memoria) y abrir Compras | Toast "Tu sesión expiró"; queda como visitante (login con retorno). Si el backend responde 404 de perfil porque también perdió el usuario, aplica el escenario de cuenta inexistente |
| 14 | Mensajes (edge case) | Como ORGANIZADOR, abrir Mensajes | EmptyState provisorio |
| 15 | Temas | Cambiar el tema del sistema claro/oscuro | Header, BottomNav, toasts y modal se ven bien en ambos |
| 16 | Lector de pantalla | Activar TalkBack/VoiceOver en BottomNav y en un Modal | Pestañas anunciadas con estado seleccionado; el foco queda dentro del modal |

Para los escenarios 12 y 13, ver el comportamiento esperado en [research R6–R7](./research.md#r6-aviso-de-sesión-expirada-inyectado-en-authprovider).
