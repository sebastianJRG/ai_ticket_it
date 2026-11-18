import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Checkbox } from '../../src/components/Checkbox';
import { ThemeProvider } from '../../src/theme/ThemeContext';

const setup = async (props = {}) =>
	render(
		<ThemeProvider scheme="dark">
			<Checkbox label="Acepto los términos" {...props} />
		</ThemeProvider>
	);

describe('Checkbox', () => {
	it('expone rol checkbox y estado checked', async () => {
		await setup({ checked: true });
		expect(
			screen.getByRole('checkbox', { name: 'Acepto los términos' })
		).toBeChecked();
	});

	it('llama a onChange con el valor invertido', async () => {
		const onChange = jest.fn();
		await setup({ checked: false, onChange });
		await fireEvent.press(screen.getByRole('checkbox'));
		expect(onChange).toHaveBeenCalledWith(true);
	});

	it('muestra el error', async () => {
		await setup({ error: 'Aceptá los términos para continuar' });
		expect(screen.getByText('Aceptá los términos para continuar')).toBeTruthy();
	});

	it('disabled no dispara onChange', async () => {
		const onChange = jest.fn();
		await setup({ onChange, disabled: true });
		await fireEvent.press(screen.getByRole('checkbox'));
		expect(onChange).not.toHaveBeenCalled();
	});
});
