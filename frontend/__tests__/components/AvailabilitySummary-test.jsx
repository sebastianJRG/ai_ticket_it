import React from 'react';
import { screen } from '@testing-library/react-native';
import { AvailabilitySummary } from '../../src/components/AvailabilitySummary';
import { resumenDisponibilidad } from '../../src/compras/gestionCompras';
import { formatPrice } from '../../src/theme/format';
import { renderConTema } from '../helpers/renderConTema';
import { DISPONIBILIDAD_EJEMPLO } from '../helpers/comprasEjemplo';

const RESUMEN = resumenDisponibilidad(DISPONIBILIDAD_EJEMPLO);

describe('AvailabilitySummary (contracts/componentes.md)', () => {
	it.each(['dark', 'light'])(
		'muestra totales y cada tipo (%s)',
		async (scheme) => {
			await renderConTema(<AvailabilitySummary resumen={RESUMEN} />, {
				scheme
			});
			expect(screen.getByText('Vendidas 199 de 220 (90%)')).toBeTruthy();
			expect(screen.getByText('General')).toBeTruthy();
			expect(screen.getByText(formatPrice(32000))).toBeTruthy();
			expect(screen.getByText('89 / 100')).toBeTruthy();
			expect(screen.getByText('Quedan 11')).toBeTruthy();
			expect(screen.getByText('Quedan 10')).toBeTruthy();
			expect(screen.getByText('Agotado')).toBeTruthy();
		}
	);

	it('cada barra es un progressbar con valor y etiqueta accesibles', async () => {
		await renderConTema(<AvailabilitySummary resumen={RESUMEN} />);
		const barras = screen.getAllByRole('progressbar');
		expect(barras).toHaveLength(3);
		const platea = screen.getByLabelText(
			'Platea: 90 de 100 vendidas, quedan 10'
		);
		expect(platea.props.accessibilityValue).toEqual(
			expect.objectContaining({ min: 0, max: 100, now: 90 })
		);
		expect(
			screen.getByLabelText('VIP: 20 de 20 vendidas, agotado')
		).toBeTruthy();
	});
});
