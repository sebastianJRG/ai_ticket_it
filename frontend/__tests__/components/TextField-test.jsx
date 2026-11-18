import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TextField } from '../../src/components/TextField';
import { ThemeProvider } from '../../src/theme/ThemeContext';

const setup = async (props = {}) =>
	render(
		<ThemeProvider scheme="dark">
			<TextField label="Nombre de usuario" value="" required {...props} />
		</ThemeProvider>
	);

describe('TextField', () => {
	it('muestra el label y (opcional) si no es required', async () => {
		await setup({ required: false });
		expect(screen.getByText(/Nombre de usuario/)).toBeTruthy();
		expect(screen.getByText(/opcional/)).toBeTruthy();
	});

	it('emite onChangeText', async () => {
		const onChangeText = jest.fn();
		await setup({ onChangeText });
		await fireEvent.changeText(screen.getByLabelText('Nombre de usuario'), 'ana');
		expect(onChangeText).toHaveBeenCalledWith('ana');
	});

	it('muestra error', async () => {
		await setup({ error: 'No puede estar vacío' });
		expect(screen.getByText('No puede estar vacío')).toBeTruthy();
	});

	it('secureTextEntry oculta y permite mostrar la contraseña', async () => {
		await setup({ label: 'Contraseña', secureTextEntry: true });
		const input = screen.getByLabelText('Contraseña');
		expect(input.props.secureTextEntry).toBe(true);
		await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));
		expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(false);
		expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeTruthy();
	});

	it('muestra contador con maxLength en multilínea', async () => {
		await setup({ multiline: true, value: 'hola', maxLength: 600 });
		expect(screen.getByText('4/600')).toBeTruthy();
	});
});
