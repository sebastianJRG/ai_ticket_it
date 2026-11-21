/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen
} from 'expo-router/testing-library';
import * as eventoService from '../../src/services/eventoService';
import { ApiError } from '../../src/services/api';
import { ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { crearEventoDe } from '../helpers/eventosEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(),
	obtenerEvento: jest.fn(() => new Promise(() => {})),
	obtenerComprasEvento: jest.fn(() => new Promise(() => {})),
	crearEvento: jest.fn()
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(() => Promise.resolve([])),
	crearCategoria: jest.fn()
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(),
	quitarFavorito: jest.fn()
}));

const APP = path.resolve(__dirname, '../../src/app');
const DIA = 24 * 60 * 60 * 1000;
const en = (dias) => new Date(Date.now() + dias * DIA).toISOString();
const PROPIO = { id: 'u-organizador', nombre: 'Bruno', apellido: 'Pérez' };

/** Eventos relativos a la fecha real: 2 próximos, 1 finalizado propios y 1 ajeno. */
function eventos() {
	return [
		crearEventoDe(PROPIO, {
			id: 'p-pas',
			nombre: 'Recital viejo',
			fecha: en(-5)
		}),
		crearEventoDe(PROPIO, {
			id: 'p-fut1',
			nombre: 'Obra propia',
			fecha: en(3)
		}),
		crearEventoDe(
			{ id: 'org-1', nombre: 'Otra', apellido: 'Persona' },
			{ id: 'ajeno', nombre: 'Evento ajeno', fecha: en(4) }
		),
		crearEventoDe(PROPIO, {
			id: 'p-fut2',
			nombre: 'Festival propio',
			fecha: en(10)
		})
	];
}

async function abrir() {
	mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
	await renderRouter(APP, { initialUrl: '/organizador/eventos' });
	await act(async () => {});
}

describe('Mis eventos — US2 (contracts/pantallas.md › /organizador/eventos)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		eventoService.listarEventos.mockResolvedValue(eventos());
	});

	it('muestra solo los propios en Próximos y Finalizados (US2-1)', async () => {
		await abrir();
		expect(screen.getByText('Próximos')).toBeTruthy();
		expect(screen.getByText('Finalizados')).toBeTruthy();
		expect(screen.getByText('Obra propia')).toBeTruthy();
		expect(screen.getByText('Festival propio')).toBeTruthy();
		expect(screen.getByText('Recital viejo')).toBeTruthy();
		expect(screen.getAllByText('Finalizado').length).toBeGreaterThan(0);
		expect(screen.queryByText('Evento ajeno')).toBeNull();
		expect(screen.queryByRole('button', { name: /favoritos/i })).toBeNull();
	});

	it('tocar una tarjeta abre las compras del evento', async () => {
		await abrir();
		await fireEvent.press(screen.getByText('Obra propia'));
		expect(screen).toHavePathname('/evento/p-fut1/compras');
	});

	it('la acción "Crear" del header va a Crear evento', async () => {
		await abrir();
		await fireEvent.press(screen.getByRole('button', { name: 'Crear evento' }));
		expect(screen).toHavePathname('/organizador/crear');
	});

	it('sin eventos propios: estado vacío con "Crear evento" (US2-2)', async () => {
		eventoService.listarEventos.mockResolvedValue([eventos()[2]]);
		await abrir();
		expect(screen.getByText('Todavía no creaste eventos')).toBeTruthy();
		await fireEvent.press(
			screen.getAllByRole('button', { name: 'Crear evento' }).at(-1)
		);
		expect(screen).toHavePathname('/organizador/crear');
	});

	it('solo finalizados: no hay sección "Próximos"', async () => {
		eventoService.listarEventos.mockResolvedValue([eventos()[0]]);
		await abrir();
		expect(screen.queryByText('Próximos')).toBeNull();
		expect(screen.getByText('Finalizados')).toBeTruthy();
	});

	it('error sin datos: EmptyState con "Reintentar"', async () => {
		eventoService.listarEventos.mockRejectedValue(new ApiError('', 0));
		await abrir();
		expect(screen.getByText('Sin conexión')).toBeTruthy();
		eventoService.listarEventos.mockResolvedValue(eventos());
		await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		await act(async () => {});
		expect(screen.getByText('Obra propia')).toBeTruthy();
	});

	it('mientras carga muestra esqueletos', async () => {
		eventoService.listarEventos.mockReturnValue(new Promise(() => {}));
		mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
		await renderRouter(APP, { initialUrl: '/organizador/eventos' });
		expect(screen.getByLabelText('Cargando eventos')).toBeTruthy();
	});
});
