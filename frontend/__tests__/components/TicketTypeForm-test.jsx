import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { TicketTypeForm } from '../../src/components/TicketTypeForm';
import { renderConTema } from '../helpers/renderConTema';

const TIPO = {
	clave: 't2',
	nombre: 'Platea',
	descripcion: 'Sentado',
	precio: '1500',
	cupo: '100'
};

const montar = (props = {}, scheme = 'dark') =>
	renderConTema(
		<TicketTypeForm
			numero={2}
			tipo={TIPO}
			errores={{}}
			quitable
			alCambiar={() => {}}
			alPerderFoco={() => {}}
			alQuitar={() => {}}
			{...props}
		/>,
		{ scheme }
	);

describe('TicketTypeForm (contracts/componentes.md › TicketTypeForm)', () => {
	it.each(['dark', 'light'])(
		'muestra el número, los 4 campos y la ayuda de precio (%s)',
		async (scheme) => {
			await montar({}, scheme);
			expect(screen.getByText('Tipo de entrada 2')).toBeTruthy();
			expect(screen.getByLabelText('Nombre').props.value).toBe('Platea');
			expect(screen.getByLabelText('Descripción').props.value).toBe('Sentado');
			expect(screen.getByLabelText('Precio').props.value).toBe('1500');
			expect(screen.getByLabelText('Cupo').props.value).toBe('100');
			expect(screen.getByText('$')).toBeTruthy();
			expect(screen.getByText('0 = gratis')).toBeTruthy();
		}
	);

	it('muestra los errores por campo', async () => {
		await montar({
			errores: {
				precio: 'El precio no puede ser negativo.',
				cupo: 'El cupo tiene que ser un número entero mayor a 0.'
			}
		});
		expect(screen.getByText('El precio no puede ser negativo.')).toBeTruthy();
		expect(
			screen.getByText('El cupo tiene que ser un número entero mayor a 0.')
		).toBeTruthy();
	});

	it('avisa los cambios y la pérdida de foco por campo', async () => {
		const alCambiar = jest.fn();
		const alPerderFoco = jest.fn();
		await montar({ alCambiar, alPerderFoco });
		await fireEvent.changeText(screen.getByLabelText('Precio'), '100');
		expect(alCambiar).toHaveBeenCalledWith('precio', '100');
		await fireEvent(screen.getByLabelText('Cupo'), 'blur');
		expect(alPerderFoco).toHaveBeenCalledWith('cupo');
	});

	it('la papelera solo aparece si es quitable y llama a alQuitar', async () => {
		const alQuitar = jest.fn();
		await montar({ alQuitar });
		await fireEvent.press(
			screen.getByRole('button', { name: 'Quitar tipo de entrada 2' })
		);
		expect(alQuitar).toHaveBeenCalledTimes(1);
	});

	it('sin quitable no hay papelera', async () => {
		await montar({ quitable: false, numero: 1 });
		expect(
			screen.queryByRole('button', { name: 'Quitar tipo de entrada 1' })
		).toBeNull();
	});

	it('sugiere General, Platea o VIP como placeholder según el número', async () => {
		await montar({ numero: 1, tipo: { ...TIPO, nombre: '' } });
		expect(screen.getByLabelText('Nombre').props.placeholder).toBe('General');
	});
});
