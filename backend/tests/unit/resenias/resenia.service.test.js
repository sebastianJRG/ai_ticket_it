/**
 * Tests unitarios de `ReseniaService`.
 * Repositorios en memoria nuevos en cada test y reloj inyectado.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import EstadoCompra from '../../../src/models/estadoCompra.js';
import CategoriaRepository from '../../../src/repositories/categoriaRepository.js';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import ReseniaRepository from '../../../src/repositories/reseniaRepository.js';
import TipoEntradaRepository from '../../../src/repositories/tipoEntradaRepository.js';
import UsuarioRepository from '../../../src/repositories/usuarioRepository.js';
import EventoService from '../../../src/services/eventoService.js';
import ReseniaService from '../../../src/services/reseniaService.js';
import {
	construirCompra,
	construirEvento,
	construirResenia,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

/** "Ahora" antes de la fecha por defecto del evento (2030-01-10). */
const ANTES = new Date('2030-01-01T00:00:00.000Z');
/** "Ahora" posterior al evento. */
const DESPUES = new Date('2030-02-01T00:00:00.000Z');

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } =
	EstadoCompra;

describe('ReseniaService', () => {
	let reseniaRepo;
	let eventoRepo;
	let usuarioRepo;
	let compraRepo;
	let ahora;
	let servicio;
	let comprador;
	let otroComprador;
	let organizador;
	let evento;

	/** Reseña con datos base; cada test sobrescribe lo que necesita. */
	const reseniar = (cambios = {}) =>
		servicio.crearResenia({
			compradorId: comprador.id,
			eventoId: evento.id,
			detalle: 'Muy buen evento',
			puntuacion: 4,
			...cambios
		});

	/** Compra del comprador (por defecto UTILIZADA) para el evento dado. */
	const comprarEn = (
		estado = UTILIZADA,
		{ quien = comprador, en = evento } = {}
	) =>
		construirCompra(compraRepo, {
			comprador: quien,
			evento: en,
			tipoEntrada: en.tiposEntrada[0],
			estado
		});

	beforeEach(async () => {
		reseniaRepo = new ReseniaRepository();
		eventoRepo = new EventoRepository();
		usuarioRepo = new UsuarioRepository();
		compraRepo = new CompraRepository();
		ahora = DESPUES;
		servicio = new ReseniaService(
			reseniaRepo,
			eventoRepo,
			usuarioRepo,
			compraRepo,
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
		evento = await construirEvento(eventoRepo, { organizador });
	});

	describe('crearResenia', () => {
		describe('reseña válida', () => {
			it.each([UTILIZADA])(
				'crea la reseña con una compra %s',
				async (estado) => {
					await comprarEn(estado);

					const resenia = await reseniar();

					expect(resenia.id).toBeTruthy();
					expect(resenia.comprador.id).toBe(comprador.id);
					expect(resenia.evento.id).toBe(evento.id);
					expect(resenia.detalle).toBe('Muy buen evento');
					expect(resenia.puntuacion).toBe(4);
				}
			);

			it('persiste la reseña', async () => {
				await comprarEn();

				const resenia = await reseniar();

				const guardada = await reseniaRepo.buscarPorId(resenia.id);
				expect(guardada).not.toBeNull();
				expect(guardada.puntuacion).toBe(4);
			});

			it('basta una compra elegible aunque haya otras en otros estados', async () => {
				await comprarEn(CANCELADA);
				await comprarEn(CONFIRMADA);
				await comprarEn(UTILIZADA);

				await expect(reseniar()).resolves.toMatchObject({ puntuacion: 4 });
			});

			it('permite reseñar dos eventos distintos', async () => {
				const otroEvento = await construirEvento(eventoRepo, {
					organizador,
					prefijoTipos: 'x'
				});
				await comprarEn();
				await comprarEn(UTILIZADA, { en: otroEvento });

				await reseniar();

				await expect(
					reseniar({ eventoId: otroEvento.id })
				).resolves.toBeTruthy();
			});

			it('permite que dos compradores reseñen el mismo evento', async () => {
				await comprarEn();
				await comprarEn(UTILIZADA, { quien: otroComprador });

				await reseniar();

				await expect(
					reseniar({ compradorId: otroComprador.id })
				).resolves.toBeTruthy();
			});
		});

		describe('validación del cuerpo', () => {
			it('rechaza con 400 una puntuación inválida', async () => {
				await comprarEn();

				await expect(reseniar({ puntuacion: 6 })).rejects.toMatchObject({
					status: 400,
					message: 'La puntuación debe estar entre 1 y 5.'
				});
			});

			it('rechaza con 400 un detalle vacío', async () => {
				await expect(reseniar({ detalle: '  ' })).rejects.toMatchObject({
					status: 400
				});
			});

			it('no persiste nada cuando la validación falla', async () => {
				await comprarEn();

				await reseniar({ puntuacion: 0 }).catch(() => {});

				expect(await reseniaRepo.obtenerTodos()).toEqual([]);
			});
		});

		describe('entidades relacionadas', () => {
			it('rechaza con 404 un comprador inexistente', async () => {
				await expect(reseniar({ compradorId: '999' })).rejects.toMatchObject({
					status: 404,
					message: 'El comprador con ID 999 no existe.'
				});
			});

			it('rechaza con 403 a un usuario que no es COMPRADOR', async () => {
				await expect(
					reseniar({ compradorId: organizador.id })
				).rejects.toMatchObject({
					status: 403,
					message: 'Solo los compradores pueden reseñar eventos.'
				});
			});

			it('rechaza con 404 un evento inexistente', async () => {
				await expect(reseniar({ eventoId: '999' })).rejects.toMatchObject({
					status: 404,
					message: 'El evento con ID 999 no existe.'
				});
			});
		});

		describe('reglas de negocio', () => {
			it('rechaza con 400 si el evento aún no ocurrió', async () => {
				await comprarEn();
				ahora = ANTES;

				await expect(reseniar()).rejects.toMatchObject({
					status: 400,
					message: 'El evento aún no ha ocurrido.'
				});
				expect(await reseniaRepo.obtenerTodos()).toEqual([]);
			});

			it('rechaza con 403 si el comprador no tiene ninguna compra del evento', async () => {
				await expect(reseniar()).rejects.toMatchObject({
					status: 403,
					message:
						'Solo puedes reseñar eventos en los que tengas una entrada utilizada.'
				});
			});

			it.each([PENDIENTE, CONFIRMADA, CANCELADA, REEMBOLSADA])(
				'rechaza con 403 si la única compra está %s',
				async (estado) => {
					await comprarEn(estado);

					await expect(reseniar()).rejects.toMatchObject({ status: 403 });
				}
			);

			it('rechaza con 403 si la compra es de otro comprador', async () => {
				await comprarEn(CONFIRMADA, { quien: otroComprador });

				await expect(reseniar()).rejects.toMatchObject({ status: 403 });
			});

			it('rechaza con 403 si la compra es de otro evento', async () => {
				const otroEvento = await construirEvento(eventoRepo, {
					organizador,
					prefijoTipos: 'x'
				});
				await comprarEn(CONFIRMADA, { en: otroEvento });

				await expect(reseniar()).rejects.toMatchObject({ status: 403 });
			});

			it('rechaza con 409 una segunda reseña del mismo comprador al mismo evento', async () => {
				await comprarEn();
				await reseniar();

				await expect(reseniar({ puntuacion: 1 })).rejects.toMatchObject({
					status: 409,
					message: 'Ya reseñaste este evento.'
				});
				expect(await reseniaRepo.obtenerTodos()).toHaveLength(1);
			});

			it('dos reseñas simultáneas: una tiene éxito y la otra recibe 409', async () => {
				await comprarEn();

				const resultados = await Promise.allSettled([reseniar(), reseniar()]);

				expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(
					1
				);
				expect(
					resultados.find((r) => r.status === 'rejected').reason.status
				).toBe(409);
				expect(await reseniaRepo.obtenerTodos()).toHaveLength(1);
			});
		});

		it('la reseña creada influye en el ordenamiento por puntaje de los eventos', async () => {
			const otroOrganizador = await usuarioRepo.crear(
				construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.dos' })
			);
			const eventoB = await construirEvento(eventoRepo, {
				nombre: 'B',
				organizador: otroOrganizador,
				prefijoTipos: 'x'
			});
			const eventoService = new EventoService(
				eventoRepo,
				new CategoriaRepository(),
				usuarioRepo,
				new TipoEntradaRepository(),
				reseniaRepo
			);
			await comprarEn(UTILIZADA, { en: eventoB });

			await reseniar({ eventoId: eventoB.id, puntuacion: 5 });

			const ordenados = await eventoService.buscarEventos({
				sortBy: 'puntaje'
			});
			expect(ordenados.map((e) => e.id)).toEqual([eventoB.id, evento.id]);
		});
	});

	describe('listarPorEvento', () => {
		it('devuelve las reseñas del evento en orden de creación', async () => {
			const r1 = await construirResenia(reseniaRepo, evento, 5, { comprador });
			const r2 = await construirResenia(reseniaRepo, evento, 2, {
				comprador: otroComprador
			});

			const resultado = await servicio.listarPorEvento(evento.id);

			expect(resultado.map((r) => r.id)).toEqual([r1.id, r2.id]);
		});

		it('devuelve solo las reseñas de ese evento', async () => {
			const otroEvento = await construirEvento(eventoRepo, {
				organizador,
				prefijoTipos: 'x'
			});
			await construirResenia(reseniaRepo, otroEvento, 1, { comprador });
			const propia = await construirResenia(reseniaRepo, evento, 4, {
				comprador
			});

			const resultado = await servicio.listarPorEvento(evento.id);

			expect(resultado.map((r) => r.id)).toEqual([propia.id]);
		});

		it('devuelve un arreglo vacío si el evento no tiene reseñas', async () => {
			expect(await servicio.listarPorEvento(evento.id)).toEqual([]);
		});

		it('rechaza con 404 un evento inexistente', async () => {
			await expect(servicio.listarPorEvento('999')).rejects.toMatchObject({
				status: 404,
				message: 'El evento con ID 999 no existe.'
			});
		});

		it('rechaza con 400 un ID vacío', async () => {
			await expect(servicio.listarPorEvento('')).rejects.toMatchObject({
				status: 400
			});
		});
	});

	describe('listarPorOrganizador', () => {
		let otroOrganizador;
		let eventoAnterior;
		let eventoAjeno;

		beforeEach(async () => {
			otroOrganizador = await usuarioRepo.crear(
				construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.dos' })
			);
			eventoAnterior = await construirEvento(eventoRepo, {
				nombre: 'Anterior',
				organizador,
				prefijoTipos: 'a'
			});
			eventoAjeno = await construirEvento(eventoRepo, {
				nombre: 'Ajeno',
				organizador: otroOrganizador,
				prefijoTipos: 'j'
			});
		});

		it('devuelve las reseñas de todos los eventos del organizador, en orden de creación', async () => {
			const r1 = await construirResenia(reseniaRepo, evento, 5, { comprador });
			await construirResenia(reseniaRepo, eventoAjeno, 1, { comprador });
			const r2 = await construirResenia(reseniaRepo, eventoAnterior, 3, {
				comprador: otroComprador
			});

			const resultado = await servicio.listarPorOrganizador(organizador.id);

			expect(resultado.map((r) => r.id)).toEqual([r1.id, r2.id]);
		});

		it('devuelve un arreglo vacío si el organizador no tiene reseñas', async () => {
			await construirResenia(reseniaRepo, eventoAjeno, 4, { comprador });

			expect(await servicio.listarPorOrganizador(organizador.id)).toEqual([]);
		});

		it('rechaza con 404 un usuario inexistente', async () => {
			await expect(servicio.listarPorOrganizador('999')).rejects.toMatchObject({
				status: 404
			});
		});

		it('rechaza con 404 si el usuario no es ORGANIZADOR', async () => {
			await expect(
				servicio.listarPorOrganizador(comprador.id)
			).rejects.toMatchObject({ status: 404 });
		});

		it('rechaza con 400 un ID vacío', async () => {
			await expect(servicio.listarPorOrganizador('  ')).rejects.toMatchObject({
				status: 400
			});
		});
	});
});
