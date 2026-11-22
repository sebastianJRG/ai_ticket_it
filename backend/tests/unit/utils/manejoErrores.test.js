/**
 * Tests unitarios del middleware central de errores (`src/utils/manejoErrores.js`).
 * Se invocan los middlewares con objetos falsos y un logger simulado.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
	rutaNoEncontrada,
	crearManejadorErrores
} from '../../../src/utils/manejoErrores.js';
import {
	AppError,
	BadRequestError,
	NotFoundError,
	ConflictError,
	UnauthorizedError
} from '../../../src/errors/index.js';

/**
 * Crea un logger simulado con los niveles que usa el manejador.
 * @returns {{info: jest.Mock, warn: jest.Mock, error: jest.Mock}} Logger falso
 */
function crearLogger() {
	return { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

/**
 * Lee el registro JSON emitido en la primera llamada de un nivel del logger.
 * @param {jest.Mock} nivel - Método del logger (warn o error)
 * @returns {object} Registro parseado
 */
function primerLog(nivel) {
	return JSON.parse(nivel.mock.calls[0][0]);
}

describe('rutaNoEncontrada', () => {
	it('pasa un NotFoundError al siguiente middleware', () => {
		const next = jest.fn();

		rutaNoEncontrada({}, {}, next);

		expect(next).toHaveBeenCalledTimes(1);
		const error = next.mock.calls[0][0];
		expect(error).toBeInstanceOf(NotFoundError);
		expect(error.statusCode).toBe(404);
		expect(error.message).toBe('No encontrada');
	});
});

describe('crearManejadorErrores', () => {
	let logger;
	let manejador;
	let req;
	let res;
	let next;

	beforeEach(() => {
		logger = crearLogger();
		manejador = crearManejadorErrores({ logger });
		req = { id: 'req-123', method: 'POST', originalUrl: '/api/compras' };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it.each([
		[new BadRequestError('Datos inválidos'), 400],
		[new UnauthorizedError('Sin token'), 401],
		[new NotFoundError('La compra no existe.'), 404],
		[new ConflictError('Sin cupo'), 409],
		[new AppError('Personalizado', 422), 422]
	])('responde un AppError con su statusCode (%s)', (error, statusCode) => {
		manejador(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(statusCode);
		expect(res.json).toHaveBeenCalledWith({ message: error.message });
		expect(next).not.toHaveBeenCalled();
	});

	it('registra un AppError como warn en JSON con el requestId', () => {
		manejador(new NotFoundError('La compra no existe.'), req, res, next);

		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.error).not.toHaveBeenCalled();
		expect(primerLog(logger.warn)).toMatchObject({
			evento: 'error_controlado',
			requestId: 'req-123',
			statusCode: 404,
			nombre: 'NotFoundError',
			metodo: 'POST',
			ruta: '/api/compras'
		});
	});

	it('responde 400 a un JSON mal formado del body-parser', () => {
		const error = Object.assign(new SyntaxError('Unexpected token'), {
			type: 'entity.parse.failed',
			status: 400,
			statusCode: 400
		});

		manejador(error, req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: 'Unexpected token' });
	});

	it('responde 500 genérico ante un error inesperado sin filtrar su mensaje', () => {
		manejador(new Error('detalle interno secreto'), req, res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Error interno del servidor'
		});
	});

	it('responde 500 aunque lo lanzado no sea un Error', () => {
		manejador('texto suelto', req, res, next);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Error interno del servidor'
		});
	});

	it('registra un error inesperado como error en JSON con stack y requestId', () => {
		manejador(new Error('detalle interno secreto'), req, res, next);

		expect(logger.error).toHaveBeenCalledTimes(1);
		const registro = primerLog(logger.error);
		expect(registro).toMatchObject({
			evento: 'error_inesperado',
			requestId: 'req-123',
			statusCode: 500,
			metodo: 'POST',
			ruta: '/api/compras',
			mensaje: 'detalle interno secreto'
		});
		expect(registro.stack).toEqual(expect.any(String));
	});

	it('usa console como logger por defecto', () => {
		const espia = jest.spyOn(console, 'warn').mockImplementation(() => {});

		crearManejadorErrores()(new NotFoundError(), req, res, next);

		expect(espia).toHaveBeenCalledTimes(1);
	});
});
