/**
 * Tests de integración de GET /api/eventos/:idEvento (ruta pública).
 *
 * @license ISC
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let baseUrl;
let eventoId;

const json = { 'Content-Type': 'application/json' };

before(async () => {
	server = createApp().listen(0);
	await new Promise((resolve) => server.once('listening', resolve));
	baseUrl = `http://127.0.0.1:${server.address().port}`;

	const registro = await (
		await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: json,
			body: JSON.stringify({
				nombre: 'Org',
				apellido: 'Detalle',
				nombreUsuario: 'org.detalle',
				contrasenia: 'Clave123!',
				rol: 'ORGANIZADOR'
			})
		})
	).json();
	const { accessToken } = await (
		await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: json,
			body: JSON.stringify({
				nombreUsuario: 'org.detalle',
				contrasenia: 'Clave123!'
			})
		})
	).json();
	const auth = { ...json, Authorization: `Bearer ${accessToken}` };
	const categoria = await (
		await fetch(`${baseUrl}/api/categorias`, {
			method: 'POST',
			headers: auth,
			body: JSON.stringify({ nombre: 'Música', descripcion: 'Conciertos' })
		})
	).json();
	const evento = await (
		await fetch(`${baseUrl}/api/eventos`, {
			method: 'POST',
			headers: auth,
			body: JSON.stringify({
				nombre: 'Rock Fest',
				descripcion: 'Festival de rock',
				categoriaId: categoria.id,
				fecha: '2100-01-01T20:00:00.000Z',
				tiposEntrada: [
					{ nombre: 'General', descripcion: 'Entrada', precio: 100, cupo: 50 }
				]
			})
		})
	).json();
	eventoId = evento.id;
	assert.ok(
		eventoId,
		`no se pudo crear el evento (organizador ${registro.id})`
	);
});

after(() => new Promise((resolve) => server.close(resolve)));

describe('GET /api/eventos/:idEvento', () => {
	it('devuelve 200 con el detalle del evento sin necesidad de token', async () => {
		const res = await fetch(`${baseUrl}/api/eventos/${eventoId}`);

		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.id, eventoId);
		assert.equal(body.nombre, 'Rock Fest');
		assert.equal(body.categoria.nombre, 'Música');
		assert.equal(body.tiposEntrada.length, 1);
		assert.equal(body.tiposEntrada[0].precio, 100);
		assert.equal(body.organizador.nombre, 'Org');
	});

	it('no expone hashes del organizador', async () => {
		const texto = await (
			await fetch(`${baseUrl}/api/eventos/${eventoId}`)
		).text();

		assert.ok(!texto.includes('contraseniaHash'));
		assert.ok(!texto.includes('refreshTokenHash'));
	});

	it('devuelve 404 si el evento no existe', async () => {
		const res = await fetch(`${baseUrl}/api/eventos/999`);

		assert.equal(res.status, 404);
		assert.ok((await res.json()).message);
	});

	it('GET /api/eventos/:id/compras sigue exigiendo autenticación', async () => {
		const res = await fetch(`${baseUrl}/api/eventos/${eventoId}/compras`);

		assert.equal(res.status, 401);
	});
});
