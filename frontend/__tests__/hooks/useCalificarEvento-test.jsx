import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useCalificarEvento } from '../../src/hooks/useCalificarEvento';
import * as reseniaService from '../../src/services/reseniaService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { crearResenia } from '../helpers/comprasEjemplo';

jest.mock('../../src/services/reseniaService', () => ({
	listarReseniasEvento: jest.fn(),
	crearResenia: jest.fn()
}));

const USUARIO = 'u-comprador';
const PROPIA = crearResenia({
	comprador: { id: USUARIO, nombre: 'Ana', apellido: 'G' }
});
const AJENA = crearResenia();
const VALIDO = { puntuacion: 4, detalle: '  Muy bueno  ' };

describe('useCalificarEvento (data-model.md §6)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		reseniaService.listarReseniasEvento.mockResolvedValue([AJENA]);
	});

	it('sin eventoId no pide nada', async () => {
		const { result } = await renderHook(() =>
			useCalificarEvento(null, USUARIO)
		);
		expect(reseniaService.listarReseniasEvento).not.toHaveBeenCalled();
		expect(result.current.verificando).toBe(false);
		expect(result.current.yaCalificado).toBe(false);
	});

	it('verifica con las reseñas del evento', async () => {
		const d = diferido();
		reseniaService.listarReseniasEvento.mockReturnValue(d.promesa);
		const { result } = await renderHook(() =>
			useCalificarEvento('ev', USUARIO)
		);
		expect(reseniaService.listarReseniasEvento).toHaveBeenCalledWith('ev');
		expect(result.current.verificando).toBe(true);
		await act(async () => d.resolver([AJENA, PROPIA]));
		expect(result.current.verificando).toBe(false);
		expect(result.current.yaCalificado).toBe(true);
	});

	it('si la verificación falla se ofrece igual, sin error', async () => {
		reseniaService.listarReseniasEvento.mockRejectedValue(new ApiError('x', 0));
		const { result } = await renderHook(() =>
			useCalificarEvento('ev', USUARIO)
		);
		await waitFor(() => expect(result.current.verificando).toBe(false));
		expect(result.current.yaCalificado).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('borrador inválido → false sin petición', async () => {
		const { result } = await renderHook(() =>
			useCalificarEvento('ev', USUARIO)
		);
		await waitFor(() => expect(result.current.verificando).toBe(false));
		let ok;
		await act(async () => {
			ok = await result.current.enviar({ puntuacion: null, detalle: '' });
		});
		expect(ok).toBe(false);
		expect(reseniaService.crearResenia).not.toHaveBeenCalled();
	});

	it('201 → envía el comentario recortado, devuelve true y marca calificado', async () => {
		const d = diferido();
		reseniaService.crearResenia.mockReturnValue(d.promesa);
		const { result } = await renderHook(() =>
			useCalificarEvento('ev', USUARIO)
		);
		await waitFor(() => expect(result.current.verificando).toBe(false));
		let promesa;
		await act(async () => {
			promesa = result.current.enviar(VALIDO);
		});
		expect(reseniaService.crearResenia).toHaveBeenCalledWith({
			eventoId: 'ev',
			detalle: 'Muy bueno',
			puntuacion: 4
		});
		expect(result.current.enviando).toBe(true);
		let ok;
		await act(async () => {
			d.resolver(PROPIA);
			ok = await promesa;
		});
		expect(ok).toBe(true);
		expect(result.current.enviando).toBe(false);
		expect(result.current.yaCalificado).toBe(true);
	});

	it('409 → false, ya calificado y aviso', async () => {
		reseniaService.crearResenia.mockRejectedValue(new ApiError('x', 409));
		const { result } = await renderHook(() =>
			useCalificarEvento('ev', USUARIO)
		);
		await waitFor(() => expect(result.current.verificando).toBe(false));
		let ok;
		await act(async () => {
			ok = await result.current.enviar(VALIDO);
		});
		expect(ok).toBe(false);
		expect(result.current.yaCalificado).toBe(true);
		expect(result.current.error.titulo).toBe('Ya calificaste este evento');
	});

	it('403 → error sin marcar calificado', async () => {
		reseniaService.crearResenia.mockRejectedValue(new ApiError('x', 403));
		const { result } = await renderHook(() =>
			useCalificarEvento('ev', USUARIO)
		);
		await waitFor(() => expect(result.current.verificando).toBe(false));
		await act(async () => {
			await result.current.enviar(VALIDO);
		});
		expect(result.current.yaCalificado).toBe(false);
		expect(result.current.error.titulo).toBe(
			'Necesitás una entrada utilizada de este evento para calificarlo'
		);
	});

	it('una segunda llamada en curso no hace otra petición', async () => {
		const d = diferido();
		reseniaService.crearResenia.mockReturnValue(d.promesa);
		const { result } = await renderHook(() =>
			useCalificarEvento('ev', USUARIO)
		);
		await waitFor(() => expect(result.current.verificando).toBe(false));
		await act(async () => {
			result.current.enviar(VALIDO);
			result.current.enviar(VALIDO);
		});
		expect(reseniaService.crearResenia).toHaveBeenCalledTimes(1);
		await act(async () => d.resolver(PROPIA));
	});

	it('no actualiza tras desmontar', async () => {
		const d = diferido();
		reseniaService.listarReseniasEvento.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { unmount } = await renderHook(() =>
			useCalificarEvento('ev', USUARIO)
		);
		await unmount();
		await act(async () => d.resolver([PROPIA]));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
