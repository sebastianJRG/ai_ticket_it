/**
 * Tests de integración de las rutas de reseñas.
 * Verifican el cableado HTTP: acceso público al GET, autenticación y rol en el POST,
 * y el flujo completo hasta la regla «el evento debe haber ocurrido». Las demás
 * reglas de negocio se prueban en los tests unitarios con reloj inyectado.
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
let evento;

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
	tokenComprador = await tokenDe('comprador.resenias', 'COMPRADOR');
	tokenOrganizador = await tokenDe('organizador.resenias', 'ORGANIZADOR');

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
	evento = await creado.json();
});

after(() => new Promise((resolve) => server.close(resolve)));

describe('GET /api/resenias/:idEvento', () => {
	it('es público: responde 200 con una lista vacía sin token', async () => {
		const res = await api('GET', `/resenias/${evento.id}`);

		assert.equal(res.status, 200);
		assert.deepEqual(await res.json(), []);
	});

	it('responde 404 si el evento no existe', async () => {
		assert.equal((await api('GET', '/resenias/999')).status, 404);
	});
});

describe('GET /api/usuarios/:idOrganizador/resenias', () => {
	it('es público: responde 200 con una lista vacía sin token', async () => {
		const res = await api('GET', `/usuarios/${evento.organizador.id}/resenias`);

		assert.equal(res.status, 200);
		assert.deepEqual(await res.json(), []);
	});

	it('responde 404 si el organizador no existe', async () => {
		assert.equal((await api('GET', '/usuarios/999/resenias')).status, 404);
	});
});

describe('POST /api/resenias', () => {
	const cuerpo = () => ({
		eventoId: evento.id,
		detalle: 'Excelente',
		puntuacion: 5
	});

	it('responde 401 sin token', async () => {
		assert.equal(
			(await api('POST', '/resenias', { cuerpo: cuerpo() })).status,
			401
		);
	});

	it('responde 403 al ORGANIZADOR', async () => {
		const res = await api('POST', '/resenias', {
			token: tokenOrganizador,
			cuerpo: cuerpo()
		});

		assert.equal(res.status, 403);
	});

	it('responde 400 con una puntuación inválida', async () => {
		const res = await api('POST', '/resenias', {
			token: tokenComprador,
			cuerpo: { ...cuerpo(), puntuacion: 9 }
		});

		assert.equal(res.status, 400);
	});

	it('responde 404 si el evento no existe', async () => {
		const res = await api('POST', '/resenias', {
			token: tokenComprador,
			cuerpo: { ...cuerpo(), eventoId: '999' }
		});

		assert.equal(res.status, 404);
	});

	it('con una compra confirmada, responde 400 mientras el evento no ha ocurrido', async () => {
		const compra = await api('POST', '/compras', {
			token: tokenComprador,
			cuerpo: {
				eventoId: evento.id,
				tipoEntradaId: evento.tiposEntrada[0].id,
				cantidad: 1
			}
		});
		assert.equal(compra.status, 201);
		const { id } = await compra.json();
		const confirmada = await api('PATCH', `/compras/${id}/confirmacion`, {
			token: tokenOrganizador
		});
		assert.equal(confirmada.status, 200);

		const res = await api('POST', '/resenias', {
			token: tokenComprador,
			cuerpo: cuerpo()
		});

		assert.equal(res.status, 400);
		assert.equal((await res.json()).message, 'El evento aún no ha ocurrido.');
	});
});
