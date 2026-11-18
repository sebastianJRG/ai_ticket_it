import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import * as authService from '../src/services/authService';

jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn()
}));
jest.mock('../src/services/authService');

let auth;
function Sonda() {
	auth = useAuth();
	return (
		<Text>
			{auth.cargando
				? 'cargando'
				: auth.usuario
					? auth.usuario.nombreUsuario
					: 'anonimo'}
		</Text>
	);
}
const montar = () =>
	render(
		<AuthProvider>
			<Sonda />
		</AuthProvider>
	);

describe('AuthContext', () => {
	beforeEach(() => jest.clearAllMocks());

	it('arranca anónimo si no hay sesión guardada', async () => {
		SecureStore.getItemAsync.mockResolvedValue(null);
		montar();
		await waitFor(() => expect(screen.getByText('anonimo')).toBeTruthy());
	});

	it('restaura la sesión guardada', async () => {
		SecureStore.getItemAsync.mockResolvedValue(
			JSON.stringify({
				accessToken: 'a',
				refreshToken: 'r',
				usuario: { nombreUsuario: 'ana' }
			})
		);
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
	});

	it('iniciarSesion guarda la sesión y expone el usuario', async () => {
		SecureStore.getItemAsync.mockResolvedValue(null);
		authService.login.mockResolvedValue({
			accessToken: 'a',
			refreshToken: 'r',
			usuario: { nombreUsuario: 'ana', rol: 'COMPRADOR' }
		});
		montar();
		await waitFor(() => expect(screen.getByText('anonimo')).toBeTruthy());
		await act(() =>
			auth.iniciarSesion({ nombreUsuario: 'ana', contrasenia: 'x' })
		);
		expect(SecureStore.setItemAsync).toHaveBeenCalled();
		expect(screen.getByText('ana')).toBeTruthy();
	});

	it('cerrarSesion limpia el estado aunque falle el backend', async () => {
		SecureStore.getItemAsync.mockResolvedValue(
			JSON.stringify({
				accessToken: 'a',
				refreshToken: 'r',
				usuario: { nombreUsuario: 'ana' }
			})
		);
		authService.cerrarSesion.mockRejectedValue(new Error('x'));
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		await act(() => auth.cerrarSesion());
		expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
		expect(screen.getByText('anonimo')).toBeTruthy();
	});
});
