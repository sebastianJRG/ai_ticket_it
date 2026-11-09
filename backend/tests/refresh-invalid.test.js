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

describe('POST /api/refresh - invalid', () => {
	it('retorna 401 cuando el refresh token es inválido o expirado', async () => {
		const res = await fetch(`${baseUrl}/api/refresh`, {
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
});
