import { act, renderHook } from '@testing-library/react-native';
import { useCancelarCompra } from '../../src/hooks/useCancelarCompra';
import * as compraService from '../../src/services/compraService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { crearCompraListado } from '../helpers/comprasEjemplo';

jest.mock('../../src/services/compraService', () => ({
	cancelarCompra: jest.fn()
}));

const COMPRA = crearCompraListado({ id: 'c1', estado: 'CONFIRMADA' });

describe('useCancelarCompra (data-model.md §6)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('cancela, expone enviando y avisa el éxito', async () => {
		const d = diferido();
		compraService.cancelarCompra.mockReturnValue(d.promesa);
		const alTerminar = jest.fn();
		const { result } = await renderHook(() =>
			useCancelarCompra({ alTerminar })
		);
		expect(result.current.enviando).toBe(false);
		let promesa;
		await act(async () => {
			promesa = result.current.cancelar(COMPRA);
		});
		expect(compraService.cancelarCompra).toHaveBeenCalledWith('c1');
		expect(result.current.enviando).toBe(true);
		const actualizada = { ...COMPRA, estado: 'CANCELADA' };
		await act(async () => {
			d.resolver(actualizada);
			await promesa;
		});
		expect(result.current.enviando).toBe(false);
		expect(alTerminar).toHaveBeenCalledWith({ ok: true, compra: actualizada });
	});

	it('error → alTerminar con ok false, sin lanzar', async () => {
		const error = new ApiError('El evento ya ocurrió.', 400);
		compraService.cancelarCompra.mockRejectedValue(error);
		const alTerminar = jest.fn();
		const { result } = await renderHook(() =>
			useCancelarCompra({ alTerminar })
		);
		await act(async () => {
			await expect(result.current.cancelar(COMPRA)).resolves.toBeUndefined();
		});
		expect(alTerminar).toHaveBeenCalledWith({ ok: false, error });
		expect(result.current.enviando).toBe(false);
	});

	it('ignora una segunda llamada mientras hay una en curso', async () => {
		const d = diferido();
		compraService.cancelarCompra.mockReturnValue(d.promesa);
		const { result } = await renderHook(() =>
			useCancelarCompra({ alTerminar: () => {} })
		);
		await act(async () => {
			result.current.cancelar(COMPRA);
			result.current.cancelar(COMPRA);
		});
		expect(compraService.cancelarCompra).toHaveBeenCalledTimes(1);
		await act(async () => d.resolver(COMPRA));
	});

	it('no actualiza ni avisa tras desmontar', async () => {
		const d = diferido();
		compraService.cancelarCompra.mockReturnValue(d.promesa);
		const alTerminar = jest.fn();
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { result, unmount } = await renderHook(() =>
			useCancelarCompra({ alTerminar })
		);
		await act(async () => {
			result.current.cancelar(COMPRA);
		});
		await unmount();
		await act(async () => d.resolver(COMPRA));
		expect(alTerminar).not.toHaveBeenCalled();
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
