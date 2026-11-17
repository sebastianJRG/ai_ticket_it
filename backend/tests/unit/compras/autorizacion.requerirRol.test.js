/**
 * Tests unitarios del middleware `requerirRol`.
 * Se invoca la función directamente con objetos falsos: sin Express ni servidor.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { requerirRol } from '../../../src/utils/autorizacion.js';
import ErrorHttp from '../../../src/utils/errorHttp.js';

describe('requerirRol', () => {
	let res;
	let next;

	beforeEach(() => {
		res = {};
		next = jest.fn();
	});

	it('responde 401 si no hay usuario autenticado (undefined)', () => {
		requerirRol('COMPRADOR')({ user: undefined }, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		const error = next.mock.calls[0][0];
		expect(error).toBeInstanceOf(ErrorHttp);
		expect(error.status).toBe(401);
	});

	it('responde 401 si el token fue inválido (user = null)', () => {
		requerirRol('COMPRADOR')({ user: null }, res, next);

		expect(next.mock.calls[0][0].status).toBe(401);
	});

	it('responde 403 si el rol no está permitido', () => {
		requerirRol('COMPRADOR')({ user: { id: '1', rol: 'ORGANIZADOR' } }, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		const error = next.mock.calls[0][0];
		expect(error).toBeInstanceOf(ErrorHttp);
		expect(error.status).toBe(403);
	});

	it('continúa sin error si el rol coincide', () => {
		requerirRol('COMPRADOR')({ user: { id: '1', rol: 'COMPRADOR' } }, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith();
	});

	it('acepta cualquiera de varios roles permitidos', () => {
		const middleware = requerirRol('COMPRADOR', 'ORGANIZADOR');

		middleware({ user: { rol: 'ORGANIZADOR' } }, res, next);

		expect(next).toHaveBeenCalledWith();
	});

	it('cada middleware creado es independiente', () => {
		const soloComprador = requerirRol('COMPRADOR');
		const soloOrganizador = requerirRol('ORGANIZADOR');
		const req = { user: { rol: 'COMPRADOR' } };

		soloComprador(req, res, next);
		soloOrganizador(req, res, next);

		expect(next.mock.calls[0]).toEqual([]);
		expect(next.mock.calls[1][0].status).toBe(403);
	});
});
