# Quickstart: validar Mis compras del comprador

**Feature**: `006-mis-compras-comprador` | Contratos: [pantallas.md](./contracts/pantallas.md), [componentes.md](./contracts/componentes.md) · Modelo: [data-model.md](./data-model.md)

## Prerrequisitos

- Node 20 y dependencias instaladas en la raíz (`npm install`).
- Backend con datos de prueba: `npm run dev:backend:seed` (usuarios en `AGENTS.md`, contraseña `Prueba123!`).
- Frontend: `npm run dev:frontend` (web con `w`, o Expo Go).

## Pruebas automáticas

```bash
cd frontend
npx jest __tests__/compras/misCompras-test.js __tests__/resenias/calificacion-test.js
npx jest __tests__/components/{Tabs,PurchaseCard,StatusTimeline,RatingInput}-test.jsx
npx jest __tests__/hooks/{useMisCompras,useCancelarCompra,useCalificarEvento}-test.jsx
npx jest __tests__/navegacion/reglas-test.js
npx jest __tests__/screens/{mis-compras,detalle-compra}-test.jsx
npm test            # suite completa en verde
npm run lint        # incluye JSDoc (eslint-plugin-jsdoc)
```

Esperado: todo en verde. En el ciclo TDD, estas pruebas se escriben y aprueban **antes** de implementar y deben fallar primero.

## Validación manual

Preparar datos (como `bruno.organizador`, sobre sus eventos del seed, y como `ana.comprador`):

1. Como `ana.comprador`, comprar entradas de 3 eventos distintos (quedan PENDIENTE).
2. Como `bruno.organizador`, confirmar una con `PATCH /api/compras/:id/confirmacion` (curl con su token) y cancelar otra con `/cancelacion`; confirmar otra y reembolsarla con `/reembolso`.
3. Para UTILIZADA hace falta un evento ya ocurrido: crear como organizador un evento con fecha unos minutos en el futuro, comprar y confirmar, y esperar a que pase la fecha (la tarea periódica corre cada 60 s; se puede bajar con `INTERVALO_UTILIZADAS_MS`).

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 1 | US1 pestañas | Abrir Compras | Activas muestra PENDIENTE y CONFIRMADA; Pasadas la UTILIZADA; Canceladas CANCELADA y REEMBOLSADA; contadores coinciden; la más reciente arriba |
| 2 | US1 días | Ver la CONFIRMADA | Badge "Confirmada · faltan N días" y cuenta regresiva destacada ("Es hoy" si el evento es hoy) |
| 3 | US1 vacío | Entrar como `lucas.comprador` sin compras | "Todavía no compraste entradas" + "Explorar eventos" lleva a `/explorar` |
| 4 | US1 actualizar | Confirmar otra compra desde el backend y deslizar hacia abajo | La tarjeta cambia de estado sin salir de la pantalla |
| 5 | US2 cancelar | En una Activa futura tocar "Cancelar" → "Sí, cancelar compra" | Toast "Compra cancelada"; la compra pasa a Canceladas (2 toques) |
| 6 | US2 no cancelable | Revisar UTILIZADA, CANCELADA, REEMBOLSADA | No hay acción de cancelar (ni en tarjeta ni en detalle) |
| 7 | US2 rechazo | Abrir el diálogo de una compra cuyo evento ya pasó (dejar la app abierta hasta que pase la fecha) y confirmar | Toast con el error del servidor; la lista se recarga |
| 8 | US3 detalle | Tocar una tarjeta | Resumen, badge, pestañas Detalle/Chat; la línea de estado marca el estado actual (Cancelada: Pendiente → Cancelada; Reembolsada: Pendiente → Confirmada → Reembolsada) |
| 9 | US4 validación | En la UTILIZADA: "Calificar evento" → "Enviar reseña" sin estrellas | "Elegí de 1 a 5 estrellas"; sin petición. Comentario solo con espacios → "Escribí un comentario" |
| 10 | US4 envío | 4 estrellas + comentario → enviar | Toast "¡Gracias por tu reseña!"; la sección dice "Ya calificaste este evento"; la reseña aparece en el detalle del evento |
| 11 | US4 una vez | Volver a abrir la compra (o otra del mismo evento) | No se ofrece calificar; si se fuerza el envío (p. ej. falla la verificación), 409 → "Ya calificaste este evento" |
| 12 | Acceso | Abrir `/compra/<id>` sin sesión; y como organizador | Visitante → login y vuelve al detalle tras iniciar sesión; organizador → `/organizador/eventos` |
| 13 | Accesibilidad | Lector de pantalla en Compras y en el formulario | Pestañas anuncian "Activas, 2, seleccionada"; estrellas como radios "4 estrellas, Muy bueno" |
