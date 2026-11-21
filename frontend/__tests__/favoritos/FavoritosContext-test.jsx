import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
	FavoritosProvider,
	useFavoritos
} from '../../src/favoritos/FavoritosContext';
import * as usuarioService from '../../src/services/usuarioService';
import { ApiError } from '../../src/services/api';
import { COMPRADOR, ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { EVENTOS } from '../helpers/eventosEjemplo';
import { diferido } from '../helpers/diferido';

let mockAuth;
const mockMostrar = jest.fn();
jest.mock('../../src/auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../src/feedback/ToastContext', () => ({
	useToast: () => ({ mostrar: mockMostrar, ocultar: jest.fn() })
}));
jest.mock('../../src/services/usuarioService', () => ({
	listarFavoritos: jest.fn(),
	agregarFavorito: jest.fn(),
	quitarFavorito: jest.fn()
}));

const [A, B, C] = EVENTOS.slice(1, 4);
const wrapper = ({ children }) => (
	<FavoritosProvider>{children}</FavoritosProvider>
);
const ids = (r) => r.current.eventos.map((e) => e.id);

/**
 * Monta el hook con la sesión dada.
 * @param {object} [usuario] Usuario de la sesión.
 * @returns {Promise<any>} Resultado de renderHook.
 */
async function montar(usuario = COMPRADOR) {
	mockAuth = crearAuthFalso({ usuario });
	return renderHook(() => useFavoritos(), { wrapper });
}

describe('FavoritosContext (data-model §8 EstadoFavoritos)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usuarioService.listarFavoritos.mockResolvedValue([A, B]);
	});

	it('COMPRADOR: carga la lista en su orden y expone esFavorito', async () => {
		const { result } = await montar();
		await waitFor(() => expect(result.current.cargando).toBe(false));
		expect(ids(result)).toEqual([A.id, B.id]);
		expect(result.current.esFavorito(A.id)).toBe(true);
		expect(result.current.esFavorito(C.id)).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it.each([
		['visitante', null],
		['ORGANIZADOR', ORGANIZADOR]
	])('%s: no llama servicios y la lista queda vacía', async (_, usuario) => {
		const { result } = await montar(usuario);
		await act(async () => {});
		expect(usuarioService.listarFavoritos).not.toHaveBeenCalled();
		expect(result.current.eventos).toEqual([]);
		await act(async () => result.current.alternar(A));
		expect(usuarioService.agregarFavorito).not.toHaveBeenCalled();
	});

	it('cambio de usuario descarta y recarga', async () => {
		const { result, rerender } = await montar();
		await waitFor(() => expect(ids(result)).toEqual([A.id, B.id]));
		usuarioService.listarFavoritos.mockResolvedValue([C]);
		mockAuth = crearAuthFalso({ usuario: { ...COMPRADOR, id: 'otro' } });
		await rerender({});
		await waitFor(() => expect(ids(result)).toEqual([C.id]));
		mockAuth = crearAuthFalso({ usuario: null });
		await rerender({});
		await waitFor(() => expect(result.current.eventos).toEqual([]));
	});

	it('alternar agrega al final antes de la respuesta (SC-004) y adopta la del servidor', async () => {
		const { result } = await montar();
		await waitFor(() => expect(result.current.cargando).toBe(false));
		const d = diferido();
		usuarioService.agregarFavorito.mockReturnValue(d.promesa);
		// La respuesta sigue pendiente: el cambio no espera a la red.
		await act(async () => {
			result.current.alternar(C);
		});
		expect(result.current.esFavorito(C.id)).toBe(true);
		expect(ids(result)).toEqual([A.id, B.id, C.id]);
		expect(result.current.estaPendiente(C.id)).toBe(true);
		expect(usuarioService.agregarFavorito).toHaveBeenCalledWith(C.id);
		await act(async () => d.resolver([C, A, B]));
		expect(ids(result)).toEqual([C.id, A.id, B.id]);
		expect(result.current.estaPendiente(C.id)).toBe(false);
	});

	it('alternar quita al instante y llama quitarFavorito', async () => {
		const { result } = await montar();
		await waitFor(() => expect(result.current.cargando).toBe(false));
		usuarioService.quitarFavorito.mockResolvedValue([B]);
		await act(async () => {
			result.current.alternar(A);
		});
		expect(usuarioService.quitarFavorito).toHaveBeenCalledWith(A.id);
		expect(ids(result)).toEqual([B.id]);
	});

	it('con dos pendientes, la primera respuesta no pisa el optimista de la segunda', async () => {
		usuarioService.listarFavoritos.mockResolvedValue([A]);
		const { result } = await montar();
		await waitFor(() => expect(result.current.cargando).toBe(false));
		const d1 = diferido();
		const d2 = diferido();
		usuarioService.agregarFavorito
			.mockReturnValueOnce(d1.promesa)
			.mockReturnValueOnce(d2.promesa);
		await act(async () => {
			result.current.alternar(B);
		});
		await act(async () => {
			result.current.alternar(C);
		});
		await act(async () => d1.resolver([A, B]));
		expect(ids(result)).toEqual([A.id, B.id, C.id]);
		await act(async () => d2.resolver([A, B, C]));
		expect(ids(result)).toEqual([A.id, B.id, C.id]);
	});

	it('error al quitar: vuelve a su posición previa y avisa (US4-1)', async () => {
		usuarioService.listarFavoritos.mockResolvedValue([A, B, C]);
		const { result } = await montar();
		await waitFor(() => expect(result.current.cargando).toBe(false));
		usuarioService.quitarFavorito.mockRejectedValue(new ApiError('x', 0));
		await act(async () => {
			await result.current.alternar(B);
		});
		expect(ids(result)).toEqual([A.id, B.id, C.id]);
		expect(mockMostrar).toHaveBeenCalledWith(
			expect.objectContaining({
				tono: 'error',
				titulo: 'No pudimos actualizar tus favoritos'
			})
		);
	});

	it('error al agregar: lo quita de nuevo y avisa', async () => {
		const { result } = await montar();
		await waitFor(() => expect(result.current.cargando).toBe(false));
		usuarioService.agregarFavorito.mockRejectedValue(new ApiError('x', 500));
		await act(async () => {
			await result.current.alternar(C);
		});
		expect(result.current.esFavorito(C.id)).toBe(false);
		expect(mockMostrar).toHaveBeenCalledTimes(1);
	});

	it('un segundo toque del mismo evento mientras está pendiente no hace nada', async () => {
		const { result } = await montar();
		await waitFor(() => expect(result.current.cargando).toBe(false));
		usuarioService.agregarFavorito.mockReturnValue(new Promise(() => {}));
		await act(async () => {
			result.current.alternar(C);
		});
		await act(async () => {
			result.current.alternar(C);
		});
		expect(usuarioService.agregarFavorito).toHaveBeenCalledTimes(1);
		expect(usuarioService.quitarFavorito).not.toHaveBeenCalled();
		expect(result.current.esFavorito(C.id)).toBe(true);
	});

	it('error de carga queda en error y recargar reintenta', async () => {
		usuarioService.listarFavoritos.mockRejectedValueOnce(new ApiError('x', 0));
		const { result } = await montar();
		await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
		await act(async () => result.current.recargar());
		expect(result.current.error).toBeNull();
		expect(ids(result)).toEqual([A.id, B.id]);
	});

	it('useFavoritos fuera del provider lanza', async () => {
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		await expect(renderHook(() => useFavoritos())).rejects.toThrow(
			/FavoritosProvider/
		);
		spy.mockRestore();
	});
});
