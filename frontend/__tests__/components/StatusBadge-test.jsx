import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusBadge } from '../../src/components/StatusBadge';
import { ThemeProvider } from '../../src/theme/ThemeContext';

const setup = async (props) =>
	render(
		<ThemeProvider scheme="dark">
			<StatusBadge {...props} />
		</ThemeProvider>
	);

describe('StatusBadge', () => {
	it.each([
		['PENDIENTE', 'Pendiente de pago'],
		['CONFIRMADA', 'Confirmada'],
		['UTILIZADA', 'Utilizada'],
		['CANCELADA', 'Cancelada'],
		['REEMBOLSADA', 'Reembolsada']
	])('%s muestra el texto "%s"', async (status, text) => {
		await setup({ status });
		expect(screen.getByText(text)).toBeTruthy();
	});

	it('CONFIRMADA con daysLeft agrega la cuenta regresiva', async () => {
		await setup({ status: 'CONFIRMADA', daysLeft: 5 });
		expect(screen.getByText('Confirmada · faltan 5 días')).toBeTruthy();
	});

	it('CONFIRMADA: es mañana / es hoy', async () => {
		await setup({ status: 'CONFIRMADA', daysLeft: 1 });
		expect(screen.getByText('Confirmada · es mañana')).toBeTruthy();
	});

	it('daysLeft se ignora en otros estados', async () => {
		await setup({ status: 'PENDIENTE', daysLeft: 5 });
		expect(screen.queryByText(/faltan/)).toBeNull();
	});

	it('se anuncia con el texto completo', async () => {
		await setup({ status: 'CONFIRMADA', daysLeft: 25 });
		expect(screen.getByLabelText('Confirmada, faltan 25 días')).toBeTruthy();
	});

	it('size sm usa el texto corto', async () => {
		await render(
			<ThemeProvider scheme="dark">
				<StatusBadge status="PENDIENTE" size="sm" />
			</ThemeProvider>
		);
		expect(screen.getByText('Pendiente')).toBeTruthy();
	});
});
