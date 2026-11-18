import React from 'react';
import {
	fireEvent,
	render,
	screen,
	waitFor
} from '@testing-library/react-native';
import Registro from '../../src/app/registro';
import { ThemeProvider } from '../../src/theme/ThemeContext';
import { ApiError } from '../../src/services/api';
import * as authService from '../../src/services/authService';

const mockReplace = jest.fn();
const mockIniciar = jest.fn();
jest.mock('expo-router', () => ({
	useRouter: () => ({ replace: mockReplace, push: jest.fn() })
}));
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => ({ iniciarSesion: mockIniciar })
}));
jest.mock('../../src/services/authService', () => ({
	registrar: jest.fn()
}));

const montar = () =>
	render(
		<ThemeProvider scheme="dark">
			<Registro />
		</ThemeProvider>
	);

const llenar = async (contrasenia = 'Abcdef1!') => {
	await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana');
	await fireEvent.changeText(screen.getByLabelText('Apellido'), 'Paz');
	await fireEvent.changeText(screen.getByLabelText('Nombre de usuario'), 'ana');
	await fireEvent.changeText(screen.getByLabelText('Contraseña'), contrasenia);
};

describe('Registro', () => {
	beforeEach(() => jest.clearAllMocks());

	it('registra un COMPRADOR por defecto, inicia sesión y entra', async () => {
		authService.registrar.mockResolvedValue({ id: '1' });
		mockIniciar.mockResolvedValue({ rol: 'COMPRADOR' });
		await montar();
		await llenar();
		await fireEvent.press(screen.getByRole('checkbox'));
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
		expect(authService.registrar).toHaveBeenCalledWith({
			nombre: 'Ana',
			apellido: 'Paz',
			nombreUsuario: 'ana',
			contrasenia: 'Abcdef1!',
			rol: 'COMPRADOR'
		});
		expect(mockIniciar).toHaveBeenCalledWith({
			nombreUsuario: 'ana',
			contrasenia: 'Abcdef1!'
		});
	});

	it('envía ORGANIZADOR si se elige ese rol', async () => {
		authService.registrar.mockResolvedValue({ id: '1' });
		mockIniciar.mockResolvedValue({ rol: 'ORGANIZADOR' });
		await montar();
		await fireEvent.press(screen.getByRole('radio', { name: /organizar/ }));
		await llenar();
		await fireEvent.press(screen.getByRole('checkbox'));
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		await waitFor(() => expect(authService.registrar).toHaveBeenCalled());
		expect(authService.registrar.mock.calls[0][0].rol).toBe('ORGANIZADOR');
	});

	it('sin términos marca el error del checkbox y no envía', async () => {
		await montar();
		await llenar();
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		expect(
			screen.getByText('Aceptá los términos para crear tu cuenta.')
		).toBeTruthy();
		expect(authService.registrar).not.toHaveBeenCalled();
	});

	it('valida la contraseña con un mensaje que explica cómo resolverla', async () => {
		await montar();
		await llenar('abc');
		await fireEvent.press(screen.getByRole('checkbox'));
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		expect(screen.getByText('Usá al menos 8 caracteres.')).toBeTruthy();
		expect(authService.registrar).not.toHaveBeenCalled();
	});

	it('muestra el error del backend (nombre de usuario en uso)', async () => {
		authService.registrar.mockRejectedValue(
			new ApiError('El nombre de usuario ya está en uso.', 400)
		);
		await montar();
		await llenar();
		await fireEvent.press(screen.getByRole('checkbox'));
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		expect(
			await screen.findByText('El nombre de usuario ya está en uso.')
		).toBeTruthy();
		expect(mockReplace).not.toHaveBeenCalled();
	});
});
