/**
 * Tests unitarios de la jerarquía de errores de la aplicación (`src/errors/`).
 * Cada subclase fija su código HTTP; quien la lanza solo pasa el mensaje.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import {
	AppError,
	BadRequestError,
	UnauthorizedError,
	ForbiddenError,
	NotFoundError,
	ConflictError
} from '../../../src/errors/index.js';

describe('AppError', () => {
	it('guarda el mensaje y el código HTTP recibidos', () => {
		const error = new AppError('Algo falló', 418);

		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe('Algo falló');
		expect(error.statusCode).toBe(418);
		expect(error.name).toBe('AppError');
		expect(error.stack).toEqual(expect.any(String));
	});
});

describe.each([
	[BadRequestError, 400, 'BadRequestError'],
	[UnauthorizedError, 401, 'UnauthorizedError'],
	[ForbiddenError, 403, 'ForbiddenError'],
	[NotFoundError, 404, 'NotFoundError'],
	[ConflictError, 409, 'ConflictError']
])('%p', (Clase, statusCode, nombre) => {
	it(`extiende AppError y Error con statusCode ${statusCode}`, () => {
		const error = new Clase('Mensaje propio');

		expect(error).toBeInstanceOf(AppError);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(Clase);
		expect(error.statusCode).toBe(statusCode);
		expect(error.name).toBe(nombre);
		expect(error.message).toBe('Mensaje propio');
	});

	it('usa un mensaje por defecto no vacío si no recibe uno', () => {
		const error = new Clase();

		expect(typeof error.message).toBe('string');
		expect(error.message.length).toBeGreaterThan(0);
		expect(error.statusCode).toBe(statusCode);
	});
});
