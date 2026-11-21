import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { CategoryChips } from '../../src/components/CategoryChips';
import { renderConTema } from '../helpers/renderConTema';
import { CATEGORIAS } from '../helpers/eventosEjemplo';

describe.each(['dark', 'light'])('CategoryChips (%s)', (scheme) => {
	it('"Todo" primero y seleccionado con seleccionada=null, luego las categorías en orden', async () => {
		await renderConTema(
			<CategoryChips
				categorias={CATEGORIAS}
				seleccionada={null}
				alCambiar={() => {}}
			/>,
			{ scheme }
		);
		const tabs = screen.getAllByRole('tab');
		expect(tabs.map((t) => t.props.accessibilityLabel)).toEqual([
			'Todo',
			'Recitales',
			'Teatro',
			'Stand-up'
		]);
		expect(tabs[0].props.accessibilityState.selected).toBe(true);
		expect(tabs[1].props.accessibilityState.selected).toBe(false);
		expect(screen.getByTestId('category-chips').props.accessibilityRole).toBe(
			'tablist'
		);
	});

	it('tocar una categoría llama alCambiar(id) y "Todo" alCambiar(null)', async () => {
		const alCambiar = jest.fn();
		await renderConTema(
			<CategoryChips
				categorias={CATEGORIAS}
				seleccionada="cat-tea"
				alCambiar={alCambiar}
			/>,
			{ scheme }
		);
		expect(
			screen.getByRole('tab', { name: 'Teatro' }).props.accessibilityState
				.selected
		).toBe(true);
		await fireEvent.press(screen.getByRole('tab', { name: 'Recitales' }));
		expect(alCambiar).toHaveBeenLastCalledWith('cat-rec');
		await fireEvent.press(screen.getByRole('tab', { name: 'Todo' }));
		expect(alCambiar).toHaveBeenLastCalledWith(null);
	});

	it('sin categorías solo muestra "Todo"', async () => {
		await renderConTema(
			<CategoryChips
				categorias={[]}
				seleccionada={null}
				alCambiar={() => {}}
			/>,
			{ scheme }
		);
		expect(screen.getAllByRole('tab')).toHaveLength(1);
	});
});
