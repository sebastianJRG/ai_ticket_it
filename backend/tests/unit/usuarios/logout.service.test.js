/**
 * Tests unitarios de `LogoutService.cerrarSesion`.
 * Repositorio en memoria nuevo en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import UsuarioRepository from '../../../src/repositories/usuarioRepository.js';
import LogoutService from '../../../src/services/logoutService.js';
import { sembrarUsuarioConSesion } from './sesion.helpers.js';

describe('LogoutService.cerrarSesion', () => {
	let repositorio;
	let servicio;
	let usuarioA;
	let usuarioB;

	beforeEach(async () => {
		repositorio = new UsuarioRepository();
		servicio = new LogoutService(repositorio);
		usuarioA = await sembrarUsuarioConSesion(repositorio, 'a', 'token-de-a');
		usuarioB = await sembrarUsuarioConSesion(repositorio, 'b', 'token-de-b');
	});

	it('cierra solo la sesión del dueño del token', async () => {
		await servicio.cerrarSesion({ refreshToken: 'token-de-b' });

		const a = await repositorio.buscarPorId(usuarioA.id);
		const b = await repositorio.buscarPorId(usuarioB.id);
		expect(b.refreshTokenHash).toBeNull();
		expect(a.refreshTokenHash).toBeTruthy();
	});

	it('lanza 401 con un token inventado y no cierra ninguna sesión', async () => {
		await expect(
			servicio.cerrarSesion({ refreshToken: 'token-inventado' })
		).rejects.toMatchObject({ status: 401 });

		const a = await repositorio.buscarPorId(usuarioA.id);
		const b = await repositorio.buscarPorId(usuarioB.id);
		expect(a.refreshTokenHash).toBeTruthy();
		expect(b.refreshTokenHash).toBeTruthy();
	});
});
