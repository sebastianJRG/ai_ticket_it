/**
 * Tests unitarios del esquema y el serializador de mensajes.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import {
	aMensajeRespuesta,
	crearMensajeSchema
} from '../../../src/dto/mensaje.js';
import Mensaje from '../../../src/models/mensaje.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

describe('crearMensajeSchema', () => {
	it('acepta un texto válido y lo recorta', () => {
		const resultado = crearMensajeSchema.safeParse({ mensaje: '  Hola  ' });

		expect(resultado.success).toBe(true);
		expect(resultado.data.mensaje).toBe('Hola');
	});

	it('acepta exactamente 1000 caracteres', () => {
		expect(
			crearMensajeSchema.safeParse({ mensaje: 'a'.repeat(1000) }).success
		).toBe(true);
	});

	it.each([
		['vacío', ''],
		['solo espacios', '   '],
		['más de 1000 caracteres', 'a'.repeat(1001)],
		['un número', 42],
		['undefined', undefined],
		['null', null]
	])('rechaza un mensaje %s', (_nombre, mensaje) => {
		expect(crearMensajeSchema.safeParse({ mensaje }).success).toBe(false);
	});
});

describe('aMensajeRespuesta', () => {
	it('expone solo datos públicos del remitente y el ID de la compra', () => {
		const enviado = new Date('2030-01-01T10:00:00.000Z');
		const mensaje = new Mensaje(
			'7',
			construirUsuario({ id: '5', rol: 'COMPRADOR' }),
			'Hola',
			enviado,
			{ id: '3' }
		);

		expect(aMensajeRespuesta(mensaje)).toEqual({
			id: '7',
			compraId: '3',
			usuario: { id: '5', nombre: 'Ana', apellido: 'Pérez', rol: 'COMPRADOR' },
			mensaje: 'Hola',
			enviado
		});
	});
});
