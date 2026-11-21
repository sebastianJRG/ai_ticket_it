import { act, renderHook } from '@testing-library/react-native';
import { useChatCompra } from '../../src/hooks/useChatCompra';
import * as mensajeService from '../../src/services/mensajeService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { COMPRADOR, crearAuthFalso } from '../helpers/authFalso';
import {
	CONVERSACION,
	TEXTO_1001,
	crearMensaje
} from '../helpers/mensajesEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth
}));
jest.mock('../../src/services/mensajeService', () => ({
	listarMensajes: jest.fn(),
	enviarMensaje: jest.fn()
}));

/** Opciones sin consulta periódica efectiva (US1). */
const SIN_POLLING = { activo: true, intervaloMs: 1e9 };

const montar = (id, opciones = SIN_POLLING) =>
	renderHook(({ id: i, o }) => useChatCompra(i, o), {
		initialProps: { id, o: opciones }
	});

/** Mensajes locales (sin id del servidor) del resultado. */
const locales = (result) => result.current.mensajes.filter((m) => m.claveLocal);

beforeEach(() => {
	jest.clearAllMocks();
	mockAuth = crearAuthFalso({ usuario: COMPRADOR });
	mensajeService.listarMensajes.mockResolvedValue([]);
});

describe('useChatCompra — carga (data-model.md §5)', () => {
	it.each([undefined, null, ''])(
		'con ID vacío (%p) no pide nada',
		async (id) => {
			const { result } = await montar(id);
			expect(mensajeService.listarMensajes).not.toHaveBeenCalled();
			expect(result.current.cargando).toBe(false);
		}
	);

	it('con activo=false no pide nada', async () => {
		await montar('c-1', { activo: false, intervaloMs: 1e9 });
		expect(mensajeService.listarMensajes).not.toHaveBeenCalled();
	});

	it('pide una vez y expone la conversación', async () => {
		const d = diferido();
		mensajeService.listarMensajes.mockReturnValue(d.promesa);
		const { result } = await montar('c-1');
		expect(result.current.cargando).toBe(true);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(1);
		expect(mensajeService.listarMensajes).toHaveBeenCalledWith('c-1');
		await act(async () => d.resolver(CONVERSACION));
		expect(result.current.cargando).toBe(false);
		expect(result.current.error).toBeNull();
		expect(result.current.mensajes.map((m) => m.id)).toEqual([
			'm-1',
			'm-2',
			'm-3',
			'm-4'
		]);
	});

	it('error inicial queda en error y recargar vuelve a pedir', async () => {
		mensajeService.listarMensajes.mockRejectedValueOnce(new ApiError('x', 0));
		const { result } = await montar('c-1');
		await act(async () => {});
		expect(result.current.error.status).toBe(0);
		expect(result.current.cargando).toBe(false);
		mensajeService.listarMensajes.mockResolvedValue(CONVERSACION);
		await act(async () => result.current.recargar());
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(2);
		expect(result.current.error).toBeNull();
		expect(result.current.mensajes).toHaveLength(4);
	});

	it('recargar con una consulta en curso no dispara otro GET', async () => {
		const d = diferido();
		mensajeService.listarMensajes.mockReturnValue(d.promesa);
		const { result } = await montar('c-1');
		await act(async () => {
			result.current.recargar();
		});
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(1);
		await act(async () => d.resolver([]));
	});
});

describe('useChatCompra — envío (research R3)', () => {
	it('agrega al instante un local enviando con el texto recortado', async () => {
		const d = diferido();
		mensajeService.enviarMensaje.mockReturnValue(d.promesa);
		const { result } = await montar('c-1');
		await act(async () => {});
		await act(async () => result.current.enviar('  hola '));
		expect(locales(result)).toEqual([
			expect.objectContaining({ estado: 'enviando', mensaje: 'hola' })
		]);
		expect(mensajeService.enviarMensaje).toHaveBeenCalledWith('c-1', 'hola');
		const servidor = crearMensaje({ id: 'm-9', mensaje: 'hola' });
		await act(async () => d.resolver(servidor));
		expect(locales(result)).toEqual([
			expect.objectContaining({
				estado: 'confirmado',
				id: 'm-9',
				enviado: servidor.enviado
			})
		]);
	});

	it.each(['', '   ', TEXTO_1001])(
		'un texto inválido no se agrega',
		async (t) => {
			const { result } = await montar('c-1');
			await act(async () => {});
			await act(async () => result.current.enviar(t));
			expect(result.current.mensajes).toEqual([]);
			expect(mensajeService.enviarMensaje).not.toHaveBeenCalled();
		}
	);

	it('cola FIFO: un solo POST en curso', async () => {
		const d1 = diferido();
		const d2 = diferido();
		mensajeService.enviarMensaje
			.mockReturnValueOnce(d1.promesa)
			.mockReturnValueOnce(d2.promesa);
		const { result } = await montar('c-1');
		await act(async () => {});
		await act(async () => {
			result.current.enviar('uno');
			result.current.enviar('dos');
		});
		expect(mensajeService.enviarMensaje).toHaveBeenCalledTimes(1);
		expect(mensajeService.enviarMensaje).toHaveBeenLastCalledWith('c-1', 'uno');
		await act(async () =>
			d1.resolver(crearMensaje({ id: 'a', mensaje: 'uno' }))
		);
		expect(mensajeService.enviarMensaje).toHaveBeenCalledTimes(2);
		expect(mensajeService.enviarMensaje).toHaveBeenLastCalledWith('c-1', 'dos');
		await act(async () =>
			d2.resolver(crearMensaje({ id: 'b', mensaje: 'dos' }))
		);
		expect(locales(result).map((m) => m.mensaje)).toEqual(['uno', 'dos']);
	});

	it('fallo: queda en error, la cola sigue y reintentar reenvía', async () => {
		mensajeService.enviarMensaje
			.mockRejectedValueOnce(new ApiError('x', 0))
			.mockResolvedValueOnce(crearMensaje({ id: 'b', mensaje: 'dos' }))
			.mockResolvedValueOnce(crearMensaje({ id: 'a', mensaje: 'uno' }));
		const { result } = await montar('c-1');
		await act(async () => {});
		await act(async () => {
			result.current.enviar('uno');
			result.current.enviar('dos');
		});
		const [fallido, segundo] = locales(result);
		expect(fallido).toEqual(
			expect.objectContaining({ estado: 'error', mensaje: 'uno' })
		);
		expect(fallido.error.status).toBe(0);
		expect(segundo).toEqual(
			expect.objectContaining({ estado: 'confirmado', id: 'b' })
		);
		await act(async () => result.current.reintentar(fallido.claveLocal));
		expect(mensajeService.enviarMensaje).toHaveBeenLastCalledWith('c-1', 'uno');
		const reintentado = locales(result).find(
			(m) => m.claveLocal === fallido.claveLocal
		);
		expect(reintentado).toEqual(
			expect.objectContaining({ estado: 'confirmado', id: 'a' })
		);
		expect(reintentado.error).toBeUndefined();
	});

	it('un 400 conserva el error del servidor en el local', async () => {
		mensajeService.enviarMensaje.mockRejectedValue(
			new ApiError('El mensaje no puede estar vacío.', 400)
		);
		const { result } = await montar('c-1');
		await act(async () => {});
		await act(async () => result.current.enviar('hola'));
		const [l] = locales(result);
		expect(l.estado).toBe('error');
		expect(l.error.message).toBe('El mensaje no puede estar vacío.');
		expect(result.current.error).toBeNull();
	});

	it('desmontado con un envío en curso no actualiza estado', async () => {
		const d = diferido();
		mensajeService.enviarMensaje.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { result, unmount } = await montar('c-1');
		await act(async () => {});
		await act(async () => result.current.enviar('hola'));
		await unmount();
		await act(async () => d.resolver(crearMensaje({ id: 'x' })));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
