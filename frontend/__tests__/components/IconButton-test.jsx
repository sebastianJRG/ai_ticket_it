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

/** Busca en el árbol del botón el primer nodo con la prop `fill`. */
const conFill = (nodo) => {
	if (!nodo || typeof nodo !== 'object') return null;
	if (nodo.props && typeof nodo.props.fill === 'string') return nodo;
	for (const hijo of nodo.children ?? []) {
		const r = conFill(hijo);
		if (r) return r;
	}
	return null;
};

describe('IconButton relleno y seleccionado (corrección 3)', () => {
	it('sin fill el ícono queda vacío y no seleccionado', async () => {
		await setup();
		const boton = screen.getByRole('button');
		expect(conFill(boton).props.fill).toBe('none');
		expect(boton.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: false })
		);
	});

	it('con fill y seleccionado pinta el ícono y lo anuncia', async () => {
		await setup({ fill: '#ff4d94', color: '#ff4d94', seleccionado: true });
		const boton = screen.getByRole('button');
		expect(conFill(boton).props.fill).toBe('#ff4d94');
		expect(boton.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: true })
		);
	});
});
