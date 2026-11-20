import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ToastProvider, useToast } from '../../src/feedback/ToastContext';
import { renderConTema } from '../helpers/renderConTema';

let toast;
function Sonda() {
	toast = useToast();
	return <Text>contenido</Text>;
}

const montar = (scheme = 'dark') =>
	renderConTema(
		<ToastProvider>
			<Sonda />
		</ToastProvider>,
		{ scheme }
	);

const mostrar = async (aviso) => {
	await act(async () => toast.mostrar(aviso));
};
const avanzar = async (ms) => {
	await act(async () => {
		jest.advanceTimersByTime(ms);
	});
};

describe('ToastProvider / useToast', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it.each(['dark', 'light'])(
		'muestra el aviso y lo oculta a los 4 s (%s)',
		async (scheme) => {
			await montar(scheme);
			await mostrar({ tono: 'success', titulo: 'Compra confirmada' });
			expect(screen.getByText('Compra confirmada')).toBeTruthy();
			await avanzar(3900);
			expect(screen.getByText('Compra confirmada')).toBeTruthy();
			await avanzar(200);
			expect(screen.queryByText('Compra confirmada')).toBeNull();
		}
	);

	it('con acción dura 6 s', async () => {
		await montar();
		await mostrar({
			tono: 'warning',
			titulo: 'Sin conexión',
			accion: { etiqueta: 'Reintentar', alPresionar: jest.fn() }
		});
		await avanzar(5900);
		expect(screen.getByText('Sin conexión')).toBeTruthy();
		await avanzar(200);
		expect(screen.queryByText('Sin conexión')).toBeNull();
	});

	it('muestra los avisos de a uno, en orden (FIFO)', async () => {
		await montar();
		await mostrar({ tono: 'info', titulo: 'Primero' });
		await mostrar({ tono: 'info', titulo: 'Segundo' });
		expect(screen.getByText('Primero')).toBeTruthy();
		expect(screen.queryByText('Segundo')).toBeNull();
		await avanzar(4100);
		expect(screen.queryByText('Primero')).toBeNull();
		expect(screen.getByText('Segundo')).toBeTruthy();
	});

	it('ocultar pasa al siguiente', async () => {
		await montar();
		await mostrar({ tono: 'info', titulo: 'Primero' });
		await mostrar({ tono: 'info', titulo: 'Segundo' });
		await act(async () => toast.ocultar());
		expect(screen.queryByText('Primero')).toBeNull();
		expect(screen.getByText('Segundo')).toBeTruthy();
	});

	it('tocar la acción la ejecuta y oculta el aviso', async () => {
		const alPresionar = jest.fn();
		await montar();
		await mostrar({
			tono: 'warning',
			titulo: 'No pudimos actualizar tu perfil',
			accion: { etiqueta: 'Reintentar', alPresionar }
		});
		await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		expect(alPresionar).toHaveBeenCalledTimes(1);
		expect(screen.queryByText('No pudimos actualizar tu perfil')).toBeNull();
	});

	it('useToast fuera del provider lanza', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		await expect(render(<Sonda />)).rejects.toThrow(
			'useToast debe usarse dentro de ToastProvider.'
		);
		console.error.mockRestore();
	});
});
