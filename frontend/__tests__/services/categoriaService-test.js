import {
	listarCategorias,
	crearCategoria
} from '../../src/services/categoriaService';
import { cliente, configurarSesion } from '../../src/services/api';
import { prepararCliente } from '../helpers/adaptadorFalso';

let adaptador;
const enviada = (i = 0) => adaptador.mock.calls[i][0];

describe('categoriaService', () => {
	it('listarCategorias es pública', async () => {
		adaptador = prepararCliente(cliente, configurarSesion, {
			conSesion: false
		});
		const categorias = [{ id: 'c1', nombre: 'Música' }];
		adaptador.responder(200, categorias);
		await expect(listarCategorias()).resolves.toEqual(categorias);
		expect(enviada()).toMatchObject({ method: 'get', url: '/api/categorias' });
		expect(enviada().headers.Authorization).toBeUndefined();
	});

	it('crearCategoria hace POST /api/categorias con nombre y descripción', async () => {
		adaptador = prepararCliente(cliente, configurarSesion);
		adaptador.responder(201, { id: 'c1', nombre: 'Teatro' });
		await expect(
			crearCategoria({ nombre: 'Teatro', descripcion: 'Obras' })
		).resolves.toEqual({ id: 'c1', nombre: 'Teatro' });
		expect(enviada()).toMatchObject({ method: 'post', url: '/api/categorias' });
		expect(JSON.parse(enviada().data)).toEqual({
			nombre: 'Teatro',
			descripcion: 'Obras'
		});
		expect(enviada().headers.Authorization).toBe('Bearer a1');
	});
});
