import React from 'react';
import { screen } from '@testing-library/react-native';
import { PantallaCarga } from '../../src/components/PantallaCarga';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('PantallaCarga (%s)', (scheme) => {
	it('se anuncia como carga de sesión y muestra la marca', async () => {
		await renderConTema(<PantallaCarga />, { scheme });
		expect(screen.getByLabelText('Cargando sesión')).toBeTruthy();
		expect(screen.getByText('Al Ticket It')).toBeTruthy();
	});

	it('no muestra campos de login', async () => {
		await renderConTema(<PantallaCarga />, { scheme });
		expect(screen.queryByText('Iniciar sesión')).toBeNull();
		expect(screen.queryByLabelText('Nombre de usuario')).toBeNull();
	});
});
