/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen
} from 'expo-router/testing-library';
import * as eventoService from '../../src/services/eventoService';
import * as categoriaService from '../../src/services/categoriaService';
import * as usuarioService from '../../src/services/usuarioService';
import { ApiError } from '../../src/services/api';
import { COMPRADOR, crearAuthFalso } from '../helpers/authFalso';
import { crearEvento } from '../helpers/eventosEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(),
	obtenerEvento: jest.fn(() => new Promise(() => {}))
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn()
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarFavoritos: jest.fn(),
	agregarFavorito: jest.fn(),
	quitarFavorito: jest.fn()
}));

const APP = path.resolve(__dirname, '../../src/app');
const enDias = (n) => new Date(Date.now() + n * 86400000).toISOString();
const UNO = crearEvento({
	id: 'uno',
	nombre: 'Primero guardado',
	fecha: enDias(2)
});
const DOS = crearEvento({
	id: 'dos',
	nombre: 'Segundo guardado',
	fecha: enDias(4)
});

/** Monta la app real en Favoritos con un COMPRADOR. */
async function abrir() {
	mockAuth = crearAuthFalso({ usuario: COMPRADOR });
	await renderRouter(APP, { initialUrl: '/favoritos' });
	await act(async () => {});
}

describe('Favoritos — US4 (contracts/pantallas.md › /favoritos)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		eventoService.listarEventos.mockResolvedValue([]);
		categoriaService.listarCategorias.mockResolvedValue([]);
		usuarioService.listarFavoritos.mockResolvedValue([UNO, DOS]);
	});

	it('mientras carga muestra esqueletos', async () => {
		usuarioService.listarFavoritos.mockReturnValue(new Promise(() => {}));
		mockAuth = crearAuthFalso({ usuario: COMPRADOR });
		await renderRouter(APP, { initialUrl: '/favoritos' });
		expect(screen.getByLabelText('Cargando eventos')).toBeTruthy();
	});

	it('lista en orden de agregado con el corazón lleno', async () => {
		await abrir();
		const tarjetas = screen
			.getAllByRole('button', { name: /guardado,/ })
			.map((b) => b.props.accessibilityLabel.split(',')[0]);
		expect(tarjetas).toEqual(['Primero guardado', 'Segundo guardado']);
		expect(
			screen.getAllByRole('button', { name: 'Quitar de favoritos' })
		).toHaveLength(2);
	});

	it('desmarcar lo quita al instante', async () => {
		usuarioService.quitarFavorito.mockReturnValue(new Promise(() => {}));
		await abrir();
		await act(async () => {
			fireEvent.press(
				screen.getAllByRole('button', { name: 'Quitar de favoritos' })[0]
			);
		});
		expect(usuarioService.quitarFavorito).toHaveBeenCalledWith('uno');
		expect(screen.queryByText('Primero guardado')).toBeNull();
		expect(screen.getByText('Segundo guardado')).toBeTruthy();
	});

	it('vacío: mensaje y "Explorar eventos" lleva a Explorar (US4-3)', async () => {
		usuarioService.listarFavoritos.mockResolvedValue([]);
		await abrir();
		expect(
			screen.getByRole('header', { name: 'Todavía no tenés favoritos' })
		).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Explorar eventos' }));
		});
		expect(screen).toHavePathname('/explorar');
	});

	it('error → "Reintentar" vuelve a cargar', async () => {
		usuarioService.listarFavoritos.mockRejectedValue(new ApiError('x', 0));
		await abrir();
		expect(screen.getByRole('header', { name: 'Sin conexión' })).toBeTruthy();
		usuarioService.listarFavoritos.mockResolvedValue([UNO]);
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		expect(screen.getByText('Primero guardado')).toBeTruthy();
	});

	it('tocar una tarjeta abre el detalle', async () => {
		await abrir();
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: /^Segundo guardado,/ })
			);
		});
		expect(screen).toHavePathname('/evento/dos');
	});
});
