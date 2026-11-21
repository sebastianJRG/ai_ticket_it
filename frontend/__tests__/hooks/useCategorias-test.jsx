import { renderHook, waitFor } from '@testing-library/react-native';
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
});
