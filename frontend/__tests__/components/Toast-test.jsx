import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { Toast } from '../../src/components/Toast';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('Toast (%s)', (scheme) => {
	it.each(['success', 'info', 'warning'])(
		'tono %s se anuncia como región viva',
		async (tono) => {
			await renderConTema(
				<Toast tono={tono} titulo="Guardado en favoritos" />,
				{
					scheme
				}
			);
			const toast = screen.getByTestId('toast');
			expect(toast.props.accessibilityLiveRegion).toBe('polite');
			expect(toast.props.accessibilityRole).not.toBe('alert');
			expect(screen.getByText('Guardado en favoritos')).toBeTruthy();
		}
	);

	it('tono error tiene rol alert', async () => {
		await renderConTema(<Toast tono="error" titulo="Pago rechazado" />, {
			scheme
		});
		expect(screen.getByTestId('toast').props.accessibilityRole).toBe('alert');
		expect(screen.getByText('Pago rechazado')).toBeTruthy();
	});

	it('el mensaje es opcional', async () => {
		await renderConTema(
			<Toast
				tono="info"
				titulo="Tu sesión expiró"
				mensaje="Iniciá sesión de nuevo."
			/>,
			{ scheme }
		);
		expect(screen.getByText('Iniciá sesión de nuevo.')).toBeTruthy();
	});

	it('sin acción no hay botón', async () => {
		await renderConTema(<Toast tono="success" titulo="Listo" />, { scheme });
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('la acción ejecuta alPresionar y luego alCerrar', async () => {
		const alPresionar = jest.fn();
		const alCerrar = jest.fn();
		await renderConTema(
			<Toast
				tono="warning"
				titulo="No pudimos actualizar tu perfil"
				accion={{ etiqueta: 'Reintentar', alPresionar }}
				alCerrar={alCerrar}
			/>,
			{ scheme }
		);
		await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		expect(alPresionar).toHaveBeenCalledTimes(1);
		expect(alCerrar).toHaveBeenCalledTimes(1);
	});
});
