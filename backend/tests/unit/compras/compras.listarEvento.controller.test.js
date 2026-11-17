/**
 * Tests unitarios de `CompraController.listarPorEvento`.
 * El servicio y los objetos de Express son dobles creados en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import CompraController from '../../../src/controllers/compraController.js';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import {
	construirCompra,
	construirEvento,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

describe('CompraController.listarPorEvento', () => {
	let servicio;
	let controlador;
	let req;
	let res;
	let next;
	let compra;
	let disponibilidad;

	beforeEach(async () => {
		const evento = await construirEvento(new EventoRepository(), {
			nombre: 'Rock Fest',
			organizador: construirUsuario({ id: '9', rol: 'ORGANIZADOR' })
		});
		compra = await construirCompra(new CompraRepository(), {
			comprador: construirUsuario({ id: '5', rol: 'COMPRADOR' }),
			evento,
			tipoEntrada: evento.tiposEntrada[0],
			cantidad: 2
		});

		disponibilidad = [
			{
				tipoEntradaId: 't1',
				nombre: 'Tipo 1',
				precio: 100,
				cupo: 10,
				vendidas: 2,
				disponibles: 8
			}
		];
		servicio = {
			listarComprasDeEvento: jest
				.fn()
				.mockResolvedValue({ compras: [compra], disponibilidad })
		};
		controlador = new CompraController(servicio);
		req = { user: { id: '9', rol: 'ORGANIZADOR' }, params: { idEvento: '1' } };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it('responde 200 con las compras serializadas y la disponibilidad por tipo', async () => {
		await controlador.listarPorEvento(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			disponibilidad,
			compras: [
				{
					id: compra.id,
					comprador: { id: '5', nombre: 'Ana', apellido: 'Pérez' },
					evento: {
						id: compra.evento.id,
						nombre: 'Rock Fest',
						fecha: compra.evento.fecha
					},
					tipoEntrada: {
						id: compra.tipoEntrada.id,
						nombre: compra.tipoEntrada.nombre,
						precio: compra.tipoEntrada.precio
					},
					cantidad: 2,
					total: compra.total,
					estado: compra.estado
				}
			]
		});
	});

	it('no expone hashes ni datos sensibles del comprador', async () => {
		await controlador.listarPorEvento(req, res, next);

		const texto = JSON.stringify(res.json.mock.calls[0][0]);
		expect(texto).not.toContain('hash-secreto');
	});

	it('toma el usuario del token y el evento de la URL', async () => {
		await controlador.listarPorEvento(req, res, next);

		expect(servicio.listarComprasDeEvento).toHaveBeenCalledWith({
			eventoId: '1',
			usuarioId: '9'
		});
	});

	it('responde 200 con una lista vacía si no hay compras', async () => {
		servicio.listarComprasDeEvento.mockResolvedValue({
			compras: [],
			disponibilidad
		});

		await controlador.listarPorEvento(req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ compras: [], disponibilidad });
	});

	it('propaga el error del servicio con next', async () => {
		const error = new Error('falló');
		servicio.listarComprasDeEvento.mockRejectedValue(error);

		await controlador.listarPorEvento(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
