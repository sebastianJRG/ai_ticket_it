import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '../../src/components/Button';
import { ThemeProvider } from '../../src/theme/ThemeContext';

const setup = async (props = {}) =>
	render(
		<ThemeProvider scheme="dark">
			<Button {...props}>Pagar $ 70.400</Button>
		</ThemeProvider>
	);

describe('Button', () => {
	it('muestra el texto y tiene rol button', async () => {
		await setup();
		expect(screen.getByRole('button', { name: /Pagar/ })).toBeTruthy();
	});

	it('llama a onPress', async () => {
		const onPress = jest.fn();
		await setup({ onPress });
		await fireEvent.press(screen.getByRole('button'));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('disabled: no llama a onPress y expone accessibilityState', async () => {
		const onPress = jest.fn();
		await setup({ onPress, disabled: true });
		await fireEvent.press(screen.getByRole('button'));
		expect(onPress).not.toHaveBeenCalled();
		expect(screen.getByRole('button')).toBeDisabled();
	});

	it('loading: busy, sin onPress y muestra spinner en lugar del texto', async () => {
		const onPress = jest.fn();
		await setup({ onPress, loading: true });
		const btn = screen.getByRole('button');
		await fireEvent.press(btn);
		expect(onPress).not.toHaveBeenCalled();
		expect(btn).toBeBusy();
		expect(screen.queryByText(/Pagar/)).toBeNull();
	});

	it('usa el alto del tamaño (sm 36, md 44, lg 52)', async () => {
		for (const [size, h] of [
			['sm', 36],
			['md', 44],
			['lg', 52]
		]) {
			const { unmount } = await setup({ size });
			expect(screen.getByRole('button')).toHaveStyle({ height: h });
			await unmount();
		}
	});

	it('primary usa colores primary / onPrimary', async () => {
		await setup({ variant: 'primary' });
		expect(screen.getByRole('button')).toHaveStyle({
			backgroundColor: '#c8ff3d'
		});
	});
});
