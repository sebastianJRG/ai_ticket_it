/**
 * Tests unitarios de `UsuariosController.obtenerActual`.
 * El servicio y los objetos de Express son dobles creados en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import UsuariosController from '../../../src/controllers/usuariosController.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

describe('UsuariosController.obtenerActual', () => {
	let servicio;
	let controlador;
	let req;
	let res;
	let next;

	beforeEach(() => {
		servicio = {
			obtenerPerfil: jest
				.fn()
				.mockResolvedValue(construirUsuario({ id: '5', rol: 'COMPRADOR' }))
		};
		controlador = new UsuariosController(servicio);
		req = { user: { id: '5', rol: 'COMPRADOR' }, params: {}, body: {} };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it('responde 200 con el perfil serializado, sin hashes', async () => {
		await controlador.obtenerActual(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			id: '5',
			nombre: 'Ana',
			apellido: 'Pérez',
			nombreUsuario: 'usuario.test',
			rol: 'COMPRADOR',
			permissions: ['permiso:uno']
		});
	});

	it('toma el id del token, nunca de la URL ni del cuerpo', async () => {
		req.params = { id: '99' };
		req.body = { id: '99' };

		await controlador.obtenerActual(req, res, next);

		expect(servicio.obtenerPerfil).toHaveBeenCalledWith('5');
	});

	it('delega los errores del servicio a next', async () => {
		const error = new Error('no existe');
		servicio.obtenerPerfil.mockRejectedValue(error);

		await controlador.obtenerActual(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
