import {
	listarEventos,
	obtenerEvento,
	crearEvento,
	obtenerComprasEvento
} from '../../src/services/eventoService';
import { cliente, configurarSesion } from '../../src/services/api';
import { prepararCliente } from '../helpers/adaptadorFalso';

let adaptador;
const enviada = (i = 0) => adaptador.mock.calls[i][0];

describe('eventoService', () => {
	beforeEach(() => {
		adaptador = prepararCliente(cliente, configurarSesion);
	});

	it('listarEventos omite los filtros vacíos', async () => {
		adaptador.responder(200, []);
		await listarEventos({ q: '', categoriaId: 'c1' });
		expect(enviada()).toMatchObject({ method: 'get', url: '/api/eventos' });
		expect(enviada().params).toEqual({ categoriaId: 'c1' });
	});

	it('listarEventos omite null, undefined y textos de solo espacios', async () => {
		adaptador.responder(200, []);
		await listarEventos({
			q: '   ',
			categoriaId: null,
			sortBy: undefined,
			order: 'desc'
		});
		expect(enviada().params).toEqual({ order: 'desc' });
	});

	it('listarEventos envía texto, categoría, orden y sentido tal cual', async () => {
		const eventos = [{ id: 'e1', puntajeOrganizador: 4.5 }];
		adaptador.responder(200, eventos);
		await expect(
			listarEventos({
				q: 'rock',
				categoriaId: 'c1',
				sortBy: 'puntaje',
				order: 'asc'
			})
		).resolves.toEqual(eventos);
		expect(enviada().params).toEqual({
			q: 'rock',
			categoriaId: 'c1',
			sortBy: 'puntaje',
			order: 'asc'
		});
	});

	it('listarEventos sin argumentos funciona y sin sesión no envía credencial', async () => {
		adaptador = prepararCliente(cliente, configurarSesion, {
			conSesion: false
		});
		adaptador.responder(200, []);
		await expect(listarEventos()).resolves.toEqual([]);
		expect(enviada().params ?? {}).toEqual({});
		expect(enviada().headers.Authorization).toBeUndefined();
	});

	it('obtenerEvento es público y codifica el ID', async () => {
		adaptador = prepararCliente(cliente, configurarSesion, {
			conSesion: false
		});
		adaptador.responder(200, { id: 'e/1' });
		await expect(obtenerEvento('e/1')).resolves.toEqual({ id: 'e/1' });
		expect(enviada()).toMatchObject({
			method: 'get',
			url: '/api/eventos/e%2F1'
		});
		expect(enviada().headers.Authorization).toBeUndefined();
	});

	it('crearEvento hace POST /api/eventos con los datos idénticos', async () => {
		const datos = {
			nombre: 'Recital',
			descripcion: 'En vivo',
			categoriaId: 'c1',
			fecha: '2027-01-10T20:00:00.000Z',
			tiposEntrada: [
				{ nombre: 'General', descripcion: 'Campo', precio: 100, cupo: 50 }
			],
			multimedia: []
		};
		adaptador.responder(201, { id: 'e1', ...datos });
		await expect(crearEvento(datos)).resolves.toMatchObject({ id: 'e1' });
		expect(enviada()).toMatchObject({ method: 'post', url: '/api/eventos' });
		expect(JSON.parse(enviada().data)).toEqual(datos);
		expect(enviada().headers.Authorization).toBe('Bearer a1');
	});

	it('obtenerComprasEvento hace GET /api/eventos/:id/compras', async () => {
		const cuerpo = { compras: [], disponibilidad: [] };
		adaptador.responder(200, cuerpo);
		await expect(obtenerComprasEvento('e 1')).resolves.toEqual(cuerpo);
		expect(enviada()).toMatchObject({
			method: 'get',
			url: '/api/eventos/e%201/compras'
		});
		expect(enviada().headers.Authorization).toBe('Bearer a1');
	});
});
