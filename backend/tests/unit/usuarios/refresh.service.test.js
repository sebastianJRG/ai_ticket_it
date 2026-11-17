/**
 * Tests unitarios de `RefreshService.renovar`.
 * Repositorio en memoria nuevo en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import UsuarioRepository from '../../../src/repositories/usuarioRepository.js';
import RefreshService from '../../../src/services/refreshService.js';
import { sembrarUsuarioConSesion } from './sesion.helpers.js';

describe('RefreshService.renovar', () => {
	let repositorio;
	let servicio;
	let usuarioA;
	let usuarioB;

	beforeEach(async () => {
		repositorio = new UsuarioRepository();
		servicio = new RefreshService(repositorio);
		usuarioA = await sembrarUsuarioConSesion(repositorio, 'a', 'token-de-a');
		usuarioB = await sembrarUsuarioConSesion(repositorio, 'b', 'token-de-b');
	});

	it('renueva la sesión del dueño del token y no la de otro usuario', async () => {
		const antesA = (await repositorio.buscarPorId(usuarioA.id))
			.refreshTokenHash;

		const resultado = await servicio.renovar({ refreshToken: 'token-de-b' });

		expect(resultado.usuario.id).toBe(usuarioB.id);
		expect(resultado.refreshToken).not.toBe('token-de-b');
		const despuesA = (await repositorio.buscarPorId(usuarioA.id))
			.refreshTokenHash;
		expect(despuesA).toBe(antesA);
	});

	it('lanza 401 con un token que no pertenece a nadie y no modifica usuarios', async () => {
		const antes = await repositorio.buscarVarios({});

		await expect(
			servicio.renovar({ refreshToken: 'token-inventado' })
		).rejects.toMatchObject({ status: 401 });

		expect(await repositorio.buscarVarios({})).toEqual(antes);
	});

	it('invalida el token anterior tras rotarlo', async () => {
		await servicio.renovar({ refreshToken: 'token-de-b' });

		await expect(
			servicio.renovar({ refreshToken: 'token-de-b' })
		).rejects.toMatchObject({ status: 401 });
	});
});
