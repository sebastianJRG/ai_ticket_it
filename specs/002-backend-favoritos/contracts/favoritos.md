# Contrato HTTP: Favoritos del comprador

**Feature**: `002-backend-favoritos` | **Base**: `/api/usuarios/favoritos` | **Consumidor**: `frontend/src/services/usuarioService.js` (`listarFavoritos`, `agregarFavorito`, `quitarFavorito`; ver [contrato 001](../../001-servicios-api-axios/contracts/servicios.md))

## Común a las tres rutas

- **Autenticación**: `Authorization: Bearer <accessToken>`. El usuario sale **siempre** del token, nunca de la URL ni del cuerpo.
- **Rol**: solo `COMPRADOR`.
- **Cuerpo de la petición**: ninguno (se ignora si viene).
- **Cuerpo de éxito**: `200` con `EventoRespuesta[]` en orden de agregado (`[]` si no hay). Mismo formato que cada elemento de `GET /api/eventos` ([data-model](../data-model.md#representación-de-respuesta-evento-público)).
- **Errores**: cuerpo `{ "message": string }` (manejador central de `app.js`).
- **ID de petición (opcional)**: el cliente puede enviar `X-Request-Id` (1–128 caracteres de `[A-Za-z0-9_-]`) para correlacionar logs; si falta o no es válido, el servidor genera uno. No cambia la respuesta.

| Código | Cuándo |
|--------|--------|
| 400 | `:idEvento` vacío tras `trim` (p. ej. `%20`) |
| 401 | sin token o token inválido |
| 403 | token válido de un rol distinto de COMPRADOR |
| 404 | el usuario del token ya no existe; o (solo PUT) el evento no existe |

## GET `/api/usuarios/favoritos`

Lista los favoritos del comprador. Los eventos que ya no existan se omiten.

```http
GET /api/usuarios/favoritos
Authorization: Bearer eyJ...
```

```json
200 OK
[
  {
    "id": "1",
    "nombre": "Rock Fest",
    "descripcion": "Festival de rock",
    "fecha": "2100-01-01T20:00:00.000Z",
    "categoria": { "id": "1", "nombre": "Música", "descripcion": "Conciertos" },
    "tiposEntrada": [{ "id": "1", "nombre": "General", "precio": 100, "cupo": 50 }],
    "multimedia": [],
    "organizador": { "id": "2", "nombre": "Org", "apellido": "Detalle", "rol": "ORGANIZADOR" },
    "puntajeOrganizador": null
  }
]
```

Errores: 401, 403, 404 (usuario).

Efecto: logs estructurados `{"evento":"favoritos_listados","requestId","usuarioId","rol","cantidad"}` y `{"evento":"eventos_resueltos","requestId","solicitados","encontrados"}`.

## PUT `/api/usuarios/favoritos/:idEvento`

Agrega el evento a favoritos. **Idempotente**: si ya estaba, no se duplica ni cambia de posición. Se permite un evento que ya ocurrió.

```http
PUT /api/usuarios/favoritos/1
Authorization: Bearer eyJ...
```

`200 OK` con la lista actualizada (mismo formato que GET).

Errores: 400 (ID), 401, 403, 404 (usuario o evento inexistente; mensaje `El evento con ID <id> no existe.`).

Efecto: log estructurado `{"evento":"favorito_agregado","requestId","usuarioId","rol":"COMPRADOR","eventoId","cantidad"}` (más `eventos_resueltos` al armar la respuesta).

## DELETE `/api/usuarios/favoritos/:idEvento`

Quita el evento de favoritos. **Idempotente**: si no estaba (o el evento no existe), responde 200 con la lista sin cambios.

```http
DELETE /api/usuarios/favoritos/1
Authorization: Bearer eyJ...
```

`200 OK` con la lista actualizada (mismo formato que GET).

Errores: 400 (ID), 401, 403, 404 (usuario).

Efecto: log estructurado `{"evento":"favorito_quitado","requestId","usuarioId","rol":"COMPRADOR","eventoId","cantidad"}` (más `eventos_resueltos` al armar la respuesta).

## Compatibilidad (FR-008)

Sin cambios en `GET /api/usuarios`, `POST /api/usuarios` ni `GET /api/usuarios/:idOrganizador/resenias`. El perfil sigue sin exponer `favoritos`.
