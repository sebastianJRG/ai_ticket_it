/**
 * Tests unitarios de `EventoController.obtener` (GET /api/eventos/:idEvento).
 * El servicio y los objetos de Express son dobles creados en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import EventoController from '../../../src/controllers/eventoController.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

describe('EventoController.obtener', () => {
	let servicio;
	let controlador;
	let req;
	let res;
	let next;
	let evento;

	beforeEach(() => {
		evento = {
			id: '1',
			nombre: 'Rock Fest',
			organizador: construirUsuario({ id: '9', rol: 'ORGANIZADOR' })
		};
		servicio = { obtenerPorId: jest.fn().mockResolvedValue(evento) };
		controlador = new EventoController(servicio);
		req = { params: { idEvento: '1' } };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it('responde 200 con el evento serializado', async () => {
		await controlador.obtener(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			id: '1',
			nombre: 'Rock Fest',
			organizador: {
				id: '9',
				nombre: 'Ana',
				apellido: 'Pérez',
				rol: 'ORGANIZADOR'
			},
			puntajeOrganizador: null
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('no filtra los hashes del organizador', async () => {
		await controlador.obtener(req, res, next);

		const json = JSON.stringify(res.json.mock.calls[0][0]);
		expect(json).not.toContain('contraseniaHash');
		expect(json).not.toContain('refreshTokenHash');
		expect(json).not.toContain('hash-secreto');
	});

	it('toma el id de la URL y es una ruta pública (sin req.user)', async () => {
		await controlador.obtener(req, res, next);

		expect(servicio.obtenerPorId).toHaveBeenCalledWith('1');
		expect(req.user).toBeUndefined();
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it('delega el error en next y no responde si el servicio rechaza', async () => {
		const error = Object.assign(new Error('no existe'), { status: 404 });
		servicio.obtenerPorId.mockRejectedValue(error);

		await controlador.obtener(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
