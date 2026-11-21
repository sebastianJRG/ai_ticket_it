/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen,
	within
} from 'expo-router/testing-library';
import * as eventoService from '../../src/services/eventoService';
import { ApiError } from '../../src/services/api';
import { ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { crearEventoDe } from '../helpers/eventosEjemplo';
import { crearCompraOrganizador } from '../helpers/comprasEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(),
	obtenerEvento: jest.fn(() => new Promise(() => {})),
	obtenerComprasEvento: jest.fn(),
	crearEvento: jest.fn()
}));
jest.mock('../../src/services/compraService', () => ({
	listarMisCompras: jest.fn(() => Promise.resolve([])),
	cancelarCompra: jest.fn()
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
const EVENTOS = [
	crearEventoDe(PROPIO, { id: 'e1', nombre: 'Noche de jazz', fecha: en(3) }),
	crearEventoDe(PROPIO, { id: 'e2', nombre: 'Obra de teatro', fecha: en(6) }),
	crearEventoDe(PROPIO, { id: 'e3', nombre: 'Sin ventas', fecha: en(9) })
];
const COMPRAS = {
	e1: [
		crearCompraOrganizador({ id: 'c1', evento: { id: 'e1' } }),
		crearCompraOrganizador({
			id: 'c2',
			estado: 'CONFIRMADA',
			comprador: { id: 'u2', nombre: 'Lucas', apellido: 'Díaz' },
			evento: { id: 'e1' }
		})
	],
	e2: [
		crearCompraOrganizador({
			id: 'c3',
			estado: 'UTILIZADA',
			evento: { id: 'e2' }
		})
	],
	e3: []
};

async function abrir() {
	mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
	await renderRouter(APP, { initialUrl: '/organizador/mensajes' });
	await act(async () => {});
}

const filas = () => screen.queryAllByTestId('organizer-purchase-row');

describe('Mensajes — US5 (contracts/pantallas.md › /organizador/mensajes)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		eventoService.listarEventos.mockResolvedValue(EVENTOS);
		eventoService.obtenerComprasEvento.mockImplementation((id) =>
			Promise.resolve({ compras: COMPRAS[id], disponibilidad: [] })
		);
	});

	it('agrupa las compras por evento, sin botones de acción (US5-1)', async () => {
		await abrir();
		expect(screen.getByText('Noche de jazz')).toBeTruthy();
		expect(screen.getByText('Obra de teatro')).toBeTruthy();
		expect(screen.queryByText('Sin ventas')).toBeNull();
		expect(filas()).toHaveLength(3);
		expect(within(filas()[0]).getByText('Lucas Díaz')).toBeTruthy();
		expect(within(filas()[0]).getByText('Confirmada')).toBeTruthy();
		expect(screen.queryAllByRole('button', { name: 'Confirmar' })).toHaveLength(
			0
		);
		expect(screen.queryAllByRole('button', { name: 'Cancelar' })).toHaveLength(
			0
		);
	});

	it('tocar una fila abre el detalle de la compra con ?evento=', async () => {
		await abrir();
		await fireEvent.press(within(filas()[2]).getByText('Ana García'));
		expect(screen).toHavePathname('/compra/c3');
		expect(screen).toHaveSearchParams({ idCompra: 'c3', evento: 'e2' });
	});

	it('sin compras: estado vacío', async () => {
		eventoService.obtenerComprasEvento.mockResolvedValue({
			compras: [],
			disponibilidad: []
		});
		await abrir();
		expect(
			screen.getByText('Todavía no hay compras para conversar')
		).toBeTruthy();
	});

	it('si falla 1 evento avisa en singular y permite reintentar', async () => {
		eventoService.obtenerComprasEvento.mockImplementation((id) =>
			id === 'e2'
				? Promise.reject(new ApiError('x', 500))
				: Promise.resolve({ compras: COMPRAS[id], disponibilidad: [] })
		);
		await abrir();
		expect(
			screen.getByText('No pudimos cargar las compras de 1 evento')
		).toBeTruthy();
		expect(filas()).toHaveLength(2);
		expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
	});

	it('si fallan 2 eventos avisa en plural', async () => {
		eventoService.obtenerComprasEvento.mockImplementation((id) =>
			id === 'e1'
				? Promise.resolve({ compras: COMPRAS.e1, disponibilidad: [] })
				: Promise.reject(new ApiError('x', 500))
		);
		await abrir();
		expect(
			screen.getByText('No pudimos cargar las compras de 2 eventos')
		).toBeTruthy();
	});

	it('si falla todo: EmptyState de error', async () => {
		eventoService.listarEventos.mockRejectedValue(new ApiError('', 0));
		await abrir();
		expect(screen.getByText('Sin conexión')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
	});
});
