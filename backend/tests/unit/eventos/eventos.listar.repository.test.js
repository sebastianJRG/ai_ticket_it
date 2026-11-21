/**
 * Tests unitarios de `EventoRepository.buscarEventos` (filtros de texto y categoría).
 * Cada test usa un repositorio en memoria nuevo.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import {
	construirCategoria,
	construirEvento
} from '../../helpers/eventosFixtures.js';

describe('EventoRepository.buscarEventos', () => {
	let repositorio;
	let musica;
	let teatro;

	const nombres = (eventos) => eventos.map((e) => e.nombre);

	beforeEach(async () => {
		repositorio = new EventoRepository();
		musica = construirCategoria({ id: 'cat-musica', nombre: 'Música' });
		teatro = construirCategoria({ id: 'cat-teatro', nombre: 'Teatro' });

		await construirEvento(repositorio, {
			nombre: 'Rock Fest',
			descripcion: 'Bandas en vivo',
			categoria: musica
		});
		await construirEvento(repositorio, {
			nombre: 'Obra Hamlet',
			descripcion: 'Drama clásico',
			categoria: teatro
		});
		await construirEvento(repositorio, {
			nombre: 'Jazz Night',
			descripcion: 'Noche de ROCK suave y jazz',
			categoria: musica
		});
	});

	it('sin filtros devuelve todos los eventos en orden de creación', async () => {
		const resultado = await repositorio.buscarEventos({});

		expect(nombres(resultado)).toEqual([
			'Rock Fest',
			'Obra Hamlet',
			'Jazz Night'
		]);
	});

	it('funciona sin argumentos', async () => {
		const resultado = await repositorio.buscarEventos();

		expect(resultado).toHaveLength(3);
	});

	it('busca el texto en el nombre', async () => {
		const resultado = await repositorio.buscarEventos({ texto: 'hamlet' });

		expect(nombres(resultado)).toEqual(['Obra Hamlet']);
	});

	it('busca el texto en la descripción', async () => {
		const resultado = await repositorio.buscarEventos({ texto: 'bandas' });

		expect(nombres(resultado)).toEqual(['Rock Fest']);
	});

	it('no distingue mayúsculas de minúsculas', async () => {
		const resultado = await repositorio.buscarEventos({ texto: 'rOcK' });

		expect(nombres(resultado)).toEqual(['Rock Fest', 'Jazz Night']);
	});

	it('devuelve [] si el texto no coincide con nada', async () => {
		const resultado = await repositorio.buscarEventos({ texto: 'inexistente' });

		expect(resultado).toEqual([]);
	});

	it('filtra por categoría', async () => {
		const resultado = await repositorio.buscarEventos({
			categoriaId: 'cat-musica'
		});

		expect(nombres(resultado)).toEqual(['Rock Fest', 'Jazz Night']);
	});

	it('devuelve [] si la categoría no existe', async () => {
		const resultado = await repositorio.buscarEventos({
			categoriaId: 'no-existe'
		});

		expect(resultado).toEqual([]);
	});

	it('combina texto y categoría como un AND', async () => {
		const resultado = await repositorio.buscarEventos({
			texto: 'rock',
			categoriaId: 'cat-teatro'
		});

		expect(resultado).toEqual([]);
	});

	it('ignora texto y categoría vacíos', async () => {
		const resultado = await repositorio.buscarEventos({
			texto: '',
			categoriaId: ''
		});

		expect(resultado).toHaveLength(3);
	});

	it('no modifica el contenido del repositorio', async () => {
		const resultado = await repositorio.buscarEventos({ texto: 'rock' });
		resultado.pop();

		expect(await repositorio.obtenerTodos()).toHaveLength(3);
	});
});
