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

describe('POST /api/logout', () => {
	it('retorna 200 y invalida el refresh token cuando es válido', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: 'Logout',
				apellido: 'Prueba',
				nombreUsuario: 'logout.prueba',
				contrasenia: 'Clave123!',
				rol: 'COMPRADOR'
			})
		});
		assert.equal(res.status, 201);

		const loginRes = await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombreUsuario: 'logout.prueba',
				contrasenia: 'Clave123!'
			})
		});
		assert.equal(loginRes.status, 200);
		const loginBody = await loginRes.json();

		const logoutRes = await fetch(`${baseUrl}/api/logout`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: loginBody.refreshToken
			})
		});
		assert.equal(logoutRes.status, 200);

		const refreshRes = await fetch(`${baseUrl}/api/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: loginBody.refreshToken
			})
		});
		assert.equal(refreshRes.status, 401);
	});

	it('retorna 401 cuando el refresh token es inválido', async () => {
		const res = await fetch(`${baseUrl}/api/logout`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken: 'token-falso'
			})
		});
		assert.equal(res.status, 401);
		const body = await res.json();
		assert.ok(body.message);
	});

	it('retorna 400 cuando falta el refresh token', async () => {
		const res = await fetch(`${baseUrl}/api/logout`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});
		assert.equal(res.status, 400);
		const body = await res.json();
		assert.ok(body.message);
	});
});
