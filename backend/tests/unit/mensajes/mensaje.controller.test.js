/**
 * Tests unitarios de `MensajeController`.
 * El servicio y los objetos de Express son dobles creados en cada test.
 * El controlador pasa `{ requestId: req.id }` al servicio para los logs
 * (specs/008-chat-compra/research.md R11).
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import MensajeController from '../../../src/controllers/mensajeController.js';
import Mensaje from '../../../src/models/mensaje.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

describe('MensajeController', () => {
	let servicio;
	let controlador;
	let req;
	let res;
	let next;
	let mensaje;

	const respuestaEsperada = () => ({
		id: '7',
		compraId: '3',
		usuario: { id: '5', nombre: 'Ana', apellido: 'Pérez', rol: 'COMPRADOR' },
		mensaje: 'Hola',
		enviado: mensaje.enviado
	});

	beforeEach(() => {
		mensaje = new Mensaje(
			'7',
			construirUsuario({ id: '5', rol: 'COMPRADOR' }),
			'Hola',
			new Date('2030-01-01T10:00:00.000Z'),
			{ id: '3' }
		);
		servicio = {
			crearMensaje: jest.fn().mockResolvedValue(mensaje),
			listarPorCompra: jest.fn().mockResolvedValue([mensaje])
		};
		controlador = new MensajeController(servicio);
		req = {
			user: { id: '5', rol: 'COMPRADOR' },
			params: { idCompra: '3' },
			body: { mensaje: 'Hola' },
			id: 'req-1'
		};
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	describe('crear', () => {
		it('responde 201 con el mensaje serializado', async () => {
			await controlador.crear(req, res, next);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(respuestaEsperada());
		});

		it('toma el usuario del token y la compra de la URL, nunca del cuerpo', async () => {
			req.body = { mensaje: 'Hola', usuarioId: '99', compraId: '99' };

			await controlador.crear(req, res, next);

			expect(servicio.crearMensaje).toHaveBeenCalledWith(
				{
					compraId: '3',
					usuarioId: '5',
					mensaje: 'Hola'
				},
				{ requestId: 'req-1' }
			);
		});

		it('tolera un cuerpo ausente pasando mensaje undefined al servicio', async () => {
			req.body = undefined;

			await controlador.crear(req, res, next);

			expect(servicio.crearMensaje).toHaveBeenCalledWith(
				{
					compraId: '3',
					usuarioId: '5',
					mensaje: undefined
				},
				{ requestId: 'req-1' }
			);
		});

		it('propaga el error del servicio con next', async () => {
			const error = new Error('falló');
			servicio.crearMensaje.mockRejectedValue(error);

			await controlador.crear(req, res, next);

			expect(next).toHaveBeenCalledWith(error);
			expect(res.json).not.toHaveBeenCalled();
		});
	});

	describe('listar', () => {
		it('responde 200 con la lista serializada', async () => {
			await controlador.listar(req, res, next);

			expect(servicio.listarPorCompra).toHaveBeenCalledWith(
				{
					compraId: '3',
					usuarioId: '5'
				},
				{ requestId: 'req-1' }
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith([respuestaEsperada()]);
		});

		it('propaga el error del servicio con next', async () => {
			const error = new Error('falló');
			servicio.listarPorCompra.mockRejectedValue(error);

			await controlador.listar(req, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
