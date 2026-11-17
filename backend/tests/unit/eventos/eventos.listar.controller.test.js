/**
 * Tests unitarios de `EventoController.listar` (GET /api/eventos).
 * El servicio y los objetos de Express son dobles creados en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import EventoController from '../../../src/controllers/eventoController.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

describe('EventoController.listar', () => {
	let servicio;
	let controlador;
	let req;
	let res;
	let next;

	beforeEach(() => {
		servicio = { buscarEventos: jest.fn() };
		controlador = new EventoController(servicio);
		req = { query: { q: 'rock', sortBy: 'precio' } };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it('responde 200 con los eventos que devuelve el servicio', async () => {
		const eventos = [
			{ id: '1', nombre: 'Rock Fest', organizador: construirUsuario({ id: '9', rol: 'ORGANIZADOR' }) }
		];
		servicio.buscarEventos.mockResolvedValue(eventos);

		await controlador.listar(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledTimes(1);
		expect(res.json).toHaveBeenCalledWith([
			{
				id: '1',
				nombre: 'Rock Fest',
				organizador: { id: '9', nombre: 'Ana', apellido: 'Pérez', rol: 'ORGANIZADOR' }
			}
		]);
		expect(next).not.toHaveBeenCalled();
	});

	it('no filtra los hashes del organizador en la respuesta', async () => {
		servicio.buscarEventos.mockResolvedValue([
			{ id: '1', nombre: 'Rock Fest', organizador: construirUsuario({ id: '9', rol: 'ORGANIZADOR' }) }
		]);

		await controlador.listar(req, res, next);

		const json = JSON.stringify(res.json.mock.calls[0][0]);
		expect(json).not.toContain('contraseniaHash');
		expect(json).not.toContain('refreshTokenHash');
		expect(json).not.toContain('hash-secreto');
	});

	it('pasa al servicio una copia de req.query, no el mismo objeto', async () => {
		servicio.buscarEventos.mockResolvedValue([]);

		await controlador.listar(req, res, next);

		const argumento = servicio.buscarEventos.mock.calls[0][0];
		expect(argumento).toEqual({ q: 'rock', sortBy: 'precio' });
		expect(argumento).not.toBe(req.query);
	});

	it('es una ruta pública: funciona sin req.user', async () => {
		servicio.buscarEventos.mockResolvedValue([]);
		req.user = undefined;

		await controlador.listar(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(next).not.toHaveBeenCalled();
	});

	it('responde 200 con un arreglo vacío si no hay coincidencias', async () => {
		servicio.buscarEventos.mockResolvedValue([]);

		await controlador.listar(req, res, next);

		expect(res.json).toHaveBeenCalledWith([]);
	});

	it('delega el error en next y no responde si el servicio rechaza', async () => {
		const error = new Error('sortBy debe ser uno de: precio, fecha, puntaje.');
		servicio.buscarEventos.mockRejectedValue(error);

		await controlador.listar(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});
});
