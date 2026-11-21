import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useMisCompras } from '../../src/hooks/useMisCompras';
import * as compraService from '../../src/services/compraService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { crearCompraListado } from '../helpers/comprasEjemplo';

jest.mock('../../src/services/compraService', () => ({
	listarMisCompras: jest.fn()
}));

const C1 = crearCompraListado({ id: 'c1' });
const C2 = crearCompraListado({ id: 'c2', estado: 'CONFIRMADA' });

describe('useMisCompras (data-model.md §6)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('al montar pide una vez y arranca cargando sin compras', async () => {
		const d = diferido();
		compraService.listarMisCompras.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useMisCompras());
		expect(compraService.listarMisCompras).toHaveBeenCalledTimes(1);
		expect(result.current.cargando).toBe(true);
		expect(result.current.actualizando).toBe(false);
		expect(result.current.compras).toBeNull();
		await act(async () => d.resolver([C1, C2]));
		expect(result.current.compras).toEqual([C1, C2]);
		expect(result.current.cargando).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('error sin datos → error y compras null', async () => {
		compraService.listarMisCompras.mockRejectedValue(new ApiError('x', 0));
		const { result } = await renderHook(() => useMisCompras());
		await waitFor(() => expect(result.current.cargando).toBe(false));
		expect(result.current.error).toBeInstanceOf(ApiError);
		expect(result.current.compras).toBeNull();
	});

	it('recargar() con datos usa actualizando y, si falla, conserva las compras', async () => {
		compraService.listarMisCompras.mockResolvedValueOnce([C1]);
		const { result } = await renderHook(() => useMisCompras());
		await waitFor(() => expect(result.current.compras).toEqual([C1]));
		const d = diferido();
		compraService.listarMisCompras.mockReturnValueOnce(d.promesa);
		let promesa;
		await act(async () => {
			promesa = result.current.recargar();
		});
		expect(result.current.actualizando).toBe(true);
		expect(result.current.cargando).toBe(false);
		await act(async () => {
			d.rechazar(new ApiError('x', 500));
			await promesa;
		});
		expect(result.current.actualizando).toBe(false);
		expect(result.current.compras).toEqual([C1]);
		expect(result.current.error.status).toBe(500);
	});

	it('recargar() exitoso reemplaza las compras y limpia el error', async () => {
		compraService.listarMisCompras.mockRejectedValueOnce(new ApiError('x', 0));
		const { result } = await renderHook(() => useMisCompras());
		await waitFor(() => expect(result.current.error).not.toBeNull());
		compraService.listarMisCompras.mockResolvedValueOnce([C2]);
		await act(async () => result.current.recargar());
		expect(result.current.compras).toEqual([C2]);
		expect(result.current.error).toBeNull();
	});

	it('descarta una respuesta vieja que llega después de una nueva', async () => {
		const viejo = diferido();
		const nuevo = diferido();
		compraService.listarMisCompras
			.mockReturnValueOnce(viejo.promesa)
			.mockReturnValueOnce(nuevo.promesa);
		const { result } = await renderHook(() => useMisCompras());
		await act(async () => {
			result.current.recargar();
		});
		await act(async () => nuevo.resolver([C2]));
		await act(async () => viejo.resolver([C1]));
		expect(result.current.compras).toEqual([C2]);
	});

	it('no actualiza tras desmontar y nunca lanza', async () => {
		const d = diferido();
		compraService.listarMisCompras.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { unmount } = await renderHook(() => useMisCompras());
		await unmount();
		await act(async () => d.rechazar(new ApiError('x', 0)));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
