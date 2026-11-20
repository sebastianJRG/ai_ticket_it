import React from 'react';
import {
	fireEvent,
	render,
	screen,
	waitFor
} from '@testing-library/react-native';
import Login from '../../src/app/(auth)/login';
import { ThemeProvider } from '../../src/theme/ThemeContext';
import { ApiError } from '../../src/services/api';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockIniciar = jest.fn();
let mockParams = {};
jest.mock('expo-router', () => ({
	useRouter: () => ({ replace: mockReplace, push: mockPush }),
	useLocalSearchParams: () => mockParams
}));
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => ({ iniciarSesion: mockIniciar })
}));

const montar = () =>
	render(
		<ThemeProvider scheme="dark">
			<Login />
		</ThemeProvider>
	);

const ingresar = async (usuario = 'ana') => {
	await fireEvent.changeText(
		screen.getByLabelText('Nombre de usuario'),
		usuario
	);
	await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1!');
	await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
};

describe('Login', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockParams = {};
	});

	it('inicia sesión con nombre de usuario y contraseña y entra a la app', async () => {
		mockIniciar.mockResolvedValue({ rol: 'COMPRADOR' });
		await montar();
		await fireEvent.changeText(
			screen.getByLabelText('Nombre de usuario'),
			'ana'
		);
		await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1!');
		await fireEvent.press(
			screen.getByRole('button', { name: 'Iniciar sesión' })
		);
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/explorar'));
		expect(mockIniciar).toHaveBeenCalledWith({
			nombreUsuario: 'ana',
			contrasenia: 'Abcdef1!'
		});
	});

	it('un ORGANIZADOR entra a Mis eventos', async () => {
		mockIniciar.mockResolvedValue({ rol: 'ORGANIZADOR' });
		await montar();
		await fireEvent.changeText(
			screen.getByLabelText('Nombre de usuario'),
			'bruno'
		);
		await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1!');
		await fireEvent.press(
			screen.getByRole('button', { name: 'Iniciar sesión' })
		);
		await waitFor(() =>
			expect(mockReplace).toHaveBeenCalledWith('/organizador/eventos')
		);
	});

	it('muestra error genérico ante credenciales incorrectas (401)', async () => {
		mockIniciar.mockRejectedValue(new ApiError('Credenciales inválidas.', 401));
		await montar();
		await fireEvent.changeText(
			screen.getByLabelText('Nombre de usuario'),
			'ana'
		);
		await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'mal');
		await fireEvent.press(
			screen.getByRole('button', { name: 'Iniciar sesión' })
		);
		expect(
			await screen.findByText('El usuario o la contraseña no coinciden.')
		).toBeTruthy();
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('muestra el mensaje de conexión si no hay red', async () => {
		mockIniciar.mockRejectedValue(
			new ApiError(
				'No pudimos conectar con el servidor. Revisá tu conexión.',
				0
			)
		);
		await montar();
		await fireEvent.changeText(
			screen.getByLabelText('Nombre de usuario'),
			'ana'
		);
		await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'x');
		await fireEvent.press(
			screen.getByRole('button', { name: 'Iniciar sesión' })
		);
		expect(await screen.findByText(/No pudimos conectar/)).toBeTruthy();
	});

	it('no envía si faltan campos', async () => {
		await montar();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Iniciar sesión' })
		);
		expect(mockIniciar).not.toHaveBeenCalled();
		expect(
			screen.getByText('El nombre de usuario no puede estar vacío.')
		).toBeTruthy();
	});

	it('navega a registro y a explorar sin cuenta', async () => {
		await montar();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Explorar eventos sin cuenta' })
		);
		expect(mockReplace).toHaveBeenCalledWith('/explorar');
		await fireEvent.press(
			screen.getByRole('link', { name: 'Creá una cuenta' })
		);
		expect(mockPush).toHaveBeenCalledWith('/registro');
	});

	describe('con volverA (US2)', () => {
		it('un COMPRADOR vuelve a la pantalla de origen (SC-003)', async () => {
			mockParams = { volverA: '/compras' };
			mockIniciar.mockResolvedValue({ rol: 'COMPRADOR' });
			await montar();
			await ingresar();
			await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/compras'));
		});

		it('un ORGANIZADOR que venía de una pantalla de comprador va a su sección (US2-3)', async () => {
			mockParams = { volverA: '/compras' };
			mockIniciar.mockResolvedValue({ rol: 'ORGANIZADOR' });
			await montar();
			await ingresar('bruno');
			await waitFor(() =>
				expect(mockReplace).toHaveBeenCalledWith('/organizador/eventos')
			);
		});

		it('ignora un volverA externo', async () => {
			mockParams = { volverA: 'https://evil.com' };
			mockIniciar.mockResolvedValue({ rol: 'COMPRADOR' });
			await montar();
			await ingresar();
			await waitFor(() =>
				expect(mockReplace).toHaveBeenCalledWith('/explorar')
			);
		});

		it('propaga volverA al ir a registro', async () => {
			mockParams = { volverA: '/compras' };
			await montar();
			await fireEvent.press(
				screen.getByRole('link', { name: 'Creá una cuenta' })
			);
			expect(mockPush).toHaveBeenCalledWith({
				pathname: '/registro',
				params: { volverA: '/compras' }
			});
		});
	});
});
