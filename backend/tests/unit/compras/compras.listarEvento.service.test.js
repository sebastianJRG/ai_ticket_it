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
		expect(await listar(organizador)).toEqual([]);
	});

	it('devuelve las compras de todos los compradores, en cualquier estado y en orden', async () => {
		const a = await comprarEn(evento, comprador, EstadoCompra.PENDIENTE);
		const b = await comprarEn(evento, otroComprador, EstadoCompra.CONFIRMADA);
		const c = await comprarEn(evento, comprador, EstadoCompra.CANCELADA);

		const compras = await listar(organizador);

		expect(compras.map((x) => x.id)).toEqual([a.id, b.id, c.id]);
	});

	it('no mezcla compras de otros eventos', async () => {
		const propia = await comprarEn(evento, comprador);
		await comprarEn(otroEvento, comprador);

		const compras = await listar(organizador);

		expect(compras.map((x) => x.id)).toEqual([propia.id]);
	});

	it('rechaza con 403 a un organizador que no es dueño del evento', async () => {
		await expect(listar(otroOrganizador)).rejects.toMatchObject({ status: 403 });
	});

	it('rechaza con 403 a un comprador', async () => {
		await expect(listar(comprador)).rejects.toMatchObject({ status: 403 });
	});

	it('rechaza con 404 si el evento no existe', async () => {
		await expect(listar(organizador, '999')).rejects.toMatchObject({
			status: 404
		});
	});

	it('rechaza con 404 si el usuario no existe', async () => {
		await expect(
			servicio.listarComprasDeEvento({ eventoId: evento.id, usuarioId: '999' })
		).rejects.toMatchObject({ status: 404 });
	});

	it('rechaza con 400 si el ID de evento es inválido', async () => {
		await expect(listar(organizador, '  ')).rejects.toMatchObject({
			status: 400
		});
	});
});
