import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { QuantityStepper } from '../../src/components/QuantityStepper';
import { renderConTema } from '../helpers/renderConTema';

const props = (extra = {}) => ({
	valor: 1,
	min: 1,
	max: 3,
	alCambiar: jest.fn(),
	etiqueta: 'Cantidad de Platea',
	...extra
});

describe.each(['dark', 'light'])('QuantityStepper (%s)', (scheme) => {
	it('el grupo lleva la etiqueta y el valor se anuncia', async () => {
		await renderConTema(<QuantityStepper {...props({ valor: 2 })} />, {
			scheme
		});
		expect(screen.getByLabelText('Cantidad de Platea')).toBeTruthy();
		const valor = screen.getByText('2');
		expect(valor.props.accessibilityLiveRegion).toBe('polite');
	});

	it('"−" deshabilitado en el mínimo; "+" suma uno', async () => {
		const p = props();
		await renderConTema(<QuantityStepper {...p} />, { scheme });
		expect(screen.getByRole('button', { name: 'Restar una' })).toBeDisabled();
		await fireEvent.press(screen.getByRole('button', { name: 'Restar una' }));
		expect(p.alCambiar).not.toHaveBeenCalled();
		await fireEvent.press(screen.getByRole('button', { name: 'Sumar una' }));
		expect(p.alCambiar).toHaveBeenCalledWith(2);
	});

	it('en el máximo "+" se deshabilita y aparece "Máximo N" (US3-2)', async () => {
		const p = props({ valor: 3 });
		await renderConTema(<QuantityStepper {...p} />, { scheme });
		expect(screen.getByRole('button', { name: 'Sumar una' })).toBeDisabled();
		expect(screen.getByText('Máximo 3')).toBeTruthy();
		await fireEvent.press(screen.getByRole('button', { name: 'Sumar una' }));
		expect(p.alCambiar).not.toHaveBeenCalled();
		await fireEvent.press(screen.getByRole('button', { name: 'Restar una' }));
		expect(p.alCambiar).toHaveBeenCalledWith(2);
	});

	it('debajo del máximo no muestra el hint', async () => {
		await renderConTema(<QuantityStepper {...props({ valor: 2 })} />, {
			scheme
		});
		expect(screen.queryByText(/^Máximo/)).toBeNull();
	});

	it('deshabilitado bloquea ambos botones', async () => {
		const p = props({ valor: 2, deshabilitado: true });
		await renderConTema(<QuantityStepper {...p} />, { scheme });
		expect(screen.getByRole('button', { name: 'Sumar una' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Restar una' })).toBeDisabled();
	});

	it('no permite tipear y los botones miden al menos 44', async () => {
		await renderConTema(<QuantityStepper {...props()} />, { scheme });
		expect(screen.queryByDisplayValue('1')).toBeNull();
		const mas = StyleSheet.flatten(
			screen.getByRole('button', { name: 'Sumar una' }).props.style
		);
		expect(mas.width).toBeGreaterThanOrEqual(44);
		expect(mas.height).toBeGreaterThanOrEqual(44);
	});
});
