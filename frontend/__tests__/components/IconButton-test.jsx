import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { IconButton } from '../../src/components/IconButton';
import { ThemeProvider } from '../../src/theme/ThemeContext';

const setup = async (props = {}) =>
	render(
		<ThemeProvider scheme="dark">
			<IconButton icon="Heart" label="Guardar en favoritos" {...props} />
		</ThemeProvider>
	);

describe('IconButton', () => {
	it('usa label como accessibilityLabel con rol button', async () => {
		await setup();
		expect(
			screen.getByRole('button', { name: 'Guardar en favoritos' })
		).toBeTruthy();
	});

	it('mide al menos 44 x 44', async () => {
		await setup();
		expect(screen.getByRole('button')).toHaveStyle({ width: 44, height: 44 });
	});

	it('llama a onPress', async () => {
		const onPress = jest.fn();
		await setup({ onPress });
		await fireEvent.press(screen.getByRole('button'));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('disabled no dispara onPress', async () => {
		const onPress = jest.fn();
		await setup({ onPress, disabled: true });
		await fireEvent.press(screen.getByRole('button'));
		expect(onPress).not.toHaveBeenCalled();
	});
});
