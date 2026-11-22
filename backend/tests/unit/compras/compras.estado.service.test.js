/**
 * Tests unitarios de `CompraService.cancelarCompra`, `confirmarCompra` y `reembolsarCompra`.
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

/** "Ahora" fijo: anterior a la fecha por defecto del evento (2030-01-10). */
const ANTES = new Date('2030-01-01T00:00:00.000Z');
/** "Ahora" posterior al evento. */
const DESPUES = new Date('2030-02-01T00:00:00.000Z');

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } =
	EstadoCompra;

describe('CompraService: cambios de estado', () => {
	let compraRepo;
	let eventoRepo;
	let usuarioRepo;
	let cambioRepo;
	let ahora;
	let servicio;
	let comprador;
	let otroComprador;
	let organizador;
	let otroOrganizador;
	let evento;
	let tipo;

	/** Crea una compra del comprador en el estado dado. */
	const compraEn = (estado, cambios = {}) =>
		construirCompra(compraRepo, {
			comprador,
			evento,
			tipoEntrada: tipo,
			cantidad: 1,
			estado,
			...cambios
		});

	/** Acciones bajo prueba, indexadas por nombre para reutilizar casos. */
	const accion = {
		cancelar: (compraId, usuarioId) =>
			servicio.cancelarCompra({ compraId, usuarioId }),
		confirmar: (compraId, usuarioId) =>
			servicio.confirmarCompra({ compraId, usuarioId }),
		reembolsar: (compraId, usuarioId) =>
			servicio.reembolsarCompra({ compraId, usuarioId })
	};

	beforeEach(async () => {
		compraRepo = new CompraRepository();
		eventoRepo = new EventoRepository();
		usuarioRepo = new UsuarioRepository();
		cambioRepo = new CambioEstadoCompraRepository();
		ahora = ANTES;
		servicio = new CompraService(
			compraRepo,
			eventoRepo,
			usuarioRepo,
			cambioRepo,
			() => ahora
		);

		comprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comprador.uno' })
		);
		otroComprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comprador.dos' })
		);
		organizador = await usuarioRepo.crear(
			construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.uno' })
		);
		otroOrganizador = await usuarioRepo.crear(
			construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.dos' })
		);
		evento = await construirEvento(eventoRepo, { cupo: 2, organizador });
		tipo = evento.tiposEntrada[0];
	});

	describe('cancelarCompra', () => {
		it.each([PENDIENTE, CONFIRMADA])(
			'el comprador cancela su compra %s',
			async (estado) => {
				const compra = await compraEn(estado);

				const resultado = await accion.cancelar(compra.id, comprador.id);

				expect(resultado.estado).toBe(CANCELADA);
				expect((await compraRepo.buscarPorId(compra.id)).estado).toBe(
					CANCELADA
				);
			}
		);

		it('el organizador del evento puede cancelar la compra', async () => {
			const compra = await compraEn(CONFIRMADA);

			const resultado = await accion.cancelar(compra.id, organizador.id);

			expect(resultado.estado).toBe(CANCELADA);
		});

		it('rechaza con 403 a otro comprador', async () => {
			const compra = await compraEn(CONFIRMADA);

			await expect(
				accion.cancelar(compra.id, otroComprador.id)
			).rejects.toMatchObject({
				name: 'ForbiddenError'
			});
			expect((await compraRepo.buscarPorId(compra.id)).estado).toBe(CONFIRMADA);
		});

		it('rechaza con 403 al organizador de otro evento', async () => {
			const compra = await compraEn(CONFIRMADA);

			await expect(
				accion.cancelar(compra.id, otroOrganizador.id)
			).rejects.toMatchObject({
				name: 'ForbiddenError'
			});
		});

		it.each([UTILIZADA, CANCELADA, REEMBOLSADA])(
			'rechaza con 409 una compra %s',
			async (estado) => {
				const compra = await compraEn(estado);

				await expect(
					accion.cancelar(compra.id, comprador.id)
				).rejects.toMatchObject({
					name: 'ConflictError'
				});
				expect((await compraRepo.buscarPorId(compra.id)).estado).toBe(estado);
			}
		);

		it('rechaza con 400 si el evento ya ocurrió', async () => {
			const compra = await compraEn(CONFIRMADA);
			ahora = DESPUES;

			await expect(
				accion.cancelar(compra.id, comprador.id)
			).rejects.toMatchObject({
				name: 'BadRequestError',
				message: 'El evento ya ocurrió.'
			});
			expect((await compraRepo.buscarPorId(compra.id)).estado).toBe(CONFIRMADA);
		});

		it('libera el cupo: una compra posterior que daba 409 ahora es posible', async () => {
			const reserva = await compraEn(CONFIRMADA, { cantidad: 2 });
			const comprar = () =>
				servicio.crearCompra({
					compradorId: otroComprador.id,
					eventoId: evento.id,
					tipoEntradaId: tipo.id,
					cantidad: 1
				});
			await expect(comprar()).rejects.toMatchObject({ name: 'ConflictError' });

			await accion.cancelar(reserva.id, comprador.id);

			await expect(comprar()).resolves.toMatchObject({ estado: PENDIENTE });
		});

		it('dos cancelaciones simultáneas: una tiene éxito y la otra recibe 409', async () => {
			const compra = await compraEn(CONFIRMADA);

			const resultados = await Promise.allSettled([
				accion.cancelar(compra.id, comprador.id),
				accion.cancelar(compra.id, organizador.id)
			]);

			expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(
				1
			);
			const rechazada = resultados.find((r) => r.status === 'rejected');
			expect(rechazada.reason.name).toBe('ConflictError');
			expect(await cambioRepo.obtenerTodos()).toHaveLength(1);
		});
	});

	describe('confirmarCompra', () => {
		it('el organizador confirma una compra PENDIENTE', async () => {
			const compra = await compraEn(PENDIENTE);

			const resultado = await accion.confirmar(compra.id, organizador.id);

			expect(resultado.estado).toBe(CONFIRMADA);
			expect((await compraRepo.buscarPorId(compra.id)).estado).toBe(CONFIRMADA);
		});

		it('rechaza con 403 al organizador de otro evento', async () => {
			const compra = await compraEn(PENDIENTE);

			await expect(
				accion.confirmar(compra.id, otroOrganizador.id)
			).rejects.toMatchObject({
				name: 'ForbiddenError'
			});
		});

		it('rechaza con 403 a un comprador', async () => {
			const compra = await compraEn(PENDIENTE);

			await expect(
				accion.confirmar(compra.id, comprador.id)
			).rejects.toMatchObject({
				name: 'ForbiddenError'
			});
		});

		it.each([CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA])(
			'rechaza con 409 una compra %s',
			async (estado) => {
				const compra = await compraEn(estado);

				await expect(
					accion.confirmar(compra.id, organizador.id)
				).rejects.toMatchObject({
					name: 'ConflictError'
				});
			}
		);

		it('rechaza con 400 si el evento ya ocurrió', async () => {
			const compra = await compraEn(PENDIENTE);
			ahora = DESPUES;

			await expect(
				accion.confirmar(compra.id, organizador.id)
			).rejects.toMatchObject({
				name: 'BadRequestError',
				message: 'El evento ya ocurrió.'
			});
		});
	});

	describe('reembolsarCompra', () => {
		it('el organizador reembolsa una compra CONFIRMADA', async () => {
			const compra = await compraEn(CONFIRMADA);

			const resultado = await accion.reembolsar(compra.id, organizador.id);

			expect(resultado.estado).toBe(REEMBOLSADA);
			expect((await compraRepo.buscarPorId(compra.id)).estado).toBe(
				REEMBOLSADA
			);
		});

		it('rechaza con 403 al organizador de otro evento', async () => {
			const compra = await compraEn(CONFIRMADA);

			await expect(
				accion.reembolsar(compra.id, otroOrganizador.id)
			).rejects.toMatchObject({
				name: 'ForbiddenError'
			});
		});

		it('rechaza con 403 a un comprador', async () => {
			const compra = await compraEn(CONFIRMADA);

			await expect(
				accion.reembolsar(compra.id, comprador.id)
			).rejects.toMatchObject({
				name: 'ForbiddenError'
			});
		});

		it.each([PENDIENTE, UTILIZADA, CANCELADA, REEMBOLSADA])(
			'rechaza con 409 una compra %s',
			async (estado) => {
				const compra = await compraEn(estado);

				await expect(
					accion.reembolsar(compra.id, organizador.id)
				).rejects.toMatchObject({
					name: 'ConflictError'
				});
			}
		);

		it('rechaza con 400 si el evento ya ocurrió', async () => {
			const compra = await compraEn(CONFIRMADA);
			ahora = DESPUES;

			await expect(
				accion.reembolsar(compra.id, organizador.id)
			).rejects.toMatchObject({
				name: 'BadRequestError',
				message: 'El evento ya ocurrió.'
			});
		});

		it('libera el cupo de la compra reembolsada', async () => {
			const compra = await compraEn(CONFIRMADA, { cantidad: 2 });
			const comprar = () =>
				servicio.crearCompra({
					compradorId: otroComprador.id,
					eventoId: evento.id,
					tipoEntradaId: tipo.id,
					cantidad: 2
				});
			await expect(comprar()).rejects.toMatchObject({ name: 'ConflictError' });

			await accion.reembolsar(compra.id, organizador.id);

			await expect(comprar()).resolves.toMatchObject({ cantidad: 2 });
		});
	});

	describe.each([
		['cancelar', CONFIRMADA, () => comprador, CANCELADA],
		['confirmar', PENDIENTE, () => organizador, CONFIRMADA],
		['reembolsar', CONFIRMADA, () => organizador, REEMBOLSADA]
	])(
		'%s: comportamiento común',
		(nombre, estadoInicial, actor, estadoFinal) => {
			it('registra el cambio de estado con el actor y la fecha', async () => {
				const compra = await compraEn(estadoInicial);

				await accion[nombre](compra.id, actor().id);

				const cambios = await cambioRepo.obtenerTodos();
				expect(cambios).toHaveLength(1);
				expect(cambios[0].estado).toBe(estadoFinal);
				expect(cambios[0].quien.id).toBe(actor().id);
				expect(cambios[0].compra.id).toBe(compra.id);
				expect(cambios[0].fechaHora).toEqual(ANTES);
			});

			it('rechaza con 404 una compra inexistente', async () => {
				await expect(accion[nombre]('999', actor().id)).rejects.toMatchObject({
					name: 'NotFoundError',
					message: 'La compra con ID 999 no existe.'
				});
			});

			it('rechaza con 404 un usuario inexistente', async () => {
				const compra = await compraEn(estadoInicial);

				await expect(accion[nombre](compra.id, '999')).rejects.toMatchObject({
					name: 'NotFoundError'
				});
			});

			it.each([
				['vacío', ''],
				['undefined', undefined]
			])('rechaza con 400 un ID de compra %s', async (_etiqueta, id) => {
				await expect(accion[nombre](id, actor().id)).rejects.toMatchObject({
					name: 'BadRequestError'
				});
			});

			it('no registra cambios cuando la operación falla', async () => {
				const compra = await compraEn(estadoInicial);

				await accion[nombre](compra.id, otroComprador.id).catch(() => {});

				expect(await cambioRepo.obtenerTodos()).toEqual([]);
			});
		}
	);
});
