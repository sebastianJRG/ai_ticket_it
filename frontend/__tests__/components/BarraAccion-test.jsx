import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { screen } from '@testing-library/react-native';
import { BarraAccion } from '../../src/components/BarraAccion';
import { METRICAS, renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('BarraAccion (%s)', (scheme) => {
	it('renderiza sus hijos', async () => {
		await renderConTema(
			<BarraAccion>
				<Text>Comprar entradas</Text>
			</BarraAccion>,
			{ scheme }
		);
		expect(screen.getByText('Comprar entradas')).toBeTruthy();
	});

	it('suma el inset inferior de la safe area al padding', async () => {
		await renderConTema(
			<BarraAccion>
				<Text>CTA</Text>
			</BarraAccion>,
			{ scheme }
		);
		const barra = screen.getByTestId('barra-accion');
		const estilo = StyleSheet.flatten(barra.props.style);
		expect(estilo.paddingBottom).toBeGreaterThanOrEqual(METRICAS.insets.bottom);
	});
});
