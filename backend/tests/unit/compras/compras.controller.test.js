/**
 * Tests unitarios de `CompraController.crear`.
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

describe('CompraController.crear', () => {
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
			cantidad: 2
		});

		servicio = { crearCompra: jest.fn().mockResolvedValue(compra) };
		controlador = new CompraController(servicio);
		req = {
			user: { id: '5', rol: 'COMPRADOR' },
			body: { eventoId: '1', tipoEntradaId: 't1', cantidad: 2 }
		};
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	it('responde 201 con la compra en la forma del contrato', async () => {
		await controlador.crear(req, res, next);

		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledTimes(1);
		expect(res.json.mock.calls[0][0]).toEqual({
			id: compra.id,
			comprador: { id: '5', nombre: 'Ana', apellido: 'Pérez' },
			evento: { id: compra.evento.id, nombre: 'Rock Fest', fecha: compra.evento.fecha },
			tipoEntrada: { id: 't1', nombre: 'Tipo 1', precio: 100 },
			cantidad: 2,
			total: 200,
			estado: 'PENDIENTE'
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('no filtra hashes en la respuesta', async () => {
		await controlador.crear(req, res, next);

		const json = JSON.stringify(res.json.mock.calls[0][0]);
		expect(json).not.toContain('hash-secreto');
		expect(json).not.toContain('contraseniaHash');
	});

	it('toma compradorId del token y no del cuerpo', async () => {
		req.body.compradorId = '999-falso';

		await controlador.crear(req, res, next);

		expect(servicio.crearCompra).toHaveBeenCalledTimes(1);
		expect(servicio.crearCompra.mock.calls[0][0]).toEqual({
			eventoId: '1',
			tipoEntradaId: 't1',
			cantidad: 2,
			compradorId: '5'
		});
	});

	it('no modifica el cuerpo original de la petición', async () => {
		req.body.compradorId = '999-falso';

		await controlador.crear(req, res, next);

		expect(req.body.compradorId).toBe('999-falso');
	});

	it('delega el error en next y no responde si el servicio rechaza', async () => {
		const error = new Error('Cupo insuficiente: quedan 0 entradas disponibles.');
		servicio.crearCompra.mockRejectedValue(error);

		await controlador.crear(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
	});
});
