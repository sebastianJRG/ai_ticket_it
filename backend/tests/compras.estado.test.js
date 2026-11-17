/**
 * Tests de integración de las rutas PATCH de estado de compras.
 * Verifican el cableado HTTP: autenticación, roles y CORS. Las reglas de negocio
 * (transiciones, propiedad, fechas) se prueban en los tests unitarios.
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
let tokenOrganizador;

/** Crea un usuario, inicia sesión y devuelve su access token. */
async function tokenDe(nombreUsuario, rol) {
	const cuerpo = (datos) => ({
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(datos)
	});
	const contrasenia = 'Clave123!';
	const creado = await fetch(
		`${baseUrl}/api/usuarios`,
		cuerpo({ nombre: 'Test', apellido: 'Uno', nombreUsuario, contrasenia, rol })
	);
	assert.equal(creado.status, 201);
	const login = await fetch(
		`${baseUrl}/api/login`,
		cuerpo({ nombreUsuario, contrasenia })
	);
	assert.equal(login.status, 200);
	return (await login.json()).accessToken;
}

/** Envía un PATCH al recurso de estado de una compra. */
function patch(ruta, token) {
	return fetch(`${baseUrl}/api/compras/${ruta}`, {
		method: 'PATCH',
		headers: token ? { Authorization: `Bearer ${token}` } : {}
	});
}

before(async () => {
	server = createApp(new UsuarioRepository()).listen(0);
	await new Promise((resolve) => server.once('listening', resolve));
	baseUrl = `http://127.0.0.1:${server.address().port}`;
	tokenComprador = await tokenDe('comprador.estado', 'COMPRADOR');
	tokenOrganizador = await tokenDe('organizador.estado', 'ORGANIZADOR');
});

after(() => new Promise((resolve) => server.close(resolve)));

describe('PATCH /api/compras/:idCompra/cancelacion', () => {
	it('responde 401 sin token', async () => {
		assert.equal((await patch('1/cancelacion')).status, 401);
	});

	it('permite el acceso al COMPRADOR (404: la compra no existe)', async () => {
		assert.equal((await patch('999/cancelacion', tokenComprador)).status, 404);
	});

	it('permite el acceso al ORGANIZADOR (404: la compra no existe)', async () => {
		assert.equal(
			(await patch('999/cancelacion', tokenOrganizador)).status,
			404
		);
	});
});

for (const ruta of ['confirmacion', 'reembolso']) {
	describe(`PATCH /api/compras/:idCompra/${ruta}`, () => {
		it('responde 401 sin token', async () => {
			assert.equal((await patch(`1/${ruta}`)).status, 401);
		});

		it('responde 403 al COMPRADOR', async () => {
			assert.equal((await patch(`1/${ruta}`, tokenComprador)).status, 403);
		});

		it('permite el acceso al ORGANIZADOR (404: la compra no existe)', async () => {
			assert.equal((await patch(`999/${ruta}`, tokenOrganizador)).status, 404);
		});
	});
}

describe('CORS', () => {
	it('el preflight acepta el método PATCH', async () => {
		const res = await fetch(`${baseUrl}/api/compras/1/cancelacion`, {
			method: 'OPTIONS',
			headers: {
				Origin: 'http://localhost:3000',
				'Access-Control-Request-Method': 'PATCH',
				'Access-Control-Request-Headers': 'Authorization'
			}
		});
		assert.match(
			res.headers.get('access-control-allow-methods') ?? '',
			/PATCH/
		);
	});
});
