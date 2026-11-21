import { act, renderHook } from '@testing-library/react-native';
import { useCrearCategoria } from '../../src/hooks/useCrearCategoria';
import * as servicio from '../../src/services/categoriaService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';

jest.mock('../../src/services/categoriaService', () => ({
	crearCategoria: jest.fn()
}));

const DATOS = { nombre: 'Jazz', descripcion: 'Música' };

describe('useCrearCategoria (data-model.md §5)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('éxito → { ok: true, categoria } y enviando vuelve a false', async () => {
		const d = diferido();
		servicio.crearCategoria.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useCrearCategoria());
		expect(result.current.enviando).toBe(false);
		let promesa;
		await act(async () => {
			promesa = result.current.crear(DATOS);
		});
		expect(servicio.crearCategoria).toHaveBeenCalledWith(DATOS);
		expect(result.current.enviando).toBe(true);
		let resultado;
		await act(async () => {
			d.resolver({ id: 'nuevo' });
			resultado = await promesa;
		});
		expect(resultado).toEqual({ ok: true, categoria: { id: 'nuevo' } });
		expect(result.current.enviando).toBe(false);
	});

	it('error → { ok: false, error } sin lanzar', async () => {
		const error = new ApiError('Datos inválidos', 400);
		servicio.crearCategoria.mockRejectedValue(error);
		const { result } = await renderHook(() => useCrearCategoria());
		let resultado;
		await act(async () => {
			resultado = await result.current.crear(DATOS);
		});
		expect(resultado).toEqual({ ok: false, error });
		expect(result.current.enviando).toBe(false);
	});

	it('una segunda llamada en curso no vuelve a pedir', async () => {
		const d = diferido();
		servicio.crearCategoria.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useCrearCategoria());
		let segunda;
		await act(async () => {
			result.current.crear(DATOS);
			segunda = result.current.crear(DATOS);
		});
		expect(servicio.crearCategoria).toHaveBeenCalledTimes(1);
		await expect(segunda).resolves.toBeNull();
		await act(async () => d.resolver({ id: 'x' }));
	});

	it('no actualiza estado tras desmontar', async () => {
		const d = diferido();
		servicio.crearCategoria.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { result, unmount } = await renderHook(() => useCrearCategoria());
		let promesa;
		await act(async () => {
			promesa = result.current.crear(DATOS);
		});
		await unmount();
		await act(async () => {
			d.resolver({ id: 'x' });
			await promesa;
		});
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
