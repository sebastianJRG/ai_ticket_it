import {
	crearCompra,
	listarMisCompras,
	cancelarCompra,
	confirmarCompra,
	reembolsarCompra
} from '../../src/services/compraService';
import { ApiError, cliente, configurarSesion } from '../../src/services/api';
import { prepararCliente } from '../helpers/adaptadorFalso';

let adaptador;
const enviada = (i = 0) => adaptador.mock.calls[i][0];

describe('compraService', () => {
	beforeEach(() => {
		adaptador = prepararCliente(cliente, configurarSesion);
	});

	it('crearCompra hace POST /api/compras con evento, tipo de entrada y cantidad', async () => {
		adaptador.responder(201, { id: 'c1', estado: 'PENDIENTE' });
		await expect(
			crearCompra({ eventoId: 'e1', tipoEntradaId: 't1', cantidad: 2 })
		).resolves.toEqual({ id: 'c1', estado: 'PENDIENTE' });
		expect(enviada()).toMatchObject({ method: 'post', url: '/api/compras' });
		expect(JSON.parse(enviada().data)).toEqual({
			eventoId: 'e1',
			tipoEntradaId: 't1',
			cantidad: 2
		});
		expect(enviada().headers.Authorization).toBe('Bearer a1');
	});

	it('crearCompra con cupo insuficiente rechaza con ApiError 409 y el mensaje del backend', async () => {
		adaptador.responder(409, { message: 'Cupo insuficiente.' });
		const error = await crearCompra({
			eventoId: 'e1',
			tipoEntradaId: 't1',
			cantidad: 99
		}).catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 409, message: 'Cupo insuficiente.' });
	});

	it('listarMisCompras hace GET /api/compras', async () => {
		const compras = [{ id: 'c1', diasRestantes: 3 }];
		adaptador.responder(200, compras);
		await expect(listarMisCompras()).resolves.toEqual(compras);
		expect(enviada()).toMatchObject({ method: 'get', url: '/api/compras' });
	});

	it.each([
		['cancelarCompra', cancelarCompra, 'cancelacion'],
		['confirmarCompra', confirmarCompra, 'confirmacion'],
		['reembolsarCompra', reembolsarCompra, 'reembolso']
	])(
		'%s hace PATCH sin cuerpo, con sesión y el ID codificado',
		async (_nombre, operacion, accion) => {
			adaptador.responder(200, { id: 'c/1' });
			await expect(operacion('c/1')).resolves.toEqual({ id: 'c/1' });
			expect(enviada()).toMatchObject({
				method: 'patch',
				url: `/api/compras/c%2F1/${accion}`
			});
			expect(enviada().data).toBeUndefined();
			expect(enviada().headers.Authorization).toBe('Bearer a1');
		}
	);
});
