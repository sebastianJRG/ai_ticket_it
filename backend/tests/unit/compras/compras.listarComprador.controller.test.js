/**
 * Tests unitarios de `CompraController.listarPropias` (GET /api/compras).
 * El servicio y los objetos de Express son dobles creados en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import CompraController from '../../../src/controllers/compraController.js';
import { aCompraRespuesta } from '../../../src/dto/compra.js';
import EstadoCompra from '../../../src/models/estadoCompra.js';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import {
	construirCompra,
	construirEvento,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

describe('CompraController.listarPropias', () => {
	let servicio;
	let controlador;
	let req;
	let res;
	let next;
	let confirmada;
	let pendiente;

	beforeEach(async () => {
		const evento = await construirEvento(new EventoRepository());
		const repo = new CompraRepository();
		const datos = {
			comprador: construirUsuario({ id: '5' }),
			evento,
			tipoEntrada: evento.tiposEntrada[0]
		};
		confirmada = await construirCompra(repo, {
			...datos,
			estado: EstadoCompra.CONFIRMADA
		});
		pendiente = await construirCompra(repo, datos);

		servicio = {
			listarComprasDeComprador: jest.fn().mockResolvedValue([
				{ compra: confirmada, diasRestantes: 4 },
				{ compra: pendiente, diasRestantes: null }
			])
		};
		controlador = new CompraController(servicio);
		req = { user: { id: '5', rol: 'COMPRADOR' } };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it('responde 200 con cada compra serializada y sus días restantes', async () => {
		await controlador.listarPropias(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith([
			{ ...aCompraRespuesta(confirmada), diasRestantes: 4 },
			{ ...aCompraRespuesta(pendiente), diasRestantes: null }
		]);
	});

	it('toma el comprador del token', async () => {
		await controlador.listarPropias(req, res, next);

		expect(servicio.listarComprasDeComprador).toHaveBeenCalledWith({
			usuarioId: '5'
		});
	});

	it('no expone hashes del comprador', async () => {
		await controlador.listarPropias(req, res, next);

		expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(
			'hash-secreto'
		);
	});

	it('propaga el error del servicio con next', async () => {
		const error = new Error('falló');
		servicio.listarComprasDeComprador.mockRejectedValue(error);

		await controlador.listarPropias(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
