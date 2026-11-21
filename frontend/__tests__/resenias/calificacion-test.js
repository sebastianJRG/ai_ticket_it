import {
	ESCALA_PUNTAJE,
	mensajeErrorResenia,
	textoPuntaje,
	validarResenia,
	yaCalifico
} from '../../src/resenias/calificacion';
import { RESENIAS } from '../helpers/comprasEjemplo';

describe('ESCALA_PUNTAJE y textoPuntaje (data-model.md §5)', () => {
	it('escala de 1 a 5', () => {
		expect(ESCALA_PUNTAJE).toEqual({
			1: 'Malo',
			2: 'Regular',
			3: 'Bueno',
			4: 'Muy bueno',
			5: 'Excelente'
		});
	});

	it('caption "4/5 · Muy bueno"; sin puntuación → ""', () => {
		expect(textoPuntaje(4)).toBe('4/5 · Muy bueno');
		expect(textoPuntaje(1)).toBe('1/5 · Malo');
		expect(textoPuntaje(null)).toBe('');
		expect(textoPuntaje(7)).toBe('');
	});
});

describe('validarResenia (BorradorResenia.puntuacion, BorradorResenia.detalle)', () => {
	it('borrador válido', () => {
		expect(validarResenia({ puntuacion: 4, detalle: 'Muy bueno' })).toEqual({
			valido: true,
			errores: {}
		});
	});

	it.each([null, 0, 6, 2.5, undefined])(
		'puntuación %p → error',
		(puntuacion) => {
			const r = validarResenia({ puntuacion, detalle: 'ok' });
			expect(r.valido).toBe(false);
			expect(r.errores.puntuacion).toBe('Elegí de 1 a 5 estrellas');
		}
	);

	it.each(['', '   \n ', undefined])(
		'comentario %p → "Escribí un comentario"',
		(detalle) => {
			const r = validarResenia({ puntuacion: 3, detalle });
			expect(r.valido).toBe(false);
			expect(r.errores.detalle).toBe('Escribí un comentario');
		}
	);

	it('1000 caracteres tras trim es válido; 1001 no', () => {
		expect(
			validarResenia({ puntuacion: 3, detalle: `  ${'a'.repeat(1000)}  ` })
				.valido
		).toBe(true);
		expect(
			validarResenia({ puntuacion: 3, detalle: 'a'.repeat(1001) }).errores
				.detalle
		).toBe('Máximo 1000 caracteres');
	});

	it('informa ambos errores a la vez', () => {
		expect(validarResenia({ puntuacion: null, detalle: ' ' })).toEqual({
			valido: false,
			errores: {
				puntuacion: 'Elegí de 1 a 5 estrellas',
				detalle: 'Escribí un comentario'
			}
		});
	});
});

describe('yaCalifico', () => {
	it('detecta una reseña del usuario', () => {
		expect(yaCalifico(RESENIAS, 'c1')).toBe(true);
		expect(yaCalifico(RESENIAS, 'otro')).toBe(false);
	});

	it('tolera comprador null y listas vacías o nulas', () => {
		expect(yaCalifico([{ comprador: null }], 'c1')).toBe(false);
		expect(yaCalifico([], 'c1')).toBe(false);
		expect(yaCalifico(null, 'c1')).toBe(false);
		expect(yaCalifico(RESENIAS, null)).toBe(false);
	});
});

describe('mensajeErrorResenia (research R11)', () => {
	it('409 → ya calificado', () => {
		expect(mensajeErrorResenia({ status: 409, message: 'x' })).toEqual({
			titulo: 'Ya calificaste este evento',
			cuerpo: '',
			yaCalificado: true
		});
	});

	it('400 usa el mensaje del servidor', () => {
		expect(
			mensajeErrorResenia({ status: 400, message: 'El evento no ocurrió.' })
		).toEqual({
			titulo: 'No pudimos guardar tu reseña',
			cuerpo: 'El evento no ocurrió.',
			yaCalificado: false
		});
	});

	it.each([
		[403, 'Necesitás una entrada utilizada de este evento para calificarlo'],
		[0, 'Sin conexión'],
		[500, 'No pudimos guardar tu reseña']
	])('%i → "%s"', (status, titulo) => {
		const m = mensajeErrorResenia({ status });
		expect(m.titulo).toBe(titulo);
		expect(m.yaCalificado).toBe(false);
	});
});
