/**
 * Tests unitarios de las consultas nuevas de `ReseniaRepository` y `CompraRepository`.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import ReseniaRepository from '../../../src/repositories/reseniaRepository.js';
import {
	construirCompra,
	construirEvento,
	construirResenia
} from '../../helpers/eventosFixtures.js';

describe('ReseniaRepository', () => {
	let repo;
	let eventoA;
	let eventoB;
	const ana = { id: 'u1' };
	const beto = { id: 'u2' };

	beforeEach(async () => {
		repo = new ReseniaRepository();
		const eventos = new EventoRepository();
		eventoA = await construirEvento(eventos, { nombre: 'A' });
		eventoB = await construirEvento(eventos, {
			nombre: 'B',
			prefijoTipos: 'x'
		});
	});

	describe('buscarPorEventoId', () => {
		it('devuelve solo las reseñas del evento, en orden de creación', async () => {
			const r1 = await construirResenia(repo, eventoA, 5, { comprador: ana });
			await construirResenia(repo, eventoB, 1, { comprador: ana });
			const r3 = await construirResenia(repo, eventoA, 3, { comprador: beto });

			const resultado = await repo.buscarPorEventoId(eventoA.id);

			expect(resultado.map((r) => r.id)).toEqual([r1.id, r3.id]);
		});

		it('devuelve un arreglo vacío si el evento no tiene reseñas', async () => {
			expect(await repo.buscarPorEventoId(eventoA.id)).toEqual([]);
		});
	});

	describe('buscarPorOrganizadorId', () => {
		it('devuelve copias de las reseñas de eventos de ese organizador, en orden', async () => {
			const eventos = new EventoRepository();
			const propio = await construirEvento(eventos, {
				organizador: { id: 'org-9' },
				prefijoTipos: 'p'
			});
			const r1 = await construirResenia(repo, propio, 5, { comprador: ana });
			await construirResenia(repo, eventoA, 2, { comprador: ana });
			const r2 = await construirResenia(repo, propio, 3, { comprador: beto });

			const resultado = await repo.buscarPorOrganizadorId('org-9');

			expect(resultado.map((r) => r.id)).toEqual([r1.id, r2.id]);
			resultado[0].puntuacion = 1;
			expect((await repo.buscarPorId(r1.id)).puntuacion).toBe(5);
		});

		it('devuelve un arreglo vacío si el organizador no tiene reseñas', async () => {
			expect(await repo.buscarPorOrganizadorId('org-9')).toEqual([]);
		});
	});

	describe('buscarPorCompradorYEvento', () => {
		it('encuentra la reseña de ese comprador en ese evento', async () => {
			const esperada = await construirResenia(repo, eventoA, 5, {
				comprador: ana
			});
			await construirResenia(repo, eventoA, 2, { comprador: beto });
			await construirResenia(repo, eventoB, 1, { comprador: ana });

			const resultado = await repo.buscarPorCompradorYEvento(
				ana.id,
				eventoA.id
			);

			expect(resultado.id).toBe(esperada.id);
		});

		it('devuelve null si no existe', async () => {
			await construirResenia(repo, eventoA, 5, { comprador: beto });

			expect(
				await repo.buscarPorCompradorYEvento(ana.id, eventoA.id)
			).toBeNull();
		});
	});
});

describe('CompraRepository.buscarPorCompradorYEvento', () => {
	it('devuelve solo las compras de ese comprador en ese evento', async () => {
		const repo = new CompraRepository();
		const eventos = new EventoRepository();
		const eventoA = await construirEvento(eventos, { nombre: 'A' });
		const eventoB = await construirEvento(eventos, {
			nombre: 'B',
			prefijoTipos: 'x'
		});
		const ana = { id: 'u1' };
		const beto = { id: 'u2' };
		const datos = (comprador, evento) => ({
			comprador,
			evento,
			tipoEntrada: evento.tiposEntrada[0]
		});
		const c1 = await construirCompra(repo, datos(ana, eventoA));
		const c2 = await construirCompra(repo, datos(ana, eventoA));
		await construirCompra(repo, datos(beto, eventoA));
		await construirCompra(repo, datos(ana, eventoB));

		const resultado = await repo.buscarPorCompradorYEvento(ana.id, eventoA.id);

		expect(resultado.map((c) => c.id)).toEqual([c1.id, c2.id]);
	});

	it('devuelve un arreglo vacío si no hay compras', async () => {
		expect(
			await new CompraRepository().buscarPorCompradorYEvento('u1', '1')
		).toEqual([]);
	});
});
