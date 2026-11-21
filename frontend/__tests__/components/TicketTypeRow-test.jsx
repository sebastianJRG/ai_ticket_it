import React from 'react';
import { Text } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { TicketTypeRow } from '../../src/components/TicketTypeRow';
import { renderConTema } from '../helpers/renderConTema';

const BASE = {
	nombre: 'Platea',
	descripcion: 'Sentado',
	precioTexto: '$ 40.000'
};

describe.each(['dark', 'light'])('TicketTypeRow (%s)', (scheme) => {
	describe('informativo (detalle)', () => {
		it('muestra nombre, descripción y precio, sin rol radio', async () => {
			await renderConTema(<TicketTypeRow {...BASE} interactive={false} />, {
				scheme
			});
			expect(screen.getByText('Platea')).toBeTruthy();
			expect(screen.getByText('Sentado')).toBeTruthy();
			expect(screen.getByText('$ 40.000')).toBeTruthy();
			expect(screen.queryByRole('radio')).toBeNull();
		});

		it('muestra el texto del cupo disponible (corrección 2)', async () => {
			await renderConTema(
				<TicketTypeRow
					{...BASE}
					interactive={false}
					cupoTexto="Quedan 5 entradas"
				/>,
				{ scheme }
			);
			expect(screen.getByText('Quedan 5 entradas')).toBeTruthy();
		});

		it('agotado muestra "Agotado" y "Sin cupo"', async () => {
			await renderConTema(
				<TicketTypeRow {...BASE} interactive={false} agotado />,
				{ scheme }
			);
			expect(screen.getByText('Agotado')).toBeTruthy();
			expect(screen.getByText('Sin cupo')).toBeTruthy();
		});

		it('sin descripción no renderiza texto vacío', async () => {
			await renderConTema(
				<TicketTypeRow {...BASE} descripcion="" interactive={false} />,
				{ scheme }
			);
			expect(screen.queryByText('')).toBeNull();
		});
	});

	describe('interactivo (checkout)', () => {
		it('es un radio con label "<nombre>, <precio>" y estado checked', async () => {
			await renderConTema(
				<TicketTypeRow {...BASE} interactive seleccionado />,
				{
					scheme
				}
			);
			const radio = screen.getByRole('radio', { name: 'Platea, $ 40.000' });
			expect(radio).toBeChecked();
		});

		it('no seleccionado → no checked; tocarlo llama alSeleccionar', async () => {
			const alSeleccionar = jest.fn();
			await renderConTema(
				<TicketTypeRow {...BASE} interactive alSeleccionar={alSeleccionar} />,
				{ scheme }
			);
			const radio = screen.getByRole('radio', { name: 'Platea, $ 40.000' });
			expect(radio).not.toBeChecked();
			await fireEvent.press(radio);
			expect(alSeleccionar).toHaveBeenCalledTimes(1);
		});

		it('agotado: label con ", agotado", deshabilitado y no llama alSeleccionar', async () => {
			const alSeleccionar = jest.fn();
			await renderConTema(
				<TicketTypeRow
					{...BASE}
					interactive
					agotado
					alSeleccionar={alSeleccionar}
				/>,
				{ scheme }
			);
			const radio = screen.getByRole('radio', {
				name: 'Platea, $ 40.000, agotado'
			});
			expect(radio).toBeDisabled();
			await fireEvent.press(radio);
			expect(alSeleccionar).not.toHaveBeenCalled();
		});

		it('deshabilitado no llama alSeleccionar', async () => {
			const alSeleccionar = jest.fn();
			await renderConTema(
				<TicketTypeRow
					{...BASE}
					interactive
					deshabilitado
					alSeleccionar={alSeleccionar}
				/>,
				{ scheme }
			);
			await fireEvent.press(screen.getByRole('radio'));
			expect(alSeleccionar).not.toHaveBeenCalled();
		});

		it('no seleccionado no renderiza los children', async () => {
			await renderConTema(
				<TicketTypeRow {...BASE} interactive>
					<Text>stepper</Text>
				</TicketTypeRow>,
				{ scheme }
			);
			expect(screen.queryByText('stepper')).toBeNull();
		});

		it('seleccionado renderiza los children', async () => {
			await renderConTema(
				<TicketTypeRow {...BASE} interactive seleccionado>
					<Text>stepper</Text>
				</TicketTypeRow>,
				{ scheme }
			);
			expect(screen.getByText('stepper')).toBeTruthy();
		});
	});
});
