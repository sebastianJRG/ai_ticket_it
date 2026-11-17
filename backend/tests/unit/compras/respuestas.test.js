/**
 * Tests unitarios de los serializadores de respuesta.
 * Garantizan que no se filtren datos sensibles (hashes, permisos, favoritos).
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { aCompraRespuesta } from '../../../src/dto/compra.js';
import { aEventoRespuesta } from '../../../src/dto/evento.js';
import { aUsuarioPublico } from '../../../src/dto/usuarioPublico.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import {
	construirCompra,
	construirEvento,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

const CAMPOS_SENSIBLES = [
	'contraseniaHash',
	'refreshTokenHash',
	'permissions',
	'favoritos',
	'nombreUsuario'
];

describe('serializadores de respuesta', () => {
	let usuario;

	beforeEach(() => {
		usuario = construirUsuario({ id: '5', rol: 'COMPRADOR' });
	});

	describe('aUsuarioPublico', () => {
		it('solo expone id, nombre, apellido y rol', () => {
			expect(aUsuarioPublico(usuario)).toEqual({
				id: '5',
				nombre: 'Ana',
				apellido: 'Pérez',
				rol: 'COMPRADOR'
			});
		});

		it('no contiene campos sensibles', () => {
			const publico = aUsuarioPublico(usuario);

			for (const campo of CAMPOS_SENSIBLES) {
				expect(publico).not.toHaveProperty(campo);
			}
		});

		it('no modifica el usuario original', () => {
			aUsuarioPublico(usuario);

			expect(usuario.contraseniaHash).toBe('hash-secreto-de-contrasenia');
		});

		it('devuelve null si no hay usuario', () => {
			expect(aUsuarioPublico(null)).toBeNull();
			expect(aUsuarioPublico(undefined)).toBeNull();
		});
	});

	describe('aEventoRespuesta', () => {
		let evento;

		beforeEach(async () => {
			evento = await construirEvento(new EventoRepository(), {
				nombre: 'Rock Fest',
				organizador: construirUsuario({ id: '9', rol: 'ORGANIZADOR' })
			});
		});

		it('reemplaza el organizador por su versión pública', () => {
			const respuesta = aEventoRespuesta(evento);

			expect(respuesta.organizador).toEqual({
				id: '9',
				nombre: 'Ana',
				apellido: 'Pérez',
				rol: 'ORGANIZADOR'
			});
		});

		it('conserva el resto de los datos del evento', () => {
			const respuesta = aEventoRespuesta(evento);

			expect(respuesta.id).toBe(evento.id);
			expect(respuesta.nombre).toBe('Rock Fest');
			expect(respuesta.categoria).toEqual(evento.categoria);
			expect(respuesta.tiposEntrada).toEqual(evento.tiposEntrada);
			expect(respuesta.fecha).toEqual(evento.fecha);
		});

		it('no deja hashes en ninguna parte de la respuesta serializada', () => {
			const json = JSON.stringify(aEventoRespuesta(evento));

			expect(json).not.toContain('contraseniaHash');
			expect(json).not.toContain('refreshTokenHash');
			expect(json).not.toContain('hash-secreto');
		});

		it('no modifica el evento original', () => {
			aEventoRespuesta(evento);

			expect(evento.organizador.contraseniaHash).toBe('hash-secreto-de-contrasenia');
		});

		it('tolera un evento sin organizador', () => {
			evento.organizador = undefined;

			expect(() => aEventoRespuesta(evento)).not.toThrow();
		});
	});

	describe('aCompraRespuesta', () => {
		let compra;
		let evento;

		beforeEach(async () => {
			evento = await construirEvento(new EventoRepository(), {
				nombre: 'Rock Fest',
				precios: [100],
				organizador: construirUsuario({ id: '9', rol: 'ORGANIZADOR' })
			});
			compra = await construirCompra(new CompraRepository(), {
				comprador: usuario,
				evento,
				tipoEntrada: evento.tiposEntrada[0],
				cantidad: 2
			});
		});

		it('tiene la forma del contrato', () => {
			expect(aCompraRespuesta(compra)).toEqual({
				id: compra.id,
				comprador: { id: '5', nombre: 'Ana', apellido: 'Pérez' },
				evento: { id: evento.id, nombre: 'Rock Fest', fecha: evento.fecha },
				tipoEntrada: { id: 't1', nombre: 'Tipo 1', precio: 100 },
				cantidad: 2,
				total: 200,
				estado: 'PENDIENTE'
			});
		});

		it('no filtra hashes ni el organizador del evento', () => {
			const json = JSON.stringify(aCompraRespuesta(compra));

			expect(json).not.toContain('contraseniaHash');
			expect(json).not.toContain('refreshTokenHash');
			expect(json).not.toContain('hash-secreto');
			expect(json).not.toContain('organizador');
		});

		it('no modifica la compra original', () => {
			aCompraRespuesta(compra);

			expect(compra.comprador.contraseniaHash).toBe('hash-secreto-de-contrasenia');
			expect(compra.evento.organizador).toBeDefined();
		});
	});
});
