import { AppState } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { usePantallaActiva } from '../../src/hooks/usePantallaActiva';

const mockFoco = { valor: true };
jest.mock('expo-router', () => {
	const { useEffect } = jest.requireActual('react');
	return {
		useFocusEffect: (efecto) => {
			const enfocada = mockFoco.valor;
			useEffect(() => (enfocada ? efecto() : undefined), [efecto, enfocada]);
		}
	};
});

let oyente;
let remove;
const ESTADO_ORIGINAL = AppState.currentState;

beforeEach(() => {
	mockFoco.valor = true;
	oyente = null;
	remove = jest.fn();
	AppState.currentState = 'active';
	jest.spyOn(AppState, 'addEventListener').mockImplementation((tipo, fn) => {
		oyente = fn;
		return { remove };
	});
});

afterEach(() => {
	jest.restoreAllMocks();
	AppState.currentState = ESTADO_ORIGINAL;
});

describe('usePantallaActiva (data-model.md §5)', () => {
	it('true con foco y app activa', async () => {
		const { result } = await renderHook(() => usePantallaActiva());
		expect(result.current).toBe(true);
		expect(AppState.addEventListener).toHaveBeenCalledWith(
			'change',
			expect.any(Function)
		);
	});

	it('false al pasar a background y true al volver', async () => {
		const { result } = await renderHook(() => usePantallaActiva());
		await act(async () => oyente('background'));
		expect(result.current).toBe(false);
		await act(async () => oyente('active'));
		expect(result.current).toBe(true);
	});

	it('false con la app inactive', async () => {
		const { result } = await renderHook(() => usePantallaActiva());
		await act(async () => oyente('inactive'));
		expect(result.current).toBe(false);
	});

	it('false al perder el foco', async () => {
		const { result, rerender } = await renderHook(() => usePantallaActiva());
		mockFoco.valor = false;
		await rerender();
		expect(result.current).toBe(false);
	});

	it('arranca en false si la app ya está en background', async () => {
		AppState.currentState = 'background';
		const { result } = await renderHook(() => usePantallaActiva());
		expect(result.current).toBe(false);
	});

	it('limpia la suscripción al desmontar', async () => {
		const { unmount } = await renderHook(() => usePantallaActiva());
		await unmount();
		expect(remove).toHaveBeenCalledTimes(1);
	});
});
