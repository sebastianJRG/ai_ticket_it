import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { AgregarTipoEntrada } from '../../src/components/AgregarTipoEntrada';
import { renderConTema } from '../helpers/renderConTema';

describe('AgregarTipoEntrada', () => {
	it.each(['dark', 'light'])('es un botón que agrega (%s)', async (scheme) => {
		const alPresionar = jest.fn();
		await renderConTema(<AgregarTipoEntrada alPresionar={alPresionar} />, {
			scheme
		});
		expect(screen.getByText('Agregar tipo de entrada')).toBeTruthy();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Agregar tipo de entrada' })
		);
		expect(alPresionar).toHaveBeenCalledTimes(1);
	});

	it('deshabilitado no llama a alPresionar', async () => {
		const alPresionar = jest.fn();
		await renderConTema(
			<AgregarTipoEntrada alPresionar={alPresionar} disabled />
		);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Agregar tipo de entrada' })
		);
		expect(alPresionar).not.toHaveBeenCalled();
	});
});
