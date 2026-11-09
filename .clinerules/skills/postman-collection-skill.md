# Postman Collection Skill

## Propósito

Mantener la colección de Postman `backend/postman/backend.postman_collection.json` actualizada
cada vez que se agregue una nueva ruta al backend.

---

## Archivos relacionados

- `backend/postman/backend.postman_collection.json` — La colección escribible para Postman.
- `.clinerules/skills/postman-collection-skill.md` — Este archivo.

---

## Qué mantener actualizado

- **Variables de la colección**: si una nueva ruta necesita datos en el body, los agrega aquí.
- **Carpetas de recursos**: una carpeta por recurso (usuario, evento, compra, categoría, etc.).
- **Solicitudes**: una solicitud por método y acción (POST /crear, GET /listar, PUT /actualizar, DELETE /eliminar).
- **Respuestas de ejemplo**: al menos una respuesta exitosa y una de error para cada método.

---

## Cómo agregar una nueva ruta

### 1. Identificar el recurso

En el backend, cada ruta empieza con `/api/`. El primer segmento después de `/api/` es el recurso,
p. ej.:

```
/api/usuarios
/api/eventos
/api/categorias
/api/compras
```

El nombre del recurso será el nombre de la carpeta (en minúsculas, singular o plural según prefieras)
y el nombre de la solicitud será la acción.

### 2. Agregar una carpeta en la colección

Dentro del array `item`, agrega un objeto como este para una nueva carpeta:

```json
{
	"name": "NuevoRecurso",
	"item": []
}
```

### 3. Agregar una solicitud dentro de esa carpeta

Para cada método que exponga, agrega un objeto `request` con:

- `method`: `GET`, `POST`, `PUT`, `PATCH` o `DELETE`.
- `header`: `Content-Type: application/json` en los casos que necesiten body.
- `body`: en `mode: "raw"` y `raw: "..."` para peticiones que envien JSON.
- `url`: usando `{{base_url}}` y el camino relativo, por ejemplo:

```json
{
	"method": "POST",
	"header": [
		{
			"key": "Content-Type",
			"value": "application/json"
		}
	],
	"body": {
		"mode": "raw",
		"raw": "{\n  \"nombre\": \"{{nuevo_recurso_nombre}}\",\n  \"descripcion\": \"{{nuevo_recurso_descripcion}}\"\n}"
	},
	"url": {
		"raw": "{{base_url}}/nuevo-recurso",
		"host": ["{{base_url}}"],
		"path": ["nuevo-recurso"]
	}
}
```

### 4. Agregar variables de colección

Para cada campo que pueda cambiar en el cuerpo de la solicitud, agrega una variable de colección
con un nombre descriptivo y un valor inventado. Usa el patrón:

```
<recurso>_<campo>
```

Ejemplo para un recurso `evento`:

```json
{
	"key": "evento_nombre",
	"value": "Concierto de prueba",
	"type": "default"
}
```

Ejemplo para un recurso `compra`:

```json
{
	"key": "compra_cantidad",
	"value": 2,
	"type": "default"
}
```

### 5. Agregar ejemplos de respuesta

Dentro del objeto `request`, agrega un array `response` con al menos dos ejemplos:
una respuesta exitosa y una de error.

Ejemplo para una respuesta `201`:

```json
{
	"name": "Creación exitosa",
	"status": "201",
	"code": 201,
	"header": [],
	"body": ""
}
```

Ejemplo para una respuesta `400`:

```json
{
	"name": "Validación fallida",
	"status": "400",
	"code": 400,
	"header": [],
	"body": ""
}
```

### 6. Guardar y verificar

- Guarda el archivo `backend/postman/backend.postman_collection.json`.
- Abre la colección en Postman.
- Confirmar que todas las variables aparecen en el panel **Variables**.
- Prueba la nueva solicitud para asegurarte de que el endpoint responde correctamente.

---

## Buenas prácticas

- No modifiques la variable `base_url` a menos que cambie el puerto o el host del backend.
- No escribas datos reales en las variables de prueba; siempre usa datos inventados.
- Usa el patrón `<recurso>_<campo>` para que las variables sean únicas.
- Si una ruta requiere autenticación, agrega la variable `auth_token` y llámala en el header `Authorization`.
- Si hay múltiples métodos para el mismo recurso, agrupa todas las solicitudes dentro de la misma carpeta.

---

## Ejemplo: agregar `POST /api/eventos`

1. Agregar carpeta `Eventos`.
2. Agregar solicitud `Crear evento` (POST).
3. Agregar variables:
   - `evento_nombre`
   - `evento_descripcion`
   - `evento_fecha`
   - `evento_categoria_id`
   - `evento_organizador_id`
   - `evento_tipo_entrada` (puede ser un array en el request real, pero para la colección puedes usar un valor de prueba)
4. Agregar método `GET` para listar eventos.
5. Guardar.

---

## Notas finales

Esta skill se debe revisar y ejecutar a la vez que se implementa una nueva ruta en `backend/src`.
Si el desarrollador agrega un controlador, un servicio o una ruta, el mismo debe actualizar la
colección siguiendo los pasos anteriores.
