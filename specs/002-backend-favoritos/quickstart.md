# Quickstart: validar Favoritos del comprador

**Feature**: `002-backend-favoritos` | Contrato: [contracts/favoritos.md](./contracts/favoritos.md) | Modelo: [data-model.md](./data-model.md)

## Prerrequisitos

- Node.js 20 y dependencias instaladas en la raíz del monorepo (`npm install`).
- Rama `002-backend-favoritos`.

## 1. Suite automatizada (camino principal)

```bash
npm run test:backend          # node:test (integración) + Jest (unitarias)
```

Esperado:

- `tests/favoritos.test.js` (node:test) en verde: cubre todos los escenarios de aceptación de US1–US3 y los edge cases de la spec.
- `tests/unit/utils/requestId.test.js`, `tests/unit/usuarios/favoritos.service.test.js`, `tests/unit/usuarios/favoritos.controller.test.js` y `tests/unit/eventos/eventos.obtenerPorIds.service.test.js` (Jest) en verde.
- 0 fallos en el resto de la suite (SC-003). En particular `tests/usuarios.test.js › no expone hashes ni favoritos` sigue pasando.

Durante TDD, antes de implementar, las pruebas nuevas deben **fallar** (rojo) tras la aprobación del usuario.

```bash
npm run lint                  # ESLint sin errores en los archivos nuevos/modificados
```

## 2. Prueba manual con curl

```bash
npm run dev:backend           # http://localhost:3000 (o el PORT configurado)
```

En otra terminal (`B=http://localhost:3000/api`; requiere `jq`):

```bash
# Organizador + categoría + evento
curl -s -XPOST $B/usuarios -H 'Content-Type: application/json' \
  -d '{"nombre":"Org","apellido":"Uno","nombreUsuario":"org1","contrasenia":"Clave123!","rol":"ORGANIZADOR"}'
TO=$(curl -s -XPOST $B/login -H 'Content-Type: application/json' \
  -d '{"nombreUsuario":"org1","contrasenia":"Clave123!"}' | jq -r .accessToken)
CAT=$(curl -s -XPOST $B/categorias -H "Authorization: Bearer $TO" -H 'Content-Type: application/json' \
  -d '{"nombre":"Música","descripcion":"Conciertos"}' | jq -r .id)
EV=$(curl -s -XPOST $B/eventos -H "Authorization: Bearer $TO" -H 'Content-Type: application/json' \
  -d "{\"nombre\":\"Rock\",\"descripcion\":\"Fest\",\"categoriaId\":\"$CAT\",\"fecha\":\"2100-01-01T20:00:00Z\",\"tiposEntrada\":[{\"nombre\":\"General\",\"descripcion\":\"Campo\",\"precio\":100,\"cupo\":10}]}" | jq -r .id)

# Comprador
curl -s -XPOST $B/usuarios -H 'Content-Type: application/json' \
  -d '{"nombre":"Ana","apellido":"Paz","nombreUsuario":"ana","contrasenia":"Clave123!","rol":"COMPRADOR"}'
TC=$(curl -s -XPOST $B/login -H 'Content-Type: application/json' \
  -d '{"nombreUsuario":"ana","contrasenia":"Clave123!"}' | jq -r .accessToken)
```

| # | Comando | Resultado esperado |
|---|---------|--------------------|
| 1 | `curl -s $B/usuarios/favoritos -H "Authorization: Bearer $TC"` | `200 []` (US3-2) |
| 2 | `curl -s -XPUT $B/usuarios/favoritos/$EV -H "Authorization: Bearer $TC"` | `200` lista con 1 evento, `organizador` sin hashes, `puntajeOrganizador: null` (US1-1) |
| 3 | repetir #2 | sigue habiendo exactamente 1 evento (US1-2, SC-002) |
| 4 | `curl -s -XPUT $B/usuarios/favoritos/999 -H "Authorization: Bearer $TC" -w '%{http_code}'` | `404` (US1-3) |
| 5 | `curl -s $B/usuarios/favoritos -H "Authorization: Bearer $TC"` | `200` con el evento (US3-1) |
| 6 | `curl -s -XDELETE $B/usuarios/favoritos/$EV -H "Authorization: Bearer $TC"` | `200 []` (US2-1) |
| 7 | repetir #6 | `200 []` (US2-2) |
| 8 | `curl -s $B/usuarios/favoritos -w '%{http_code}'` | `401` |
| 9 | `curl -s $B/usuarios/favoritos -H "Authorization: Bearer $TO" -w '%{http_code}'` | `403` |
| 10 | `curl -s -XPUT "$B/usuarios/favoritos/%20" -H "Authorization: Bearer $TC" -w '%{http_code}'` | `400` |
| 11 | `curl -s $B/usuarios -H "Authorization: Bearer $TC"` | perfil **sin** `favoritos` (FR-008) |

En la consola del servidor:

- Los pasos 2, 3, 6 y 7 emiten `favorito_agregado` / `favorito_quitado`.
- Los pasos 1 y 5 emiten `favoritos_listados`.
- Todas las respuestas exitosas emiten `eventos_resueltos`.
- Cada línea lleva `requestId`.

Repetir el paso 1 con `-H 'X-Request-Id: prueba-123'` debe mostrar `"requestId":"prueba-123"` en el log. Con `-H 'X-Request-Id: <script>'` se ve un UUID generado.

## 3. Cierre

- `AGENTS.md` documenta las tres rutas en la sección de usuarios (FR-010).
- El frontend (`usuarioService.listarFavoritos/agregarFavorito/quitarFavorito`) deja de recibir 404 de ruta inexistente.
