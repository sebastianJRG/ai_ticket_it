# Quickstart: validar Eventos del organizador

**Feature**: `007-organizador-eventos` | Contratos: [pantallas.md](./contracts/pantallas.md) y [componentes.md](./contracts/componentes.md) | Modelo: [data-model.md](./data-model.md)

## Requisitos previos

- Node 20 y las dependencias instaladas (`npm install` en la raíz).
- Ninguna dependencia nueva: `npx expo-doctor` dentro de `frontend/` no debe reportar cambios.

## 1. Pruebas automáticas

```bash
cd frontend && npx jest \
  __tests__/eventos/formularioEvento-test.js \
  __tests__/eventos/misEventos-test.js \
  __tests__/compras/gestionCompras-test.js \
  __tests__/navegacion/reglas-test.js \
  __tests__/components/{Select,TicketTypeForm,AgregarTipoEntrada,AvailabilitySummary,OrganizerPurchaseRow}-test.jsx \
  __tests__/hooks/{useMisEventos,useCrearEvento,useCrearCategoria,useCategorias,useComprasEvento,useAccionCompra,useComprasOrganizador}-test.jsx \
  __tests__/screens/{mis-eventos,crear-evento,compras-evento,mensajes-organizador,detalle-compra}-test.jsx
cd frontend && npx jest          # suite completa: nada de 001–006 se rompe
npm run lint && npm run format   # JSDoc (eslint-plugin-jsdoc) y estilo
npm run test:backend             # sin cambios en backend: tiene que seguir verde
```

Resultado esperado: todo verde. Las pruebas puras cubren SC-002 (paridad de validaciones) y SC-004 (matriz de acciones).

## 2. Prueba manual con datos de prueba

```bash
npm run dev:backend:seed   # terminal 1
npm run dev:frontend       # terminal 2 (web, Android o iOS)
```

Usuarios: `bruno.organizador`, `sofia.organizadora`, `ana.comprador` y `lucas.comprador` (contraseña `Prueba123!`, ver AGENTS.md › Datos de prueba).

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 1 | US2-1 | Entrar como `bruno.organizador` | Mis eventos muestra solo sus 3 eventos, en "Próximos". Con `sofia.organizadora` se ven otros 3 distintos |
| 2 | US2-2 | Registrar un organizador nuevo y abrir Mis eventos | Estado vacío con "Crear evento" |
| 3 | US1-1 | En Crear, agregar 2 tipos más (son 3) y quitar el 2.º | Quedan "Tipo de entrada 1" y "2" (el antiguo 3.º). El único que queda no tiene papelera |
| 4 | US1-2 | Dejar el nombre vacío y salir del campo; precio `-5`; cupo `1,5`; fecha `01/01/2020` | Cada campo muestra su mensaje accionable (research R5). "Publicar" no envía nada (Network sin `POST`) |
| 5 | US1-4 | Categoría → "+ Crear categoría" → "Jazz" / "Música en vivo" | Toast "Categoría creada" y "Jazz" queda elegida |
| 6 | US1-3, SC-001 | Completar un evento con 2 tipos (General $0 × 100 y VIP $15000 × 20) y publicar | Toast "Evento publicado" y se abre `/evento/<id>/compras` con 0 vendidas. El evento aparece en Mis eventos y, como `ana.comprador`, en Explorar con "Gratis"/"Desde". En total, menos de 3 minutos |
| 7 | US1-5 | Con el backend detenido, publicar | Banner "Sin conexión. Tus datos siguen acá." y el formulario intacto |
| 8 | Doble toque | Tocar "Publicar evento" dos veces rápido | Un solo `POST /api/eventos` |
| 9 | US3-1, US3-2 | Como `ana.comprador`, comprar 2 entradas General del evento creado en el paso 6. Como `lucas.comprador`, comprar 1 VIP. Volver como `bruno.organizador` y abrir el evento | Disponibilidad igual a la respuesta de `GET /api/eventos/<id>/compras` y "Pendientes 2" |
| 10 | US4-1, US4-5 | Confirmar la compra de Ana | Toast "Compra confirmada"; pasa a Confirmadas (1) y las vendidas no cambian (PENDIENTE ya ocupaba cupo) |
| 11 | US4-2, US4-4 | En Confirmadas, tocar "Reembolsar" | Modal destructivo con "2 × General a Ana … No se puede deshacer". "Sí, reembolsar" la manda a Canceladas y baja las vendidas en 2 |
| 12 | US4-3 | Ver una compra en Canceladas | Sin botones |
| 13 | US3-3 | Como `sofia.organizadora`, abrir `/evento/<id de Bruno>/compras` | "No tenés acceso a este evento" |
| 14 | Acceso | Como `ana.comprador`, abrir `/evento/<id>/compras` | Redirige a `/evento/<id>` |
| 15 | US5-1 | Como `bruno.organizador`, abrir Mensajes | Compras agrupadas por evento (comprador, tipo y estado). Al tocar una se abre `/compra/<id>?evento=<id>` con Detalle y Chat (provisorio hasta 008) |
| 16 | Error de acción | Abrir las compras en dos pestañas del navegador, cancelar en una y luego confirmar en la otra | Toast "No se pudo confirmar la compra: …" y la lista se recarga |

## 3. Accesibilidad y tema

- Con TalkBack o VoiceOver:
  - las barras de disponibilidad se anuncian como progreso con "N de M vendidas";
  - las pestañas se anuncian con su contador;
  - el Select se anuncia como botón con el valor elegido.
- Con el tema oscuro, `AvailabilitySummary`, `OrganizerPurchaseRow` y `Select` respetan los tokens.
