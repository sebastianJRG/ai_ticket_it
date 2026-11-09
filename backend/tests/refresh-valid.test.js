import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import UsuarioRepository from '../src/repositories/usuarioRepository.js';

let server;
let baseUrl;

before(async () => {
	// === CADA TEST TIENE SU PROPIO REPOSITORIO IN-MEMORY ===
	const repository = new UsuarioRepository();
	const app = createApp(repository);
	server = app.listen(0);
	await new Promise((resolve) => {
		server.once('listening', resolve);
	});
	baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
	return new Promise((resolve) => {
		server.close(resolve);
	});
});

describe('POST /api/refresh - valid', () => {
	it('retorna 200 y un nuevo access token cuando el refresh token es válido', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: 'Refresh',
				apellido: 'Prueba',
				nombreUsuario: 'refresh.prueba',
				contrasenia: 'Clave123!',
				rol: 'COMPRADOR'
			})
		});
		assert.equal(res.status, 201);

		const loginRes = await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombreUsuario: 'refresh.prueba',
				contrasenia: 'Clave123!'
			})
		});
		assert.equal(loginRes.status, 200);
		const loginBody = await loginRes.json();

		const refreshRes = await fetch(`${baseUrl}/api/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: loginBody.refreshToken
			})
		});
		assert.equal(refreshRes.status, 200);
		const body = await refreshRes.json();

		assert.ok(body.accessToken, 'Debe retornar un accessToken');
		assert.ok(body.refreshToken, 'Debe retornar un refreshToken');
		assert.equal(body.usuario.id, loginBody.usuario.id);
		assert.equal(body.usuario.rol, 'COMPRADOR');
	});
});
