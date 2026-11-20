# Quickstart: validar la capa de servicios

**Feature**: 001-servicios-api-axios

## Prerrequisitos

- Node.js 20 y dependencias instaladas en la raíz (`npm install`).
- `axios` agregado al workspace `frontend` (`cd frontend && npx expo install axios`).
- Para la validación manual: backend corriendo (`npm run dev:backend`) y, en un celular físico, `EXPO_PUBLIC_API_URL` con la IP LAN del PC (ver `frontend/.env.example`).

## 1. Pruebas automáticas (sin red)

```bash
cd frontend
npx jest __tests__/services        # cliente + 7 servicios
npx jest __tests__/auth-AuthContext-test.jsx
npx jest __tests__/screens         # login y registro: no deben cambiar (SC-004)
npm test                           # suite completa
```

Resultado esperado: todo en verde. Casos clave que deben figurar (ver contratos):

| Escenario | Archivo de prueba | Contrato |
|-----------|-------------------|----------|
| 401 → 1 refresh → reintento ok (US1-1) | `api-test.js` | [cliente-api.md](./contracts/cliente-api.md) |
| 3 peticiones concurrentes → 1 refresh (US1-2, SC-003) | `api-test.js` | idem |
| Refresh rechazado → `alExpirar`, 401 (US1-3) | `api-test.js` | idem |
| Tokens rotados persistidos (US1-4) | `auth-AuthContext-test.jsx` | [data-model.md](./data-model.md#sesion) |
| Login 401 no renueva (US1-5) | `authService-test.js` | [servicios.md](./contracts/servicios.md#authservicejs-todas-con-sinsesion-true-re-exporta-apierror) |
| 409 / sin conexión / sin cuerpo (US2) | `api-test.js`, `compraService-test.js` | [cliente-api.md](./contracts/cliente-api.md) |
| Filtros vacíos omitidos, PATCH sin cuerpo, públicas sin token (US3) | `eventoService-test.js`, `compraService-test.js` | [servicios.md](./contracts/servicios.md) |

## 2. Calidad

```bash
npm run lint && npm run format     # desde la raíz
grep -rn "fetch(" frontend/src     # debe quedar vacío: todo pasa por axios (FR-001)
```

## 3. Validación manual end-to-end (opcional)

1. `npm run dev:backend` y `npm run dev:frontend`; abrir la app.
2. Registrarse e iniciar sesión: mismos mensajes y navegación que antes (US4).
3. Probar credenciales incorrectas: aparece el mensaje del backend, sin intentos de refresh en la consola del backend.
4. Renovación sin esperar 15 min: arrancar el backend con `JWT_ACCESS_EXPIRATION=10s` (leída en `backend/src/utils/configJwt.js`), iniciar sesión, esperar 10 s y disparar una operación autenticada desde una pantalla de prueba o la consola de Expo: debe completarse y verse un único `POST /api/refresh`.
5. Reiniciar el backend (memoria vacía → refresh inválido) y repetir: la app vuelve a estado anónimo.
6. Apagar el backend y reintentar el login: "No pudimos conectar con el servidor. Revisá tu conexión."

## Resultado de la validación (2026-11-20)

- Suite del frontend: 19 suites, 142 pruebas en verde. Pruebas de login y registro sin modificar.
- Lint de `frontend/` sin errores ni advertencias; Prettier en verde en los archivos de la feature.
- `grep -rn "fetch(" frontend/src`: sin resultados.
- E2E automatizado contra el backend real (`JWT_ACCESS_EXPIRATION=10s`, puerto 3999), con una prueba Jest temporal y el adaptador `http` de axios (el entorno de Jest de Expo no tiene red real): registro + login, `listarMisCompras` ok; tras vencer el access token, 3 llamadas concurrentes resolvieron con **una sola** renovación (`guardarTokens` 1 vez); con refresh inválido, la petición falló con 401 y `alExpirar` se llamó 1 vez; las rutas públicas siguieron funcionando.
- Pendiente: los pasos 2, 3 y 6 de la sección 3 (pantallas de login/registro y backend apagado en un dispositivo o emulador).
