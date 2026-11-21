import React from 'react';
import { screen } from '@testing-library/react-native';
import { Rating } from '../../src/components/Rating';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('Rating compact (%s)', (scheme) => {
	it('muestra el valor con coma y un decimal', async () => {
		await renderConTema(<Rating valor={4.666} />, { scheme });
		expect(screen.getByText('4,7')).toBeTruthy();
		expect(
			screen.getByLabelText('Puntaje del organizador 4,7 de 5')
		).toBeTruthy();
	});

	it('con nombre lo muestra', async () => {
		await renderConTema(<Rating valor={4} nombre="Bruno Pérez" />, { scheme });
		expect(screen.getByText(/Bruno Pérez/)).toBeTruthy();
	});

	it('sin puntaje muestra "Sin reseñas"', async () => {
		await renderConTema(<Rating valor={null} nombre="Bruno Pérez" />, {
			scheme
		});
		expect(screen.getByText(/Sin reseñas/)).toBeTruthy();
		expect(screen.getByLabelText(/Organizador sin reseñas/)).toBeTruthy();
	});
});
