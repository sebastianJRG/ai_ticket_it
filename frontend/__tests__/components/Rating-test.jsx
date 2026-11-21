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

describe.each(['dark', 'light'])(
	'Rating estrellas (%s) — feature 005',
	(scheme) => {
		it('5 estrellas, valor con coma y cantidad entre paréntesis', async () => {
			await renderConTema(
				<Rating variante="estrellas" valor={4.6} cantidad={12} />,
				{ scheme }
			);
			expect(screen.getAllByTestId(/^estrella-/)).toHaveLength(5);
			expect(screen.getByText('4,6')).toBeTruthy();
			expect(screen.getByText('(12)')).toBeTruthy();
			expect(
				screen.getByLabelText('Puntaje 4,6 de 5, 12 reseñas')
			).toBeTruthy();
		});

		it('sin cantidad no muestra paréntesis', async () => {
			await renderConTema(<Rating variante="estrellas" valor={4} />, {
				scheme
			});
			expect(screen.queryByText(/^\(/)).toBeNull();
			expect(screen.getByLabelText('Puntaje 4,0 de 5')).toBeTruthy();
		});

		it('una sola reseña usa singular', async () => {
			await renderConTema(
				<Rating variante="estrellas" valor={5} cantidad={1} />,
				{ scheme }
			);
			expect(screen.getByLabelText('Puntaje 5,0 de 5, 1 reseña')).toBeTruthy();
		});
	}
);
