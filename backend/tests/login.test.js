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

describe('POST /api/login', () => {
	it('retorna 200 y un access token con id, rol y permisos cuando las credenciales son válidas', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: 'Login',
				apellido: 'Prueba',
				nombreUsuario: 'login.prueba',
				contrasenia: 'Clave123!',
				rol: 'COMPRADOR'
			})
		});
		assert.equal(res.status, 201);
		const usuario = await res.json();

		const loginRes = await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombreUsuario: 'login.prueba',
				contrasenia: 'Clave123!'
			})
		});
		assert.equal(loginRes.status, 200);
		const body = await loginRes.json();

		assert.ok(body.accessToken, 'Debe retornar un accessToken');
		assert.ok(body.refreshToken, 'Debe retornar un refreshToken');
		assert.equal(body.usuario.id, usuario.id);
		assert.equal(body.usuario.nombreUsuario, 'login.prueba');
		assert.equal(body.usuario.rol, 'COMPRADOR');
		assert.ok(Array.isArray(body.usuario.permissions));
		assert.equal(body.usuario.contraseniaHash, undefined);
		assert.equal(body.usuario.refreshTokenHash, undefined);
	});

	it('retorna 401 cuando el nombre de usuario no existe', async () => {
		const res = await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombreUsuario: 'no-existe',
				contrasenia: 'Clave123!'
			})
		});
		assert.equal(res.status, 401);
		const body = await res.json();
		assert.ok(body.message);
	});

	it('retorna 401 cuando la contraseña es incorrecta', async () => {
		const res = await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombreUsuario: 'login.prueba',
				contrasenia: 'Contrasenia Incorrecta!'
			})
		});
		assert.equal(res.status, 401);
		const body = await res.json();
		assert.ok(body.message);
	});

	it('retorna 400 cuando faltan campos obligatorios', async () => {
		const res = await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombreUsuario: 'login.prueba'
			})
		});
		assert.equal(res.status, 400);
		const body = await res.json();
		assert.ok(body.message);
	});
});
