import { act, renderHook } from '@testing-library/react-native';
import { useComprasEvento } from '../../src/hooks/useComprasEvento';
import * as eventoService from '../../src/services/eventoService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import {
	COMPRAS_ORGANIZADOR,
	DISPONIBILIDAD_EJEMPLO
} from '../helpers/comprasEjemplo';

jest.mock('../../src/services/eventoService', () => ({
	obtenerComprasEvento: jest.fn()
}));

const DATOS = {
	compras: COMPRAS_ORGANIZADOR,
	disponibilidad: DISPONIBILIDAD_EJEMPLO
};

describe('useComprasEvento (data-model.md §5)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('pide una vez con el ID y expone los datos', async () => {
		const d = diferido();
		eventoService.obtenerComprasEvento.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useComprasEvento('ev-1'));
		expect(result.current.cargando).toBe(true);
		expect(result.current.datos).toBeNull();
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledTimes(1);
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledWith('ev-1');
		await act(async () => d.resolver(DATOS));
		expect(result.current.datos).toEqual(DATOS);
		expect(result.current.cargando).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it.each([undefined, null, ''])(
		'con ID vacío (%p) no pide nada',
		async (id) => {
			const { result } = await renderHook(() => useComprasEvento(id));
			expect(eventoService.obtenerComprasEvento).not.toHaveBeenCalled();
			expect(result.current).toEqual(
				expect.objectContaining({ datos: null, cargando: false, error: null })
			);
		}
	);

	it('403 → error con status y datos null', async () => {
		eventoService.obtenerComprasEvento.mockRejectedValue(
			new ApiError('No', 403)
		);
		const { result } = await renderHook(() => useComprasEvento('ev-1'));
		await act(async () => {});
		expect(result.current.error.status).toBe(403);
		expect(result.current.datos).toBeNull();
	});

	it('recargar devuelve una promesa y, si falla con datos, los conserva', async () => {
		eventoService.obtenerComprasEvento.mockResolvedValue(DATOS);
		const { result } = await renderHook(() => useComprasEvento('ev-1'));
		await act(async () => {});
		eventoService.obtenerComprasEvento.mockRejectedValue(
			new ApiError('x', 500)
		);
		let p;
		await act(async () => {
			p = result.current.recargar();
			await p;
		});
		expect(p).toBeInstanceOf(Promise);
		expect(result.current.datos).toEqual(DATOS);
		expect(result.current.error.status).toBe(500);
	});

	it('una respuesta vieja se ignora', async () => {
		const vieja = diferido();
		const nueva = diferido();
		eventoService.obtenerComprasEvento
			.mockReturnValueOnce(vieja.promesa)
			.mockReturnValueOnce(nueva.promesa);
		const { result } = await renderHook(() => useComprasEvento('ev-1'));
		await act(async () => {
			result.current.recargar();
		});
		const nuevos = { compras: [], disponibilidad: [] };
		await act(async () => nueva.resolver(nuevos));
		await act(async () => vieja.resolver(DATOS));
		expect(result.current.datos).toEqual(nuevos);
	});

	it('no actualiza tras desmontar', async () => {
		const d = diferido();
		eventoService.obtenerComprasEvento.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { unmount } = await renderHook(() => useComprasEvento('ev-1'));
		await unmount();
		await act(async () => d.resolver(DATOS));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
