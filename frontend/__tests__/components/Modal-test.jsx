import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { Modal } from '../../src/components/Modal';
import { darkTheme, lightTheme } from '../../src/theme/theme';
import { renderConTema } from '../helpers/renderConTema';

const props = (extra = {}) => ({
	visible: true,
	titulo: '¿Cancelar esta compra?',
	cuerpo: 'Se cancelan 2 entradas y pedís el reembolso de $ 64.000.',
	alConfirmar: jest.fn(),
	alCancelar: jest.fn(),
	...extra
});

describe.each([
	['dark', darkTheme],
	['light', lightTheme]
])('Modal (%s)', (scheme, tema) => {
	it('muestra título, cuerpo, confirmar y volver (US4-1)', async () => {
		await renderConTema(<Modal {...props()} />, { scheme });
		expect(
			screen.getByRole('header', { name: '¿Cancelar esta compra?' })
		).toBeTruthy();
		expect(screen.getByText(/reembolso de \$ 64\.000/)).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Confirmar' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Volver' })).toBeTruthy();
	});

	it('es un diálogo modal para el lector de pantalla', async () => {
		await renderConTema(<Modal {...props()} />, { scheme });
		expect(
			screen.getByTestId('modal-dialogo').props.accessibilityViewIsModal
		).toBe(true);
	});

	it('usa etiquetas personalizadas', async () => {
		await renderConTema(
			<Modal
				{...props({
					etiquetaConfirmar: 'Sí, cancelar y pedir reembolso',
					etiquetaCancelar: 'No, conservar entradas'
				})}
			/>,
			{ scheme }
		);
		expect(
			screen.getByRole('button', { name: 'Sí, cancelar y pedir reembolso' })
		).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'No, conservar entradas' })
		).toBeTruthy();
	});

	it('confirmar y volver llaman a sus callbacks', async () => {
		const p = props();
		await renderConTema(<Modal {...p} />, { scheme });
		await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
		expect(p.alConfirmar).toHaveBeenCalledTimes(1);
		await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
		expect(p.alCancelar).toHaveBeenCalledTimes(1);
	});

	it('el back de Android (onRequestClose) cancela', async () => {
		const p = props();
		await renderConTema(<Modal {...p} />, { scheme });
		screen.getByTestId('modal').props.onRequestClose();
		expect(p.alCancelar).toHaveBeenCalledTimes(1);
	});

	it('destructivo pinta el botón de confirmar con el color de error', async () => {
		await renderConTema(<Modal {...props({ destructivo: true })} />, {
			scheme
		});
		const estilo = StyleSheet.flatten(
			screen.getByRole('button', { name: 'Confirmar' }).props.style
		);
		expect(estilo.backgroundColor).toBe(tema.colors.error);
	});

	it('cargando deshabilita volver y marca ocupado el confirmar', async () => {
		await renderConTema(<Modal {...props({ cargando: true })} />, { scheme });
		const botones = screen.getAllByRole('button');
		const confirmar = botones.find((b) => b.props.accessibilityState?.busy);
		expect(confirmar).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Volver' }).props.accessibilityState
		).toEqual(expect.objectContaining({ disabled: true }));
	});

	it('con visible={false} no renderiza contenido', async () => {
		await renderConTema(<Modal {...props({ visible: false })} />, { scheme });
		expect(screen.queryByText('¿Cancelar esta compra?')).toBeNull();
	});
});
