import {
	obtenerPerfil,
	listarReseniasOrganizador,
	listarFavoritos,
	agregarFavorito,
	quitarFavorito
} from '../../src/services/usuarioService';
import { ApiError, cliente, configurarSesion } from '../../src/services/api';
import { prepararCliente } from '../helpers/adaptadorFalso';

let adaptador;
const enviada = (i = 0) => adaptador.mock.calls[i][0];

describe('usuarioService', () => {
	beforeEach(() => {
		adaptador = prepararCliente(cliente, configurarSesion);
	});

	it('obtenerPerfil hace GET /api/usuarios con sesión y devuelve el perfil', async () => {
		const perfil = { id: 'u1', nombreUsuario: 'ana', rol: 'COMPRADOR' };
		adaptador.responder(200, perfil);
		await expect(obtenerPerfil()).resolves.toEqual(perfil);
		expect(enviada()).toMatchObject({ method: 'get', url: '/api/usuarios' });
		expect(enviada().headers.Authorization).toBe('Bearer a1');
	});

	it('listarReseniasOrganizador es pública y codifica el ID', async () => {
		adaptador = prepararCliente(cliente, configurarSesion, {
			conSesion: false
		});
		const resenias = [{ id: 'r1', puntuacion: 5 }];
		adaptador.responder(200, resenias);
		await expect(listarReseniasOrganizador('org 1/x')).resolves.toEqual(
			resenias
		);
		expect(enviada()).toMatchObject({
			method: 'get',
			url: '/api/usuarios/org%201%2Fx/resenias'
		});
		expect(enviada().headers.Authorization).toBeUndefined();
	});

	it('listarFavoritos hace GET /api/usuarios/favoritos', async () => {
		adaptador.responder(200, [{ id: 'e1' }]);
		await expect(listarFavoritos()).resolves.toEqual([{ id: 'e1' }]);
		expect(enviada()).toMatchObject({
			method: 'get',
			url: '/api/usuarios/favoritos'
		});
	});

	it('agregarFavorito hace PUT /api/usuarios/favoritos/:idEvento sin cuerpo', async () => {
		adaptador.responder(200, ['e1']);
		await expect(agregarFavorito('e1')).resolves.toEqual(['e1']);
		expect(enviada()).toMatchObject({
			method: 'put',
			url: '/api/usuarios/favoritos/e1'
		});
		expect(enviada().data).toBeUndefined();
	});

	it('quitarFavorito hace DELETE /api/usuarios/favoritos/:idEvento', async () => {
		adaptador.responder(200, []);
		await expect(quitarFavorito('e 1')).resolves.toEqual([]);
		expect(enviada()).toMatchObject({
			method: 'delete',
			url: '/api/usuarios/favoritos/e%201'
		});
	});

	it('favoritos sin la feature 002 fallan con ApiError 404', async () => {
		adaptador.responder(404, undefined);
		const error = await listarFavoritos().catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(404);
	});
});
