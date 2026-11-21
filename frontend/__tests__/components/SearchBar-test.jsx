import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { SearchBar } from '../../src/components/SearchBar';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('SearchBar (%s)', (scheme) => {
	it('editable: placeholder por defecto y alCambiar', async () => {
		const alCambiar = jest.fn();
		await renderConTema(<SearchBar valor="" alCambiar={alCambiar} />, {
			scheme
		});
		const input = screen.getByPlaceholderText(
			'Buscá artistas, obras, eventos…'
		);
		await fireEvent.changeText(input, 'jazz');
		expect(alCambiar).toHaveBeenCalledWith('jazz');
	});

	it('con valor muestra "Borrar búsqueda" que limpia', async () => {
		const alCambiar = jest.fn();
		await renderConTema(<SearchBar valor="jazz" alCambiar={alCambiar} />, {
			scheme
		});
		await fireEvent.press(
			screen.getByRole('button', { name: 'Borrar búsqueda' })
		);
		expect(alCambiar).toHaveBeenCalledWith('');
	});

	it('sin valor no muestra "Borrar búsqueda"', async () => {
		await renderConTema(<SearchBar valor="" alCambiar={() => {}} />, {
			scheme
		});
		expect(
			screen.queryByRole('button', { name: 'Borrar búsqueda' })
		).toBeNull();
	});

	it('disparador: no editable y tocarla llama alPresionar', async () => {
		const alPresionar = jest.fn();
		await renderConTema(<SearchBar valor="" alPresionar={alPresionar} />, {
			scheme
		});
		expect(
			screen.queryByPlaceholderText('Buscá artistas, obras, eventos…')
		).toBeNull();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Buscar eventos' })
		);
		expect(alPresionar).toHaveBeenCalledTimes(1);
	});
});
