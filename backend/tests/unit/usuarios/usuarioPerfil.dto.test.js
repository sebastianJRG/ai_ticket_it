/**
 * Tests unitarios del serializador `aUsuarioPerfil`.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import { aUsuarioPerfil } from '../../../src/dto/usuarioPerfil.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

describe('aUsuarioPerfil', () => {
	it('expone únicamente los campos del perfil', () => {
		const usuario = construirUsuario({ id: '5', rol: 'ORGANIZADOR' });

		expect(aUsuarioPerfil(usuario)).toEqual({
			id: '5',
			nombre: 'Ana',
			apellido: 'Pérez',
			nombreUsuario: 'usuario.test',
			rol: 'ORGANIZADOR',
			permissions: ['permiso:uno']
		});
	});

	it('nunca filtra hashes ni favoritos', () => {
		const resultado = aUsuarioPerfil(construirUsuario({ id: '5' }));

		expect(resultado).not.toHaveProperty('contraseniaHash');
		expect(resultado).not.toHaveProperty('refreshTokenHash');
		expect(resultado).not.toHaveProperty('favoritos');
	});

	it('devuelve una copia de los permisos, no la referencia original', () => {
		const usuario = construirUsuario({ id: '5' });

		aUsuarioPerfil(usuario).permissions.push('otro:permiso');

		expect(usuario.permissions).toEqual(['permiso:uno']);
	});

	it('devuelve null si no hay usuario', () => {
		expect(aUsuarioPerfil(null)).toBeNull();
		expect(aUsuarioPerfil(undefined)).toBeNull();
	});
});
