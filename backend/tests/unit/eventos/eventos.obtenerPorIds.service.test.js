/**
 * Tests unitarios de `EventoService.obtenerPorIds` (resolución de favoritos).
 * Repositorios en memoria nuevos y logger falso en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import ReseniaRepository from '../../../src/repositories/reseniaRepository.js';
import EventoService from '../../../src/services/eventoService.js';
import {
	construirEvento,
	construirResenia
} from '../../helpers/eventosFixtures.js';

/**
 * Devuelve el objeto registrado en la última llamada a `logger.info`.
 * @param {{info: import('@jest/globals').jest.Mock}} logger - Logger falso
 * @returns {object} Línea de log parseada
 */
function ultimoLog(logger) {
	const llamadas = logger.info.mock.calls;
	return JSON.parse(llamadas[llamadas.length - 1][0]);
}

describe('EventoService.obtenerPorIds', () => {
	let eventoRepo;
	let reseniaRepo;
	let logger;
	let servicio;

	beforeEach(() => {
		eventoRepo = new EventoRepository();
		reseniaRepo = new ReseniaRepository();
		logger = { info: jest.fn() };
		servicio = new EventoService(
			eventoRepo,
			null,
			null,
			null,
			reseniaRepo,
			logger
		);
	});

	it('devuelve los eventos en el mismo orden que los IDs recibidos', async () => {
		const a = await construirEvento(eventoRepo, { nombre: 'A' });
		const b = await construirEvento(eventoRepo, { nombre: 'B' });
		const c = await construirEvento(eventoRepo, { nombre: 'C' });

		const eventos = await servicio.obtenerPorIds([c.id, a.id, b.id]);

		expect(eventos.map((e) => e.nombre)).toEqual(['C', 'A', 'B']);
	});

	it('omite los IDs que no corresponden a un evento', async () => {
		const a = await construirEvento(eventoRepo, { nombre: 'A' });

		const eventos = await servicio.obtenerPorIds(['999', a.id, 'otro']);

		expect(eventos.map((e) => e.id)).toEqual([a.id]);
	});

	it('devuelve [] si no recibe IDs', async () => {
		await construirEvento(eventoRepo);

		expect(await servicio.obtenerPorIds([])).toEqual([]);
	});

	it('incluye puntajeOrganizador: promedio de reseñas del organizador o null', async () => {
		const conResenias = { id: 'org-1', nombre: 'Org 1' };
		const sinResenias = { id: 'org-2', nombre: 'Org 2' };
		const pasado = await construirEvento(eventoRepo, {
			organizador: conResenias
		});
		const proximo = await construirEvento(eventoRepo, {
			organizador: conResenias
		});
		const otro = await construirEvento(eventoRepo, {
			organizador: sinResenias
		});
		await construirResenia(reseniaRepo, pasado, 4);
		await construirResenia(reseniaRepo, pasado, 2);

		const eventos = await servicio.obtenerPorIds([proximo.id, otro.id]);

		expect(eventos[0].puntajeOrganizador).toBe(3);
		expect(eventos[1].puntajeOrganizador).toBeNull();
	});

	it('no modifica los eventos almacenados', async () => {
		const a = await construirEvento(eventoRepo);

		await servicio.obtenerPorIds([a.id]);

		const almacenado = await eventoRepo.buscarPorId(a.id);
		expect(almacenado).not.toHaveProperty('puntajeOrganizador');
	});

	it('registra eventos_resueltos con el requestId del contexto', async () => {
		const a = await construirEvento(eventoRepo);

		await servicio.obtenerPorIds([a.id, '999'], { requestId: 'req-1' });

		expect(logger.info).toHaveBeenCalledTimes(1);
		expect(ultimoLog(logger)).toEqual({
			evento: 'eventos_resueltos',
			requestId: 'req-1',
			solicitados: 2,
			encontrados: 1
		});
	});

	it('registra requestId null si no se pasa contexto', async () => {
		await servicio.obtenerPorIds([]);

		expect(ultimoLog(logger)).toMatchObject({
			evento: 'eventos_resueltos',
			requestId: null,
			solicitados: 0,
			encontrados: 0
		});
	});
});
