/**
 * Tests unitarios de `crearCompraSchema`.
 * Pruebas puras: sin servidor ni estado compartido.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import { crearCompraSchema } from '../../../src/dto/compra.js';

const valido = () => ({
	compradorId: '5',
	eventoId: '1',
	tipoEntradaId: 't1',
	cantidad: 2
});

describe('crearCompraSchema', () => {
	it('acepta un cuerpo válido', () => {
		const resultado = crearCompraSchema.safeParse(valido());

		expect(resultado.success).toBe(true);
		expect(resultado.data).toEqual(valido());
	});

	it('recorta espacios en los IDs', () => {
		const resultado = crearCompraSchema.safeParse({
			...valido(),
			eventoId: ' 1 ',
			tipoEntradaId: ' t1 '
		});

		expect(resultado.data.eventoId).toBe('1');
		expect(resultado.data.tipoEntradaId).toBe('t1');
	});

	it.each([
		['compradorId', 'El ID del comprador es obligatorio y debe ser un texto.'],
		['eventoId', 'El ID del evento es obligatorio y debe ser un texto.'],
		['tipoEntradaId', 'El ID del tipo de entrada es obligatorio y debe ser un texto.']
	])('rechaza si falta %s, con mensaje en español', (campo, mensaje) => {
		const datos = valido();
		delete datos[campo];

		const resultado = crearCompraSchema.safeParse(datos);

		expect(resultado.success).toBe(false);
		expect(resultado.error.issues[0].message).toBe(mensaje);
	});

	it('rechaza un ID vacío', () => {
		const resultado = crearCompraSchema.safeParse({ ...valido(), eventoId: '   ' });

		expect(resultado.success).toBe(false);
		expect(resultado.error.issues[0].message).toBe(
			'El ID del evento no puede estar vacío.'
		);
	});

	it.each([
		[0, 'La cantidad debe ser mayor a 0.'],
		[-3, 'La cantidad debe ser mayor a 0.'],
		[1.5, 'La cantidad debe ser un número entero.'],
		['2', 'La cantidad es obligatoria y debe ser un número.']
	])('rechaza cantidad=%j', (cantidad, mensaje) => {
		const resultado = crearCompraSchema.safeParse({ ...valido(), cantidad });

		expect(resultado.success).toBe(false);
		expect(resultado.error.issues[0].message).toBe(mensaje);
	});

	it('rechaza si falta la cantidad', () => {
		const datos = valido();
		delete datos.cantidad;

		const resultado = crearCompraSchema.safeParse(datos);

		expect(resultado.success).toBe(false);
		expect(resultado.error.issues[0].message).toBe(
			'La cantidad es obligatoria y debe ser un número.'
		);
	});
});
