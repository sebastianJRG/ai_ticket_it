/**
 * Tests unitarios de `CompraService.listarComprasDeComprador` (GET /api/compras).
 * Repositorios en memoria nuevos en cada test y reloj inyectado.
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

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } =
	EstadoCompra;

const AHORA = new Date('2030-01-01T12:00:00.000Z');
const DIA_MS = 24 * 60 * 60 * 1000;

describe('CompraService.listarComprasDeComprador', () => {
	let compraRepo;
	let eventoRepo;
	let usuarioRepo;
	let servicio;
	let comprador;
	let otroComprador;
	let organizador;
	let evento;

	const listar = (usuario = comprador) =>
		servicio.listarComprasDeComprador({ usuarioId: usuario.id });

	const comprarEn = (e, estado = PENDIENTE, quien = comprador) =>
		construirCompra(compraRepo, {
			comprador: quien,
			evento: e,
			tipoEntrada: e.tiposEntrada[0],
			estado
		});

	const eventoEn = (ms, prefijoTipos = 'e') =>
		construirEvento(eventoRepo, {
			organizador,
			fecha: new Date(AHORA.getTime() + ms),
			prefijoTipos
		});

	beforeEach(async () => {
		compraRepo = new CompraRepository();
		eventoRepo = new EventoRepository();
		usuarioRepo = new UsuarioRepository();
		servicio = new CompraService(
			compraRepo,
			eventoRepo,
			usuarioRepo,
			new CambioEstadoCompraRepository(),
			() => AHORA
		);

		comprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comp.uno' })
		);
		otroComprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comp.dos' })
		);
		organizador = await usuarioRepo.crear(
			construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.uno' })
		);
		evento = await eventoEn(3 * DIA_MS);
	});

	it('devuelve vacío si el comprador no tiene compras', async () => {
		expect(await listar()).toEqual([]);
	});

	it('devuelve solo las compras del comprador, en cualquier estado y en orden de creación', async () => {
		const a = await comprarEn(evento, PENDIENTE);
		await comprarEn(evento, CONFIRMADA, otroComprador);
		const b = await comprarEn(evento, CANCELADA);
		const c = await comprarEn(evento, REEMBOLSADA);

		const resultado = await listar();

		expect(resultado.map((r) => r.compra.id)).toEqual([a.id, b.id, c.id]);
		expect(resultado.map((r) => r.compra.estado)).toEqual([
			PENDIENTE,
			CANCELADA,
			REEMBOLSADA
		]);
	});

	it('calcula los días que faltan para el evento de una compra CONFIRMADA', async () => {
		await comprarEn(evento, CONFIRMADA);

		const [{ diasRestantes }] = await listar();

		expect(diasRestantes).toBe(3);
	});

	it('redondea hacia arriba los días parciales', async () => {
		const enDiaYMedio = await eventoEn(1.5 * DIA_MS, 'm');
		await comprarEn(enDiaYMedio, CONFIRMADA);

		const [{ diasRestantes }] = await listar();

		expect(diasRestantes).toBe(2);
	});

	it('devuelve 0 días si el evento de una compra CONFIRMADA ya ocurrió', async () => {
		const pasado = await eventoEn(-DIA_MS, 'p');
		await comprarEn(pasado, CONFIRMADA);

		const [{ diasRestantes }] = await listar();

		expect(diasRestantes).toBe(0);
	});

	it.each([PENDIENTE, UTILIZADA, CANCELADA, REEMBOLSADA])(
		'devuelve diasRestantes null para una compra %s',
		async (estado) => {
			await comprarEn(evento, estado);

			const [{ diasRestantes }] = await listar();

			expect(diasRestantes).toBeNull();
		}
	);

	it('rechaza con 403 a un ORGANIZADOR', async () => {
		await expect(listar(organizador)).rejects.toMatchObject({ status: 403 });
	});

	it('rechaza con 404 si el usuario no existe', async () => {
		await expect(
			servicio.listarComprasDeComprador({ usuarioId: '999' })
		).rejects.toMatchObject({ status: 404 });
	});
});

describe('CompraRepository.buscarPorCompradorId', () => {
	it('devuelve copias de las compras del comprador en orden de creación', async () => {
		const repo = new CompraRepository();
		const evento = await construirEvento(new EventoRepository());
		const comprador = construirUsuario({ id: 'c1' });
		const otro = construirUsuario({ id: 'c2' });
		const datos = { evento, tipoEntrada: evento.tiposEntrada[0] };
		const a = await construirCompra(repo, { ...datos, comprador });
		await construirCompra(repo, { ...datos, comprador: otro });
		const b = await construirCompra(repo, { ...datos, comprador });

		const compras = await repo.buscarPorCompradorId('c1');

		expect(compras.map((c) => c.id)).toEqual([a.id, b.id]);
		compras[0].cantidad = 99;
		expect((await repo.buscarPorId(a.id)).cantidad).toBe(1);
	});
});
