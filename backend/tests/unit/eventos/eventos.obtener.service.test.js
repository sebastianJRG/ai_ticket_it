/**
 * Tests unitarios de `EventoService.obtenerPorId` (GET /api/eventos/:idEvento).
 * Repositorio en memoria nuevo en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import EventoService from '../../../src/services/eventoService.js';
import { construirEvento } from '../../helpers/eventosFixtures.js';

describe('EventoService.obtenerPorId', () => {
	let eventoRepo;
	let servicio;

	beforeEach(() => {
		eventoRepo = new EventoRepository();
		servicio = new EventoService(eventoRepo, null, null, null, null);
	});

	it('devuelve el evento con ese id', async () => {
		const guardado = await construirEvento(eventoRepo, { nombre: 'Rock Fest' });

		const evento = await servicio.obtenerPorId(guardado.id);

		expect(evento.id).toBe(guardado.id);
		expect(evento.nombre).toBe('Rock Fest');
	});

	it('lanza 404 si el evento no existe', async () => {
		await expect(servicio.obtenerPorId('999')).rejects.toMatchObject({
			status: 404,
			message: 'El evento con ID 999 no existe.'
		});
	});

	it.each([
		['', 'vacío'],
		['   ', 'solo espacios'],
		[undefined, 'ausente'],
		[42, 'no textual']
	])('lanza 400 si el id es inválido (%p: %s)', async (id) => {
		await expect(servicio.obtenerPorId(id)).rejects.toMatchObject({
			status: 400
		});
	});
});
