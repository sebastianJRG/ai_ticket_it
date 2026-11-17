/**
 * Tests unitarios de `EventoService.buscarEventos` (validación, filtros y ordenamiento).
 * Los repositorios en memoria se crean nuevos en cada test; no hay estado compartido.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import ReseniaRepository from '../../../src/repositories/reseniaRepository.js';
import EventoService from '../../../src/services/eventoService.js';
import {
	construirCategoria,
	construirEvento,
	construirResenia
} from '../../helpers/eventosFixtures.js';

describe('EventoService.buscarEventos', () => {
	let eventoRepo;
	let reseniaRepo;
	let servicio;

	const nombres = (eventos) => eventos.map((e) => e.nombre);

	beforeEach(() => {
		eventoRepo = new EventoRepository();
		reseniaRepo = new ReseniaRepository();
		// Este método solo usa los repositorios de eventos y reseñas
		servicio = new EventoService(eventoRepo, null, null, null, reseniaRepo);
	});

	describe('validación de parámetros', () => {
		it('rechaza un sortBy inválido', async () => {
			await expect(
				servicio.buscarEventos({ sortBy: 'nombre' })
			).rejects.toThrow('sortBy debe ser uno de: precio, fecha, puntaje.');
		});

		it('rechaza un order inválido', async () => {
			await expect(
				servicio.buscarEventos({ sortBy: 'precio', order: 'up' })
			).rejects.toThrow('order debe ser asc o desc.');
		});

		it('rechaza una q que no es texto', async () => {
			await expect(servicio.buscarEventos({ q: ['a', 'b'] })).rejects.toThrow(
				'El parámetro q debe ser un texto.'
			);
		});

		it('acepta una consulta sin argumentos', async () => {
			await construirEvento(eventoRepo, { nombre: 'A' });

			const resultado = await servicio.buscarEventos();

			expect(nombres(resultado)).toEqual(['A']);
		});
	});

	describe('sin ordenamiento', () => {
		beforeEach(async () => {
			await construirEvento(eventoRepo, { nombre: 'A', precios: [300] });
			await construirEvento(eventoRepo, { nombre: 'B', precios: [100] });
			await construirEvento(eventoRepo, { nombre: 'C', precios: [200] });
		});

		it('devuelve el orden de creación', async () => {
			const resultado = await servicio.buscarEventos({});

			expect(nombres(resultado)).toEqual(['A', 'B', 'C']);
		});

		it('ignora order si no hay sortBy', async () => {
			const resultado = await servicio.buscarEventos({ order: 'desc' });

			expect(nombres(resultado)).toEqual(['A', 'B', 'C']);
		});
	});

	describe('ordenar por precio', () => {
		beforeEach(async () => {
			await construirEvento(eventoRepo, { nombre: 'Caro', precios: [300] });
			await construirEvento(eventoRepo, { nombre: 'Barato', precios: [100] });
			// Su precio es el mínimo de sus tipos de entrada (150), no el primero
			await construirEvento(eventoRepo, {
				nombre: 'Medio',
				precios: [500, 150]
			});
		});

		it('es ascendente por defecto', async () => {
			const resultado = await servicio.buscarEventos({ sortBy: 'precio' });

			expect(nombres(resultado)).toEqual(['Barato', 'Medio', 'Caro']);
		});

		it('se invierte con order=desc', async () => {
			const resultado = await servicio.buscarEventos({
				sortBy: 'precio',
				order: 'desc'
			});

			expect(nombres(resultado)).toEqual(['Caro', 'Medio', 'Barato']);
		});

		it('conserva el orden de creación en los empates', async () => {
			await construirEvento(eventoRepo, { nombre: 'Barato 2', precios: [100] });

			const resultado = await servicio.buscarEventos({ sortBy: 'precio' });

			expect(nombres(resultado).slice(0, 2)).toEqual(['Barato', 'Barato 2']);
		});
	});

	describe('ordenar por fecha', () => {
		beforeEach(async () => {
			await construirEvento(eventoRepo, {
				nombre: 'Lejano',
				fecha: new Date('2030-06-01T00:00:00.000Z')
			});
			await construirEvento(eventoRepo, {
				nombre: 'Cercano',
				fecha: new Date('2030-02-01T00:00:00.000Z')
			});
			await construirEvento(eventoRepo, {
				nombre: 'Intermedio',
				fecha: new Date('2030-04-01T00:00:00.000Z')
			});
		});

		it('es ascendente por defecto (el más próximo primero)', async () => {
			const resultado = await servicio.buscarEventos({ sortBy: 'fecha' });

			expect(nombres(resultado)).toEqual(['Cercano', 'Intermedio', 'Lejano']);
		});

		it('se invierte con order=desc', async () => {
			const resultado = await servicio.buscarEventos({
				sortBy: 'fecha',
				order: 'desc'
			});

			expect(nombres(resultado)).toEqual(['Lejano', 'Intermedio', 'Cercano']);
		});
	});

	describe('puntaje del organizador', () => {
		const orgA = { id: 'org-a', nombre: 'A' };
		const orgB = { id: 'org-b', nombre: 'B' };
		const orgC = { id: 'org-c', nombre: 'C' };
		let a1;

		beforeEach(async () => {
			await construirEvento(eventoRepo, { nombre: 'C1', organizador: orgC });
			const b1 = await construirEvento(eventoRepo, {
				nombre: 'B1',
				organizador: orgB
			});
			a1 = await construirEvento(eventoRepo, {
				nombre: 'A1',
				organizador: orgA
			});
			// A2 no tiene reseñas propias, pero hereda el puntaje de su organizador
			await construirEvento(eventoRepo, { nombre: 'A2', organizador: orgA });

			// Organizador A: (5 + 3) / 2 = 4
			await construirResenia(reseniaRepo, a1, 5);
			await construirResenia(reseniaRepo, a1, 3);
			// Organizador B: 2
			await construirResenia(reseniaRepo, b1, 2);
		});

		const puntajes = (eventos) =>
			Object.fromEntries(eventos.map((e) => [e.nombre, e.puntajeOrganizador]));

		it('incluye en cada evento el promedio de reseñas de su organizador', async () => {
			const resultado = await servicio.buscarEventos();

			expect(puntajes(resultado)).toEqual({ C1: null, B1: 2, A1: 4, A2: 4 });
		});

		it('ordena descendente por defecto (el organizador mejor valorado primero)', async () => {
			const resultado = await servicio.buscarEventos({ sortBy: 'puntaje' });

			expect(nombres(resultado)).toEqual(['A1', 'A2', 'B1', 'C1']);
		});

		it('se invierte con order=asc', async () => {
			const resultado = await servicio.buscarEventos({
				sortBy: 'puntaje',
				order: 'asc'
			});

			expect(nombres(resultado)).toEqual(['B1', 'A1', 'A2', 'C1']);
		});

		it.each(['asc', 'desc'])(
			'deja al final los eventos de organizadores sin reseñas con order=%s',
			async (order) => {
				await construirEvento(eventoRepo, { nombre: 'C2', organizador: orgC });

				const resultado = await servicio.buscarEventos({
					sortBy: 'puntaje',
					order
				});

				expect(nombres(resultado).slice(-2)).toEqual(['C1', 'C2']);
			}
		);

		it('no altera las entidades guardadas en el repositorio', async () => {
			await servicio.buscarEventos();

			const guardado = await eventoRepo.buscarPorId(a1.id);
			expect(guardado.puntajeOrganizador).toBeUndefined();
		});

		it('sin repositorio de reseñas: puntaje null y orden de creación', async () => {
			const sinRepo = new EventoService(eventoRepo, null, null, null);

			const resultado = await sinRepo.buscarEventos({ sortBy: 'puntaje' });

			expect(nombres(resultado)).toEqual(['C1', 'B1', 'A1', 'A2']);
			expect(resultado.every((e) => e.puntajeOrganizador === null)).toBe(true);
		});
	});

	describe('combinación de filtros y orden', () => {
		it('filtra por q y categoriaId y luego ordena el resultado', async () => {
			const musica = construirCategoria({ id: 'cat-musica', nombre: 'Música' });
			const teatro = construirCategoria({ id: 'cat-teatro', nombre: 'Teatro' });
			await construirEvento(eventoRepo, {
				nombre: 'Rock caro',
				categoria: musica,
				precios: [300]
			});
			await construirEvento(eventoRepo, {
				nombre: 'Rock barato',
				categoria: musica,
				precios: [100]
			});
			await construirEvento(eventoRepo, {
				nombre: 'Rock teatral',
				categoria: teatro,
				precios: [50]
			});
			await construirEvento(eventoRepo, {
				nombre: 'Jazz',
				categoria: musica,
				precios: [10]
			});

			const resultado = await servicio.buscarEventos({
				q: 'rock',
				categoriaId: 'cat-musica',
				sortBy: 'precio'
			});

			expect(nombres(resultado)).toEqual(['Rock barato', 'Rock caro']);
		});
	});

	describe('aislamiento del repositorio', () => {
		it('ordenar no altera el orden de creación de las consultas siguientes', async () => {
			await construirEvento(eventoRepo, { nombre: 'A', precios: [300] });
			await construirEvento(eventoRepo, { nombre: 'B', precios: [100] });

			await servicio.buscarEventos({ sortBy: 'precio' });
			const sinOrden = await servicio.buscarEventos({});

			expect(nombres(sinOrden)).toEqual(['A', 'B']);
		});
	});
});
