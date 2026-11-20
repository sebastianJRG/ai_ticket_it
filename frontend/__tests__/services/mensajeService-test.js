import {
	enviarMensaje,
	listarMensajes
} from '../../src/services/mensajeService';
import { ApiError, cliente, configurarSesion } from '../../src/services/api';
import { prepararCliente } from '../helpers/adaptadorFalso';

let adaptador;
const enviada = (i = 0) => adaptador.mock.calls[i][0];

describe('mensajeService', () => {
	beforeEach(() => {
		adaptador = prepararCliente(cliente, configurarSesion);
	});

	it('enviarMensaje hace POST /api/compras/:id/mensajes con { mensaje }', async () => {
		adaptador.responder(201, { id: 'm1', mensaje: 'hola' });
		await expect(enviarMensaje('c1', 'hola')).resolves.toEqual({
			id: 'm1',
			mensaje: 'hola'
		});
		expect(enviada()).toMatchObject({
			method: 'post',
			url: '/api/compras/c1/mensajes'
		});
		expect(JSON.parse(enviada().data)).toEqual({ mensaje: 'hola' });
		expect(enviada().headers.Authorization).toBe('Bearer a1');
	});

	it('listarMensajes hace GET /api/compras/:id/mensajes con el ID codificado', async () => {
		adaptador.responder(200, [{ id: 'm1' }]);
		await expect(listarMensajes('c/1')).resolves.toEqual([{ id: 'm1' }]);
		expect(enviada()).toMatchObject({
			method: 'get',
			url: '/api/compras/c%2F1/mensajes'
		});
	});

	it('un 403 rechaza con ApiError 403 sin intentar renovar', async () => {
		adaptador.responder(403, { message: 'No participás de esta compra.' });
		const error = await listarMensajes('c1').catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({
			status: 403,
			message: 'No participás de esta compra.'
		});
		expect(adaptador).toHaveBeenCalledTimes(1);
	});
});
