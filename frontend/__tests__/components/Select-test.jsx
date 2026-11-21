import React from 'react';
import { Text } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { Select } from '../../src/components/Select';
import { renderConTema } from '../helpers/renderConTema';

const OPCIONES = [
	{ clave: 'cat-rec', etiqueta: 'Recitales' },
	{ clave: 'cat-tea', etiqueta: 'Teatro' }
];

const montar = (props = {}, scheme = 'dark') =>
	renderConTema(
		<Select
			label="Categoría"
			valor={null}
			opciones={OPCIONES}
			placeholder="Elegí una categoría"
			required
			abierto={false}
			alAbrir={() => {}}
			alCerrar={() => {}}
			alElegir={() => {}}
			{...props}
		/>,
		{ scheme }
	);

describe('Select (contracts/componentes.md › Select)', () => {
	it.each(['dark', 'light'])(
		'cerrado muestra label y placeholder (%s)',
		async (scheme) => {
			await montar({}, scheme);
			expect(screen.getByText('Categoría')).toBeTruthy();
			expect(screen.getByText('Elegí una categoría')).toBeTruthy();
			expect(
				screen.getByRole('button', { name: 'Categoría, sin elegir' })
			).toBeTruthy();
		}
	);

	it('con valor muestra la etiqueta elegida y la usa en el nombre accesible', async () => {
		await montar({ valor: 'cat-tea' });
		expect(screen.getByText('Teatro')).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Categoría, Teatro' })
		).toBeTruthy();
	});

	it('muestra el error y lo expone como hint', async () => {
		await montar({ error: 'Elegí una categoría o creá una nueva.' });
		expect(
			screen.getByText('Elegí una categoría o creá una nueva.')
		).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Categoría, sin elegir' }).props
				.accessibilityHint
		).toBe('Elegí una categoría o creá una nueva.');
	});

	it('tocar el campo llama a alAbrir', async () => {
		const alAbrir = jest.fn();
		await montar({ alAbrir });
		await fireEvent.press(
			screen.getByRole('button', { name: 'Categoría, sin elegir' })
		);
		expect(alAbrir).toHaveBeenCalledTimes(1);
	});

	it('abierto muestra opciones como radio, el pie, y elegir llama a alElegir', async () => {
		const alElegir = jest.fn();
		await montar({
			abierto: true,
			valor: 'cat-rec',
			alElegir,
			pie: <Text>+ Crear categoría</Text>
		});
		const radios = screen.getAllByRole('radio');
		expect(radios).toHaveLength(2);
		expect(
			screen.getByRole('radio', { name: 'Recitales' }).props.accessibilityState
		).toEqual(expect.objectContaining({ checked: true }));
		expect(
			screen.getByRole('radio', { name: 'Teatro' }).props.accessibilityState
		).toEqual(expect.objectContaining({ checked: false }));
		expect(screen.getByText('+ Crear categoría')).toBeTruthy();
		await fireEvent.press(screen.getByRole('radio', { name: 'Teatro' }));
		expect(alElegir).toHaveBeenCalledWith('cat-tea');
	});

	it('con children reemplaza la lista dentro del sheet', async () => {
		await renderConTema(
			<Select
				label="Categoría"
				valor={null}
				opciones={OPCIONES}
				abierto
				alAbrir={() => {}}
				alCerrar={() => {}}
				alElegir={() => {}}
			>
				<Text>Formulario de alta</Text>
			</Select>
		);
		expect(screen.getByText('Formulario de alta')).toBeTruthy();
		expect(screen.queryAllByRole('radio')).toHaveLength(0);
	});
});
