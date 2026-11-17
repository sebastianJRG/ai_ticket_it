/**
 * Tests unitarios de `CompraService.marcarComprasUtilizadas`.
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

/** Fecha del evento pasado y del evento futuro, respecto de AHORA. */
const FECHA_PASADA = new Date('2030-01-10T00:00:00.000Z');
const AHORA = new Date('2030-02-01T12:00:00.000Z');
const FECHA_FUTURA = new Date('2030-03-01T00:00:00.000Z');

describe('CompraService.marcarComprasUtilizadas', () => {
	let compraRepo;
	let eventoRepo;
	let cambioRepo;
	let servicio;
	let comprador;
	let eventoPasado;
	let eventoFuturo;

	/** Crea una compra del comprador (u otro) en el evento y estado dados. */
	const comprar = (estado, { en = eventoPasado, quien = comprador } = {}) =>
		construirCompra(compraRepo, {
			comprador: quien,
			evento: en,
			tipoEntrada: en.tiposEntrada[0],
			estado
		});

	const estadoDe = async (compra) =>
		(await compraRepo.buscarPorId(compra.id)).estado;

	beforeEach(async () => {
		compraRepo = new CompraRepository();
		eventoRepo = new EventoRepository();
		cambioRepo = new CambioEstadoCompraRepository();
		const usuarioRepo = new UsuarioRepository();
		servicio = new CompraService(
			compraRepo,
			eventoRepo,
			usuarioRepo,
			cambioRepo,
			() => AHORA
		);

		comprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comprador.uno' })
		);
		eventoPasado = await construirEvento(eventoRepo, { fecha: FECHA_PASADA });
		eventoFuturo = await construirEvento(eventoRepo, {
			fecha: FECHA_FUTURA,
			prefijoTipos: 'f'
		});
	});

	it('marca como UTILIZADA una compra CONFIRMADA de un evento ya ocurrido', async () => {
		const compra = await comprar(CONFIRMADA);

		const cantidad = await servicio.marcarComprasUtilizadas();

		expect(cantidad).toBe(1);
		expect(await estadoDe(compra)).toBe(UTILIZADA);
	});

	it('deja CONFIRMADA una compra de un evento que aún no ocurrió', async () => {
		const compra = await comprar(CONFIRMADA, { en: eventoFuturo });

		expect(await servicio.marcarComprasUtilizadas()).toBe(0);
		expect(await estadoDe(compra)).toBe(CONFIRMADA);
	});

	it.each([PENDIENTE, CANCELADA, REEMBOLSADA, UTILIZADA])(
		'no toca una compra %s aunque el evento ya haya ocurrido',
		async (estado) => {
			const compra = await comprar(estado);

			expect(await servicio.marcarComprasUtilizadas()).toBe(0);
			expect(await estadoDe(compra)).toBe(estado);
			expect(await cambioRepo.obtenerTodos()).toHaveLength(0);
		}
	);

	it('considera ocurrido un evento cuya fecha es exactamente ahora', async () => {
		const justoAhora = await construirEvento(eventoRepo, {
			fecha: AHORA,
			prefijoTipos: 'j'
		});
		const compra = await comprar(CONFIRMADA, { en: justoAhora });

		expect(await servicio.marcarComprasUtilizadas()).toBe(1);
		expect(await estadoDe(compra)).toBe(UTILIZADA);
	});

	it('registra el cambio en el historial con el sistema como autor', async () => {
		const compra = await comprar(CONFIRMADA);

		await servicio.marcarComprasUtilizadas();

		const cambios = await cambioRepo.obtenerTodos();
		expect(cambios).toHaveLength(1);
		expect(cambios[0].compra.id).toBe(compra.id);
		expect(cambios[0].estado).toBe(UTILIZADA);
		expect(cambios[0].quien).toBeNull();
		expect(cambios[0].fechaHora).toEqual(AHORA);
	});

	it('procesa varias compras de distintos eventos y compradores en una pasada', async () => {
		const otro = construirUsuario({ id: '77', rol: 'COMPRADOR' });
		const otroPasado = await construirEvento(eventoRepo, {
			fecha: FECHA_PASADA,
			prefijoTipos: 'o'
		});
		const a = await comprar(CONFIRMADA);
		const b = await comprar(CONFIRMADA, { en: otroPasado, quien: otro });
		const futura = await comprar(CONFIRMADA, { en: eventoFuturo });
		const pendiente = await comprar(PENDIENTE);

		expect(await servicio.marcarComprasUtilizadas()).toBe(2);

		expect(await estadoDe(a)).toBe(UTILIZADA);
		expect(await estadoDe(b)).toBe(UTILIZADA);
		expect(await estadoDe(futura)).toBe(CONFIRMADA);
		expect(await estadoDe(pendiente)).toBe(PENDIENTE);
		expect(await cambioRepo.obtenerTodos()).toHaveLength(2);
	});

	it('es idempotente: una segunda ejecución no cambia nada ni duplica el historial', async () => {
		await comprar(CONFIRMADA);
		await servicio.marcarComprasUtilizadas();

		expect(await servicio.marcarComprasUtilizadas()).toBe(0);
		expect(await cambioRepo.obtenerTodos()).toHaveLength(1);
	});

	it('devuelve 0 si no hay compras', async () => {
		expect(await servicio.marcarComprasUtilizadas()).toBe(0);
	});

	it('la compra UTILIZADA sigue reservando cupo', async () => {
		await comprar(CONFIRMADA);
		const { id: tipoEntradaId } = eventoPasado.tiposEntrada[0];

		await servicio.marcarComprasUtilizadas();

		const reservadas = (await compraRepo.buscarPorEventoId(eventoPasado.id))
			.filter((c) => c.tipoEntrada.id === tipoEntradaId)
			.filter((c) => c.estado === UTILIZADA)
			.reduce((suma, c) => suma + c.cantidad, 0);
		expect(reservadas).toBe(1);
	});
});
