/**
 * Tests de integración de `GET /api/eventos/:idEvento/compras`.
 * Verifican autenticación, rol, propiedad del evento y el listado completo.
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
let tokenOtroOrganizador;
let tokenComprador;
let tokenOtroComprador;
let evento;

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

/** Crea una compra de 1 entrada del evento con el token dado. */
async function comprar(token) {
	const res = await api('POST', '/compras', {
		token,
		cuerpo: {
			eventoId: evento.id,
			tipoEntradaId: evento.tiposEntrada[0].id,
			cantidad: 1
		}
	});
	assert.equal(res.status, 201);
	return res.json();
}

before(async () => {
	server = createApp(new UsuarioRepository()).listen(0);
	await new Promise((resolve) => server.once('listening', resolve));
	baseUrl = `http://127.0.0.1:${server.address().port}`;
	tokenOrganizador = await tokenDe('organizador.lista', 'ORGANIZADOR');
	tokenOtroOrganizador = await tokenDe('otro.org.lista', 'ORGANIZADOR');
	tokenComprador = await tokenDe('comprador.lista', 'COMPRADOR');
	tokenOtroComprador = await tokenDe('otro.comprador.lista', 'COMPRADOR');

	const categoria = await api('POST', '/categorias', {
		token: tokenOrganizador,
		cuerpo: { nombre: 'Música', descripcion: 'Conciertos' }
	});
	assert.equal(categoria.status, 201);
	const creado = await api('POST', '/eventos', {
		token: tokenOrganizador,
		cuerpo: {
			nombre: 'Festival',
			descripcion: 'Festival de prueba',
			categoriaId: (await categoria.json()).id,
			fecha: '2100-01-01T00:00:00.000Z',
			tiposEntrada: [
				{ nombre: 'General', descripcion: 'Entrada', precio: 100, cupo: 10 }
			]
		}
	});
	assert.equal(creado.status, 201);
	evento = await creado.json();
});

after(() => new Promise((resolve) => server.close(resolve)));

describe('GET /api/eventos/:idEvento/compras', () => {
	it('responde 401 sin token', async () => {
		assert.equal((await api('GET', `/eventos/${evento.id}/compras`)).status, 401);
	});

	it('responde 403 a un COMPRADOR', async () => {
		const res = await api('GET', `/eventos/${evento.id}/compras`, {
			token: tokenComprador
		});

		assert.equal(res.status, 403);
	});

	it('responde 403 a un organizador que no es dueño del evento', async () => {
		const res = await api('GET', `/eventos/${evento.id}/compras`, {
			token: tokenOtroOrganizador
		});

		assert.equal(res.status, 403);
	});

	it('responde 404 si el evento no existe', async () => {
		const res = await api('GET', '/eventos/999/compras', {
			token: tokenOrganizador
		});

		assert.equal(res.status, 404);
	});

	it('responde 200 con una lista vacía si aún no hay compras', async () => {
		const res = await api('GET', `/eventos/${evento.id}/compras`, {
			token: tokenOrganizador
		});

		assert.equal(res.status, 200);
		const cuerpo = await res.json();
		assert.deepEqual(cuerpo.compras, []);
		assert.deepEqual(cuerpo.disponibilidad, [
			{
				tipoEntradaId: evento.tiposEntrada[0].id,
				nombre: 'General',
				precio: 100,
				cupo: 10,
				vendidas: 0,
				disponibles: 10
			}
		]);
	});

	it('lista las compras de todos los compradores del evento, en orden', async () => {
		const primera = await comprar(tokenComprador);
		const segunda = await comprar(tokenOtroComprador);

		const res = await api('GET', `/eventos/${evento.id}/compras`, {
			token: tokenOrganizador
		});

		assert.equal(res.status, 200);
		const { compras, disponibilidad } = await res.json();
		assert.equal(disponibilidad[0].vendidas, 2);
		assert.equal(disponibilidad[0].disponibles, 8);
		assert.deepEqual(
			compras.map((c) => c.id),
			[primera.id, segunda.id]
		);
		assert.ok(compras.every((c) => c.evento.id === evento.id));
		assert.equal(compras[0].comprador.contrasenia, undefined);
	});
});
