import React from 'react';
import { Platform, Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import * as authService from '../src/services/authService';
import { configurarSesion } from '../src/services/api';

jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn()
}));
jest.mock('../src/services/authService');
jest.mock('../src/services/api', () => ({
	configurarSesion: jest.fn(),
	ApiError: class ApiError extends Error {}
}));

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

describe('AuthContext — cierre voluntario (marca para las guardias)', () => {
	const GUARDADA = JSON.stringify({
		accessToken: 'a',
		refreshToken: 'r',
		usuario: { nombreUsuario: 'ana' }
	});

	beforeEach(() => {
		jest.clearAllMocks();
		SecureStore.getItemAsync.mockResolvedValue(GUARDADA);
		authService.cerrarSesion.mockResolvedValue();
	});

	it('arranca en false, cerrarSesion la activa y terminarCierre la apaga', async () => {
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		expect(auth.cierreVoluntario).toBe(false);
		await act(() => auth.cerrarSesion());
		expect(auth.cierreVoluntario).toBe(true);
		await act(async () => auth.terminarCierre());
		expect(auth.cierreVoluntario).toBe(false);
	});

	it('iniciarSesion la apaga', async () => {
		authService.login.mockResolvedValue({
			accessToken: 'a',
			refreshToken: 'r',
			usuario: { nombreUsuario: 'ana' }
		});
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		await act(() => auth.cerrarSesion());
		await act(() =>
			auth.iniciarSesion({ nombreUsuario: 'ana', contrasenia: 'x' })
		);
		expect(auth.cierreVoluntario).toBe(false);
	});

	it('la expiración no cuenta como cierre voluntario', async () => {
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		const proveedor = configurarSesion.mock.calls
			.map(([p]) => p)
			.filter(Boolean)
			.at(-1);
		await act(() => proveedor.alExpirar());
		expect(auth.usuario).toBeNull();
		expect(auth.cierreVoluntario).toBe(false);
	});
});

describe('AuthContext en web (sin SecureStore)', () => {
	const OS_ORIGINAL = Platform.OS;
	const LOCAL_ORIGINAL = globalThis.localStorage;
	let datos;

	beforeEach(() => {
		jest.clearAllMocks();
		Platform.OS = 'web';
		datos = new Map();
		globalThis.localStorage = {
			getItem: (k) => (datos.has(k) ? datos.get(k) : null),
			setItem: (k, v) => datos.set(k, String(v)),
			removeItem: (k) => datos.delete(k)
		};
		// Como el stub web de expo-secure-store (`export default {}`): falla si se usa.
		const noExiste = () => {
			throw new TypeError(
				'ExpoSecureStore.default.setValueWithKeyAsync is not a function'
			);
		};
		SecureStore.getItemAsync.mockImplementation(noExiste);
		SecureStore.setItemAsync.mockImplementation(noExiste);
		SecureStore.deleteItemAsync.mockImplementation(noExiste);
	});

	afterEach(() => {
		Platform.OS = OS_ORIGINAL;
		globalThis.localStorage = LOCAL_ORIGINAL;
		SecureStore.getItemAsync.mockReset();
		SecureStore.setItemAsync.mockReset();
		SecureStore.deleteItemAsync.mockReset();
	});

	it('iniciarSesion resuelve y guarda la sesión en localStorage', async () => {
		authService.login.mockResolvedValue({
			accessToken: 'a',
			refreshToken: 'r',
			usuario: { nombreUsuario: 'ana', rol: 'COMPRADOR' }
		});
		montar();
		await waitFor(() => expect(screen.getByText('anonimo')).toBeTruthy());
		let usuario;
		await act(async () => {
			usuario = await auth.iniciarSesion({
				nombreUsuario: 'ana',
				contrasenia: 'x'
			});
		});
		expect(usuario).toEqual({ nombreUsuario: 'ana', rol: 'COMPRADOR' });
		expect(screen.getByText('ana')).toBeTruthy();
		expect(JSON.parse(datos.get('sesion')).usuario.nombreUsuario).toBe('ana');
	});

	it('restaura la sesión de localStorage y cerrarSesion la borra', async () => {
		datos.set(
			'sesion',
			JSON.stringify({
				accessToken: 'a',
				refreshToken: 'r',
				usuario: { nombreUsuario: 'ana' }
			})
		);
		authService.cerrarSesion.mockResolvedValue();
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		await act(() => auth.cerrarSesion());
		expect(screen.getByText('anonimo')).toBeTruthy();
		expect(datos.has('sesion')).toBe(false);
	});
});

describe('AuthContext como proveedor de sesión', () => {
	beforeEach(() => jest.clearAllMocks());

	const GUARDADA = {
		accessToken: 'a',
		refreshToken: 'r',
		usuario: { nombreUsuario: 'ana' }
	};
	/** Último proveedor registrado con configurarSesion (distinto de null). */
	const proveedor = () =>
		configurarSesion.mock.calls
			.map(([p]) => p)
			.filter(Boolean)
			.at(-1);

	it('registra el proveedor al montar', async () => {
		SecureStore.getItemAsync.mockResolvedValue(null);
		montar();
		await waitFor(() => expect(screen.getByText('anonimo')).toBeTruthy());
		const p = proveedor();
		expect(typeof p.obtenerTokens).toBe('function');
		expect(typeof p.guardarTokens).toBe('function');
		expect(typeof p.alExpirar).toBe('function');
	});

	it('obtenerTokens devuelve null sin sesión', async () => {
		SecureStore.getItemAsync.mockResolvedValue(null);
		montar();
		await waitFor(() => expect(screen.getByText('anonimo')).toBeTruthy());
		expect(proveedor().obtenerTokens()).toBeNull();
	});

	it('obtenerTokens devuelve los tokens de la sesión restaurada', async () => {
		SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(GUARDADA));
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		expect(proveedor().obtenerTokens()).toEqual({
			accessToken: 'a',
			refreshToken: 'r'
		});
	});

	it('guardarTokens persiste la sesión rotada y obtenerTokens la devuelve', async () => {
		SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(GUARDADA));
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		const nueva = {
			accessToken: 'a2',
			refreshToken: 'r2',
			usuario: { nombreUsuario: 'ana' }
		};
		await act(() => proveedor().guardarTokens(nueva));
		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			'sesion',
			JSON.stringify(nueva)
		);
		expect(proveedor().obtenerTokens()).toEqual({
			accessToken: 'a2',
			refreshToken: 'r2'
		});
	});

	it('alExpirar cierra la sesión local sin llamar al logout del backend', async () => {
		SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(GUARDADA));
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		await act(() => proveedor().alExpirar());
		expect(screen.getByText('anonimo')).toBeTruthy();
		expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sesion');
		expect(authService.cerrarSesion).not.toHaveBeenCalled();
		expect(proveedor().obtenerTokens()).toBeNull();
	});

	it('alExpirar avisa a la UI una vez, después de limpiar la sesión (FR-006)', async () => {
		SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(GUARDADA));
		let borradoAlAvisar = null;
		const aviso = jest.fn(() => {
			borradoAlAvisar = SecureStore.deleteItemAsync.mock.calls.length > 0;
		});
		render(
			<AuthProvider alExpirar={aviso}>
				<Sonda />
			</AuthProvider>
		);
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		await act(() => proveedor().alExpirar());
		expect(aviso).toHaveBeenCalledTimes(1);
		expect(borradoAlAvisar).toBe(true);
		expect(screen.getByText('anonimo')).toBeTruthy();
	});

	it('alExpirar sin la prop de aviso no falla', async () => {
		SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(GUARDADA));
		montar();
		await waitFor(() => expect(screen.getByText('ana')).toBeTruthy());
		await act(() => proveedor().alExpirar());
		expect(screen.getByText('anonimo')).toBeTruthy();
	});

	it('quita el proveedor al desmontar', async () => {
		SecureStore.getItemAsync.mockResolvedValue(null);
		const { unmount } = await montar();
		await waitFor(() => expect(screen.getByText('anonimo')).toBeTruthy());
		await unmount();
		expect(configurarSesion).toHaveBeenLastCalledWith(null);
	});
});
