import { act, renderHook } from '@testing-library/react-native';
import { useChatCompra } from '../../src/hooks/useChatCompra';
import * as mensajeService from '../../src/services/mensajeService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { COMPRADOR, crearAuthFalso } from '../helpers/authFalso';
import {
	CONVERSACION,
	TEXTO_1001,
	crearMensaje,
	remitentePublico
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

describe('useChatCompra — consulta periódica (research R2, US3)', () => {
	const CADA_5 = { activo: true, intervaloMs: 5000 };
	/** Avanza los timers falsos dentro de act. */
	const avanzar = (ms) =>
		act(async () => {
			await jest.advanceTimersByTimeAsync(ms);
		});

	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('con activo=false no consulta aunque pasen 30 s (SC-003)', async () => {
		await montar('c-1', { activo: false, intervaloMs: 5000 });
		await avanzar(30000);
		expect(mensajeService.listarMensajes).not.toHaveBeenCalled();
	});

	it('consulta al instante y otra a los 5 s de cada respuesta', async () => {
		await montar('c-1', CADA_5);
		await avanzar(0);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(1);
		await avanzar(4999);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(1);
		await avanzar(1);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(2);
		await avanzar(5000);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(3);
	});

	it('no encima consultas con una respuesta lenta', async () => {
		const d = diferido();
		mensajeService.listarMensajes.mockReturnValue(d.promesa);
		await montar('c-1', CADA_5);
		await avanzar(20000);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(1);
		mensajeService.listarMensajes.mockResolvedValue([]);
		await act(async () => d.resolver([]));
		await avanzar(5000);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(2);
	});

	it('al desactivar se detiene y descarta la respuesta en vuelo; al reactivar consulta ya', async () => {
		const d = diferido();
		mensajeService.listarMensajes.mockResolvedValueOnce([]);
		const { result, rerender } = await montar('c-1', CADA_5);
		await avanzar(0);
		mensajeService.listarMensajes.mockReturnValueOnce(d.promesa);
		await avanzar(5000);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(2);
		await rerender({ id: 'c-1', o: { activo: false, intervaloMs: 5000 } });
		await act(async () => d.resolver(CONVERSACION));
		expect(result.current.mensajes).toEqual([]);
		await avanzar(30000);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(2);
		mensajeService.listarMensajes.mockResolvedValue(CONVERSACION);
		await rerender({ id: 'c-1', o: CADA_5 });
		await avanzar(0);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(3);
		expect(result.current.mensajes).toHaveLength(4);
	});

	it('un error de red periódico con datos es silencioso y se reintenta', async () => {
		mensajeService.listarMensajes
			.mockResolvedValueOnce(CONVERSACION)
			.mockRejectedValueOnce(new ApiError('x', 0))
			.mockResolvedValue(CONVERSACION);
		const { result } = await montar('c-1', CADA_5);
		await avanzar(0);
		await avanzar(5000);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(2);
		expect(result.current.error).toBeNull();
		expect(result.current.mensajes).toHaveLength(4);
		await avanzar(5000);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(3);
	});

	it.each([403, 404])(
		'un %p periódico fija error y detiene las consultas',
		async (status) => {
			mensajeService.listarMensajes
				.mockResolvedValueOnce(CONVERSACION)
				.mockRejectedValue(new ApiError('x', status));
			const { result } = await montar('c-1', CADA_5);
			await avanzar(0);
			await avanzar(5000);
			expect(result.current.error.status).toBe(status);
			await avanzar(30000);
			expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(2);
		}
	);

	it('carrera POST/GET: el mensaje se ve una sola vez (SC-002)', async () => {
		const post = diferido();
		mensajeService.enviarMensaje.mockReturnValue(post.promesa);
		const gemelo = crearMensaje({
			id: 'm-9',
			mensaje: 'hola',
			usuario: remitentePublico(COMPRADOR),
			enviado: new Date().toISOString()
		});
		const { result } = await montar('c-1', CADA_5);
		await avanzar(0);
		await act(async () => result.current.enviar('hola'));
		mensajeService.listarMensajes.mockResolvedValue([gemelo]);
		await avanzar(5000);
		expect(
			result.current.mensajes.filter((m) => m.mensaje === 'hola')
		).toHaveLength(1);
		await act(async () => post.resolver(gemelo));
		expect(
			result.current.mensajes.filter((m) => m.mensaje === 'hola')
		).toHaveLength(1);
		await avanzar(5000);
		expect(result.current.mensajes).toHaveLength(1);
		expect(result.current.mensajes[0].id).toBe('m-9');
	});

	it('al desmontar se cancela el temporizador y no hay más consultas', async () => {
		const { unmount } = await montar('c-1', CADA_5);
		await avanzar(0);
		await unmount();
		await avanzar(30000);
		expect(mensajeService.listarMensajes).toHaveBeenCalledTimes(1);
	});
});
