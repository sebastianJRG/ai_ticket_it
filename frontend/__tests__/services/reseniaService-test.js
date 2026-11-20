import {
	crearResenia,
	listarReseniasEvento
} from '../../src/services/reseniaService';
import { cliente, configurarSesion } from '../../src/services/api';
import { prepararCliente } from '../helpers/adaptadorFalso';

let adaptador;
const enviada = (i = 0) => adaptador.mock.calls[i][0];

describe('reseniaService', () => {
	it('crearResenia hace POST /api/resenias con evento, detalle y puntuación', async () => {
		adaptador = prepararCliente(cliente, configurarSesion);
		adaptador.responder(201, { id: 'r1' });
		await expect(
			crearResenia({ eventoId: 'e1', detalle: 'Muy bueno', puntuacion: 5 })
		).resolves.toEqual({ id: 'r1' });
		expect(enviada()).toMatchObject({ method: 'post', url: '/api/resenias' });
		expect(JSON.parse(enviada().data)).toEqual({
			eventoId: 'e1',
			detalle: 'Muy bueno',
			puntuacion: 5
		});
		expect(enviada().headers.Authorization).toBe('Bearer a1');
	});

	it('listarReseniasEvento es pública y codifica el ID', async () => {
		adaptador = prepararCliente(cliente, configurarSesion, {
			conSesion: false
		});
		adaptador.responder(200, [{ id: 'r1' }]);
		await expect(listarReseniasEvento('e 1')).resolves.toEqual([{ id: 'r1' }]);
		expect(enviada()).toMatchObject({
			method: 'get',
			url: '/api/resenias/e%201'
		});
		expect(enviada().headers.Authorization).toBeUndefined();
	});
});
