/**
 * Tests unitarios de `CompraController.cancelar`, `confirmar` y `reembolsar`.
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

describe.each([
	['cancelar', 'cancelarCompra', 'COMPRADOR', 'CANCELADA'],
	['confirmar', 'confirmarCompra', 'ORGANIZADOR', 'CONFIRMADA'],
	['reembolsar', 'reembolsarCompra', 'ORGANIZADOR', 'REEMBOLSADA']
])('CompraController.%s', (metodo, metodoServicio, rol, estadoFinal) => {
	let servicio;
	let controlador;
	let req;
	let res;
	let next;
	let compra;

	beforeEach(async () => {
		const comprador = construirUsuario({ id: '5', rol: 'COMPRADOR' });
		const evento = await construirEvento(new EventoRepository(), {
			nombre: 'Rock Fest',
			organizador: construirUsuario({ id: '9', rol: 'ORGANIZADOR' })
		});
		compra = await construirCompra(new CompraRepository(), {
			comprador,
			evento,
			tipoEntrada: evento.tiposEntrada[0],
			cantidad: 2,
			estado: estadoFinal
		});

		servicio = { [metodoServicio]: jest.fn().mockResolvedValue(compra) };
		controlador = new CompraController(servicio);
		req = { user: { id: '7', rol }, params: { idCompra: '42' }, body: {} };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it('delega en el servicio con el ID de la URL y el usuario del token', async () => {
		await controlador[metodo](req, res, next);

		expect(servicio[metodoServicio]).toHaveBeenCalledTimes(1);
		expect(servicio[metodoServicio]).toHaveBeenCalledWith({
			compraId: '42',
			usuarioId: '7'
		});
	});

	it('ignora un usuarioId enviado en el cuerpo', async () => {
		req.body = { usuarioId: '999-falso', compraId: '999-falso' };

		await controlador[metodo](req, res, next);

		expect(servicio[metodoServicio]).toHaveBeenCalledWith({
			compraId: '42',
			usuarioId: '7'
		});
	});

	it('responde 200 con la compra en la forma del contrato', async () => {
		await controlador[metodo](req, res, next);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledTimes(1);
		expect(res.json.mock.calls[0][0]).toEqual({
			id: compra.id,
			comprador: { id: '5', nombre: 'Ana', apellido: 'Pérez' },
			evento: {
				id: compra.evento.id,
				nombre: 'Rock Fest',
				fecha: compra.evento.fecha
			},
			tipoEntrada: { id: 't1', nombre: 'Tipo 1', precio: 100 },
			cantidad: 2,
			total: 200,
			estado: estadoFinal
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('no filtra hashes en la respuesta', async () => {
		await controlador[metodo](req, res, next);

		const json = JSON.stringify(res.json.mock.calls[0][0]);
		expect(json).not.toContain('hash-secreto');
	});

	it('delega el error en next y no responde si el servicio rechaza', async () => {
		const error = new Error('Transición no permitida');
		servicio[metodoServicio].mockRejectedValue(error);

		await controlador[metodo](req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});
});
