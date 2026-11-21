/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen,
	waitFor
} from 'expo-router/testing-library';
import * as eventoService from '../../src/services/eventoService';
import * as categoriaService from '../../src/services/categoriaService';
import * as usuarioService from '../../src/services/usuarioService';
import { ApiError } from '../../src/services/api';
import { COMPRADOR, crearAuthFalso } from '../helpers/authFalso';
import { CATEGORIAS, crearEvento } from '../helpers/eventosEjemplo';
import { diferido } from '../helpers/diferido';

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
const DIA = 86400000;
/** Fecha relativa a ahora (los eventos de la pantalla se comparan con el reloj real). */
const enDias = (n) => new Date(Date.now() + n * DIA).toISOString();

const PASADO = crearEvento({
	id: 'p1',
	nombre: 'Concierto pasado',
	fecha: enDias(-2)
});
const FUTUROS = [1, 2, 3, 4, 5, 6].map((n) =>
	crearEvento({
		id: `f${n}`,
		nombre: `Futuro ${n}`,
		fecha: enDias(n),
		categoria: n % 2 ? CATEGORIAS[0] : CATEGORIAS[1]
	})
);
const TEATRO = FUTUROS.filter((e) => e.categoria.id === 'cat-tea');

/**
 * Monta la app real en Explorar.
 * @param {object} [estado] Opciones de `crearAuthFalso`.
 * @returns {Promise<void>}
 */
async function abrir(estado) {
	mockAuth = crearAuthFalso(estado);
	await renderRouter(APP, { initialUrl: '/explorar' });
}

describe('Explorar — US1 (contracts/pantallas.md › /explorar)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		eventoService.listarEventos.mockResolvedValue([PASADO, ...FUTUROS]);
		categoriaService.listarCategorias.mockResolvedValue(CATEGORIAS);
		usuarioService.listarFavoritos.mockResolvedValue([]);
	});

	it('consulta eventos por fecha ascendente y las categorías', async () => {
		await abrir();
		await screen.findByText('Muy pronto');
		expect(eventoService.listarEventos).toHaveBeenCalledWith({
			sortBy: 'fecha',
			order: 'asc'
		});
		expect(categoriaService.listarCategorias).toHaveBeenCalled();
	});

	it('mientras carga muestra esqueletos (US1-3)', async () => {
		eventoService.listarEventos.mockReturnValue(new Promise(() => {}));
		await abrir();
		expect(screen.getByLabelText('Cargando eventos')).toBeTruthy();
	});

	it('"Todo" seleccionado, categorías, destacados y Muy pronto sin finalizados (US1-1, US1-4)', async () => {
		await abrir();
		await screen.findByText('Muy pronto');
		expect(
			screen.getByRole('tab', { name: 'Todo' }).props.accessibilityState
				.selected
		).toBe(true);
		for (const c of CATEGORIAS) {
			expect(screen.getByRole('tab', { name: c.nombre })).toBeTruthy();
		}
		expect(screen.getByText('Destacados')).toBeTruthy();
		expect(screen.queryByText('Concierto pasado')).toBeNull();
		// Futuro 1–5 en destacados y en Muy pronto; Futuro 6 solo en Muy pronto.
		expect(screen.getAllByText('Futuro 1')).toHaveLength(2);
		expect(screen.getAllByText('Futuro 6')).toHaveLength(1);
	});

	it('tocar una categoría filtra en el servidor, con esqueletos mientras llega (US1-2)', async () => {
		await abrir();
		await screen.findByText('Muy pronto');
		const respuesta = diferido();
		eventoService.listarEventos.mockReturnValueOnce(respuesta.promesa);
		await act(async () => {
			fireEvent.press(screen.getByRole('tab', { name: 'Teatro' }));
		});
		expect(eventoService.listarEventos).toHaveBeenLastCalledWith({
			categoriaId: 'cat-tea',
			sortBy: 'fecha',
			order: 'asc'
		});
		expect(screen.getByLabelText('Cargando eventos')).toBeTruthy();
		expect(screen.queryByText('Futuro 1')).toBeNull();
		await act(async () => respuesta.resolver(TEATRO));
		expect(screen.queryByText('Futuro 1')).toBeNull();
		expect(screen.getAllByText('Futuro 2').length).toBeGreaterThan(0);
	});

	it('sin categorías (o con error) solo muestra "Todo" y los eventos igual (edge)', async () => {
		categoriaService.listarCategorias.mockRejectedValue(new ApiError('x', 0));
		await abrir();
		await screen.findByText('Muy pronto');
		expect(
			screen.getAllByRole('tab', { name: /^(Todo|Recitales|Teatro|Stand-up)$/ })
		).toHaveLength(1);
		expect(screen.getAllByText('Futuro 1').length).toBeGreaterThan(0);
	});

	it('error de red → "Sin conexión" y "Reintentar" vuelve a consultar (edge)', async () => {
		eventoService.listarEventos.mockRejectedValueOnce(new ApiError('x', 0));
		await abrir();
		expect(
			await screen.findByRole('header', { name: 'Sin conexión' })
		).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		await screen.findByText('Muy pronto');
		expect(eventoService.listarEventos).toHaveBeenCalledTimes(2);
	});

	it('error del servidor → "No pudimos cargar los eventos"', async () => {
		eventoService.listarEventos.mockRejectedValueOnce(new ApiError('x', 500));
		await abrir();
		expect(
			await screen.findByRole('header', {
				name: 'No pudimos cargar los eventos'
			})
		).toBeTruthy();
	});

	it('sin eventos futuros → "No hay eventos próximos"', async () => {
		eventoService.listarEventos.mockResolvedValue([PASADO]);
		await abrir();
		expect(
			await screen.findByRole('header', { name: 'No hay eventos próximos' })
		).toBeTruthy();
	});

	it('la SearchBar lleva a Búsqueda (con la categoría elegida)', async () => {
		await abrir();
		await screen.findByText('Muy pronto');
		await act(async () => {
			fireEvent.press(screen.getByRole('tab', { name: 'Teatro' }));
		});
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Buscar eventos' }));
		});
		expect(screen).toHavePathname('/buscar');
		expect(screen).toHaveSearchParams({ categoriaId: 'cat-tea' });
	});

	it('tocar una tarjeta abre el detalle (FR-006)', async () => {
		await abrir();
		await screen.findByText('Muy pronto');
		await act(async () => {
			fireEvent.press(screen.getAllByRole('button', { name: /^Futuro 6,/ })[0]);
		});
		expect(screen).toHavePathname('/evento/f6');
	});

	it('funciona sin sesión y saluda con sesión (FR-009)', async () => {
		await abrir();
		await screen.findByText('Muy pronto');
		expect(screen).toHavePathname('/explorar');
		expect(
			screen.getByRole('header', { name: 'Descubrí eventos' })
		).toBeTruthy();
		await abrir({ usuario: COMPRADOR });
		expect(
			await screen.findByRole('header', { name: 'Hola, Ana' })
		).toBeTruthy();
		await waitFor(() => expect(screen).toHavePathname('/explorar'));
	});
});

describe('Explorar — corazón US4 (contracts/pantallas.md › Corazón)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		eventoService.listarEventos.mockResolvedValue([FUTUROS[0]]);
		categoriaService.listarCategorias.mockResolvedValue([]);
		usuarioService.listarFavoritos.mockResolvedValue([]);
	});

	it('COMPRADOR: se llena al instante y llama agregarFavorito (US4-1, SC-004)', async () => {
		usuarioService.agregarFavorito.mockReturnValue(new Promise(() => {}));
		await abrir({ usuario: COMPRADOR });
		await screen.findByText('Muy pronto');
		await act(async () => {
			fireEvent.press(
				screen.getAllByRole('button', { name: 'Agregar a favoritos' })[0]
			);
		});
		expect(usuarioService.agregarFavorito).toHaveBeenCalledWith('f1');
		// Mismo evento en Destacados y en Muy pronto: ambos corazones cambian.
		expect(
			screen.getAllByRole('button', { name: 'Quitar de favoritos' })
		).toHaveLength(2);
	});

	it('si el servidor falla, vuelve a vacío y avisa (US4-1)', async () => {
		usuarioService.agregarFavorito.mockRejectedValue(new ApiError('x', 0));
		await abrir({ usuario: COMPRADOR });
		await screen.findByText('Muy pronto');
		await act(async () => {
			fireEvent.press(
				screen.getAllByRole('button', { name: 'Agregar a favoritos' })[0]
			);
		});
		expect(
			await screen.findByText('No pudimos actualizar tus favoritos')
		).toBeTruthy();
		expect(
			screen.getAllByRole('button', { name: 'Agregar a favoritos' })
		).toHaveLength(2);
		expect(
			screen.queryByRole('button', { name: 'Quitar de favoritos' })
		).toBeNull();
	});

	it('visitante: va a login con volverA y no llama al servicio (US4-2)', async () => {
		await abrir();
		await screen.findByText('Muy pronto');
		await act(async () => {
			fireEvent.press(
				screen.getAllByRole('button', { name: 'Agregar a favoritos' })[0]
			);
		});
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/explorar' });
		expect(usuarioService.agregarFavorito).not.toHaveBeenCalled();
	});

	it('los favoritos ya guardados aparecen llenos', async () => {
		usuarioService.listarFavoritos.mockResolvedValue([FUTUROS[0]]);
		await abrir({ usuario: COMPRADOR });
		await screen.findByText('Muy pronto');
		expect(
			await screen.findAllByRole('button', { name: 'Quitar de favoritos' })
		).toHaveLength(2);
	});
});
