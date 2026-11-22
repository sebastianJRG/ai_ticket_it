/**
 * Tests unitarios de `CompraService.listarComprasDeEvento`.
 * Repositorios en memoria nuevos en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import EstadoCompra from '../../../src/models/estadoCompra.js';
import CambioEstadoCompraRepository from '../../../src/repositories/cambioEstadoCompraRepository.js';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import UsuarioRepository from '../../../src/repositories/usuarioRepository.js';
import CompraService from '../../../src/services/compraService.js';
import {
	construirCompra,
	construirEvento,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

describe('CompraService.listarComprasDeEvento', () => {
	let compraRepo;
	let eventoRepo;
	let usuarioRepo;
	let servicio;
	let organizador;
	let otroOrganizador;
	let comprador;
	let otroComprador;
	let evento;
	let otroEvento;

	const listar = (usuario, eventoId = evento.id) =>
		servicio.listarComprasDeEvento({ eventoId, usuarioId: usuario.id });

	const comprarEn = (e, quien, estado = EstadoCompra.PENDIENTE) =>
		construirCompra(compraRepo, {
			comprador: quien,
			evento: e,
			tipoEntrada: e.tiposEntrada[0],
			estado
		});

	beforeEach(async () => {
		compraRepo = new CompraRepository();
		eventoRepo = new EventoRepository();
		usuarioRepo = new UsuarioRepository();
		servicio = new CompraService(
			compraRepo,
			eventoRepo,
			usuarioRepo,
			new CambioEstadoCompraRepository()
		);

		organizador = await usuarioRepo.crear(
			construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.uno' })
		);
		otroOrganizador = await usuarioRepo.crear(
			construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.dos' })
		);
		comprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comp.uno' })
		);
		otroComprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comp.dos' })
		);
		evento = await construirEvento(eventoRepo, { organizador });
		otroEvento = await construirEvento(eventoRepo, {
			organizador: otroOrganizador,
			prefijoTipos: 'x'
		});
	});

	it('devuelve vacío si el evento no tiene compras', async () => {
		expect((await listar(organizador)).compras).toEqual([]);
	});

	it('devuelve las compras de todos los compradores, en cualquier estado y en orden', async () => {
		const a = await comprarEn(evento, comprador, EstadoCompra.PENDIENTE);
		const b = await comprarEn(evento, otroComprador, EstadoCompra.CONFIRMADA);
		const c = await comprarEn(evento, comprador, EstadoCompra.CANCELADA);

		const { compras } = await listar(organizador);

		expect(compras.map((x) => x.id)).toEqual([a.id, b.id, c.id]);
	});

	it('no mezcla compras de otros eventos', async () => {
		const propia = await comprarEn(evento, comprador);
		await comprarEn(otroEvento, comprador);

		const { compras } = await listar(organizador);

		expect(compras.map((x) => x.id)).toEqual([propia.id]);
	});

	describe('disponibilidad por tipo de entrada', () => {
		let conDosTipos;

		const comprarTipo = (indice, cantidad, estado) =>
			construirCompra(compraRepo, {
				comprador,
				evento: conDosTipos,
				tipoEntrada: conDosTipos.tiposEntrada[indice],
				cantidad,
				estado
			});

		beforeEach(async () => {
			conDosTipos = await construirEvento(eventoRepo, {
				organizador,
				precios: [100, 250],
				cupo: 10,
				prefijoTipos: 'd'
			});
		});

		it('informa cupo completo de cada tipo si no hay compras', async () => {
			const { disponibilidad } = await listar(organizador, conDosTipos.id);

			expect(disponibilidad).toEqual([
				{
					tipoEntradaId: 'd1',
					nombre: 'Tipo 1',
					precio: 100,
					cupo: 10,
					vendidas: 0,
					disponibles: 10
				},
				{
					tipoEntradaId: 'd2',
					nombre: 'Tipo 2',
					precio: 250,
					cupo: 10,
					vendidas: 0,
					disponibles: 10
				}
			]);
		});

		it('descuenta las entradas PENDIENTE, CONFIRMADA y UTILIZADA de su tipo', async () => {
			await comprarTipo(0, 2, EstadoCompra.PENDIENTE);
			await comprarTipo(0, 3, EstadoCompra.CONFIRMADA);
			await comprarTipo(1, 1, EstadoCompra.UTILIZADA);

			const { disponibilidad } = await listar(organizador, conDosTipos.id);

			expect(disponibilidad.map((d) => [d.vendidas, d.disponibles])).toEqual([
				[5, 5],
				[1, 9]
			]);
		});

		it('no descuenta las compras CANCELADA ni REEMBOLSADA', async () => {
			await comprarTipo(0, 4, EstadoCompra.CANCELADA);
			await comprarTipo(0, 2, EstadoCompra.REEMBOLSADA);

			const { disponibilidad } = await listar(organizador, conDosTipos.id);

			expect(disponibilidad[0]).toMatchObject({ vendidas: 0, disponibles: 10 });
		});

		it('no cuenta compras de otros eventos', async () => {
			await comprarEn(evento, comprador, EstadoCompra.CONFIRMADA);

			const { disponibilidad } = await listar(organizador, conDosTipos.id);

			expect(disponibilidad[0]).toMatchObject({ vendidas: 0, disponibles: 10 });
		});
	});

	it('rechaza con 403 a un organizador que no es dueño del evento', async () => {
		await expect(listar(otroOrganizador)).rejects.toMatchObject({
			name: 'ForbiddenError'
		});
	});

	it('rechaza con 403 a un comprador', async () => {
		await expect(listar(comprador)).rejects.toMatchObject({
			name: 'ForbiddenError'
		});
	});

	it('rechaza con 404 si el evento no existe', async () => {
		await expect(listar(organizador, '999')).rejects.toMatchObject({
			name: 'NotFoundError'
		});
	});

	it('rechaza con 404 si el usuario no existe', async () => {
		await expect(
			servicio.listarComprasDeEvento({ eventoId: evento.id, usuarioId: '999' })
		).rejects.toMatchObject({ name: 'NotFoundError' });
	});

	it('rechaza con 400 si el ID de evento es inválido', async () => {
		await expect(listar(organizador, '  ')).rejects.toMatchObject({
			name: 'BadRequestError'
		});
	});
});
