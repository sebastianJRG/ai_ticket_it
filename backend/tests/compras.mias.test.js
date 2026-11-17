/**
 * Tests de integración de `GET /api/compras` (compras del comprador autenticado).
 * Verifican autenticación, rol y el cálculo de días restantes de las compras CONFIRMADA.
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
	tokenOrganizador = await tokenDe('organizador.mias', 'ORGANIZADOR');
	tokenComprador = await tokenDe('comprador.mias', 'COMPRADOR');
	tokenOtroComprador = await tokenDe('otro.comprador.mias', 'COMPRADOR');

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

describe('GET /api/compras', () => {
	it('responde 401 sin token', async () => {
		assert.equal((await api('GET', '/compras')).status, 401);
	});

	it('responde 403 a un ORGANIZADOR', async () => {
		const res = await api('GET', '/compras', { token: tokenOrganizador });

		assert.equal(res.status, 403);
	});

	it('responde 200 con una lista vacía si el comprador no tiene compras', async () => {
		const res = await api('GET', '/compras', { token: tokenComprador });

		assert.equal(res.status, 200);
		assert.deepEqual(await res.json(), []);
	});

	it('lista solo las compras propias, con días restantes en las CONFIRMADA', async () => {
		const confirmada = await comprar(tokenComprador);
		const pendiente = await comprar(tokenComprador);
		await comprar(tokenOtroComprador);
		const res1 = await api('PATCH', `/compras/${confirmada.id}/confirmacion`, {
			token: tokenOrganizador
		});
		assert.equal(res1.status, 200);

		const res = await api('GET', '/compras', { token: tokenComprador });

		assert.equal(res.status, 200);
		const compras = await res.json();
		assert.deepEqual(
			compras.map((c) => [c.id, c.estado]),
			[
				[confirmada.id, 'CONFIRMADA'],
				[pendiente.id, 'PENDIENTE']
			]
		);
		assert.ok(Number.isInteger(compras[0].diasRestantes));
		assert.ok(compras[0].diasRestantes > 0);
		assert.equal(compras[1].diasRestantes, null);
	});
});
