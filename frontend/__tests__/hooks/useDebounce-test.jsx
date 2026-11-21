import { act, renderHook } from '@testing-library/react-native';
import { useDebounce } from '../../src/hooks/useDebounce';

describe('useDebounce', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('devuelve el valor inicial de inmediato', async () => {
		const { result } = await renderHook(() => useDebounce('a', 300));
		expect(result.current).toBe('a');
	});

	it('solo emite el último valor tras 300 ms sin cambios', async () => {
		const { result, rerender } = await renderHook((v) => useDebounce(v, 300), {
			initialProps: 'a'
		});
		await rerender('ab');
		await act(async () => jest.advanceTimersByTime(200));
		await rerender('abc');
		await act(async () => jest.advanceTimersByTime(299));
		expect(result.current).toBe('a');
		await act(async () => jest.advanceTimersByTime(1));
		expect(result.current).toBe('abc');
	});

	it('usa 300 ms por defecto', async () => {
		const { result, rerender } = await renderHook((v) => useDebounce(v), {
			initialProps: 'x'
		});
		await rerender('y');
		await act(async () => jest.advanceTimersByTime(299));
		expect(result.current).toBe('x');
		await act(async () => jest.advanceTimersByTime(1));
		expect(result.current).toBe('y');
	});

	it('limpia el temporizador al desmontar', async () => {
		const { rerender, unmount } = await renderHook((v) => useDebounce(v, 300), {
			initialProps: 'a'
		});
		await rerender('b');
		const limpiar = jest.spyOn(global, 'clearTimeout');
		await unmount();
		expect(limpiar).toHaveBeenCalled();
		limpiar.mockRestore();
	});
});
