/**
 * Tests unitarios de `listarEventosSchema` (query params de GET /api/eventos).
 * Pruebas puras: sin servidor ni estado compartido.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import { listarEventosSchema } from '../../../src/dto/evento.js';

describe('listarEventosSchema', () => {
	it('acepta un objeto vacío (todos los parámetros son opcionales)', () => {
		const resultado = listarEventosSchema.safeParse({});

		expect(resultado.success).toBe(true);
		expect(resultado.data).toEqual({});
	});

	it('recorta los espacios de q y categoriaId', () => {
		const resultado = listarEventosSchema.safeParse({
			q: '  rock  ',
			categoriaId: ' 3 '
		});

		expect(resultado.success).toBe(true);
		expect(resultado.data).toEqual({ q: 'rock', categoriaId: '3' });
	});

	it.each(['precio', 'fecha', 'puntaje'])('acepta sortBy=%s', (sortBy) => {
		const resultado = listarEventosSchema.safeParse({ sortBy });

		expect(resultado.success).toBe(true);
		expect(resultado.data.sortBy).toBe(sortBy);
	});

	it.each(['asc', 'desc'])('acepta order=%s', (order) => {
		const resultado = listarEventosSchema.safeParse({ order });

		expect(resultado.success).toBe(true);
		expect(resultado.data.order).toBe(order);
	});

	it('rechaza un sortBy inválido con mensaje en español', () => {
		const resultado = listarEventosSchema.safeParse({ sortBy: 'nombre' });

		expect(resultado.success).toBe(false);
		expect(resultado.error.issues[0].message).toBe(
			'sortBy debe ser uno de: precio, fecha, puntaje.'
		);
	});

	it('rechaza un order inválido con mensaje en español', () => {
		const resultado = listarEventosSchema.safeParse({ order: 'up' });

		expect(resultado.success).toBe(false);
		expect(resultado.error.issues[0].message).toBe(
			'order debe ser asc o desc.'
		);
	});

	it.each([[['a', 'b']], [123]])('rechaza q que no es texto (%j)', (q) => {
		const resultado = listarEventosSchema.safeParse({ q });

		expect(resultado.success).toBe(false);
		expect(resultado.error.issues[0].message).toBe(
			'El parámetro q debe ser un texto.'
		);
	});

	it.each([[['1', '2']], [7]])(
		'rechaza categoriaId que no es texto (%j)',
		(categoriaId) => {
			const resultado = listarEventosSchema.safeParse({ categoriaId });

			expect(resultado.success).toBe(false);
			expect(resultado.error.issues[0].message).toBe(
				'El parámetro categoriaId debe ser un texto.'
			);
		}
	);
});
