/**
 * Tests de integración de las rutas de mensajes de una compra.
 * Verifican el cableado HTTP: autenticación, participación en la compra y el
 * flujo completo comprador ↔ organizador.
 *
 * @license ISC
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import UsuarioRepository from '../src/repositories/usuarioRepository.js';

let server;
let baseUrl;
let tokenComprador;
let tokenOtroComprador;
let tokenOrganizador;
let tokenOtroOrganizador;
let compra;

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
	tokenComprador = await tokenDe('comprador.mensajes', 'COMPRADOR');
	tokenOtroComprador = await tokenDe('otro.comprador.mensajes', 'COMPRADOR');
	tokenOrganizador = await tokenDe('organizador.mensajes', 'ORGANIZADOR');
	tokenOtroOrganizador = await tokenDe('otro.org.mensajes', 'ORGANIZADOR');

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
	const evento = await creado.json();
	const comprada = await api('POST', '/compras', {
		token: tokenComprador,
		cuerpo: {
			eventoId: evento.id,
			tipoEntradaId: evento.tiposEntrada[0].id,
			cantidad: 1
		}
	});
	assert.equal(comprada.status, 201);
	compra = await comprada.json();
});

after(() => new Promise((resolve) => server.close(resolve)));

describe('POST /api/compras/:idCompra/mensajes', () => {
	it('responde 401 sin token', async () => {
		const res = await api('POST', `/compras/${compra.id}/mensajes`, {
			cuerpo: { mensaje: 'Hola' }
		});

		assert.equal(res.status, 401);
	});

	it('responde 400 con un mensaje vacío', async () => {
		const res = await api('POST', `/compras/${compra.id}/mensajes`, {
			token: tokenComprador,
			cuerpo: { mensaje: '' }
		});

		assert.equal(res.status, 400);
	});

	it('responde 404 si la compra no existe', async () => {
		const res = await api('POST', '/compras/999/mensajes', {
			token: tokenComprador,
			cuerpo: { mensaje: 'Hola' }
		});

		assert.equal(res.status, 404);
	});

	it('responde 403 a un comprador ajeno a la compra', async () => {
		const res = await api('POST', `/compras/${compra.id}/mensajes`, {
			token: tokenOtroComprador,
			cuerpo: { mensaje: 'Hola' }
		});

		assert.equal(res.status, 403);
	});

	it('responde 403 a un organizador que no es del evento', async () => {
		const res = await api('POST', `/compras/${compra.id}/mensajes`, {
			token: tokenOtroOrganizador,
			cuerpo: { mensaje: 'Hola' }
		});

		assert.equal(res.status, 403);
	});

	it('responde 201 con el mensaje del comprador', async () => {
		const res = await api('POST', `/compras/${compra.id}/mensajes`, {
			token: tokenComprador,
			cuerpo: { mensaje: 'Hola organizador' }
		});

		assert.equal(res.status, 201);
		const cuerpo = await res.json();
		assert.equal(cuerpo.compraId, compra.id);
		assert.equal(cuerpo.mensaje, 'Hola organizador');
		assert.equal(cuerpo.usuario.rol, 'COMPRADOR');
		assert.equal(cuerpo.usuario.contrasenia, undefined);
		assert.ok(cuerpo.enviado);
	});
});

describe('GET /api/compras/:idCompra/mensajes', () => {
	it('responde 401 sin token', async () => {
		const res = await api('GET', `/compras/${compra.id}/mensajes`);

		assert.equal(res.status, 401);
	});

	it('responde 403 a un tercero', async () => {
		const res = await api('GET', `/compras/${compra.id}/mensajes`, {
			token: tokenOtroComprador
		});

		assert.equal(res.status, 403);
	});

	it('responde 404 si la compra no existe', async () => {
		const res = await api('GET', '/compras/999/mensajes', {
			token: tokenComprador
		});

		assert.equal(res.status, 404);
	});

	it('comprador y organizador ven el hilo completo en orden', async () => {
		const respuesta = await api('POST', `/compras/${compra.id}/mensajes`, {
			token: tokenOrganizador,
			cuerpo: { mensaje: 'Hola comprador' }
		});
		assert.equal(respuesta.status, 201);

		for (const token of [tokenComprador, tokenOrganizador]) {
			const res = await api('GET', `/compras/${compra.id}/mensajes`, { token });

			assert.equal(res.status, 200);
			const mensajes = await res.json();
			assert.deepEqual(
				mensajes.map((m) => [m.usuario.rol, m.mensaje]),
				[
					['COMPRADOR', 'Hola organizador'],
					['ORGANIZADOR', 'Hola comprador']
				]
			);
		}
	});
});
