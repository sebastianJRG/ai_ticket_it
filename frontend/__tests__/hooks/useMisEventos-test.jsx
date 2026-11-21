import { act, renderHook } from '@testing-library/react-native';
import { useMisEventos } from '../../src/hooks/useMisEventos';
import * as eventoService from '../../src/services/eventoService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { EVENTOS_ORGANIZADOR, crearEventoDe } from '../helpers/eventosEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn()
}));

const ids = (lista) => lista.map((e) => e.id);

describe('useMisEventos (data-model.md §5)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
	});

	it('pide por fecha ascendente una vez y expone los propios separados', async () => {
		const d = diferido();
		eventoService.listarEventos.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useMisEventos());
		expect(result.current.cargando).toBe(true);
		expect(result.current.eventos).toBeNull();
		expect(eventoService.listarEventos).toHaveBeenCalledTimes(1);
		expect(eventoService.listarEventos).toHaveBeenCalledWith({
			sortBy: 'fecha',
			order: 'asc'
		});
		await act(async () => d.resolver(EVENTOS_ORGANIZADOR));
		expect(result.current.cargando).toBe(false);
		expect(result.current.eventos).toHaveLength(4);
		expect(
			result.current.proximos.length + result.current.finalizados.length
		).toBe(4);
		expect(ids(result.current.eventos)).not.toContain('ev-ajeno-1');
	});

	it('error sin datos → error y eventos null', async () => {
		const error = new ApiError('x', 0);
		eventoService.listarEventos.mockRejectedValue(error);
		const { result } = await renderHook(() => useMisEventos());
		await act(async () => {});
		expect(result.current.error).toBe(error);
		expect(result.current.eventos).toBeNull();
		expect(result.current.proximos).toEqual([]);
	});

	it('recargar que falla conserva los datos', async () => {
		eventoService.listarEventos.mockResolvedValue(EVENTOS_ORGANIZADOR);
		const { result } = await renderHook(() => useMisEventos());
		await act(async () => {});
		eventoService.listarEventos.mockRejectedValue(new ApiError('x', 500));
		await act(async () => {
			await result.current.recargar();
		});
		expect(result.current.eventos).toHaveLength(4);
		expect(result.current.error).toBeTruthy();
	});

	it('una respuesta vieja que llega después de una más nueva se ignora', async () => {
		const vieja = diferido();
		const nueva = diferido();
		eventoService.listarEventos
			.mockReturnValueOnce(vieja.promesa)
			.mockReturnValueOnce(nueva.promesa);
		const { result } = await renderHook(() => useMisEventos());
		await act(async () => {
			result.current.recargar();
		});
		const unico = crearEventoDe({ id: 'u-organizador' }, { id: 'ev-nuevo' });
		await act(async () => nueva.resolver([unico]));
		await act(async () => vieja.resolver(EVENTOS_ORGANIZADOR));
		expect(ids(result.current.eventos)).toEqual(['ev-nuevo']);
	});

	it('no actualiza tras desmontar', async () => {
		const d = diferido();
		eventoService.listarEventos.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { unmount } = await renderHook(() => useMisEventos());
		await unmount();
		await act(async () => d.resolver(EVENTOS_ORGANIZADOR));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
