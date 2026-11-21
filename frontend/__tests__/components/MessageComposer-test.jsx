import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { MessageComposer } from '../../src/components/MessageComposer';
import { getTheme } from '../../src/theme/theme';
import { renderConTema } from '../helpers/renderConTema';

const colores = (scheme) => getTheme(scheme).colors;

const montar = (props = {}, scheme = 'dark') =>
	renderConTema(
		<MessageComposer
			valor=""
			alCambiar={() => {}}
			alEnviar={() => {}}
			valido={false}
			largo={0}
			{...props}
		/>,
		{ scheme }
	);

const estilo = (nodo) =>
	[nodo.props.style].flat(Infinity).reduce((a, s) => ({ ...a, ...s }), {});

describe('MessageComposer (contracts/componentes.md › MessageComposer)', () => {
	it.each(['dark', 'light'])('placeholder por defecto (%s)', async (scheme) => {
		await montar({}, scheme);
		expect(screen.getByPlaceholderText('Escribí un mensaje')).toBeTruthy();
	});

	it('alCambiar recibe el texto', async () => {
		const alCambiar = jest.fn();
		await montar({ alCambiar });
		await fireEvent.changeText(
			screen.getByPlaceholderText('Escribí un mensaje'),
			'hola'
		);
		expect(alCambiar).toHaveBeenCalledWith('hola');
	});

	it('inválido: deshabilitado, con hint, y no envía', async () => {
		const alEnviar = jest.fn();
		await montar({ alEnviar });
		const boton = screen.getByRole('button', { name: 'Enviar mensaje' });
		expect(boton.props.accessibilityState).toEqual(
			expect.objectContaining({ disabled: true })
		);
		expect(boton.props.accessibilityHint).toBe(
			'Escribí un mensaje para enviar'
		);
		await fireEvent.press(boton);
		expect(alEnviar).not.toHaveBeenCalled();
	});

	it('válido: envía una vez', async () => {
		const alEnviar = jest.fn();
		await montar({ alEnviar, valido: true, valor: 'hola', largo: 4 });
		await fireEvent.press(
			screen.getByRole('button', { name: 'Enviar mensaje' })
		);
		expect(alEnviar).toHaveBeenCalledTimes(1);
	});

	it('ayuda visible con texto vacío o espacios, no con texto válido', async () => {
		await montar({ valor: '   ' });
		expect(screen.getByText('Escribí un mensaje para enviar')).toBeTruthy();
		await montar({ valor: 'hola', valido: true, largo: 4 });
		expect(screen.queryByText('Escribí un mensaje para enviar')).toBeNull();
	});

	it('con error muestra el error en lugar de la ayuda', async () => {
		await montar({
			valor: '',
			error: 'El mensaje no puede superar los 1000 caracteres.'
		});
		expect(screen.queryByText('Escribí un mensaje para enviar')).toBeNull();
		expect(
			screen.getByText('El mensaje no puede superar los 1000 caracteres.')
		).toBeTruthy();
	});

	it('contador desde 800', async () => {
		await montar({ valor: 'x', largo: 799, valido: true });
		expect(screen.queryByText('799/1000')).toBeNull();
		await montar({ valor: 'x', largo: 800, valido: true });
		expect(screen.getByText('800/1000')).toBeTruthy();
	});

	it.each(['dark', 'light'])(
		'con 1001 el contador va en error y el error en región polite (%s)',
		async (scheme) => {
			await montar(
				{
					valor: 'x',
					largo: 1001,
					error: 'El mensaje no puede superar los 1000 caracteres.'
				},
				scheme
			);
			expect(estilo(screen.getByText('1001/1000')).color).toBe(
				colores(scheme).error
			);
			expect(
				screen.getByText('El mensaje no puede superar los 1000 caracteres.')
					.props.accessibilityLiveRegion
			).toBe('polite');
		}
	);

	it('sin maxLength', async () => {
		await montar();
		expect(
			screen.getByPlaceholderText('Escribí un mensaje').props.maxLength
		).toBeUndefined();
	});
});
