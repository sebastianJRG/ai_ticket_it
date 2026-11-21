# Quickstart: validar detalle de evento y compra de entradas

**Feature**: `005-detalle-evento-compra`

## Prerrequisitos

- Node 20 y dependencias instaladas en la raíz: `npm install`. **Sin dependencias nuevas.**
- `frontend/.env` con `EXPO_PUBLIC_API_URL` apuntando al backend (ver `frontend/.env.example`).
- Backend de `main` (sin cambios en esta feature): `npm run dev:backend`.

## 1. Pruebas automatizadas

```bash
cd frontend
npx jest __tests__/eventos/detalle-test.js __tests__/compras __tests__/resenias   # lógica pura (SC-002: tope de cantidad)
npx jest __tests__/hooks                      # useEvento, useReseniasOrganizador, useCrearCompra (SC-003: doble toque)
npx jest __tests__/components                 # TicketTypeRow, QuantityStepper, ReviewCard, Avatar, Rating, ResumenCompra, BarraAccion
npx jest __tests__/navegacion                 # reglas del checkout, RutaProtegida, rutas (volverA → checkout)
npx jest __tests__/screens/detalle-evento-test.jsx __tests__/screens/checkout-test.jsx
npm test                                      # suite completa, sin regresiones de 003/004
```

Resultado esperado: todo en verde. Casos por pantalla: [contracts/pantallas.md › Pruebas](./contracts/pantallas.md#pruebas-de-pantalla-resumen-de-casos).

## 2. Lint y formato

```bash
npm run lint && npm run format   # desde la raíz; verifica también el JSDoc de frontend/src
```

## 3. Datos para la validación manual

El backend arranca vacío. Con la app o con `curl`:

1. Registrar un ORGANIZADOR y dos COMPRADORES (A y B).
2. Como ORGANIZADOR: crear una categoría y estos eventos:
   - **E1** futuro con tres tipos: General `$ 25.000` cupo 100, Platea `$ 40.000` cupo **2**, Invitación `$ 0` cupo 10; sin `multimedia`.
   - **E2** futuro con un único tipo `$ 10.000` cupo 5 y `multimedia: ["https://…jpg"]`.
   - **E3** con fecha ~2 minutos en el futuro y un tipo de entrada.
3. Reseñas para CU-10: como comprador A, comprar E3; como ORGANIZADOR, confirmar (`PATCH /api/compras/:id/confirmacion`); esperar a que pase la fecha y a que la tarea periódica (`INTERVALO_UTILIZADAS_MS`, 60 s) la marque UTILIZADA; `POST /api/resenias` con `puntuacion: 5`. Repetir con más compradores/eventos si se quiere ver "Ver todas" (> 2 reseñas).

## 4. Validación manual

| # | Pasos | Resultado esperado | Traza |
|---|-------|--------------------|-------|
| 1 | Sin sesión, abrir E1 desde Explorar | Arte por categoría, nombre, fecha larga, categoría, descripción, organizador con puntaje, 3 tipos ("Gratis" en Invitación), barra "Comprar entradas · desde $ 0" | US1-1, FR-001 |
| 2 | Ver la sección de reseñas de E1 | Promedio y cantidad, 2 reseñas más recientes; con > 2, "Ver todas las N reseñas" expande | US2-1, SC-004 |
| 3 | Abrir el detalle de un evento de un organizador sin reseñas | "Este organizador todavía no tiene reseñas" | US2-2 |
| 4 | Abrir `/evento/no-existe` | "Evento no encontrado" con "Volver a Explorar" | US1-3 |
| 5 | Abrir E3 cuando ya ocurrió | "Evento finalizado", botón deshabilitado | US1-2, FR-003 |
| 6 | Sin sesión, tocar "Comprar entradas" en E1 → iniciar sesión como A | Va a login y vuelve a `/evento/<E1>/comprar` | US3-5 |
| 7 | En el checkout de E1: elegir Platea, tocar "+" | Llega a 2, "+" deshabilitado, "Máximo 2" | US3-2, SC-002 |
| 8 | Con Platea × 2 | Total "$ 80.000" y botón "Confirmar compra · $ 80.000" | US3-1, FR-005 |
| 9 | Tocar "Confirmar" dos veces rápido | Botón cargando; se crea **una** compra (verificar con `GET /api/compras` de A) | SC-003 |
| 10 | Éxito | "Compra creada", "Quedó pendiente de confirmación del organizador.", total del servidor, "Ver mis compras" lleva a `/compras` | US3-6, FR-007 |
| 11 | Como B, en el checkout de E1, Platea × 1 → Confirmar | Aviso "No quedan suficientes entradas de este tipo" + "Cupo insuficiente: quedan 0 …"; se puede elegir otro tipo | US3-3 |
| 12 | Abrir el checkout de E3 justo antes de que ocurra y confirmar después | Mensaje del servidor (evento ya ocurrido), sin compra creada, botón "Evento finalizado" | US3-4 |
| 13 | Como ORGANIZADOR, abrir E1 y luego `/evento/<E1>/comprar` | Detalle sin barra de compra; el checkout redirige al detalle | Edge case, FR-003 |
| 14 | E2 (un solo tipo): "Comprar entradas" → "Confirmar" | 2 interacciones; tipo preseleccionado | SC-001 |
| 15 | Repetir 1 y 7 en tema oscuro y con lector de pantalla | Contraste AA; filas anunciadas como radio; cantidad anunciada | Accesibilidad |
