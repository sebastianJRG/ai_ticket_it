import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { Tabs } from '../../src/components/Tabs';
import { renderConTema } from '../helpers/renderConTema';

const PESTANAS = [
	{ clave: 'activas', etiqueta: 'Activas', contador: 2 },
	{ clave: 'pasadas', etiqueta: 'Pasadas', contador: 0 },
	{ clave: 'canceladas', etiqueta: 'Canceladas', contador: 5 }
];

describe('Tabs (contracts/componentes.md › Tabs)', () => {
	it.each(['dark', 'light'])(
		'renderiza etiquetas y contadores (%s)',
		async (scheme) => {
			await renderConTema(
				<Tabs
					pestanas={PESTANAS}
					seleccionada="activas"
					alCambiar={() => {}}
				/>,
				{ scheme }
			);
			expect(screen.getByText('Activas')).toBeTruthy();
			expect(screen.getByText('Pasadas')).toBeTruthy();
			expect(screen.getByText('Canceladas')).toBeTruthy();
			expect(screen.getByText('2')).toBeTruthy();
			expect(screen.getByText('0')).toBeTruthy();
			expect(screen.getByText('5')).toBeTruthy();
		}
	);

	it('expone tablist y cada tab con su estado seleccionado y label con contador', async () => {
		await renderConTema(
			<Tabs pestanas={PESTANAS} seleccionada="pasadas" alCambiar={() => {}} />
		);
		expect(screen.getByTestId('tabs').props.accessibilityRole).toBe('tablist');
		const tabs = screen.getAllByRole('tab');
		expect(tabs).toHaveLength(3);
		const activas = screen.getByLabelText('Activas, 2');
		const pasadas = screen.getByLabelText('Pasadas, 0');
		expect(activas.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: false })
		);
		expect(pasadas.props.accessibilityState).toEqual(
			expect.objectContaining({ selected: true })
		);
	});

	it('sin contador el label es solo la etiqueta', async () => {
		await renderConTema(
			<Tabs
				variante="segmented"
				pestanas={[
					{ clave: 'detalle', etiqueta: 'Detalle' },
					{ clave: 'chat', etiqueta: 'Chat' }
				]}
				seleccionada="detalle"
				alCambiar={() => {}}
			/>
		);
		expect(screen.getByLabelText('Detalle')).toBeTruthy();
		expect(screen.getByLabelText('Chat')).toBeTruthy();
		expect(screen.getAllByRole('tab')).toHaveLength(2);
	});

	it.each(['underline', 'segmented'])(
		'tocar una pestaña llama alCambiar (%s)',
		async (variante) => {
			const alCambiar = jest.fn();
			await renderConTema(
				<Tabs
					variante={variante}
					pestanas={PESTANAS}
					seleccionada="activas"
					alCambiar={alCambiar}
				/>
			);
			await fireEvent.press(screen.getByText('Canceladas'));
			expect(alCambiar).toHaveBeenCalledWith('canceladas');
		}
	);
});
