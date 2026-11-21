import React from 'react';
import { Text } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { BottomSheet } from '../../src/components/BottomSheet';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('BottomSheet (%s)', (scheme) => {
	it('oculto no muestra el contenido', async () => {
		await renderConTema(
			<BottomSheet visible={false} titulo="Ordenar por" alCerrar={() => {}}>
				<Text>Contenido</Text>
			</BottomSheet>,
			{ scheme }
		);
		expect(screen.queryByText('Contenido')).toBeNull();
	});

	it('visible muestra título y contenido', async () => {
		await renderConTema(
			<BottomSheet visible titulo="Ordenar por" alCerrar={() => {}}>
				<Text>Contenido</Text>
			</BottomSheet>,
			{ scheme }
		);
		expect(screen.getByRole('header', { name: 'Ordenar por' })).toBeTruthy();
		expect(screen.getByText('Contenido')).toBeTruthy();
	});

	it('"Cerrar", el fondo y el back de Android llaman alCerrar', async () => {
		const alCerrar = jest.fn();
		await renderConTema(
			<BottomSheet visible titulo="Ordenar por" alCerrar={alCerrar}>
				<Text>Contenido</Text>
			</BottomSheet>,
			{ scheme }
		);
		await fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));
		await fireEvent.press(
			screen.getByTestId('bottom-sheet-fondo', { includeHiddenElements: true })
		);
		await fireEvent(screen.getByTestId('bottom-sheet'), 'requestClose');
		expect(alCerrar).toHaveBeenCalledTimes(3);
	});
});
