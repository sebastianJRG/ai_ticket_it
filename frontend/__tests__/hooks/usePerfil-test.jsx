import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePerfil } from '../../src/hooks/usePerfil';
import * as usuarioService from '../../src/services/usuarioService';
import { ApiError } from '../../src/services/api';
import { COMPRADOR, crearAuthFalso } from '../helpers/authFalso';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn()
}));

const PERFIL = { ...COMPRADOR, permissions: ['compras:leer'] };

describe('usePerfil', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockAuth = crearAuthFalso({ usuario: COMPRADOR });
	});

	it('carga el perfil del servidor (data-model.md › Perfil)', async () => {
		usuarioService.obtenerPerfil.mockResolvedValue(PERFIL);
		const { result } = await renderHook(() => usePerfil());
		await waitFor(() => expect(result.current.cargando).toBe(false));
		expect(result.current.perfil).toEqual(PERFIL);
		expect(result.current.error).toBeNull();
	});

	it('sin conexión deja el error y perfil null', async () => {
		usuarioService.obtenerPerfil.mockRejectedValue(
			new ApiError('Sin conexión', 0)
		);
		const { result } = await renderHook(() => usePerfil());
		await waitFor(() => expect(result.current.cargando).toBe(false));
		expect(result.current.perfil).toBeNull();
		expect(result.current.error).toBeInstanceOf(ApiError);
		expect(result.current.error.status).toBe(0);
		expect(mockAuth.cerrarSesion).not.toHaveBeenCalled();
	});

	it('ante 404 cierra la sesión', async () => {
		usuarioService.obtenerPerfil.mockRejectedValue(
			new ApiError('No existe', 404)
		);
		const { result } = await renderHook(() => usePerfil());
		await waitFor(() => expect(result.current.cargando).toBe(false));
		expect(mockAuth.cerrarSesion).toHaveBeenCalledTimes(1);
		expect(result.current.error.status).toBe(404);
	});

	it('recargar vuelve a pedir el perfil', async () => {
		usuarioService.obtenerPerfil
			.mockRejectedValueOnce(new ApiError('Sin conexión', 0))
			.mockResolvedValueOnce(PERFIL);
		const { result } = await renderHook(() => usePerfil());
		await waitFor(() => expect(result.current.cargando).toBe(false));
		await act(() => result.current.recargar());
		expect(usuarioService.obtenerPerfil).toHaveBeenCalledTimes(2);
		expect(result.current.perfil).toEqual(PERFIL);
		expect(result.current.error).toBeNull();
	});

	it('nunca lanza aunque falle con un error inesperado', async () => {
		usuarioService.obtenerPerfil.mockRejectedValue(new Error('boom'));
		const { result } = await renderHook(() => usePerfil());
		await waitFor(() => expect(result.current.cargando).toBe(false));
		expect(result.current.error.message).toBe('boom');
	});
});
