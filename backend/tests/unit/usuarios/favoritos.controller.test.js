/**
 * Tests unitarios de `FavoritoController` (listar, agregar, quitar).
 * Los servicios y los objetos de Express son dobles creados en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import FavoritoController from '../../../src/controllers/favoritoController.js';
import ErrorHttp from '../../../src/utils/errorHttp.js';

/**
 * Evento de dominio con organizador completo (incluye hashes que no deben salir).
 * @returns {object} Evento con `puntajeOrganizador`
 */
function eventoConSecretos() {
	return {
		id: '7',
		nombre: 'Rock Fest',
		organizador: {
			id: 'org-1',
			nombre: 'Org',
			apellido: 'Uno',
			rol: 'ORGANIZADOR',
			contraseniaHash: 'hash-secreto',
			refreshTokenHash: 'refresh-secreto',
			permissions: ['crear:evento'],
			favoritos: []
		},
		puntajeOrganizador: 4.5
	};
}

let usuarioService;
let eventoService;
let controlador;
let req;
let res;
let next;

beforeEach(() => {
	usuarioService = {
		agregarAFavoritos: jest.fn().mockResolvedValue(['7']),
		removerDeFavoritos: jest.fn().mockResolvedValue([]),
		listarFavoritos: jest.fn().mockResolvedValue(['7'])
	};
	eventoService = {
		obtenerPorIds: jest.fn().mockResolvedValue([eventoConSecretos()])
	};
	controlador = new FavoritoController(usuarioService, eventoService);
	req = {
		id: 'req-1',
		user: { id: '5', rol: 'COMPRADOR' },
		params: { idEvento: '7' },
		body: { usuarioId: 'otro' }
	};
	res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
	next = jest.fn();
});

/**
 * Comprueba que la respuesta sea 200 con el evento en formato público.
 * @returns {void}
 */
function esperarListaPublica() {
	expect(res.status).toHaveBeenCalledWith(200);
	const [cuerpo] = res.json.mock.calls[0];
	expect(cuerpo).toHaveLength(1);
	expect(cuerpo[0].organizador).toEqual({
		id: 'org-1',
		nombre: 'Org',
		apellido: 'Uno',
		rol: 'ORGANIZADOR'
	});
	expect(cuerpo[0].puntajeOrganizador).toBe(4.5);
	expect(next).not.toHaveBeenCalled();
}

describe('FavoritoController.agregar', () => {
	it('usa el usuario del token, el ID de la URL y el requestId', async () => {
		await controlador.agregar(req, res, next);

		expect(usuarioService.agregarAFavoritos).toHaveBeenCalledWith('5', '7', {
			requestId: 'req-1'
		});
		expect(eventoService.obtenerPorIds).toHaveBeenCalledWith(['7'], {
			requestId: 'req-1'
		});
	});

	it('responde 200 con la lista en formato público', async () => {
		await controlador.agregar(req, res, next);

		esperarListaPublica();
	});

	it('pasa los errores del servicio a next', async () => {
		const error = new ErrorHttp(404, 'El evento con ID 7 no existe.');
		usuarioService.agregarAFavoritos.mockRejectedValue(error);

		await controlador.agregar(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});
});

describe('FavoritoController.quitar', () => {
	beforeEach(() => {
		usuarioService.removerDeFavoritos.mockResolvedValue(['7']);
	});

	it('usa el usuario del token, el ID de la URL y el requestId', async () => {
		await controlador.quitar(req, res, next);

		expect(usuarioService.removerDeFavoritos).toHaveBeenCalledWith('5', '7', {
			requestId: 'req-1'
		});
		expect(eventoService.obtenerPorIds).toHaveBeenCalledWith(['7'], {
			requestId: 'req-1'
		});
	});

	it('responde 200 con la lista en formato público', async () => {
		await controlador.quitar(req, res, next);

		esperarListaPublica();
	});

	it('pasa los errores del servicio a next', async () => {
		const error = new ErrorHttp(400, 'El ID del evento no puede estar vacío.');
		usuarioService.removerDeFavoritos.mockRejectedValue(error);

		await controlador.quitar(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});
});

describe('FavoritoController.listar', () => {
	it('usa el usuario del token y el requestId', async () => {
		await controlador.listar(req, res, next);

		expect(usuarioService.listarFavoritos).toHaveBeenCalledWith('5', {
			requestId: 'req-1'
		});
		expect(eventoService.obtenerPorIds).toHaveBeenCalledWith(['7'], {
			requestId: 'req-1'
		});
	});

	it('responde 200 con la lista en formato público', async () => {
		await controlador.listar(req, res, next);

		esperarListaPublica();
	});

	it('pasa los errores del servicio a next', async () => {
		const error = new ErrorHttp(404, 'El usuario no existe.');
		usuarioService.listarFavoritos.mockRejectedValue(error);

		await controlador.listar(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});
});
