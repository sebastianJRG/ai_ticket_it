/**
 * Tests unitarios de `UsuarioService.obtenerPerfil`.
 * Repositorio en memoria nuevo en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import UsuarioRepository from '../../../src/repositories/usuarioRepository.js';
import UsuarioService from '../../../src/services/usuarioService.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

describe('UsuarioService.obtenerPerfil', () => {
	let repositorio;
	let servicio;

	beforeEach(() => {
		repositorio = new UsuarioRepository();
		servicio = new UsuarioService(repositorio);
	});

	it('devuelve el usuario con ese id', async () => {
		const guardado = await repositorio.crear(
			construirUsuario({ rol: 'COMPRADOR' })
		);

		const usuario = await servicio.obtenerPerfil(guardado.id);

		expect(usuario.id).toBe(guardado.id);
		expect(usuario.rol).toBe('COMPRADOR');
	});

	it('lanza 404 si el usuario no existe', async () => {
		await expect(servicio.obtenerPerfil('999')).rejects.toMatchObject({
			name: 'NotFoundError'
		});
	});

	it('lanza 404 si no se recibe id', async () => {
		await expect(servicio.obtenerPerfil(undefined)).rejects.toMatchObject({
			name: 'NotFoundError'
		});
	});
});
