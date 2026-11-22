/**
 * Tests de integración del manejo centralizado de errores: verifican, contra la
 * app real, los códigos que salen de la jerarquía `AppError` y del middleware.
 *
 * @license ISC
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

/**
 * Envía una petición JSON a la app de prueba.
 * @param {string} metodo - Método HTTP
 * @param {string} ruta - Ruta relativa (por ejemplo, '/api/usuarios')
 * @param {object} [opciones] - Cuerpo y token opcionales
 * @param {object|string} [opciones.body] - Cuerpo (un texto se envía tal cual)
 * @param {string} [opciones.token] - Access token JWT
 * @returns {Promise<Response>} Respuesta de fetch
 */
function pedir(metodo, ruta, { body, token } = {}) {
	const headers = { 'Content-Type': 'application/json' };
	if (token) headers.Authorization = `Bearer ${token}`;
	return fetch(`${baseUrl}${ruta}`, {
		method: metodo,
		headers,
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});
}

const USUARIO_BASE = {
	nombre: 'Error',
	apellido: 'Prueba',
	contrasenia: 'Clave123!'
};

before(async () => {
	const app = createApp();
	server = app.listen(0);
	await new Promise((resolve) => server.once('listening', resolve));
	baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

describe('Manejo centralizado de errores', () => {
	it('responde 404 con mensaje en una ruta inexistente', async () => {
		const res = await pedir('GET', '/api/ruta-que-no-existe');

		assert.equal(res.status, 404);
		assert.deepEqual(await res.json(), { message: 'No encontrada' });
	});

	it('responde 400 a un cuerpo JSON mal formado', async () => {
		const res = await pedir('POST', '/api/usuarios', { body: '{ roto' });

		assert.equal(res.status, 400);
		assert.equal(typeof (await res.json()).message, 'string');
	});

	it('responde 409 al registrar un nombre de usuario ya usado', async () => {
		const datos = {
			...USUARIO_BASE,
			nombreUsuario: 'error.duplicado',
			rol: 'COMPRADOR'
		};
		const primero = await pedir('POST', '/api/usuarios', { body: datos });
		assert.equal(primero.status, 201);

		const res = await pedir('POST', '/api/usuarios', { body: datos });

		assert.equal(res.status, 409);
		assert.deepEqual(await res.json(), {
			message: 'El nombre de usuario ya está en uso.'
		});
	});

	it('responde 404 al crear un evento con una categoría inexistente', async () => {
		const organizador = {
			...USUARIO_BASE,
			nombreUsuario: 'error.organizador',
			rol: 'ORGANIZADOR'
		};
		await pedir('POST', '/api/usuarios', { body: organizador });
		const login = await pedir('POST', '/api/login', {
			body: {
				nombreUsuario: organizador.nombreUsuario,
				contrasenia: organizador.contrasenia
			}
		});
		const { accessToken } = await login.json();

		const res = await pedir('POST', '/api/eventos', {
			token: accessToken,
			body: {
				nombre: 'Evento sin categoría',
				descripcion: 'Descripción del evento de prueba',
				categoriaId: 'categoria-inexistente',
				fecha: new Date('2100-01-01').toISOString(),
				tiposEntrada: [
					{ nombre: 'General', descripcion: 'X', precio: 100, cupo: 10 }
				],
				multimedia: []
			}
		});

		assert.equal(res.status, 404);
		assert.match((await res.json()).message, /categoría.*no existe/);
	});
});
