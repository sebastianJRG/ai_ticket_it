import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { AppHeader } from '../../src/components/AppHeader';
import { renderConTema, METRICAS } from '../helpers/renderConTema';

const acciones = [
	{ icono: 'Share2', label: 'Compartir', alPresionar: jest.fn() },
	{ icono: 'Heart', label: 'Guardar en favoritos', alPresionar: jest.fn() },
	{ icono: 'Ellipsis', label: 'Más', alPresionar: jest.fn() }
];

describe.each(['dark', 'light'])('AppHeader (%s)', (scheme) => {
	beforeEach(() => jest.clearAllMocks());

	it('default: título como encabezado, subtítulo y alto 56 + safe area', async () => {
		await renderConTema(
			<AppHeader titulo="Comprar entradas" subtitulo="Divididos — Gira 2027" />,
			{ scheme }
		);
		expect(
			screen.getByRole('header', { name: 'Comprar entradas' })
		).toBeTruthy();
		expect(screen.getByText('Divididos — Gira 2027')).toBeTruthy();
		const estilo = StyleSheet.flatten(
			screen.getByTestId('app-header').props.style
		);
		expect(estilo.height).toBe(56 + METRICAS.insets.top);
	});

	it('default: muestra "Volver" solo si alVolver es una función', async () => {
		const alVolver = jest.fn();
		await renderConTema(<AppHeader titulo="Detalle" alVolver={alVolver} />, {
			scheme
		});
		await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
		expect(alVolver).toHaveBeenCalledTimes(1);
	});

	it('default: sin alVolver no hay botón Volver', async () => {
		await renderConTema(<AppHeader titulo="Detalle" />, { scheme });
		expect(screen.queryByRole('button', { name: 'Volver' })).toBeNull();
	});

	it('large: título grande como encabezado y sin Volver', async () => {
		await renderConTema(
			<AppHeader variante="large" titulo="Mis compras" alVolver={jest.fn()} />,
			{ scheme }
		);
		expect(screen.getByRole('header', { name: 'Mis compras' })).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Volver' })).toBeNull();
	});

	it('transparent: no muestra el título', async () => {
		await renderConTema(
			<AppHeader
				variante="transparent"
				titulo="Divididos"
				alVolver={jest.fn()}
			/>,
			{ scheme }
		);
		expect(screen.queryByText('Divididos')).toBeNull();
		expect(screen.getByRole('button', { name: 'Volver' })).toBeTruthy();
	});

	it('renderiza como máximo 2 acciones con su label', async () => {
		await renderConTema(<AppHeader titulo="Evento" acciones={acciones} />, {
			scheme
		});
		expect(screen.getByRole('button', { name: 'Compartir' })).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Guardar en favoritos' })
		).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Más' })).toBeNull();
		await fireEvent.press(screen.getByRole('button', { name: 'Compartir' }));
		expect(acciones[0].alPresionar).toHaveBeenCalledTimes(1);
	});
});
