import React from 'react';
import { screen } from '@testing-library/react-native';
import { StatusTimeline } from '../../src/components/StatusTimeline';
import { renderConTema } from '../helpers/renderConTema';

const PASOS = [
	{ estado: 'PENDIENTE', situacion: 'hecho' },
	{ estado: 'CONFIRMADA', situacion: 'actual' },
	{ estado: 'UTILIZADA', situacion: 'pendiente' }
];

describe('StatusTimeline (contracts/componentes.md › StatusTimeline)', () => {
	it.each(['dark', 'light'])(
		'un nodo por paso, en orden, con el texto corto (%s)',
		async (scheme) => {
			await renderConTema(<StatusTimeline pasos={PASOS} />, { scheme });
			const nodos = screen.getAllByTestId(/^paso-/);
			expect(nodos.map((n) => n.props.testID)).toEqual([
				'paso-PENDIENTE',
				'paso-CONFIRMADA',
				'paso-UTILIZADA'
			]);
			expect(screen.getByText('Pendiente')).toBeTruthy();
			expect(screen.getByText('Confirmada')).toBeTruthy();
			expect(screen.getByText('Utilizada')).toBeTruthy();
		}
	);

	it('el paso actual se anuncia como estado actual', async () => {
		await renderConTema(<StatusTimeline pasos={PASOS} />);
		expect(screen.getByLabelText('Confirmada, estado actual')).toBeTruthy();
		expect(screen.getByLabelText('Pendiente, completado')).toBeTruthy();
		expect(screen.getByLabelText('Utilizada, pendiente')).toBeTruthy();
	});

	it('los pasos pendientes se atenúan', async () => {
		await renderConTema(<StatusTimeline pasos={PASOS} />);
		expect(screen.getByTestId('paso-UTILIZADA').props.style).toEqual(
			expect.objectContaining({ opacity: 0.4 })
		);
		expect(screen.getByTestId('paso-CONFIRMADA').props.style).toEqual(
			expect.objectContaining({ opacity: 1 })
		);
	});

	it('sin pasos no rompe', async () => {
		await renderConTema(<StatusTimeline pasos={[]} />);
		expect(screen.queryAllByTestId(/^paso-/)).toHaveLength(0);
	});
});
