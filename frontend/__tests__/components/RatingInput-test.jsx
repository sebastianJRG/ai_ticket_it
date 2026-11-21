import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { RatingInput } from '../../src/components/RatingInput';
import { renderConTema } from '../helpers/renderConTema';

describe('RatingInput (contracts/componentes.md › RatingInput)', () => {
	it.each(['dark', 'light'])(
		'5 estrellas como radios; solo la elegida checked (%s)',
		async (scheme) => {
			await renderConTema(<RatingInput valor={4} alCambiar={() => {}} />, {
				scheme
			});
			const radios = screen.getAllByRole('radio');
			expect(radios).toHaveLength(5);
			expect(radios.map((r) => r.props.accessibilityState.checked)).toEqual([
				false,
				false,
				false,
				true,
				false
			]);
			expect(screen.getByLabelText('4 estrellas, Muy bueno')).toBeTruthy();
			expect(screen.getByLabelText('1 estrella, Malo')).toBeTruthy();
		}
	);

	it('tocar la tercera llama alCambiar(3)', async () => {
		const alCambiar = jest.fn();
		await renderConTema(<RatingInput valor={null} alCambiar={alCambiar} />);
		await fireEvent.press(screen.getByLabelText('3 estrellas, Bueno'));
		expect(alCambiar).toHaveBeenCalledWith(3);
	});

	it('muestra el caption del puntaje', async () => {
		await renderConTema(<RatingInput valor={5} alCambiar={() => {}} />);
		expect(screen.getByText('5/5 · Excelente')).toBeTruthy();
	});

	it('muestra el error', async () => {
		await renderConTema(
			<RatingInput
				valor={null}
				alCambiar={() => {}}
				error="Elegí de 1 a 5 estrellas"
			/>
		);
		expect(screen.getByText('Elegí de 1 a 5 estrellas')).toBeTruthy();
	});

	it('deshabilitado no llama alCambiar', async () => {
		const alCambiar = jest.fn();
		await renderConTema(
			<RatingInput valor={2} alCambiar={alCambiar} deshabilitado />
		);
		await fireEvent.press(screen.getByLabelText('5 estrellas, Excelente'));
		expect(alCambiar).not.toHaveBeenCalled();
	});

	it('cada estrella mide 52 × 52', async () => {
		await renderConTema(<RatingInput valor={null} alCambiar={() => {}} />);
		const estilo = screen.getAllByRole('radio')[0].props.style;
		expect(estilo).toEqual(expect.objectContaining({ width: 52, height: 52 }));
	});
});
