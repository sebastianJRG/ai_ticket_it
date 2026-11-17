/**
 * Tests unitarios de `CompraRepository.buscarPorEventoId`.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import {
	construirCompra,
	construirEvento,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

describe('CompraRepository.buscarPorEventoId', () => {
	let repo;
	let evento;
	let otroEvento;

	const comprarEn = (e, cantidad = 1) =>
		construirCompra(repo, {
			comprador: construirUsuario({ id: 'c1' }),
			evento: e,
			tipoEntrada: e.tiposEntrada[0],
			cantidad
		});

	beforeEach(async () => {
		repo = new CompraRepository();
		const eventos = new EventoRepository();
		evento = await construirEvento(eventos, { nombre: 'Uno' });
		otroEvento = await construirEvento(eventos, { nombre: 'Dos', prefijoTipos: 'x' });
	});

	it('devuelve vacío si el evento no tiene compras', async () => {
		expect(await repo.buscarPorEventoId(evento.id)).toEqual([]);
	});

	it('devuelve solo las compras del evento, en orden de creación', async () => {
		await comprarEn(evento, 1);
		await comprarEn(otroEvento, 5);
		await comprarEn(evento, 2);

		const compras = await repo.buscarPorEventoId(evento.id);

		expect(compras.map((c) => c.cantidad)).toEqual([1, 2]);
	});

	it('devuelve copias: modificarlas no altera lo almacenado', async () => {
		await comprarEn(evento, 1);

		const [copia] = await repo.buscarPorEventoId(evento.id);
		copia.cantidad = 99;

		expect((await repo.buscarPorEventoId(evento.id))[0].cantidad).toBe(1);
	});
});
