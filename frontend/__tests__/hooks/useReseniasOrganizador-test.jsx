import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useReseniasOrganizador } from '../../src/hooks/useReseniasOrganizador';
import * as usuarioService from '../../src/services/usuarioService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { RESENIAS } from '../helpers/comprasEjemplo';

jest.mock('../../src/services/usuarioService', () => ({
	listarReseniasOrganizador: jest.fn()
}));

describe('useReseniasOrganizador (data-model.md §10)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('sin ID no pide nada y no queda cargando', async () => {
		const { result } = await renderHook(() => useReseniasOrganizador(null));
		expect(usuarioService.listarReseniasOrganizador).not.toHaveBeenCalled();
		expect(result.current.cargando).toBe(false);
		expect(result.current.resenias).toEqual([]);
	});

	it('con ID pide y expone la lista', async () => {
		usuarioService.listarReseniasOrganizador.mockResolvedValue(RESENIAS);
		const { result } = await renderHook(() => useReseniasOrganizador('org-1'));
		await waitFor(() => expect(result.current.resenias).toEqual(RESENIAS));
		expect(usuarioService.listarReseniasOrganizador).toHaveBeenCalledWith(
			'org-1'
		);
		expect(result.current.cargando).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('error → error y lista vacía', async () => {
		usuarioService.listarReseniasOrganizador.mockRejectedValue(
			new ApiError('x', 0)
		);
		const { result } = await renderHook(() => useReseniasOrganizador('org-1'));
		await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
		expect(result.current.resenias).toEqual([]);
		expect(result.current.cargando).toBe(false);
	});

	it('recargar() vuelve a pedir', async () => {
		usuarioService.listarReseniasOrganizador
			.mockRejectedValueOnce(new ApiError('x', 0))
			.mockResolvedValueOnce(RESENIAS);
		const { result } = await renderHook(() => useReseniasOrganizador('org-1'));
		await waitFor(() => expect(result.current.error).not.toBeNull());
		await act(async () => result.current.recargar());
		expect(result.current.resenias).toEqual(RESENIAS);
		expect(result.current.error).toBeNull();
	});

	it('al cambiar el ID descarta la respuesta vieja', async () => {
		const viejo = diferido();
		const nuevo = diferido();
		usuarioService.listarReseniasOrganizador
			.mockReturnValueOnce(viejo.promesa)
			.mockReturnValueOnce(nuevo.promesa);
		const { result, rerender } = await renderHook(
			(id) => useReseniasOrganizador(id),
			{ initialProps: 'org-1' }
		);
		await rerender('org-2');
		await act(async () => nuevo.resolver(RESENIAS.slice(0, 1)));
		await act(async () => viejo.resolver(RESENIAS));
		expect(result.current.resenias).toEqual(RESENIAS.slice(0, 1));
	});

	it('no actualiza tras desmontar', async () => {
		const d = diferido();
		usuarioService.listarReseniasOrganizador.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { unmount } = await renderHook(() => useReseniasOrganizador('org-1'));
		await unmount();
		await act(async () => d.resolver(RESENIAS));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
