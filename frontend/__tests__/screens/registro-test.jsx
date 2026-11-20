import React from 'react';
import {
	fireEvent,
	render,
	screen,
	waitFor
} from '@testing-library/react-native';
import Registro from '../../src/app/(auth)/registro';
import { ThemeProvider } from '../../src/theme/ThemeContext';
import { ApiError } from '../../src/services/api';
import * as authService from '../../src/services/authService';

const mockReplace = jest.fn();
const mockIniciar = jest.fn();
let mockParams = {};
jest.mock('expo-router', () => ({
	useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
	useLocalSearchParams: () => mockParams
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
	beforeEach(() => {
		jest.clearAllMocks();
		mockParams = {};
	});

	it('registra un COMPRADOR por defecto, inicia sesión y entra', async () => {
		authService.registrar.mockResolvedValue({ id: '1' });
		mockIniciar.mockResolvedValue({ rol: 'COMPRADOR' });
		await montar();
		await llenar();
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/explorar'));
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
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		await waitFor(() => expect(authService.registrar).toHaveBeenCalled());
		expect(authService.registrar.mock.calls[0][0].rol).toBe('ORGANIZADOR');
		await waitFor(() =>
			expect(mockReplace).toHaveBeenCalledWith('/organizador/crear')
		);
	});

	it('no muestra checkbox de términos y registra sin marcar nada', async () => {
		authService.registrar.mockResolvedValue({ id: '1' });
		mockIniciar.mockResolvedValue({ rol: 'COMPRADOR' });
		await montar();
		expect(screen.queryByRole('checkbox')).toBeNull();
		await llenar();
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		await waitFor(() => expect(authService.registrar).toHaveBeenCalled());
	});

	it('valida la contraseña con un mensaje que explica cómo resolverla', async () => {
		await montar();
		await llenar('abc');
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
		await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
		expect(
			await screen.findByText('El nombre de usuario ya está en uso.')
		).toBeTruthy();
		expect(mockReplace).not.toHaveBeenCalled();
	});

	describe('con volverA (US2)', () => {
		it('un COMPRADOR vuelve a la pantalla de origen', async () => {
			mockParams = { volverA: '/favoritos' };
			authService.registrar.mockResolvedValue({ id: '1' });
			mockIniciar.mockResolvedValue({ rol: 'COMPRADOR' });
			await montar();
			await llenar();
			await fireEvent.press(
				screen.getByRole('button', { name: 'Crear cuenta' })
			);
			await waitFor(() =>
				expect(mockReplace).toHaveBeenCalledWith('/favoritos')
			);
		});

		it('un ORGANIZADOR ignora un volverA de comprador y va a Crear evento', async () => {
			mockParams = { volverA: '/favoritos' };
			authService.registrar.mockResolvedValue({ id: '1' });
			mockIniciar.mockResolvedValue({ rol: 'ORGANIZADOR' });
			await montar();
			await fireEvent.press(screen.getByRole('radio', { name: /organizar/ }));
			await llenar();
			await fireEvent.press(
				screen.getByRole('button', { name: 'Crear cuenta' })
			);
			await waitFor(() =>
				expect(mockReplace).toHaveBeenCalledWith('/organizador/crear')
			);
		});

		it('conserva volverA al volver a iniciar sesión', async () => {
			mockParams = { volverA: '/favoritos' };
			await montar();
			await fireEvent.press(
				screen.getByRole('link', { name: 'Iniciá sesión' })
			);
			expect(mockReplace).toHaveBeenCalledWith({
				pathname: '/login',
				params: { volverA: '/favoritos' }
			});
		});
	});
});
