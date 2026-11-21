import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { SortSelector } from '../../src/components/SortSelector';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('SortSelector (%s)', (scheme) => {
	it('muestra el orden actual en el disparador', async () => {
		await renderConTema(
			<SortSelector valor="fecha-asc" alCambiar={() => {}} />,
			{
				scheme
			}
		);
		expect(screen.getByText('Ordenar: Fecha ↑')).toBeTruthy();
		expect(
			screen.getByRole('button', {
				name: 'Ordenar resultados, actual: Fecha más próxima'
			})
		).toBeTruthy();
	});

	it('abre las 6 opciones como radios con la actual marcada', async () => {
		await renderConTema(
			<SortSelector valor="precio-desc" alCambiar={() => {}} />,
			{
				scheme
			}
		);
		await fireEvent.press(
			screen.getByRole('button', { name: /^Ordenar resultados/ })
		);
		expect(screen.getByRole('header', { name: 'Ordenar por' })).toBeTruthy();
		const radios = screen.getAllByRole('radio');
		expect(radios).toHaveLength(6);
		const marcados = radios.filter((r) => r.props.accessibilityState?.checked);
		expect(marcados).toHaveLength(1);
		expect(marcados[0].props.accessibilityLabel).toBe('Precio mayor a menor');
	});

	it('elegir una opción llama alCambiar y cierra', async () => {
		const alCambiar = jest.fn();
		await renderConTema(
			<SortSelector valor="fecha-asc" alCambiar={alCambiar} />,
			{
				scheme
			}
		);
		await fireEvent.press(
			screen.getByRole('button', { name: /^Ordenar resultados/ })
		);
		await fireEvent.press(
			screen.getByRole('radio', { name: 'Precio menor a mayor' })
		);
		expect(alCambiar).toHaveBeenCalledWith('precio-asc');
		expect(screen.queryByRole('header', { name: 'Ordenar por' })).toBeNull();
	});
});
