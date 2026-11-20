/**
 * Tests de integración de las rutas de favoritos del comprador:
 * GET /api/usuarios/favoritos, PUT y DELETE /api/usuarios/favoritos/:idEvento.
 * Levantan la app real en un puerto efímero y operan solo por HTTP.
 *
 * @license ISC
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

const json = { 'Content-Type': 'application/json' };

/**
 * Registra un usuario y abre su sesión.
 * @param {'COMPRADOR'|'ORGANIZADOR'} rol - Rol del usuario
 * @param {string} nombreUsuario - Nombre de usuario único en la suite
 * @returns {Promise<{token: string, id: string}>} Access token e ID del usuario
 */
async function registrarYLoguear(rol, nombreUsuario) {
	const registro = await (
		await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: json,
			body: JSON.stringify({
				nombre: 'Nombre',
				apellido: 'Apellido',
				nombreUsuario,
				contrasenia: 'Clave123!',
				rol
			})
		})
	).json();
	const { accessToken } = await (
		await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: json,
			body: JSON.stringify({ nombreUsuario, contrasenia: 'Clave123!' })
		})
	).json();
	return { token: accessToken, id: registro.id };
}

/**
 * Crea una categoría y un evento futuro del organizador dado.
 * @param {string} tokenOrganizador - Access token de un ORGANIZADOR
 * @param {string} nombre - Nombre del evento
 * @returns {Promise<string>} ID del evento creado
 */
async function crearEvento(tokenOrganizador, nombre) {
	const auth = { ...json, Authorization: `Bearer ${tokenOrganizador}` };
	const categoria = await (
		await fetch(`${baseUrl}/api/categorias`, {
			method: 'POST',
			headers: auth,
			body: JSON.stringify({ nombre: `Cat ${nombre}`, descripcion: 'Desc' })
		})
	).json();
	const evento = await (
		await fetch(`${baseUrl}/api/eventos`, {
			method: 'POST',
			headers: auth,
			body: JSON.stringify({
				nombre,
				descripcion: `Descripción de ${nombre}`,
				categoriaId: categoria.id,
				fecha: '2100-01-01T20:00:00.000Z',
				tiposEntrada: [
					{ nombre: 'General', descripcion: 'Entrada', precio: 100, cupo: 50 }
				]
			})
		})
	).json();
	assert.ok(evento.id, `no se pudo crear el evento ${nombre}`);
	return evento.id;
}

/**
 * Hace una petición a las rutas de favoritos.
 * @param {'GET'|'PUT'|'DELETE'} metodo - Método HTTP
 * @param {string} [idEvento] - ID (ya codificado) para PUT/DELETE; omitido en GET
 * @param {string} [token] - Access token; sin él la petición va anónima
 * @returns {Promise<Response>} Respuesta HTTP
 */
function pedir(metodo, idEvento, token) {
	const ruta =
		idEvento === undefined
			? '/api/usuarios/favoritos'
			: `/api/usuarios/favoritos/${idEvento}`;
	const headers = token ? { Authorization: `Bearer ${token}` } : {};
	return fetch(`${baseUrl}${ruta}`, { method: metodo, headers });
}

before(async () => {
	server = createApp().listen(0);
	await new Promise((resolve) => server.once('listening', resolve));
	baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

// Prueba de humo: garantiza que la suite tenga al menos un caso (sin casos,
// node:test no ejecuta el `after` y el servidor queda abierto).
describe('andamiaje de favoritos', () => {
	it('el servidor responde y los helpers preparan datos', async () => {
		const organizador = await registrarYLoguear('ORGANIZADOR', 'fav.humo.org');
		const comprador = await registrarYLoguear('COMPRADOR', 'fav.humo.comp');

		const idEvento = await crearEvento(organizador.token, 'Humo');

		assert.ok(comprador.token);
		assert.ok(idEvento);
		assert.equal(typeof pedir, 'function');
	});
});

describe('PUT /api/usuarios/favoritos/:idEvento', () => {
	let organizador;
	let comprador;
	let idEvento;

	before(async () => {
		organizador = await registrarYLoguear('ORGANIZADOR', 'fav.put.org');
		comprador = await registrarYLoguear('COMPRADOR', 'fav.put.comp');
		idEvento = await crearEvento(organizador.token, 'Put Fest');
	});

	it('agrega el evento y devuelve 200 con la lista en formato público', async () => {
		const res = await pedir('PUT', idEvento, comprador.token);

		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.length, 1);
		assert.equal(body[0].id, idEvento);
		assert.equal(body[0].nombre, 'Put Fest');
		assert.equal(body[0].organizador.id, organizador.id);
		assert.equal(body[0].organizador.contraseniaHash, undefined);
		assert.equal(body[0].organizador.refreshTokenHash, undefined);
		assert.equal(body[0].puntajeOrganizador, null);
	});

	it('es idempotente: repetirlo deja exactamente un favorito', async () => {
		await pedir('PUT', idEvento, comprador.token);
		const res = await pedir('PUT', idEvento, comprador.token);

		assert.equal(res.status, 200);
		assert.equal((await res.json()).length, 1);
	});

	it('responde 404 si el evento no existe', async () => {
		const res = await pedir('PUT', '999', comprador.token);

		assert.equal(res.status, 404);
		assert.ok((await res.json()).message);
	});

	it('responde 400 si el ID queda vacío', async () => {
		const res = await pedir('PUT', '%20', comprador.token);

		assert.equal(res.status, 400);
	});

	it('responde 401 sin token', async () => {
		const res = await pedir('PUT', idEvento);

		assert.equal(res.status, 401);
	});

	it('responde 403 con token de ORGANIZADOR', async () => {
		const res = await pedir('PUT', idEvento, organizador.token);

		assert.equal(res.status, 403);
	});
});

describe('DELETE /api/usuarios/favoritos/:idEvento', () => {
	let organizador;
	let comprador;
	let idA;
	let idB;

	before(async () => {
		organizador = await registrarYLoguear('ORGANIZADOR', 'fav.del.org');
		comprador = await registrarYLoguear('COMPRADOR', 'fav.del.comp');
		idA = await crearEvento(organizador.token, 'Del A');
		idB = await crearEvento(organizador.token, 'Del B');
		await pedir('PUT', idA, comprador.token);
		await pedir('PUT', idB, comprador.token);
	});

	it('quita el evento y devuelve 200 con la lista actualizada', async () => {
		const res = await pedir('DELETE', idA, comprador.token);

		assert.equal(res.status, 200);
		const body = await res.json();
		assert.deepEqual(
			body.map((e) => e.id),
			[idB]
		);
		assert.equal(body[0].organizador.contraseniaHash, undefined);
	});

	it('es idempotente: repetirlo devuelve 200 con la lista igual', async () => {
		const res = await pedir('DELETE', idA, comprador.token);

		assert.equal(res.status, 200);
		assert.deepEqual(
			(await res.json()).map((e) => e.id),
			[idB]
		);
	});

	it('quitar un evento inexistente responde 200 sin cambios', async () => {
		const res = await pedir('DELETE', '999', comprador.token);

		assert.equal(res.status, 200);
		assert.equal((await res.json()).length, 1);
	});

	it('responde 400 si el ID queda vacío', async () => {
		const res = await pedir('DELETE', '%20', comprador.token);

		assert.equal(res.status, 400);
	});

	it('responde 401 sin token', async () => {
		const res = await pedir('DELETE', idB);

		assert.equal(res.status, 401);
	});

	it('responde 403 con token de ORGANIZADOR', async () => {
		const res = await pedir('DELETE', idB, organizador.token);

		assert.equal(res.status, 403);
	});
});

describe('GET /api/usuarios/favoritos', () => {
	let organizador;
	let comprador;
	let idA;
	let idB;

	before(async () => {
		organizador = await registrarYLoguear('ORGANIZADOR', 'fav.get.org');
		comprador = await registrarYLoguear('COMPRADOR', 'fav.get.comp');
		idA = await crearEvento(organizador.token, 'Get A');
		idB = await crearEvento(organizador.token, 'Get B');
	});

	it('devuelve [] a un comprador sin favoritos', async () => {
		const res = await pedir('GET', undefined, comprador.token);

		assert.equal(res.status, 200);
		assert.deepEqual(await res.json(), []);
	});

	it('devuelve los favoritos en orden de agregado', async () => {
		await pedir('PUT', idB, comprador.token);
		await pedir('PUT', idA, comprador.token);

		const res = await pedir('GET', undefined, comprador.token);

		assert.equal(res.status, 200);
		assert.deepEqual(
			(await res.json()).map((e) => e.id),
			[idB, idA]
		);
	});

	it('cada evento tiene el mismo formato que GET /api/eventos/:idEvento', async () => {
		const favoritos = await (
			await pedir('GET', undefined, comprador.token)
		).json();

		for (const favorito of favoritos) {
			const detalle = await (
				await fetch(`${baseUrl}/api/eventos/${favorito.id}`)
			).json();
			assert.deepEqual(favorito, detalle);
		}
	});

	it('responde 401 sin token', async () => {
		const res = await pedir('GET');

		assert.equal(res.status, 401);
	});

	it('responde 403 con token de ORGANIZADOR', async () => {
		const res = await pedir('GET', undefined, organizador.token);

		assert.equal(res.status, 403);
	});

	it('el perfil (GET /api/usuarios) sigue sin exponer favoritos', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			headers: { Authorization: `Bearer ${comprador.token}` }
		});

		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.id, comprador.id);
		assert.equal(body.favoritos, undefined);
	});
});
