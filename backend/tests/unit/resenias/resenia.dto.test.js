/**
 * Tests unitarios de los esquemas y del serializador de reseñas.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import {
	aReseniaRespuesta,
	crearReseniaSchema,
	idEventoSchema
} from '../../../src/dto/resenia.js';
import Resenia from '../../../src/models/resenia.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

/** Cuerpo válido base; cada test sobrescribe lo que necesita. */
const valido = (cambios = {}) => ({
	compradorId: '5',
	eventoId: '1',
	detalle: 'Muy buen evento',
	puntuacion: 4,
	...cambios
});

describe('crearReseniaSchema', () => {
	it('acepta un cuerpo válido', () => {
		expect(crearReseniaSchema.safeParse(valido()).success).toBe(true);
	});

	it('recorta el detalle', () => {
		const { data } = crearReseniaSchema.safeParse(
			valido({ detalle: '  Genial ' })
		);

		expect(data.detalle).toBe('Genial');
	});

	it.each([1, 3, 5])('acepta la puntuación %i', (puntuacion) => {
		expect(crearReseniaSchema.safeParse(valido({ puntuacion })).success).toBe(
			true
		);
	});

	it.each([
		['0', 0],
		['6', 6],
		['negativa', -1],
		['decimal', 3.5],
		['texto', '4'],
		['undefined', undefined]
	])('rechaza la puntuación %s', (_etiqueta, puntuacion) => {
		expect(crearReseniaSchema.safeParse(valido({ puntuacion })).success).toBe(
			false
		);
	});

	it.each([
		['vacío', ''],
		['solo espacios', '   '],
		['número', 5],
		['undefined', undefined]
	])('rechaza un detalle %s', (_etiqueta, detalle) => {
		expect(crearReseniaSchema.safeParse(valido({ detalle })).success).toBe(
			false
		);
	});

	it('acepta un detalle de 1000 caracteres y rechaza uno de 1001', () => {
		expect(
			crearReseniaSchema.safeParse(valido({ detalle: 'a'.repeat(1000) }))
				.success
		).toBe(true);
		expect(
			crearReseniaSchema.safeParse(valido({ detalle: 'a'.repeat(1001) }))
				.success
		).toBe(false);
	});

	it.each(['compradorId', 'eventoId'])('rechaza si falta %s', (campo) => {
		expect(
			crearReseniaSchema.safeParse(valido({ [campo]: undefined })).success
		).toBe(false);
	});

	it('devuelve el mensaje en español del primer error', () => {
		const resultado = crearReseniaSchema.safeParse(valido({ puntuacion: 9 }));

		expect(resultado.error.issues[0].message).toBe(
			'La puntuación debe estar entre 1 y 5.'
		);
	});
});

describe('idEventoSchema', () => {
	it('acepta un texto no vacío y lo recorta', () => {
		expect(idEventoSchema.parse(' 7 ')).toBe('7');
	});

	it.each([
		['vacío', ''],
		['número', 3],
		['undefined', undefined]
	])('rechaza un ID %s', (_etiqueta, valor) => {
		expect(idEventoSchema.safeParse(valor).success).toBe(false);
	});
});

describe('aReseniaRespuesta', () => {
	const resenia = new Resenia(
		'9',
		construirUsuario({ id: '5', rol: 'COMPRADOR' }),
		{ id: '1', nombre: 'Rock Fest', organizador: { id: 'org-1' } },
		'Muy buen evento',
		4
	);

	it('expone solo los datos de la reseña en la forma del contrato', () => {
		expect(aReseniaRespuesta(resenia)).toEqual({
			id: '9',
			comprador: { id: '5', nombre: 'Ana', apellido: 'Pérez' },
			eventoId: '1',
			detalle: 'Muy buen evento',
			puntuacion: 4
		});
	});

	it('no filtra hashes ni el rol del comprador', () => {
		const json = JSON.stringify(aReseniaRespuesta(resenia));

		expect(json).not.toContain('hash-secreto');
		expect(json).not.toContain('rol');
	});
});
