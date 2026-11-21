/**
 * Tests unitarios de `MensajeRepository`.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import Mensaje from '../../../src/models/mensaje.js';
import MensajeRepository from '../../../src/repositories/mensajeRepository.js';

describe('MensajeRepository', () => {
	let repo;

	/** Persiste un mensaje de la compra indicada. */
	const guardar = (compraId, texto) =>
		repo.crear(
			new Mensaje(null, { id: 'u1' }, texto, new Date(), { id: compraId })
		);

	beforeEach(() => {
		repo = new MensajeRepository();
	});

	describe('buscarPorCompraId', () => {
		it('devuelve vacío si la compra no tiene mensajes', async () => {
			expect(await repo.buscarPorCompraId('1')).toEqual([]);
		});

		it('devuelve solo los mensajes de la compra, en orden de creación', async () => {
			await guardar('1', 'primero');
			await guardar('2', 'ajeno');
			await guardar('1', 'segundo');

			const mensajes = await repo.buscarPorCompraId('1');

			expect(mensajes.map((m) => m.mensaje)).toEqual(['primero', 'segundo']);
		});

		it('devuelve copias: modificarlas no altera lo almacenado', async () => {
			await guardar('1', 'original');

			const [copia] = await repo.buscarPorCompraId('1');
			copia.mensaje = 'alterado';

			expect((await repo.buscarPorCompraId('1'))[0].mensaje).toBe('original');
		});
	});
});
