/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen
} from 'expo-router/testing-library';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { COMPRADOR, ORGANIZADOR } from '../helpers/authFalso';

jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(() => Promise.resolve()),
	deleteItemAsync: jest.fn(() => Promise.resolve())
}));
jest.mock('../../src/services/api', () => ({
	configurarSesion: jest.fn(),
	cliente: {},
	ApiError: class ApiError extends Error {}
}));
jest.mock('../../src/services/authService', () => ({
	login: jest.fn(),
	cerrarSesion: jest.fn(() => Promise.resolve())
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(),
	quitarFavorito: jest.fn()
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(() => Promise.resolve([])),
	obtenerEvento: jest.fn(() => new Promise(() => {})),
	obtenerComprasEvento: jest.fn(() => new Promise(() => {}))
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(() => Promise.resolve([]))
}));

const APP = path.resolve(__dirname, '../../src/app');

/** Mensajes de `console.error` sobre acciones de navegación sin manejar. */
const advertenciasNavegacion = (espia) =>
	espia.mock.calls
		.map((args) => String(args[0]))
		.filter((m) => m.includes('was not handled by any navigator'));

describe('Cerrar sesión en la app real (sin advertencias de navegación)', () => {
	let errores;

	beforeEach(() => {
		jest.clearAllMocks();
		errores = jest.spyOn(console, 'error');
	});

	afterEach(() => errores.mockRestore());

	it.each([
		['COMPRADOR', COMPRADOR, '/perfil'],
		['ORGANIZADOR', ORGANIZADOR, '/organizador/perfil']
	])(
		'%s: termina en /explorar como visitante',
		async (_rol, usuario, url) => {
			SecureStore.getItemAsync.mockResolvedValue(
				JSON.stringify({ accessToken: 'a', refreshToken: 'r', usuario })
			);
			await renderRouter(APP, { initialUrl: url });
			await act(async () => {});
			await act(async () => {});
			expect(screen).toHavePathname(url);
			await act(async () => {
				fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
			});
			// renderRouter usa timers falsos: corre los pasos diferidos de salir().
			for (let i = 0; i < 3; i += 1) {
				await act(async () => {
					await jest.runOnlyPendingTimersAsync();
				});
			}
			expect(screen).toHavePathname('/explorar');
			expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sesion');
			expect(advertenciasNavegacion(errores)).toEqual([]);
			// Terminado el cierre, la guardia vuelve a pedir sesión.
			await act(async () => {
				router.push('/compras');
			});
			await act(async () => {});
			expect(screen).toHavePathname('/login');
			expect(screen).toHaveSearchParams({ volverA: '/compras' });
		},
		30000
	);
});
