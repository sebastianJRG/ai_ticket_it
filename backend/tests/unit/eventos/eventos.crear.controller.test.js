/**
 * Tests unitarios de `EventoController.crear` (POST /api/eventos): los errores de
 * autenticación y rol se delegan a `next` como clases de `src/errors/`.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import EventoController from '../../../src/controllers/eventoController.js';
import {
	UnauthorizedError,
	ForbiddenError
} from '../../../src/errors/index.js';

describe('EventoController.crear', () => {
	let servicio;
	let controlador;
	let res;
	let next;

	beforeEach(() => {
		servicio = { crearEvento: jest.fn() };
		controlador = new EventoController(servicio);
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it('pasa un UnauthorizedError a next si no hay usuario', async () => {
		await controlador.crear({ user: null, body: {} }, res, next);

		expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
		expect(servicio.crearEvento).not.toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});

	it('pasa un ForbiddenError a next si el usuario no es ORGANIZADOR', async () => {
		await controlador.crear(
			{ user: { id: '1', rol: 'COMPRADOR' }, body: {} },
			res,
			next
		);

		expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
		expect(servicio.crearEvento).not.toHaveBeenCalled();
	});
});
