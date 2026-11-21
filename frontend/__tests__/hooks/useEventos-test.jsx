import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useEventos } from '../../src/hooks/useEventos';
import * as eventoService from '../../src/services/eventoService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { EVENTOS } from '../helpers/eventosEjemplo';

jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn()
}));

describe('useEventos (data-model §7 EstadoConsulta)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('arranca cargando y sin eventos; al resolver los expone', async () => {
		const d = diferido();
		eventoService.listarEventos.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useEventos({ q: 'jazz' }));
		expect(result.current.eventos).toBeNull();
		expect(result.current.cargando).toBe(true);
		await act(async () => d.resolver(EVENTOS));
		expect(result.current.eventos).toEqual(EVENTOS);
		expect(result.current.cargando).toBe(false);
		expect(result.current.error).toBeNull();
		expect(eventoService.listarEventos).toHaveBeenCalledWith({ q: 'jazz' });
	});

	it('no envía filtros vacíos', async () => {
		eventoService.listarEventos.mockResolvedValue([]);
		await renderHook(() =>
			useEventos({ q: '  ', categoriaId: null, sortBy: 'fecha', order: 'asc' })
		);
		await waitFor(() =>
			expect(eventoService.listarEventos).toHaveBeenCalledWith({
				sortBy: 'fecha',
				order: 'asc'
			})
		);
	});

	it('ante error lo expone y conserva los eventos previos', async () => {
		eventoService.listarEventos.mockResolvedValueOnce(EVENTOS);
		const { result } = await renderHook(() => useEventos({}));
		await waitFor(() => expect(result.current.eventos).toEqual(EVENTOS));
		eventoService.listarEventos.mockRejectedValueOnce(new ApiError('x', 0));
		await act(async () => result.current.recargar());
		expect(result.current.error).toBeInstanceOf(ApiError);
		expect(result.current.eventos).toEqual(EVENTOS);
		expect(result.current.cargando).toBe(false);
	});

	it('re-consulta al cambiar un filtro por valor, no por identidad', async () => {
		eventoService.listarEventos.mockResolvedValue([]);
		const { rerender } = await renderHook((f) => useEventos(f), {
			initialProps: { q: 'a' }
		});
		await waitFor(() =>
			expect(eventoService.listarEventos).toHaveBeenCalledTimes(1)
		);
		await rerender({ q: 'a' });
		await act(async () => {});
		expect(eventoService.listarEventos).toHaveBeenCalledTimes(1);
		await rerender({ q: 'b' });
		await waitFor(() =>
			expect(eventoService.listarEventos).toHaveBeenCalledTimes(2)
		);
		expect(eventoService.listarEventos).toHaveBeenLastCalledWith({ q: 'b' });
	});

	it('recargar vuelve a consultar', async () => {
		eventoService.listarEventos.mockResolvedValue([]);
		const { result } = await renderHook(() => useEventos({}));
		await waitFor(() => expect(result.current.cargando).toBe(false));
		await act(async () => result.current.recargar());
		expect(eventoService.listarEventos).toHaveBeenCalledTimes(2);
	});

	it('una respuesta vieja que llega después se ignora (SC-003)', async () => {
		const primera = diferido();
		const segunda = diferido();
		eventoService.listarEventos
			.mockReturnValueOnce(primera.promesa)
			.mockReturnValueOnce(segunda.promesa);
		const { result, rerender } = await renderHook((f) => useEventos(f), {
			initialProps: { q: 'ja' }
		});
		await rerender({ q: 'teatro' });
		await act(async () => segunda.resolver([EVENTOS[2]]));
		await act(async () => primera.resolver([EVENTOS[1]]));
		expect(result.current.eventos).toEqual([EVENTOS[2]]);
		expect(result.current.cargando).toBe(false);
	});

	it('el error de una petición vieja también se ignora', async () => {
		const primera = diferido();
		const segunda = diferido();
		eventoService.listarEventos
			.mockReturnValueOnce(primera.promesa)
			.mockReturnValueOnce(segunda.promesa);
		const { result, rerender } = await renderHook((f) => useEventos(f), {
			initialProps: { q: 'ja' }
		});
		await rerender({ q: 'teatro' });
		await act(async () => segunda.resolver([]));
		await act(async () => primera.rechazar(new ApiError('x', 500)));
		expect(result.current.error).toBeNull();
		expect(result.current.eventos).toEqual([]);
	});

	it('no actualiza tras desmontar', async () => {
		const d = diferido();
		eventoService.listarEventos.mockReturnValue(d.promesa);
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { result, unmount } = await renderHook(() => useEventos({}));
		await unmount();
		await act(async () => d.resolver(EVENTOS));
		expect(result.current.eventos).toBeNull();
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});
});
