import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { Chip } from '../../src/components/Chip';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('Chip (%s)', (scheme) => {
	it('muestra la etiqueta y el estado seleccionado', async () => {
		await renderConTema(
			<Chip
				etiqueta="Teatro"
				icono="Drama"
				seleccionado
				alPresionar={() => {}}
			/>,
			{ scheme }
		);
		const chip = screen.getByRole('button', { name: 'Teatro' });
		expect(chip.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: true })
		);
	});

	it('al tocar llama alPresionar', async () => {
		const alPresionar = jest.fn();
		await renderConTema(<Chip etiqueta="Teatro" alPresionar={alPresionar} />, {
			scheme
		});
		await fireEvent.press(screen.getByRole('button', { name: 'Teatro' }));
		expect(alPresionar).toHaveBeenCalledTimes(1);
	});

	it('removible: label "Quitar filtro" y ejecuta alPresionar', async () => {
		const alPresionar = jest.fn();
		await renderConTema(
			<Chip
				variante="filter"
				etiqueta="jazz"
				removible
				alPresionar={alPresionar}
			/>,
			{ scheme }
		);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Quitar filtro jazz' })
		);
		expect(alPresionar).toHaveBeenCalledTimes(1);
		expect(screen.getByText('jazz')).toBeTruthy();
	});

	it('acepta un rol de pestaña', async () => {
		await renderConTema(
			<Chip
				etiqueta="Todo"
				rol="tab"
				seleccionado={false}
				alPresionar={() => {}}
			/>,
			{ scheme }
		);
		expect(screen.getByRole('tab', { name: 'Todo' })).toBeTruthy();
	});
});
