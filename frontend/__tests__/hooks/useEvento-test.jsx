import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useEvento } from '../../src/hooks/useEvento';
import * as eventoService from '../../src/services/eventoService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { crearEvento } from '../helpers/eventosEjemplo';

jest.mock('../../src/services/eventoService', () => ({
	obtenerEvento: jest.fn()
}));

const EVENTO_A = crearEvento({ id: 'a', nombre: 'Evento A' });
const EVENTO_B = crearEvento({ id: 'b', nombre: 'Evento B' });

describe('useEvento (data-model.md §10)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('arranca cargando y al resolver expone el evento', async () => {
		const d = diferido();
		eventoService.obtenerEvento.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useEvento('a'));
		expect(result.current.cargando).toBe(true);
		expect(result.current.evento).toBeNull();
		await act(async () => d.resolver(EVENTO_A));
		expect(eventoService.obtenerEvento).toHaveBeenCalledWith('a');
		expect(result.current.evento).toEqual(EVENTO_A);
		expect(result.current.cargando).toBe(false);
		expect(result.current.error).toBeNull();
		expect(result.current.noEncontrado).toBe(false);
	});

	it.each([404, 400])('status %i → noEncontrado', async (status) => {
		eventoService.obtenerEvento.mockRejectedValue(new ApiError('x', status));
		const { result } = await renderHook(() => useEvento('a'));
		await waitFor(() => expect(result.current.cargando).toBe(false));
		expect(result.current.noEncontrado).toBe(true);
		expect(result.current.evento).toBeNull();
	});

	it('sin conexión → error sin noEncontrado', async () => {
		eventoService.obtenerEvento.mockRejectedValue(new ApiError('x', 0));
		const { result } = await renderHook(() => useEvento('a'));
		await waitFor(() => expect(result.current.cargando).toBe(false));
		expect(result.current.error).toBeInstanceOf(ApiError);
		expect(result.current.error.status).toBe(0);
		expect(result.current.noEncontrado).toBe(false);
	});

	it('recargar() vuelve a pedir y limpia el error', async () => {
		eventoService.obtenerEvento.mockRejectedValueOnce(new ApiError('x', 0));
		const { result } = await renderHook(() => useEvento('a'));
		await waitFor(() => expect(result.current.error).not.toBeNull());
		eventoService.obtenerEvento.mockResolvedValueOnce(EVENTO_A);
		await act(async () => result.current.recargar());
		expect(eventoService.obtenerEvento).toHaveBeenCalledTimes(2);
		expect(result.current.evento).toEqual(EVENTO_A);
		expect(result.current.error).toBeNull();
	});

	it('al cambiar el ID descarta la respuesta del ID anterior', async () => {
		const viejo = diferido();
		const nuevo = diferido();
		eventoService.obtenerEvento
			.mockReturnValueOnce(viejo.promesa)
			.mockReturnValueOnce(nuevo.promesa);
		const { result, rerender } = await renderHook((id) => useEvento(id), {
			initialProps: 'a'
		});
		await rerender('b');
		await act(async () => nuevo.resolver(EVENTO_B));
		await act(async () => viejo.resolver(EVENTO_A));
		expect(result.current.evento).toEqual(EVENTO_B);
	});

	it('no actualiza tras desmontar', async () => {
		const d = diferido();
		eventoService.obtenerEvento.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { unmount } = await renderHook(() => useEvento('a'));
		await unmount();
		await act(async () => d.resolver(EVENTO_A));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
