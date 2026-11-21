import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useCategorias } from '../../src/hooks/useCategorias';
import * as categoriaService from '../../src/services/categoriaService';
import { ApiError } from '../../src/services/api';
import { CATEGORIAS } from '../helpers/eventosEjemplo';

jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn()
}));

describe('useCategorias', () => {
	beforeEach(() => jest.clearAllMocks());

	it('devuelve [] mientras carga y luego la lista', async () => {
		categoriaService.listarCategorias.mockResolvedValue(CATEGORIAS);
		const { result } = await renderHook(() => useCategorias());
		await waitFor(() => expect(result.current.categorias).toEqual(CATEGORIAS));
		expect(categoriaService.listarCategorias).toHaveBeenCalledTimes(1);
	});

	it('arranca vacío antes de resolver', async () => {
		categoriaService.listarCategorias.mockReturnValue(new Promise(() => {}));
		const { result } = await renderHook(() => useCategorias());
		expect(result.current.categorias).toEqual([]);
	});

	it('si falla queda [] sin lanzar', async () => {
		categoriaService.listarCategorias.mockRejectedValue(new ApiError('x', 0));
		const { result } = await renderHook(() => useCategorias());
		await waitFor(() =>
			expect(categoriaService.listarCategorias).toHaveBeenCalled()
		);
		expect(result.current.categorias).toEqual([]);
	});

	it('agregar suma al final sin duplicar por id (feature 007)', async () => {
		categoriaService.listarCategorias.mockResolvedValue(CATEGORIAS);
		const { result } = await renderHook(() => useCategorias());
		await waitFor(() => expect(result.current.categorias).toEqual(CATEGORIAS));
		const jazz = { id: 'cat-jazz', nombre: 'Jazz', descripcion: 'Música' };
		await act(async () => result.current.agregar(jazz));
		expect(result.current.categorias).toEqual([...CATEGORIAS, jazz]);
		await act(async () => result.current.agregar({ ...jazz }));
		expect(result.current.categorias).toHaveLength(CATEGORIAS.length + 1);
	});

	it('recargar vuelve a pedir la lista (feature 007)', async () => {
		categoriaService.listarCategorias.mockResolvedValue(CATEGORIAS);
		const { result } = await renderHook(() => useCategorias());
		await waitFor(() => expect(result.current.cargando).toBe(false));
		categoriaService.listarCategorias.mockResolvedValue([CATEGORIAS[0]]);
		await act(async () => {
			await result.current.recargar();
		});
		expect(categoriaService.listarCategorias).toHaveBeenCalledTimes(2);
		expect(result.current.categorias).toEqual([CATEGORIAS[0]]);
	});
});
