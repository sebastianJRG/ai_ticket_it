/**
 * Tests de la seed de datos de prueba (`src/seed/datosPrueba.js`): carga, por
 * medio de los servicios, 2 compradores, 2 organizadores, 5 categorías, 3
 * eventos futuros (4 la segunda, con uno "Sin cupo") y 3 ya ocurridos por organizador, 2 compras UTILIZADA y 1 que agota el cupo, y
 * solo cuando se la llama explícitamente.
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

	it('devuelve lo que creó: 4 usuarios, 5 categorías, 13 eventos y 3 compras', () => {
		assert.equal(resultado.usuarios.length, 4);
		assert.equal(resultado.categorias.length, 5);
		assert.equal(resultado.eventos.length, 13);
		assert.equal(resultado.compras.length, 3);
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

	it('GET /api/eventos lista 13 eventos: 7 futuros (3 y 4) y 6 pasados (3 y 3)', async () => {
		const eventos = await (await fetch(`${baseUrl}/api/eventos`)).json();
		assert.equal(eventos.length, 13);
		const ahora = Date.now();
		const futuros = new Map();
		const pasados = new Map();
		for (const e of eventos) {
			assert.ok(e.tiposEntrada.length >= 1);
			const grupo = new Date(e.fecha).getTime() > ahora ? futuros : pasados;
			grupo.set(e.organizador.id, (grupo.get(e.organizador.id) ?? 0) + 1);
		}
		assert.deepEqual([...futuros.values()].sort(), [3, 4]);
		assert.deepEqual([...pasados.values()], [3, 3]);
	});

	it('cada comprador tiene 1 compra UTILIZADA de un evento pasado, que su organizador ve', async () => {
		for (const nombreUsuario of ['ana.comprador', 'lucas.comprador']) {
			const login = await fetch(`${baseUrl}/api/login`, {
				method: 'POST',
				headers: json,
				body: JSON.stringify({
					nombreUsuario,
					contrasenia: CONTRASENIA_PRUEBA
				})
			});
			const { accessToken } = await login.json();
			const compras = await (
				await fetch(`${baseUrl}/api/compras`, {
					headers: { Authorization: `Bearer ${accessToken}` }
				})
			).json();
			const utilizadas = compras.filter((c) => c.estado === 'UTILIZADA');
			assert.equal(utilizadas.length, 1, nombreUsuario);
			assert.equal(utilizadas[0].diasRestantes, null);
			assert.ok(new Date(utilizadas[0].evento.fecha).getTime() < Date.now());
		}
		const utilizadas = resultado.compras.filter(
			(c) => c.estado === 'UTILIZADA'
		);
		assert.equal(utilizadas.length, 2);
		assert.notEqual(
			utilizadas[0].evento.organizador.id,
			utilizadas[1].evento.organizador.id
		);
	});

	it('"Sin cupo" es un evento futuro de un tipo de cupo 5 totalmente vendido', async () => {
		const eventos = await (await fetch(`${baseUrl}/api/eventos`)).json();
		const sinCupo = eventos.find((e) => e.nombre === 'Sin cupo');
		assert.ok(sinCupo, 'falta el evento "Sin cupo"');
		assert.ok(new Date(sinCupo.fecha).getTime() > Date.now());
		assert.equal(sinCupo.tiposEntrada.length, 1);
		assert.equal(sinCupo.tiposEntrada[0].cupo, 5);
		const detalle = await (
			await fetch(`${baseUrl}/api/eventos/${sinCupo.id}`)
		).json();
		assert.equal(detalle.tiposEntrada[0].disponibles, 0);

		const compra = resultado.compras.find((c) => c.evento.id === sinCupo.id);
		assert.equal(compra.cantidad, 5);
		assert.equal(compra.estado, 'CONFIRMADA');

		const login = await fetch(`${baseUrl}/api/login`, {
			method: 'POST',
			headers: json,
			body: JSON.stringify({
				nombreUsuario: 'ana.comprador',
				contrasenia: CONTRASENIA_PRUEBA
			})
		});
		const { accessToken } = await login.json();
		const respuesta = await fetch(`${baseUrl}/api/compras`, {
			method: 'POST',
			headers: { ...json, Authorization: `Bearer ${accessToken}` },
			body: JSON.stringify({
				eventoId: sinCupo.id,
				tipoEntradaId: sinCupo.tiposEntrada[0].id,
				cantidad: 1
			})
		});
		assert.equal(respuesta.status, 409);
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
