/**
 * Tests unitarios de `ReseniaController`.
 * El servicio y los objetos de Express son dobles creados en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import ReseniaController from '../../../src/controllers/reseniaController.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import ReseniaRepository from '../../../src/repositories/reseniaRepository.js';
import {
	construirEvento,
	construirResenia,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

describe('ReseniaController', () => {
	let servicio;
	let controlador;
	let req;
	let res;
	let next;
	let resenia;

	/** Forma esperada de la reseña en la respuesta. */
	const respuestaEsperada = () => ({
		id: resenia.id,
		comprador: { id: '5', nombre: 'Ana', apellido: 'Pérez' },
		eventoId: resenia.evento.id,
		detalle: 'Muy buen evento',
		puntuacion: 4
	});

	beforeEach(async () => {
		const evento = await construirEvento(new EventoRepository());
		resenia = await construirResenia(new ReseniaRepository(), evento, 4, {
			comprador: construirUsuario({ id: '5', rol: 'COMPRADOR' }),
			detalle: 'Muy buen evento'
		});

		servicio = {
			crearResenia: jest.fn().mockResolvedValue(resenia),
			listarPorEvento: jest.fn().mockResolvedValue([resenia])
		};
		controlador = new ReseniaController(servicio);
		req = {
			user: { id: '5', rol: 'COMPRADOR' },
			params: {},
			body: { eventoId: '1', detalle: 'Muy buen evento', puntuacion: 4 }
		};
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	describe('crear', () => {
		it('responde 201 con la reseña en la forma del contrato', async () => {
			await controlador.crear(req, res, next);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledTimes(1);
			expect(res.json.mock.calls[0][0]).toEqual(respuestaEsperada());
			expect(next).not.toHaveBeenCalled();
		});

		it('no filtra hashes en la respuesta', async () => {
			await controlador.crear(req, res, next);

			expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(
				'hash-secreto'
			);
		});

		it('toma compradorId del token y no del cuerpo', async () => {
			req.body.compradorId = '999-falso';

			await controlador.crear(req, res, next);

			expect(servicio.crearResenia).toHaveBeenCalledWith({
				eventoId: '1',
				detalle: 'Muy buen evento',
				puntuacion: 4,
				compradorId: '5'
			});
		});

		it('no modifica el cuerpo original de la petición', async () => {
			req.body.compradorId = '999-falso';

			await controlador.crear(req, res, next);

			expect(req.body.compradorId).toBe('999-falso');
		});

		it('delega el error en next y no responde si el servicio rechaza', async () => {
			const error = new Error('Ya reseñaste este evento.');
			servicio.crearResenia.mockRejectedValue(error);

			await controlador.crear(req, res, next);

			expect(next).toHaveBeenCalledWith(error);
			expect(res.status).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
		});
	});

	describe('listar', () => {
		beforeEach(() => {
			req = { params: { idEvento: '1' }, body: {} };
		});

		it('delega en el servicio con el ID de la URL', async () => {
			await controlador.listar(req, res, next);

			expect(servicio.listarPorEvento).toHaveBeenCalledWith('1');
		});

		it('funciona sin usuario autenticado y responde 200 con la lista', async () => {
			await controlador.listar(req, res, next);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json.mock.calls[0][0]).toEqual([respuestaEsperada()]);
			expect(next).not.toHaveBeenCalled();
		});

		it('responde 200 con un arreglo vacío si no hay reseñas', async () => {
			servicio.listarPorEvento.mockResolvedValue([]);

			await controlador.listar(req, res, next);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith([]);
		});

		it('delega el error en next si el servicio rechaza', async () => {
			const error = new Error('El evento con ID 1 no existe.');
			servicio.listarPorEvento.mockRejectedValue(error);

			await controlador.listar(req, res, next);

			expect(next).toHaveBeenCalledWith(error);
			expect(res.json).not.toHaveBeenCalled();
		});
	});
});
