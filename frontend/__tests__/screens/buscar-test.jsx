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
import { crearAuthFalso } from '../helpers/authFalso';
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
const enDias = (n) => new Date(Date.now() + n * DIA).toISOString();

const JAZZ = crearEvento({
	id: 'jazz',
	nombre: 'Noche de jazz',
	fecha: enDias(3)
});
const HAMLET = crearEvento({
	id: 'hamlet',
	nombre: 'Hamlet',
	fecha: enDias(5),
	categoria: CATEGORIAS[1]
});
const VIEJO = crearEvento({
	id: 'viejo',
	nombre: 'Evento viejo',
	fecha: enDias(-3)
});

/** Placeholder del input de búsqueda. */
const PLACEHOLDER = 'Buscá artistas, obras, eventos…';

/**
 * Monta la app real en `url` como visitante (o con la sesión dada).
 * @param {string} url Ruta inicial.
 * @param {object} [estado] Opciones de `crearAuthFalso`.
 * @returns {Promise<void>}
 */
async function abrir(url, estado) {
	mockAuth = crearAuthFalso(estado);
	await renderRouter(APP, { initialUrl: url });
	await act(async () => {});
}

/** Escribe en el input y deja pasar `ms` del debounce. */
async function escribir(texto, ms = 300) {
	await act(async () => {
		fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), texto);
	});
	await act(async () => jest.advanceTimersByTime(ms));
}

/** Llamadas a listarEventos hechas hasta ahora. */
const llamadas = () => eventoService.listarEventos.mock.calls.map(([f]) => f);

describe('Búsqueda — US2 (contracts/pantallas.md › /buscar)', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		eventoService.listarEventos.mockResolvedValue([JAZZ, HAMLET]);
		categoriaService.listarCategorias.mockResolvedValue(CATEGORIAS);
		usuarioService.listarFavoritos.mockResolvedValue([]);
	});
	afterEach(() => jest.useRealTimers());

	it('inicia con la categoría del parámetro y su chip de filtro', async () => {
		await abrir('/buscar?categoriaId=cat-tea');
		expect(llamadas()[0]).toEqual(
			expect.objectContaining({ categoriaId: 'cat-tea' })
		);
		expect(
			screen.getByRole('button', { name: 'Quitar filtro Teatro' })
		).toBeTruthy();
	});

	it('el texto consulta una sola vez tras 300 ms (US2-1)', async () => {
		await abrir('/buscar');
		const antes = eventoService.listarEventos.mock.calls.length;
		await escribir('j', 100);
		await escribir('ja', 100);
		await escribir('jazz ', 299);
		expect(eventoService.listarEventos.mock.calls.length).toBe(antes);
		eventoService.listarEventos.mockResolvedValueOnce([JAZZ]);
		await act(async () => jest.advanceTimersByTime(1));
		expect(eventoService.listarEventos.mock.calls.length).toBe(antes + 1);
		expect(llamadas().at(-1)).toEqual(expect.objectContaining({ q: 'jazz' }));
		expect(screen.getByText('1 evento')).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Quitar filtro jazz' })
		).toBeTruthy();
	});

	it('el contador usa plural', async () => {
		await abrir('/buscar');
		expect(screen.getByText('2 eventos')).toBeTruthy();
	});

	it('quitar el chip de categoría re-consulta sin espera y sin categoriaId (US2-2)', async () => {
		await abrir('/buscar?categoriaId=cat-tea&q=hamlet');
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Quitar filtro Teatro' })
			);
		});
		const ultima = llamadas().at(-1);
		expect(ultima).toEqual(expect.objectContaining({ q: 'hamlet' }));
		expect(ultima.categoriaId).toBeUndefined();
		expect(
			screen.queryByRole('button', { name: 'Quitar filtro Teatro' })
		).toBeNull();
	});

	it('quitar el chip de texto vacía la barra y re-consulta sin espera', async () => {
		await abrir('/buscar?q=jazz');
		const antes = eventoService.listarEventos.mock.calls.length;
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Quitar filtro jazz' })
			);
		});
		expect(screen.getByPlaceholderText(PLACEHOLDER).props.value).toBe('');
		expect(eventoService.listarEventos.mock.calls.length).toBe(antes + 1);
		expect(llamadas().at(-1).q).toBeUndefined();
	});

	it('elegir una categoría en los chips filtra sin espera', async () => {
		await abrir('/buscar');
		await act(async () => {
			fireEvent.press(screen.getByRole('tab', { name: 'Recitales' }));
		});
		expect(llamadas().at(-1)).toEqual(
			expect.objectContaining({ categoriaId: 'cat-rec' })
		);
	});

	it('sin coincidencias: estado vacío con "Quitar filtros" que limpia todo (US2-3)', async () => {
		eventoService.listarEventos.mockResolvedValue([]);
		await abrir('/buscar?categoriaId=cat-tea&q=zzzz');
		expect(
			screen.getByRole('header', { name: 'No encontramos eventos' })
		).toBeTruthy();
		expect(
			screen.getByText('Probá con otras palabras o quitá filtros.')
		).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Quitar filtros' }));
		});
		const ultima = llamadas().at(-1);
		expect(ultima.q).toBeUndefined();
		expect(ultima.categoriaId).toBeUndefined();
		expect(screen.getByPlaceholderText(PLACEHOLDER).props.value).toBe('');
	});

	it('sin filtros activos el vacío no ofrece "Quitar filtros"', async () => {
		eventoService.listarEventos.mockResolvedValue([]);
		await abrir('/buscar');
		expect(
			screen.getByRole('header', { name: 'No encontramos eventos' })
		).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Quitar filtros' })).toBeNull();
	});

	it('solo se muestra el resultado del último texto (SC-003)', async () => {
		await abrir('/buscar');
		const ja = diferido();
		const teatro = diferido();
		eventoService.listarEventos
			.mockReturnValueOnce(ja.promesa)
			.mockReturnValueOnce(teatro.promesa);
		await escribir('ja');
		await escribir('teatro');
		await act(async () => teatro.resolver([HAMLET]));
		await act(async () => ja.resolver([JAZZ]));
		expect(screen.getByText('Hamlet')).toBeTruthy();
		expect(screen.queryByText('Noche de jazz')).toBeNull();
		expect(screen.getByText('1 evento')).toBeTruthy();
	});

	it('mientras re-consulta con resultados previos muestra esqueletos', async () => {
		await abrir('/buscar');
		expect(screen.getByText('Noche de jazz')).toBeTruthy();
		eventoService.listarEventos.mockReturnValueOnce(new Promise(() => {}));
		await escribir('x');
		expect(screen.getByLabelText('Cargando eventos')).toBeTruthy();
		expect(screen.queryByText('Noche de jazz')).toBeNull();
	});

	it('error → "Reintentar" vuelve a consultar', async () => {
		eventoService.listarEventos.mockRejectedValueOnce(new ApiError('x', 0));
		await abrir('/buscar');
		expect(screen.getByRole('header', { name: 'Sin conexión' })).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		expect(screen.getByText('Noche de jazz')).toBeTruthy();
	});

	it('muestra los finalizados marcados', async () => {
		eventoService.listarEventos.mockResolvedValue([VIEJO]);
		await abrir('/buscar');
		expect(screen.getByText('Evento viejo')).toBeTruthy();
		expect(screen.getByText('Finalizado')).toBeTruthy();
	});

	it('tocar una tarjeta abre el detalle; funciona como visitante (FR-006, FR-009)', async () => {
		await abrir('/buscar');
		expect(screen).toHavePathname('/buscar');
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: /^Noche de jazz,/ }));
		});
		expect(screen).toHavePathname('/evento/jazz');
	});

	it('recorrido SC-001: Explorar → buscar → tarjeta en 3 interacciones', async () => {
		// Explorar sin eventos para no duplicar tarjetas entre pestañas.
		eventoService.listarEventos.mockResolvedValueOnce([]);
		await abrir('/explorar');
		// 1) tocar la barra de Explorar
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Buscar eventos' }));
		});
		expect(screen).toHavePathname('/buscar');
		await act(async () => {});
		// 2) escribir el nombre
		eventoService.listarEventos.mockResolvedValue([JAZZ]);
		await escribir('jazz');
		// 3) tocar la tarjeta
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: /^Noche de jazz,/ }));
		});
		expect(screen).toHavePathname('/evento/jazz');
	});
});

describe('Búsqueda — orden US3 (CU-11)', () => {
	const PUNTUADO = crearEvento({
		id: 'top',
		nombre: 'Organizador top',
		fecha: enDias(4),
		puntajeOrganizador: 4.7
	});

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		eventoService.listarEventos.mockResolvedValue([JAZZ, HAMLET]);
		categoriaService.listarCategorias.mockResolvedValue(CATEGORIAS);
		usuarioService.listarFavoritos.mockResolvedValue([]);
	});
	afterEach(() => jest.useRealTimers());

	it('por defecto consulta por fecha ascendente', async () => {
		await abrir('/buscar');
		expect(llamadas()[0]).toEqual(
			expect.objectContaining({ sortBy: 'fecha', order: 'asc' })
		);
		expect(screen.getByText('Ordenar: Fecha ↑')).toBeTruthy();
	});

	it.each([
		['Fecha más lejana', 'fecha', 'desc'],
		['Precio menor a mayor', 'precio', 'asc'],
		['Precio mayor a menor', 'precio', 'desc'],
		['Mejor puntaje del organizador', 'puntaje', 'desc'],
		['Menor puntaje del organizador', 'puntaje', 'asc'],
		['Fecha más próxima', 'fecha', 'asc']
	])(
		'"%s" re-consulta sin espera con sortBy=%s y order=%s, conservando filtros (SC-002)',
		async (etiqueta, sortBy, order) => {
			await abrir('/buscar?q=jazz&categoriaId=cat-rec');
			if (etiqueta === 'Fecha más próxima') {
				// Cambiar primero a otra opción para que elegir la de defecto sea un cambio.
				await act(async () => {
					fireEvent.press(
						screen.getByRole('button', { name: /^Ordenar resultados/ })
					);
				});
				await act(async () => {
					fireEvent.press(
						screen.getByRole('radio', { name: 'Precio menor a mayor' })
					);
				});
			}
			const antes = eventoService.listarEventos.mock.calls.length;
			await act(async () => {
				fireEvent.press(
					screen.getByRole('button', { name: /^Ordenar resultados/ })
				);
			});
			await act(async () => {
				fireEvent.press(screen.getByRole('radio', { name: etiqueta }));
			});
			expect(eventoService.listarEventos.mock.calls.length).toBe(antes + 1);
			expect(llamadas().at(-1)).toEqual({
				q: 'jazz',
				categoriaId: 'cat-rec',
				sortBy,
				order
			});
		}
	);

	it('muestra la lista en el orden del servidor, sin reordenar (US3-1/2)', async () => {
		eventoService.listarEventos.mockResolvedValue([HAMLET, PUNTUADO, JAZZ]);
		await abrir('/buscar');
		const nombres = screen
			.getAllByRole('button', {
				name: /^(Hamlet|Organizador top|Noche de jazz),/
			})
			.map((b) => b.props.accessibilityLabel.split(',')[0]);
		expect(nombres).toEqual(['Hamlet', 'Organizador top', 'Noche de jazz']);
	});

	it('las tarjetas muestran el puntaje o "Sin reseñas" (US3-3)', async () => {
		eventoService.listarEventos.mockResolvedValue([PUNTUADO, JAZZ]);
		await abrir('/buscar');
		expect(screen.getByText('4,7')).toBeTruthy();
		expect(screen.getByText('Sin reseñas')).toBeTruthy();
	});
});

describe('Búsqueda — corazón US4', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		eventoService.listarEventos.mockResolvedValue([JAZZ, HAMLET]);
		categoriaService.listarCategorias.mockResolvedValue([]);
	});
	afterEach(() => jest.useRealTimers());

	it('comparte el estado de favoritos: lo guardado aparece lleno', async () => {
		usuarioService.listarFavoritos.mockResolvedValue([JAZZ]);
		await abrir('/buscar', {
			usuario: { id: 'u-comprador', nombre: 'Ana', rol: 'COMPRADOR' }
		});
		expect(
			screen.getAllByRole('button', { name: 'Quitar de favoritos' })
		).toHaveLength(1);
		expect(
			screen.getAllByRole('button', { name: 'Agregar a favoritos' })
		).toHaveLength(1);
	});

	it('visitante: volverA es /buscar', async () => {
		usuarioService.listarFavoritos.mockResolvedValue([]);
		await abrir('/buscar');
		await act(async () => {
			fireEvent.press(
				screen.getAllByRole('button', { name: 'Agregar a favoritos' })[0]
			);
		});
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/buscar' });
	});
});
