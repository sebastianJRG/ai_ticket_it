/**
 * Tests de la seed de datos de prueba (`src/seed/datosPrueba.js`): carga, por
 * medio de los servicios, 2 compradores, 2 organizadores, 5 categorías y 3
 * eventos futuros por organizador, y solo cuando se la llama explícitamente.
 *
 * @license ISC
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import {
	CONTRASENIA_PRUEBA,
	USUARIOS_PRUEBA,
	cargarDatosPrueba
} from '../src/seed/datosPrueba.js';

const json = { 'Content-Type': 'application/json' };
const silencioso = { info: () => {} };

/**
 * Levanta una app en un puerto libre.
 * @param {import('express').Application} app - App de Express
 * @returns {Promise<{server: import('http').Server, baseUrl: string}>}
 */
async function levantar(app) {
	const server = app.listen(0);
	await new Promise((resolve) => server.once('listening', resolve));
	return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

describe('Seed de datos de prueba', () => {
	let server;
	let baseUrl;
	let resultado;

	before(async () => {
		const app = createApp();
		resultado = await cargarDatosPrueba(app.locals, { logger: silencioso });
		({ server, baseUrl } = await levantar(app));
	});

	after(() => new Promise((resolve) => server.close(resolve)));

	it('devuelve lo que creó: 4 usuarios, 5 categorías y 6 eventos', () => {
		assert.equal(resultado.usuarios.length, 4);
		assert.equal(resultado.categorias.length, 5);
		assert.equal(resultado.eventos.length, 6);
	});

	it('GET /api/categorias lista las 5 categorías', async () => {
		const categorias = await (await fetch(`${baseUrl}/api/categorias`)).json();
		assert.deepEqual(categorias.map((c) => c.nombre).sort(), [
			'Conferencias',
			'Deportes',
			'Festivales',
			'Recitales',
			'Teatro'
		]);
	});

	it('GET /api/eventos lista 6 eventos futuros, 3 de cada organizador', async () => {
		const eventos = await (await fetch(`${baseUrl}/api/eventos`)).json();
		assert.equal(eventos.length, 6);
		const ahora = Date.now();
		for (const e of eventos) {
			assert.ok(
				new Date(e.fecha).getTime() > ahora,
				`${e.nombre} no es futuro`
			);
			assert.ok(e.tiposEntrada.length >= 1);
		}
		const porOrganizador = new Map();
		for (const e of eventos) {
			porOrganizador.set(
				e.organizador.id,
				(porOrganizador.get(e.organizador.id) ?? 0) + 1
			);
		}
		assert.deepEqual([...porOrganizador.values()], [3, 3]);
	});

	it('incluye los casos que usan las pantallas: gratis, cupo chico e imagen', async () => {
		const eventos = await (await fetch(`${baseUrl}/api/eventos`)).json();
		const tipos = eventos.flatMap((e) => e.tiposEntrada);
		assert.ok(
			eventos.some(
				(e) => e.tiposEntrada.length === 1 && e.tiposEntrada[0].precio === 0
			),
			'falta un evento con un único tipo gratis'
		);
		assert.ok(
			tipos.some((t) => t.cupo <= 2),
			'falta un tipo con cupo chico'
		);
		assert.ok(
			eventos.some((e) => e.multimedia.length > 0),
			'falta un evento con imagen'
		);
		assert.ok(
			eventos.some((e) => e.multimedia.length === 0),
			'falta un evento sin imagen'
		);
	});

	for (const usuario of USUARIOS_PRUEBA) {
		it(`${usuario.nombreUsuario} inicia sesión y su perfil tiene rol ${usuario.rol}`, async () => {
			const login = await fetch(`${baseUrl}/api/login`, {
				method: 'POST',
				headers: json,
				body: JSON.stringify({
					nombreUsuario: usuario.nombreUsuario,
					contrasenia: CONTRASENIA_PRUEBA
				})
			});
			assert.equal(login.status, 200);
			const { accessToken } = await login.json();
			const perfil = await (
				await fetch(`${baseUrl}/api/usuarios`, {
					headers: { Authorization: `Bearer ${accessToken}` }
				})
			).json();
			assert.equal(perfil.nombreUsuario, usuario.nombreUsuario);
			assert.equal(perfil.rol, usuario.rol);
		});
	}

	it('tiene 2 compradores y 2 organizadores', () => {
		const roles = USUARIOS_PRUEBA.map((u) => u.rol).sort();
		assert.deepEqual(roles, [
			'COMPRADOR',
			'COMPRADOR',
			'ORGANIZADOR',
			'ORGANIZADOR'
		]);
	});
});

describe('Sin llamar a la seed', () => {
	it('createApp() arranca vacío', async () => {
		const { server, baseUrl } = await levantar(createApp());
		try {
			const eventos = await (await fetch(`${baseUrl}/api/eventos`)).json();
			const categorias = await (
				await fetch(`${baseUrl}/api/categorias`)
			).json();
			assert.deepEqual(eventos, []);
			assert.deepEqual(categorias, []);
		} finally {
			await new Promise((resolve) => server.close(resolve));
		}
	});
});
