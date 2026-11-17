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
			await expect(servicio.buscarEventos({ sortBy: 'nombre' })).rejects.toThrow(
				'sortBy debe ser uno de: precio, fecha, puntaje.'
			);
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
			await construirEvento(eventoRepo, { nombre: 'Medio', precios: [500, 150] });
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

	describe('ordenar por puntaje', () => {
		let promedio4;
		let promedio2;
		let sinResenias;

		beforeEach(async () => {
			sinResenias = await construirEvento(eventoRepo, { nombre: 'Sin reseñas' });
			promedio2 = await construirEvento(eventoRepo, { nombre: 'Promedio 2' });
			promedio4 = await construirEvento(eventoRepo, { nombre: 'Promedio 4' });

			// Promedio 4: (5 + 3) / 2
			await construirResenia(reseniaRepo, promedio4, 5);
			await construirResenia(reseniaRepo, promedio4, 3);
			// Promedio 2: una sola reseña
			await construirResenia(reseniaRepo, promedio2, 2);
		});

		it('es descendente por defecto (el mejor valorado primero)', async () => {
			const resultado = await servicio.buscarEventos({ sortBy: 'puntaje' });

			expect(nombres(resultado).slice(0, 2)).toEqual(['Promedio 4', 'Promedio 2']);
		});

		it('se invierte con order=asc', async () => {
			const resultado = await servicio.buscarEventos({
				sortBy: 'puntaje',
				order: 'asc'
			});

			expect(nombres(resultado).slice(0, 2)).toEqual(['Promedio 2', 'Promedio 4']);
		});

		it.each(['asc', 'desc'])(
			'deja los eventos sin reseñas al final con order=%s',
			async (order) => {
				const resultado = await servicio.buscarEventos({ sortBy: 'puntaje', order });

				expect(resultado[resultado.length - 1].id).toBe(sinResenias.id);
			}
		);

		it('conserva el orden de creación entre eventos sin reseñas', async () => {
			await construirEvento(eventoRepo, { nombre: 'Sin reseñas 2' });

			const resultado = await servicio.buscarEventos({ sortBy: 'puntaje' });

			expect(nombres(resultado).slice(-2)).toEqual(['Sin reseñas', 'Sin reseñas 2']);
		});

		it('no falla y conserva el orden si no hay repositorio de reseñas', async () => {
			const sinRepo = new EventoService(eventoRepo, null, null, null);

			const resultado = await sinRepo.buscarEventos({ sortBy: 'puntaje' });

			expect(nombres(resultado)).toEqual([
				'Sin reseñas',
				'Promedio 2',
				'Promedio 4'
			]);
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
