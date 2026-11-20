/**
 * Tests unitarios del middleware `asignarRequestId`.
 * `req`, `res` y `next` son dobles creados en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { asignarRequestId } from '../../../src/utils/requestId.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Crea una petición falsa con el header `X-Request-Id` dado.
 * @param {string|undefined} valor - Valor del header (undefined = ausente)
 * @returns {{get: (nombre: string) => string|undefined}} Petición falsa
 */
function peticionCon(valor) {
	return {
		get: (nombre) =>
			nombre.toLowerCase() === 'x-request-id' ? valor : undefined
	};
}

describe('asignarRequestId', () => {
	let res;
	let next;

	beforeEach(() => {
		res = {};
		next = jest.fn();
	});

	it('usa el header X-Request-Id si es válido', () => {
		const req = peticionCon('prueba-123_ABC');

		asignarRequestId(req, res, next);

		expect(req.id).toBe('prueba-123_ABC');
	});

	it('acepta un header de exactamente 128 caracteres', () => {
		const valor = 'a'.repeat(128);
		const req = peticionCon(valor);

		asignarRequestId(req, res, next);

		expect(req.id).toBe(valor);
	});

	it.each([
		['ausente', undefined],
		['vacío', ''],
		['más de 128 caracteres', 'a'.repeat(129)],
		['con caracteres no permitidos', '<script>'],
		['con espacios', 'id con espacios'],
		['con salto de línea', 'id\ninyectado']
	])('genera un UUID si el header está %s', (_caso, valor) => {
		const req = peticionCon(valor);

		asignarRequestId(req, res, next);

		expect(req.id).toMatch(UUID);
	});

	it('genera IDs distintos para peticiones distintas', () => {
		const a = peticionCon(undefined);
		const b = peticionCon(undefined);

		asignarRequestId(a, res, next);
		asignarRequestId(b, res, next);

		expect(a.id).not.toBe(b.id);
	});

	it('llama a next() una sola vez y sin error', () => {
		asignarRequestId(peticionCon('ok'), res, next);
		asignarRequestId(peticionCon('<mal>'), res, next);

		expect(next).toHaveBeenCalledTimes(2);
		expect(next.mock.calls.every((args) => args.length === 0)).toBe(true);
	});
});
