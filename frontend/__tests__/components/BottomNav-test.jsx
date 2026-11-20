import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { BottomNav } from '../../src/components/BottomNav';
import { TABS_COMPRADOR, TABS_ORGANIZADOR } from '../../src/navegacion/reglas';
import { renderConTema, METRICAS } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('BottomNav (%s)', (scheme) => {
	it('muestra las 5 pestañas del comprador en un tablist', async () => {
		await renderConTema(
			<BottomNav
				items={TABS_COMPRADOR}
				activo="explorar"
				alSeleccionar={() => {}}
			/>,
			{ scheme }
		);
		expect(screen.getByTestId('bottom-nav').props.accessibilityRole).toBe(
			'tablist'
		);
		expect(screen.getAllByRole('tab')).toHaveLength(5);
		for (const t of TABS_COMPRADOR)
			expect(screen.getByText(t.etiqueta)).toBeTruthy();
	});

	it('muestra las 4 pestañas del organizador', async () => {
		await renderConTema(
			<BottomNav
				items={TABS_ORGANIZADOR}
				activo="eventos"
				alSeleccionar={() => {}}
			/>,
			{ scheme }
		);
		expect(screen.getAllByRole('tab')).toHaveLength(4);
		for (const t of TABS_ORGANIZADOR)
			expect(screen.getByText(t.etiqueta)).toBeTruthy();
	});

	it('marca seleccionada solo la pestaña activa', async () => {
		await renderConTema(
			<BottomNav
				items={TABS_COMPRADOR}
				activo="compras"
				alSeleccionar={() => {}}
			/>,
			{ scheme }
		);
		const seleccionadas = screen
			.getAllByRole('tab')
			.filter((t) => t.props.accessibilityState?.selected);
		expect(seleccionadas).toHaveLength(1);
		expect(
			screen.getByRole('tab', { name: 'Compras' }).props.accessibilityState
		).toEqual(expect.objectContaining({ selected: true }));
	});

	it('al tocar una pestaña llama alSeleccionar con su clave', async () => {
		const alSeleccionar = jest.fn();
		await renderConTema(
			<BottomNav
				items={TABS_COMPRADOR}
				activo="explorar"
				alSeleccionar={alSeleccionar}
			/>,
			{ scheme }
		);
		await fireEvent.press(screen.getByRole('tab', { name: 'Favoritos' }));
		expect(alSeleccionar).toHaveBeenCalledWith('favoritos');
	});

	it('anuncia novedades en los ítems de dots', async () => {
		await renderConTema(
			<BottomNav
				items={TABS_ORGANIZADOR}
				activo="eventos"
				dots={['mensajes']}
				alSeleccionar={() => {}}
			/>,
			{ scheme }
		);
		expect(
			screen.getByRole('tab', { name: 'Mensajes, novedades' })
		).toBeTruthy();
		expect(screen.getByRole('tab', { name: 'Crear' })).toBeTruthy();
	});

	it('suma el safe area inferior al alto', async () => {
		await renderConTema(
			<BottomNav
				items={TABS_COMPRADOR}
				activo="explorar"
				alSeleccionar={() => {}}
			/>,
			{ scheme }
		);
		const estilo = StyleSheet.flatten(
			screen.getByTestId('bottom-nav').props.style
		);
		expect(estilo.height).toBe(64 + METRICAS.insets.bottom);
	});
});
