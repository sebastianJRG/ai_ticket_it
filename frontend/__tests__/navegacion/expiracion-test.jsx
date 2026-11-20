/* global __dirname */
import path from 'path';
import { act, renderRouter, screen } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';
import { configurarSesion } from '../../src/services/api';
import { COMPRADOR } from '../helpers/authFalso';

jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn()
}));
jest.mock('../../src/services/api', () => ({
	configurarSesion: jest.fn(),
	cliente: {},
	ApiError: class ApiError extends Error {}
}));

const APP = path.resolve(__dirname, '../../src/app');

/** Último proveedor registrado por AuthProvider. */
const proveedor = () =>
	configurarSesion.mock.calls
		.map(([p]) => p)
		.filter(Boolean)
		.at(-1);

describe('Sesión expirada en la app real (FR-006, US3-3)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		SecureStore.getItemAsync.mockResolvedValue(
			JSON.stringify({
				accessToken: 'a',
				refreshToken: 'r',
				usuario: COMPRADOR
			})
		);
	});

	it('avisa con un toast y deja la app como visitante', async () => {
		await renderRouter(APP, { initialUrl: '/compras' });
		expect(
			await screen.findByRole('header', { name: 'Mis compras' })
		).toBeTruthy();
		await act(() => proveedor().alExpirar());
		expect(await screen.findByText('Tu sesión expiró')).toBeTruthy();
		expect(
			screen.getByText('Iniciá sesión de nuevo para continuar.')
		).toBeTruthy();
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/compras' });
	});
});
