import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChoiceCard } from '../../src/components/ChoiceCard';
import { RoleSelector } from '../../src/components/RoleSelector';
import { ThemeProvider } from '../../src/theme/ThemeContext';

const wrap = (ui) => render(<ThemeProvider scheme="dark">{ui}</ThemeProvider>);

describe('ChoiceCard', () => {
	it('expone rol radio y estado seleccionado', async () => {
		await wrap(<ChoiceCard icon="Ticket" title="Quiero comprar" selected />);
		expect(screen.getByRole('radio', { name: /Quiero comprar/ })).toBeChecked();
	});

	it('llama a onPress', async () => {
		const onPress = jest.fn();
		await wrap(
			<ChoiceCard icon="Ticket" title="Quiero comprar" onPress={onPress} />
		);
		await fireEvent.press(screen.getByRole('radio'));
		expect(onPress).toHaveBeenCalledTimes(1);
	});
});

describe('RoleSelector', () => {
	it('selecciona COMPRADOR por defecto', async () => {
		await wrap(<RoleSelector />);
		expect(screen.getByRole('radio', { name: /comprar/ })).toBeChecked();
	});

	it('emite el rol del backend al cambiar', async () => {
		const onChange = jest.fn();
		await wrap(<RoleSelector onChange={onChange} />);
		await fireEvent.press(screen.getByRole('radio', { name: /organizar/ }));
		expect(onChange).toHaveBeenCalledWith('ORGANIZADOR');
	});
});
