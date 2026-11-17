/**
 * Tests unitarios de `CompraService.crearCompra`.
 * Repositorios en memoria nuevos en cada test y reloj inyectado: sin estado
 * compartido ni dependencia de la hora real.
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
const AHORA = new Date('2030-01-01T00:00:00.000Z');

describe('CompraService.crearCompra', () => {
	let compraRepo;
	let eventoRepo;
	let usuarioRepo;
	let cambioRepo;
	let reloj;
	let servicio;
	let comprador;
	let evento;
	let tipo;

	/** Compra con los datos base, permitiendo sobrescribir cualquier campo. */
	const comprar = (cambios = {}) =>
		servicio.crearCompra({
			compradorId: comprador.id,
			eventoId: evento.id,
			tipoEntradaId: tipo.id,
			cantidad: 1,
			...cambios
		});

	beforeEach(async () => {
		compraRepo = new CompraRepository();
		eventoRepo = new EventoRepository();
		usuarioRepo = new UsuarioRepository();
		cambioRepo = new CambioEstadoCompraRepository();
		reloj = () => AHORA;
		servicio = new CompraService(compraRepo, eventoRepo, usuarioRepo, cambioRepo, reloj);

		comprador = await usuarioRepo.crear(construirUsuario({ rol: 'COMPRADOR' }));
		evento = await construirEvento(eventoRepo, { precios: [100, 250], cupo: 5 });
		tipo = evento.tiposEntrada[0];
	});

	describe('compra válida', () => {
		it('crea la compra en estado PENDIENTE', async () => {
			const compra = await comprar({ cantidad: 2 });

			expect(compra.id).toBeTruthy();
			expect(compra.estado).toBe(EstadoCompra.PENDIENTE);
			expect(compra.cantidad).toBe(2);
			expect(compra.comprador.id).toBe(comprador.id);
			expect(compra.evento.id).toBe(evento.id);
			expect(compra.tipoEntrada.id).toBe(tipo.id);
		});

		it('calcula el total como precio × cantidad', async () => {
			const compra = await comprar({ tipoEntradaId: evento.tiposEntrada[1].id, cantidad: 3 });

			expect(compra.total).toBe(750);
		});

		it('persiste la compra', async () => {
			const compra = await comprar();

			const guardada = await compraRepo.buscarPorId(compra.id);
			expect(guardada).not.toBeNull();
			expect(guardada.estado).toBe(EstadoCompra.PENDIENTE);
		});

		it('registra el primer cambio de estado (PENDIENTE, hecho por el comprador)', async () => {
			const compra = await comprar();

			const cambios = await cambioRepo.obtenerTodos();
			expect(cambios).toHaveLength(1);
			expect(cambios[0].estado).toBe(EstadoCompra.PENDIENTE);
			expect(cambios[0].quien.id).toBe(comprador.id);
			expect(cambios[0].compra.id).toBe(compra.id);
			expect(cambios[0].fechaHora).toEqual(AHORA);
		});

		it('ignora un total enviado por el cliente', async () => {
			const compra = await comprar({ total: 1 });

			expect(compra.total).toBe(100);
		});
	});

	describe('validación del cuerpo', () => {
		it('rechaza con 400 una cantidad inválida', async () => {
			await expect(comprar({ cantidad: 0 })).rejects.toMatchObject({
				status: 400,
				message: 'La cantidad debe ser mayor a 0.'
			});
		});

		it('rechaza con 400 si falta el evento', async () => {
			await expect(comprar({ eventoId: undefined })).rejects.toMatchObject({
				status: 400
			});
		});

		it('no persiste nada cuando la validación falla', async () => {
			await comprar({ cantidad: -1 }).catch(() => {});

			expect(await compraRepo.obtenerTodos()).toEqual([]);
			expect(await cambioRepo.obtenerTodos()).toEqual([]);
		});
	});

	describe('entidades relacionadas', () => {
		it('rechaza con 404 un comprador inexistente', async () => {
			await expect(comprar({ compradorId: '999' })).rejects.toMatchObject({
				status: 404,
				message: 'El comprador con ID 999 no existe.'
			});
		});

		it('rechaza con 403 a un usuario que no es COMPRADOR', async () => {
			const organizador = await usuarioRepo.crear(
				construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.test' })
			);

			await expect(comprar({ compradorId: organizador.id })).rejects.toMatchObject({
				status: 403,
				message: 'Solo los compradores pueden realizar compras.'
			});
		});

		it('rechaza con 404 un evento inexistente', async () => {
			await expect(comprar({ eventoId: '999' })).rejects.toMatchObject({
				status: 404,
				message: 'El evento con ID 999 no existe.'
			});
		});

		it('rechaza con 404 un tipo de entrada inexistente', async () => {
			await expect(comprar({ tipoEntradaId: 'zzz' })).rejects.toMatchObject({
				status: 404,
				message: 'El tipo de entrada con ID zzz no pertenece al evento.'
			});
		});

		it('rechaza con 404 un tipo de entrada que pertenece a otro evento', async () => {
			const otroEvento = await construirEvento(eventoRepo, {
				nombre: 'Otro',
				prefijoTipos: 'u'
			});

			await expect(
				comprar({ tipoEntradaId: otroEvento.tiposEntrada[0].id })
			).rejects.toMatchObject({ status: 404 });
		});
	});

	describe('evento ya ocurrido', () => {
		it('rechaza con 400 si la fecha del evento ya pasó', async () => {
			const despues = new CompraService(
				compraRepo,
				eventoRepo,
				usuarioRepo,
				cambioRepo,
				() => new Date('2030-02-01T00:00:00.000Z')
			);

			await expect(
				despues.crearCompra({
					compradorId: comprador.id,
					eventoId: evento.id,
					tipoEntradaId: tipo.id,
					cantidad: 1
				})
			).rejects.toMatchObject({ status: 400, message: 'El evento ya ocurrió.' });
		});
	});

	describe('cupo', () => {
		it('permite comprar exactamente lo que queda', async () => {
			const compra = await comprar({ cantidad: 5 });

			expect(compra.cantidad).toBe(5);
		});

		it('rechaza con 409 una unidad por encima del cupo', async () => {
			await expect(comprar({ cantidad: 6 })).rejects.toMatchObject({
				status: 409,
				message: 'Cupo insuficiente: quedan 5 entradas disponibles.'
			});
		});

		it('usa el singular cuando queda una sola entrada', async () => {
			await comprar({ cantidad: 4 });

			await expect(comprar({ cantidad: 2 })).rejects.toMatchObject({
				status: 409,
				message: 'Cupo insuficiente: queda 1 entrada disponible.'
			});
		});

		it('acumula lo reservado entre compras sucesivas', async () => {
			await comprar({ cantidad: 3 });
			await comprar({ cantidad: 2 });

			await expect(comprar({ cantidad: 1 })).rejects.toMatchObject({ status: 409 });
		});

		it('un tipo de entrada no consume el cupo de otro', async () => {
			await comprar({ cantidad: 5 });

			const compra = await comprar({
				tipoEntradaId: evento.tiposEntrada[1].id,
				cantidad: 5
			});

			expect(compra.cantidad).toBe(5);
		});

		it('un evento no consume el cupo de otro', async () => {
			await comprar({ cantidad: 5 });
			const otro = await construirEvento(eventoRepo, { nombre: 'Otro', prefijoTipos: 'u', cupo: 5 });

			const compra = await comprar({
				eventoId: otro.id,
				tipoEntradaId: otro.tiposEntrada[0].id,
				cantidad: 5
			});

			expect(compra.cantidad).toBe(5);
		});

		it.each([
			[EstadoCompra.PENDIENTE, true],
			[EstadoCompra.CONFIRMADA, true],
			[EstadoCompra.UTILIZADA, true],
			[EstadoCompra.CANCELADA, false],
			[EstadoCompra.REEMBOLSADA, false]
		])('una compra %s ocupa cupo: %s', async (estado, ocupa) => {
			await construirCompra(compraRepo, {
				comprador,
				evento,
				tipoEntrada: tipo,
				cantidad: 5,
				estado
			});

			const intento = comprar({ cantidad: 1 });

			if (ocupa) {
				await expect(intento).rejects.toMatchObject({ status: 409 });
			} else {
				await expect(intento).resolves.toMatchObject({ cantidad: 1 });
			}
		});

		it('no persiste nada cuando falta cupo', async () => {
			await comprar({ cantidad: 6 }).catch(() => {});

			expect(await compraRepo.obtenerTodos()).toEqual([]);
			expect(await cambioRepo.obtenerTodos()).toEqual([]);
		});
	});

	describe('concurrencia', () => {
		it('nunca reserva más que el cupo cuando llegan compras simultáneas', async () => {
			const pequenio = await construirEvento(eventoRepo, {
				nombre: 'Cupo chico',
				prefijoTipos: 'u',
				cupo: 3
			});

			const resultados = await Promise.allSettled(
				Array.from({ length: 8 }, () =>
					comprar({
						eventoId: pequenio.id,
						tipoEntradaId: pequenio.tiposEntrada[0].id,
						cantidad: 1
					})
				)
			);

			const exitosas = resultados.filter((r) => r.status === 'fulfilled');
			const rechazadas = resultados.filter((r) => r.status === 'rejected');
			expect(exitosas).toHaveLength(3);
			expect(rechazadas).toHaveLength(5);
			for (const r of rechazadas) {
				expect(r.reason.status).toBe(409);
			}
			expect(await compraRepo.obtenerTodos()).toHaveLength(3);
			expect(await cambioRepo.obtenerTodos()).toHaveLength(3);
		});
	});
});
