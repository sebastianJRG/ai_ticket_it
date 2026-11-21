import { act, renderHook } from '@testing-library/react-native';
import { useCrearCompra } from '../../src/hooks/useCrearCompra';
import * as compraService from '../../src/services/compraService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { crearCompraRespuesta } from '../helpers/comprasEjemplo';

jest.mock('../../src/services/compraService', () => ({
	crearCompra: jest.fn()
}));

const DATOS = { eventoId: 'ev-1', tipoEntradaId: 'te-pla', cantidad: 2 };

describe('useCrearCompra (research R7, SC-003)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('envía los datos, marca enviando y expone la compra', async () => {
		const d = diferido();
		compraService.crearCompra.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useCrearCompra());
		expect(result.current.enviando).toBe(false);
		let promesa;
		await act(async () => {
			promesa = result.current.confirmar(DATOS);
		});
		expect(compraService.crearCompra).toHaveBeenCalledWith(DATOS);
		expect(result.current.enviando).toBe(true);
		const compra = crearCompraRespuesta();
		let devuelta;
		await act(async () => {
			d.resolver(compra);
			devuelta = await promesa;
		});
		expect(devuelta).toEqual(compra);
		expect(result.current.compra).toEqual(compra);
		expect(result.current.enviando).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('error → lo expone y devuelve null', async () => {
		compraService.crearCompra.mockRejectedValue(new ApiError('Cupo', 409));
		const { result } = await renderHook(() => useCrearCompra());
		let devuelta;
		await act(async () => {
			devuelta = await result.current.confirmar(DATOS);
		});
		expect(devuelta).toBeNull();
		expect(result.current.error).toBeInstanceOf(ApiError);
		expect(result.current.error.status).toBe(409);
		expect(result.current.compra).toBeNull();
		expect(result.current.enviando).toBe(false);
	});

	it('dos confirmar seguidos sin esperar → una sola petición (SC-003)', async () => {
		const d = diferido();
		compraService.crearCompra.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useCrearCompra());
		await act(async () => {
			result.current.confirmar(DATOS);
			result.current.confirmar(DATOS);
		});
		expect(compraService.crearCompra).toHaveBeenCalledTimes(1);
		await act(async () => d.resolver(crearCompraRespuesta()));
	});

	it('después de una respuesta se puede volver a confirmar', async () => {
		compraService.crearCompra
			.mockRejectedValueOnce(new ApiError('x', 0))
			.mockResolvedValueOnce(crearCompraRespuesta());
		const { result } = await renderHook(() => useCrearCompra());
		await act(async () => {
			await result.current.confirmar(DATOS);
		});
		await act(async () => {
			await result.current.confirmar(DATOS);
		});
		expect(compraService.crearCompra).toHaveBeenCalledTimes(2);
		expect(result.current.error).toBeNull();
		expect(result.current.compra).not.toBeNull();
	});

	it('limpiarError() borra el error', async () => {
		compraService.crearCompra.mockRejectedValue(new ApiError('x', 0));
		const { result } = await renderHook(() => useCrearCompra());
		await act(async () => {
			await result.current.confirmar(DATOS);
		});
		await act(async () => result.current.limpiarError());
		expect(result.current.error).toBeNull();
	});

	it('no actualiza tras desmontar', async () => {
		const d = diferido();
		compraService.crearCompra.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { result, unmount } = await renderHook(() => useCrearCompra());
		await act(async () => {
			result.current.confirmar(DATOS);
		});
		await unmount();
		await act(async () => d.resolver(crearCompraRespuesta()));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
