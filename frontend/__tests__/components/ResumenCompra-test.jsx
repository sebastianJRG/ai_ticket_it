import React from 'react';
import { screen } from '@testing-library/react-native';
import { ResumenCompra } from '../../src/components/ResumenCompra';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('ResumenCompra (%s)', (scheme) => {
	it('muestra título, líneas y total', async () => {
		await renderConTema(
			<ResumenCompra
				titulo="Resumen"
				lineas={[
					{ etiqueta: 'Platea × 2', valor: '$ 80.000' },
					{ etiqueta: 'Precio unitario', valor: '$ 40.000' }
				]}
				total="$ 80.000"
			/>,
			{ scheme }
		);
		expect(screen.getByText('Resumen')).toBeTruthy();
		expect(screen.getByText('Platea × 2')).toBeTruthy();
		expect(screen.getByText('Precio unitario')).toBeTruthy();
		expect(screen.getByText('$ 40.000')).toBeTruthy();
		expect(screen.getByText('Total')).toBeTruthy();
		expect(screen.getAllByText('$ 80.000')).toHaveLength(2);
	});

	it('sin líneas muestra solo el total', async () => {
		await renderConTema(<ResumenCompra lineas={[]} total="Gratis" />, {
			scheme
		});
		expect(screen.getByText('Total')).toBeTruthy();
		expect(screen.getByText('Gratis')).toBeTruthy();
	});
});
