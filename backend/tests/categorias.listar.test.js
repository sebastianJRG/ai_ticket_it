/**
 * Tests de integración de `GET /api/categorias`.
 * Verifican que la ruta es pública y que lista las categorías en orden de creación.
 *
 * @license ISC
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import UsuarioRepository from '../src/repositories/usuarioRepository.js';

let server;
let baseUrl;
let tokenOrganizador;
let tokenComprador;

/** Envía una petición JSON a la API y devuelve la respuesta. */
function api(metodo, ruta, { token, cuerpo } = {}) {
	return fetch(`${baseUrl}/api${ruta}`, {
		method: metodo,
		headers: {
			...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {})
		},
		body: cuerpo ? JSON.stringify(cuerpo) : undefined
	});
}

/** Crea un usuario, inicia sesión y devuelve su access token. */
async function tokenDe(nombreUsuario, rol) {
	const contrasenia = 'Clave123!';
	const creado = await api('POST', '/usuarios', {
		cuerpo: { nombre: 'Test', apellido: 'Uno', nombreUsuario, contrasenia, rol }
	});
	assert.equal(creado.status, 201);
	const login = await api('POST', '/login', {
		cuerpo: { nombreUsuario, contrasenia }
	});
	assert.equal(login.status, 200);
	return (await login.json()).accessToken;
}

before(async () => {
	server = createApp(new UsuarioRepository()).listen(0);
	await new Promise((resolve) => server.once('listening', resolve));
	baseUrl = `http://127.0.0.1:${server.address().port}`;
	tokenOrganizador = await tokenDe('organizador.categorias', 'ORGANIZADOR');
	tokenComprador = await tokenDe('comprador.categorias', 'COMPRADOR');
});

after(() => new Promise((resolve) => server.close(resolve)));

describe('GET /api/categorias', () => {
	it('es público: responde 200 con una lista vacía sin token', async () => {
		const res = await api('GET', '/categorias');

		assert.equal(res.status, 200);
		assert.deepEqual(await res.json(), []);
	});

	it('lista las categorías creadas, en orden de creación, sin token', async () => {
		for (const [nombre, descripcion] of [
			['Música', 'Conciertos'],
			['Teatro', 'Obras']
		]) {
			const creada = await api('POST', '/categorias', {
				token: tokenOrganizador,
				cuerpo: { nombre, descripcion }
			});
			assert.equal(creada.status, 201);
		}

		const res = await api('GET', '/categorias');

		assert.equal(res.status, 200);
		const categorias = await res.json();
		assert.deepEqual(
			categorias.map((c) => [c.nombre, c.descripcion]),
			[
				['Música', 'Conciertos'],
				['Teatro', 'Obras']
			]
		);
		assert.ok(categorias.every((c) => typeof c.id === 'string' && c.id));
	});

	it('también responde 200 con un token de COMPRADOR', async () => {
		const res = await api('GET', '/categorias', { token: tokenComprador });

		assert.equal(res.status, 200);
	});
});
