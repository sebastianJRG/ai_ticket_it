import {
	aResenia,
	ordenRecientes,
	promedio,
	recientes
} from '../../src/resenias/presentacion';
import { RESENIAS } from '../helpers/comprasEjemplo';

describe('recientes (data-model.md §9)', () => {
	it('devuelve las últimas n en orden inverso de creación', () => {
		expect(recientes(RESENIAS).map((r) => r.id)).toEqual(['r5', 'r4']);
		expect(recientes(RESENIAS, 3).map((r) => r.id)).toEqual(['r5', 'r4', 'r3']);
	});

	it('con menos de n devuelve las que hay', () => {
		expect(recientes(RESENIAS.slice(0, 1)).map((r) => r.id)).toEqual(['r1']);
		expect(recientes([])).toEqual([]);
		expect(recientes(undefined)).toEqual([]);
	});
});

describe('ordenRecientes', () => {
	it('invierte la lista sin mutar la entrada', () => {
		const copia = [...RESENIAS];
		expect(ordenRecientes(RESENIAS).map((r) => r.id)).toEqual([
			'r5',
			'r4',
			'r3',
			'r2',
			'r1'
		]);
		expect(RESENIAS).toEqual(copia);
	});
});

describe('promedio', () => {
	it('usa el puntaje del servidor si es número', () => {
		expect(promedio(RESENIAS, 4.5)).toBe(4.5);
	});

	it('sin puntaje del servidor calcula el promedio local', () => {
		// 5 + 3 + 4 + 5 + 4 = 21 / 5
		expect(promedio(RESENIAS, null)).toBeCloseTo(4.2);
	});

	it('sin reseñas → null', () => {
		expect(promedio([], null)).toBeNull();
	});
});

describe('aResenia', () => {
	it('arma autor "Nombre A." e iniciales', () => {
		expect(aResenia(RESENIAS[0])).toEqual({
			id: 'r1',
			autor: 'Ana L.',
			iniciales: 'AL',
			puntuacion: 5,
			detalle: 'Primera reseña'
		});
	});

	it('comprador null → "Comprador"', () => {
		const r = aResenia(RESENIAS[1]);
		expect(r.autor).toBe('Comprador');
		expect(r.iniciales).toBe('C');
	});
});
