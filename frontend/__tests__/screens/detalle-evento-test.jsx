/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen
} from 'expo-router/testing-library';
import * as eventoService from '../../src/services/eventoService';
import * as usuarioService from '../../src/services/usuarioService';
import { ApiError } from '../../src/services/api';
import { COMPRADOR, ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { crearEvento } from '../helpers/eventosEjemplo';
import { RESENIAS, TIPOS_CHECKOUT } from '../helpers/comprasEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(() => Promise.resolve([])),
	obtenerEvento: jest.fn()
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarReseniasOrganizador: jest.fn(),
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(() => Promise.resolve([])),
	quitarFavorito: jest.fn(() => Promise.resolve([]))
}));

const APP = path.resolve(__dirname, '../../src/app');
const DIA = 86400000;
const enDias = (n) => new Date(Date.now() + n * DIA).toISOString();
const [GENERAL, PLATEA, INVITACION] = TIPOS_CHECKOUT;

const EVENTO = crearEvento({
	id: 'ev-1',
	nombre: 'Gran recital',
	descripcion: 'Una noche única',
	fecha: enDias(10),
	tiposEntrada: [GENERAL, PLATEA, INVITACION],
	multimedia: [],
	puntajeOrganizador: 4.5
});

/**
 * Monta la app real en el detalle de `id`.
 * @param {object} [estado] Opciones de `crearAuthFalso`.
 * @param {string} [id] ID del evento.
 * @returns {Promise<void>}
 */
async function abrir(estado, id = 'ev-1') {
	mockAuth = crearAuthFalso(estado);
	await renderRouter(APP, { initialUrl: `/evento/${id}` });
}

const listo = () => screen.findByRole('header', { name: 'Gran recital' });

describe('Detalle del evento — US1 (contracts/pantallas.md › /evento/[idEvento])', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		eventoService.obtenerEvento.mockResolvedValue(EVENTO);
		usuarioService.listarReseniasOrganizador.mockResolvedValue([]);
	});

	it('mientras carga muestra el esqueleto', async () => {
		eventoService.obtenerEvento.mockReturnValue(new Promise(() => {}));
		await abrir();
		expect(screen.getByLabelText('Cargando evento')).toBeTruthy();
	});

	it('muestra los datos del evento y el CTA "desde" (US1-1, FR-001)', async () => {
		await abrir({ usuario: COMPRADOR });
		await listo();
		expect(eventoService.obtenerEvento).toHaveBeenCalledWith('ev-1');
		expect(screen.getByText('Recitales')).toBeTruthy();
		expect(screen.getByText('Una noche única')).toBeTruthy();
		expect(screen.getByText(/ de \d{4} · \d{2}:\d{2} h$/)).toBeTruthy();
		expect(
			screen.getByLabelText(/^Puntaje del organizador 4,5 de 5, Bruno Pérez/)
		).toBeTruthy();
		expect(screen.getByText('General')).toBeTruthy();
		expect(screen.getByText('Platea')).toBeTruthy();
		expect(screen.getByText('Invitación')).toBeTruthy();
		expect(screen.getByText('Gratis')).toBeTruthy();
		expect(
			screen.getByRole('button', { name: /^Comprar entradas · desde \$\s0$/ })
		).toBeTruthy();
	});

	it('sin imagen usa el arte por categoría; con imagen, la foto', async () => {
		await abrir();
		await listo();
		expect(
			screen.getByTestId('arte-categoria', { includeHiddenElements: true })
		).toBeTruthy();
		expect(
			screen.queryByTestId('hero-imagen', { includeHiddenElements: true })
		).toBeNull();
	});

	it('con multimedia muestra la imagen del evento', async () => {
		eventoService.obtenerEvento.mockResolvedValue({
			...EVENTO,
			multimedia: ['https://ejemplo.com/a.jpg']
		});
		await abrir();
		await listo();
		expect(
			screen.getByTestId('hero-imagen', { includeHiddenElements: true })
		).toBeTruthy();
	});

	it('evento ya ocurrido → "Evento finalizado" y no se puede comprar (US1-2)', async () => {
		eventoService.obtenerEvento.mockResolvedValue({
			...EVENTO,
			fecha: enDias(-1)
		});
		await abrir({ usuario: COMPRADOR });
		await listo();
		expect(
			screen.getByRole('button', { name: 'Evento finalizado' })
		).toBeDisabled();
		expect(
			screen.queryByRole('button', { name: /^Comprar entradas/ })
		).toBeNull();
	});

	it.each([404, 400])(
		'%i → "Evento no encontrado" y vuelta a Explorar (US1-3)',
		async (status) => {
			eventoService.obtenerEvento.mockRejectedValue(new ApiError('x', status));
			await abrir();
			expect(await screen.findByText('Evento no encontrado')).toBeTruthy();
			await act(async () => {
				fireEvent.press(
					screen.getByRole('button', { name: 'Volver a Explorar' })
				);
			});
			expect(screen).toHavePathname('/explorar');
		}
	);

	it('sin conexión → "Sin conexión" y "Reintentar" vuelve a pedir', async () => {
		eventoService.obtenerEvento.mockRejectedValueOnce(new ApiError('x', 0));
		await abrir();
		expect(await screen.findByText('Sin conexión')).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		await listo();
		expect(eventoService.obtenerEvento).toHaveBeenCalledTimes(2);
	});

	it('ORGANIZADOR ve el detalle sin botón de compra ni corazón (edge)', async () => {
		await abrir({ usuario: ORGANIZADOR });
		await listo();
		expect(screen.queryByTestId('barra-accion')).toBeNull();
		expect(
			screen.queryByRole('button', { name: /^Comprar entradas/ })
		).toBeNull();
		expect(screen.queryByLabelText(/favoritos/)).toBeNull();
	});

	it('visitante: el CTA lleva a login con volverA del checkout (US3-5)', async () => {
		await abrir();
		await listo();
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: /^Comprar entradas/ })
			);
		});
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/evento/ev-1/comprar' });
	});

	it('COMPRADOR: el CTA abre el checkout', async () => {
		await abrir({ usuario: COMPRADOR });
		await listo();
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: /^Comprar entradas/ })
			);
		});
		expect(screen).toHavePathname('/evento/ev-1/comprar');
	});

	it('el corazón se muestra a COMPRADOR y visitante', async () => {
		await abrir({ usuario: COMPRADOR });
		await listo();
		expect(screen.getByLabelText('Agregar a favoritos')).toBeTruthy();
	});

	it('visitante toca el corazón → login con volverA del detalle', async () => {
		await abrir();
		await listo();
		await act(async () => {
			fireEvent.press(screen.getByLabelText('Agregar a favoritos'));
		});
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/evento/ev-1' });
	});
});

describe('Detalle del evento — US2 reseñas del organizador (CU-10)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		eventoService.obtenerEvento.mockResolvedValue(EVENTO);
	});

	it('pide las reseñas del organizador del evento', async () => {
		usuarioService.listarReseniasOrganizador.mockResolvedValue([]);
		await abrir();
		await listo();
		expect(usuarioService.listarReseniasOrganizador).toHaveBeenCalledWith(
			'org-1'
		);
	});

	it('con reseñas: promedio, cantidad, las 2 más recientes y "Ver todas" (US2-1, SC-004)', async () => {
		usuarioService.listarReseniasOrganizador.mockResolvedValue(RESENIAS);
		await abrir();
		await listo();
		expect(
			await screen.findByLabelText('Puntaje 4,5 de 5, 5 reseñas')
		).toBeTruthy();
		expect(screen.getByText('Última reseña')).toBeTruthy();
		expect(screen.getByText('Cuarta reseña')).toBeTruthy();
		expect(screen.queryByText('Primera reseña')).toBeNull();
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Ver todas las 5 reseñas' })
			);
		});
		expect(screen.getByText('Primera reseña')).toBeTruthy();
		expect(screen.getByText('Reseña anónima')).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Ver menos' }));
		});
		expect(screen.queryByText('Primera reseña')).toBeNull();
	});

	it('con 2 reseñas o menos no ofrece "Ver todas"', async () => {
		usuarioService.listarReseniasOrganizador.mockResolvedValue(
			RESENIAS.slice(0, 2)
		);
		await abrir();
		await listo();
		expect(await screen.findByText('Primera reseña')).toBeTruthy();
		expect(screen.queryByRole('button', { name: /^Ver todas/ })).toBeNull();
	});

	it('sin reseñas: "Este organizador todavía no tiene reseñas" (US2-2)', async () => {
		usuarioService.listarReseniasOrganizador.mockResolvedValue([]);
		await abrir();
		await listo();
		expect(
			await screen.findByText('Este organizador todavía no tiene reseñas')
		).toBeTruthy();
	});

	it('error en reseñas no tapa el detalle y "Reintentar" vuelve a pedir', async () => {
		usuarioService.listarReseniasOrganizador
			.mockRejectedValueOnce(new ApiError('x', 0))
			.mockResolvedValueOnce(RESENIAS);
		await abrir();
		await listo();
		expect(
			await screen.findByText('No pudimos cargar las reseñas')
		).toBeTruthy();
		expect(screen.getByText('Una noche única')).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		expect(await screen.findByText('Última reseña')).toBeTruthy();
		expect(usuarioService.listarReseniasOrganizador).toHaveBeenCalledTimes(2);
	});
});
