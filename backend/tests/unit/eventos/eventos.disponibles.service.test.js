/**
 * Tests unitarios de `EventoService.obtenerPorId` con el cupo disponible por
 * tipo de entrada (`disponibles`), usado por el checkout del comprador.
 * Repositorios en memoria nuevos en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import EventoService from '../../../src/services/eventoService.js';
import Compra from '../../../src/models/compra.js';
import EstadoCompra from '../../../src/models/estadoCompra.js';
import { construirEvento } from '../../helpers/eventosFixtures.js';

const silencioso = { info: () => {} };

describe('EventoService.obtenerPorId › disponibles', () => {
	let eventoRepo;
	let compraRepo;
	let servicio;
	let evento;

	/** Guarda una compra del evento para el tipo indicado. */
	const comprar = (tipo, cantidad, estado, deEvento = evento) =>
		compraRepo.crear(
			new Compra(
				null,
				{ id: 'comp-1' },
				deEvento,
				tipo,
				cantidad,
				tipo.precio * cantidad,
				estado
			)
		);

	beforeEach(async () => {
		eventoRepo = new EventoRepository();
		compraRepo = new CompraRepository();
		servicio = new EventoService(
			eventoRepo,
			null,
			null,
			null,
			null,
			silencioso,
			compraRepo
		);
		evento = await construirEvento(eventoRepo, {
			precios: [100, 200],
			cupo: 10
		});
	});

	it('sin compras, disponibles es igual al cupo', async () => {
		const detalle = await servicio.obtenerPorId(evento.id);

		expect(detalle.tiposEntrada.map((t) => t.disponibles)).toEqual([10, 10]);
	});

	it('cupo 10 y 5 confirmadas → quedan 5', async () => {
		const [general] = evento.tiposEntrada;
		await comprar(general, 5, EstadoCompra.CONFIRMADA);

		const detalle = await servicio.obtenerPorId(evento.id);

		expect(detalle.tiposEntrada[0].disponibles).toBe(5);
		expect(detalle.tiposEntrada[1].disponibles).toBe(10);
	});

	it('PENDIENTE, CONFIRMADA y UTILIZADA ocupan cupo; CANCELADA y REEMBOLSADA no', async () => {
		const [general] = evento.tiposEntrada;
		await comprar(general, 1, EstadoCompra.PENDIENTE);
		await comprar(general, 2, EstadoCompra.CONFIRMADA);
		await comprar(general, 3, EstadoCompra.UTILIZADA);
		await comprar(general, 4, EstadoCompra.CANCELADA);
		await comprar(general, 4, EstadoCompra.REEMBOLSADA);

		const detalle = await servicio.obtenerPorId(evento.id);

		expect(detalle.tiposEntrada[0].disponibles).toBe(4);
	});

	it('no cuenta compras de otros eventos', async () => {
		const otro = await construirEvento(eventoRepo, { prefijoTipos: 'o' });
		await comprar(otro.tiposEntrada[0], 7, EstadoCompra.CONFIRMADA, otro);

		const detalle = await servicio.obtenerPorId(evento.id);

		expect(detalle.tiposEntrada[0].disponibles).toBe(10);
	});

	it('no modifica los tipos de entrada guardados', async () => {
		await servicio.obtenerPorId(evento.id);

		const guardado = await eventoRepo.buscarPorId(evento.id);
		expect(guardado.tiposEntrada[0].disponibles).toBeUndefined();
	});

	it('sin compraRepository inyectado, disponibles es igual al cupo', async () => {
		const sinCompras = new EventoService(eventoRepo, null, null, null, null);

		const detalle = await sinCompras.obtenerPorId(evento.id);

		expect(detalle.tiposEntrada[0].disponibles).toBe(10);
	});

	it('el listado no incluye disponibles', async () => {
		const [primero] = await servicio.buscarEventos({});

		expect(primero.tiposEntrada[0].disponibles).toBeUndefined();
	});
});
