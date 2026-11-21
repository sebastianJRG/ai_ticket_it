import { act, renderHook } from '@testing-library/react-native';
import { useCrearEvento } from '../../src/hooks/useCrearEvento';
import * as servicio from '../../src/services/eventoService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';

jest.mock('../../src/services/eventoService', () => ({
	crearEvento: jest.fn()
}));

const DATOS = { nombre: 'X' };

describe('useCrearEvento (data-model.md §5)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('éxito → { ok: true, evento } y enviando vuelve a false', async () => {
		const d = diferido();
		servicio.crearEvento.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useCrearEvento());
		expect(result.current.enviando).toBe(false);
		let promesa;
		await act(async () => {
			promesa = result.current.publicar(DATOS);
		});
		expect(servicio.crearEvento).toHaveBeenCalledWith(DATOS);
		expect(result.current.enviando).toBe(true);
		let resultado;
		await act(async () => {
			d.resolver({ id: 'nuevo' });
			resultado = await promesa;
		});
		expect(resultado).toEqual({ ok: true, evento: { id: 'nuevo' } });
		expect(result.current.enviando).toBe(false);
	});

	it('error → { ok: false, error } sin lanzar', async () => {
		const error = new ApiError('Datos inválidos', 400);
		servicio.crearEvento.mockRejectedValue(error);
		const { result } = await renderHook(() => useCrearEvento());
		let resultado;
		await act(async () => {
			resultado = await result.current.publicar(DATOS);
		});
		expect(resultado).toEqual({ ok: false, error });
		expect(result.current.enviando).toBe(false);
	});

	it('una segunda llamada en curso no vuelve a pedir', async () => {
		const d = diferido();
		servicio.crearEvento.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useCrearEvento());
		let segunda;
		await act(async () => {
			result.current.publicar(DATOS);
			segunda = result.current.publicar(DATOS);
		});
		expect(servicio.crearEvento).toHaveBeenCalledTimes(1);
		await expect(segunda).resolves.toBeNull();
		await act(async () => d.resolver({ id: 'x' }));
	});

	it('no actualiza estado tras desmontar', async () => {
		const d = diferido();
		servicio.crearEvento.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { result, unmount } = await renderHook(() => useCrearEvento());
		let promesa;
		await act(async () => {
			promesa = result.current.publicar(DATOS);
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
