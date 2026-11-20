import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { PantallaPerfil } from '../../src/pantallas/PantallaPerfil';
import { ToastProvider } from '../../src/feedback/ToastContext';
import * as usuarioService from '../../src/services/usuarioService';
import { ApiError } from '../../src/services/api';
import { COMPRADOR, ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { renderConTema } from '../helpers/renderConTema';

let mockAuth;
const mockReplace = jest.fn();
jest.mock('../../src/auth/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('expo-router', () => ({
	useRouter: () => ({ replace: mockReplace })
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn()
}));

const montar = (usuario = COMPRADOR, scheme = 'dark') => {
	mockAuth = crearAuthFalso({ usuario });
	return renderConTema(
		<ToastProvider>
			<PantallaPerfil />
		</ToastProvider>,
		{ scheme }
	);
};

describe('PantallaPerfil', () => {
	beforeEach(() => jest.clearAllMocks());

	it('muestra el estado de carga mientras pide el perfil', async () => {
		let resolver;
		usuarioService.obtenerPerfil.mockReturnValue(
			new Promise((r) => (resolver = r))
		);
		await montar();
		expect(screen.getByTestId('perfil-cargando')).toBeTruthy();
		await act(async () => resolver({ ...COMPRADOR, nombre: 'Ana María' }));
		expect(screen.queryByTestId('perfil-cargando')).toBeNull();
		expect(screen.getByText('Ana María')).toBeTruthy();
	});

	it.each([
		['dark', COMPRADOR, 'Comprador'],
		['light', ORGANIZADOR, 'Organizador']
	])(
		'(%s) muestra nombre, apellido, @usuario y rol del servidor (US3-1)',
		async (scheme, usuario, rol) => {
			usuarioService.obtenerPerfil.mockResolvedValue({
				...usuario,
				permissions: []
			});
			await montar(usuario, scheme);
			expect(await screen.findByText(usuario.nombre)).toBeTruthy();
			expect(screen.getByText(usuario.apellido)).toBeTruthy();
			expect(screen.getByText(`@${usuario.nombreUsuario}`)).toBeTruthy();
			expect(screen.getByText(rol)).toBeTruthy();
			expect(screen.getByRole('header', { name: 'Perfil' })).toBeTruthy();
		}
	);

	it('sin conexión usa los datos de la sesión y ofrece reintentar', async () => {
		usuarioService.obtenerPerfil
			.mockRejectedValueOnce(new ApiError('Sin conexión', 0))
			.mockResolvedValueOnce({ ...COMPRADOR, nombre: 'Ana Actualizada' });
		await montar();
		expect(
			await screen.findByText('No pudimos actualizar tu perfil')
		).toBeTruthy();
		expect(screen.getByText('Ana')).toBeTruthy();
		await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		expect(await screen.findByText('Ana Actualizada')).toBeTruthy();
		expect(usuarioService.obtenerPerfil).toHaveBeenCalledTimes(2);
	});

	it('ante 404 avisa, cierra la sesión y vuelve a Explorar', async () => {
		usuarioService.obtenerPerfil.mockRejectedValue(
			new ApiError('No existe', 404)
		);
		await montar();
		expect(await screen.findByText('Tu cuenta ya no existe')).toBeTruthy();
		expect(mockAuth.cerrarSesion).toHaveBeenCalled();
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/explorar'));
	});

	it('otro error usa los datos de la sesión y avisa con el mensaje', async () => {
		usuarioService.obtenerPerfil.mockRejectedValue(
			new ApiError('Ocurrió un error inesperado.', 500)
		);
		await montar();
		expect(
			await screen.findByText('Ocurrió un error inesperado.')
		).toBeTruthy();
		expect(screen.getByTestId('toast').props.accessibilityRole).toBe('alert');
		expect(screen.getByText('@ana')).toBeTruthy();
	});

	it('cerrar sesión borra la sesión y vuelve a Explorar (US3-2)', async () => {
		usuarioService.obtenerPerfil.mockResolvedValue(COMPRADOR);
		await montar();
		await screen.findByText('Ana');
		await fireEvent.press(
			screen.getByRole('button', { name: 'Cerrar sesión' })
		);
		expect(mockAuth.cerrarSesion).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/explorar'));
	});
});
