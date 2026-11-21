/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen,
	within
} from 'expo-router/testing-library';
import { router } from 'expo-router';
import * as compraService from '../../src/services/compraService';
import * as eventoService from '../../src/services/eventoService';
import * as categoriaService from '../../src/services/categoriaService';
import { ApiError } from '../../src/services/api';
import { COMPRADOR, crearAuthFalso } from '../helpers/authFalso';
import { comprasPorEstado } from '../helpers/comprasEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/compraService', () => ({
	listarMisCompras: jest.fn(),
	cancelarCompra: jest.fn()
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
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(),
	quitarFavorito: jest.fn()
}));

const APP = path.resolve(__dirname, '../../src/app');
let COMPRAS;

/** Nombres de evento de las tarjetas visibles, en orden. */
const tarjetasVisibles = () =>
	screen
		.queryAllByTestId('purchase-card')
		.map((t) => within(t).getByTestId('purchase-card-evento').props.children);

/** Monta la app real en Mis compras con un COMPRADOR. */
async function abrir() {
	mockAuth = crearAuthFalso({ usuario: COMPRADOR });
	await renderRouter(APP, { initialUrl: '/compras' });
	await act(async () => {});
}

describe('Mis compras — US1 (contracts/pantallas.md › /compras)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		COMPRAS = comprasPorEstado(new Date());
		compraService.listarMisCompras.mockResolvedValue(COMPRAS);
		eventoService.listarEventos.mockResolvedValue([]);
		categoriaService.listarCategorias.mockResolvedValue([]);
	});

	it('mientras carga muestra 3 esqueletos', async () => {
		compraService.listarMisCompras.mockReturnValue(new Promise(() => {}));
		mockAuth = crearAuthFalso({ usuario: COMPRADOR });
		await renderRouter(APP, { initialUrl: '/compras' });
		expect(screen.getAllByTestId('purchase-card-skeleton')).toHaveLength(3);
	});

	it('pide el listado una sola vez al abrir', async () => {
		await abrir();
		expect(compraService.listarMisCompras).toHaveBeenCalledTimes(1);
	});

	it('abre en Activas, la más reciente primero, con contadores', async () => {
		await abrir();
		expect(screen.getByLabelText('Activas, 3')).toBeTruthy();
		expect(screen.getByLabelText('Pasadas, 2')).toBeTruthy();
		expect(screen.getByLabelText('Canceladas, 2')).toBeTruthy();
		expect(tarjetasVisibles()).toEqual([
			'Show de hoy',
			'Teatro en 3 días',
			'Recital pendiente'
		]);
		expect(screen.getByText('Confirmada · faltan 3 días')).toBeTruthy();
		expect(screen.getByText('Es hoy')).toBeTruthy();
	});

	it('al cambiar de pestaña muestra solo las de esa pestaña (US1-3)', async () => {
		await abrir();
		await act(async () => {
			fireEvent.press(screen.getByLabelText('Pasadas, 2'));
		});
		expect(tarjetasVisibles()).toEqual(['Festival pasado', 'Festival pasado']);
		await act(async () => {
			fireEvent.press(screen.getByLabelText('Canceladas, 2'));
		});
		expect(tarjetasVisibles()).toEqual([
			'Partido reembolsado',
			'Conferencia cancelada'
		]);
	});

	it('sin compras: vacío y "Explorar eventos" lleva a Explorar (US1-4)', async () => {
		compraService.listarMisCompras.mockResolvedValue([]);
		await abrir();
		expect(
			screen.getByRole('header', { name: 'Todavía no compraste entradas' })
		).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Explorar eventos' }));
		});
		expect(screen).toHavePathname('/explorar');
	});

	it('pestaña vacía con compras en otras: texto sin acción', async () => {
		compraService.listarMisCompras.mockResolvedValue([COMPRAS[0]]);
		await abrir();
		await act(async () => {
			fireEvent.press(screen.getByLabelText('Pasadas, 0'));
		});
		expect(
			screen.getByRole('header', { name: 'No tenés compras pasadas' })
		).toBeTruthy();
		expect(
			screen.queryByRole('button', { name: 'Explorar eventos' })
		).toBeNull();
	});

	it('error sin datos → mensaje y "Reintentar" vuelve a pedir', async () => {
		compraService.listarMisCompras.mockRejectedValue(new ApiError('x', 0));
		await abrir();
		expect(screen.getByRole('header', { name: 'Sin conexión' })).toBeTruthy();
		compraService.listarMisCompras.mockResolvedValue(COMPRAS);
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		expect(screen.getByText('Recital pendiente')).toBeTruthy();
	});

	it('gesto de actualizar vuelve a pedir; si falla mantiene la lista y avisa (US1-5)', async () => {
		await abrir();
		compraService.listarMisCompras.mockRejectedValueOnce(new ApiError('x', 0));
		const lista = screen.getByTestId('lista-compras');
		await act(async () => {
			await lista.props.refreshControl.props.onRefresh();
		});
		expect(compraService.listarMisCompras).toHaveBeenCalledTimes(2);
		expect(screen.getByText('Recital pendiente')).toBeTruthy();
		expect(screen.getByText('No pudimos actualizar tus compras')).toBeTruthy();
	});

	it('al volver a enfocar la pantalla vuelve a pedir', async () => {
		await abrir();
		await act(async () => {
			router.navigate('/explorar');
		});
		await act(async () => {
			router.navigate('/compras');
		});
		expect(compraService.listarMisCompras).toHaveBeenCalledTimes(2);
	});

	it('tocar una tarjeta abre el detalle de la compra', async () => {
		await abrir();
		await act(async () => {
			fireEvent.press(screen.getAllByTestId('purchase-card')[0]);
		});
		expect(screen).toHavePathname('/compra/c-con0');
	});
});

describe('Mis compras — US2 cancelar (contracts/pantallas.md › Cancelación)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		COMPRAS = comprasPorEstado(new Date());
		compraService.listarMisCompras.mockResolvedValue(COMPRAS);
		eventoService.listarEventos.mockResolvedValue([]);
		categoriaService.listarCategorias.mockResolvedValue([]);
	});

	const cancelarEn = (nombre) =>
		within(
			screen
				.getAllByTestId('purchase-card')
				.find((t) => within(t).queryByText(nombre))
		).getByRole('button', { name: 'Cancelar' });

	it('solo las activas futuras ofrecen "Cancelar" (US2-3, SC-004)', async () => {
		await abrir();
		expect(screen.getAllByRole('button', { name: 'Cancelar' })).toHaveLength(3);
		for (const pestana of ['Pasadas, 2', 'Canceladas, 2']) {
			await act(async () => {
				fireEvent.press(screen.getByLabelText(pestana));
			});
			expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
		}
	});

	it('"Cancelar" abre el diálogo sin navegar al detalle', async () => {
		await abrir();
		await act(async () => {
			fireEvent.press(cancelarEn('Teatro en 3 días'));
		});
		expect(
			screen.getByRole('header', { name: '¿Cancelar esta compra?' })
		).toBeTruthy();
		expect(screen).toHavePathname('/compras');
	});

	it('confirmar cancela una vez, recarga y la compra pasa a Canceladas (US2-2, SC-003)', async () => {
		compraService.cancelarCompra.mockResolvedValue({
			...COMPRAS[1],
			estado: 'CANCELADA'
		});
		await abrir();
		compraService.listarMisCompras.mockResolvedValue(
			COMPRAS.map((c) =>
				c.id === 'c-con3'
					? { ...c, estado: 'CANCELADA', diasRestantes: null }
					: c
			)
		);
		await act(async () => {
			fireEvent.press(cancelarEn('Teatro en 3 días'));
		});
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Sí, cancelar compra' })
			);
		});
		expect(compraService.cancelarCompra).toHaveBeenCalledTimes(1);
		expect(compraService.cancelarCompra).toHaveBeenCalledWith('c-con3');
		expect(compraService.listarMisCompras).toHaveBeenCalledTimes(2);
		expect(screen.getByText('Compra cancelada')).toBeTruthy();
		expect(screen.getByLabelText('Activas, 2')).toBeTruthy();
		expect(screen.getByLabelText('Canceladas, 3')).toBeTruthy();
	});

	it('si el servidor rechaza (400) muestra el error y recarga (US2-4)', async () => {
		compraService.cancelarCompra.mockRejectedValue(
			new ApiError('El evento ya ocurrió.', 400)
		);
		await abrir();
		await act(async () => {
			fireEvent.press(cancelarEn('Recital pendiente'));
		});
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Sí, cancelar compra' })
			);
		});
		expect(screen.getByText('No se puede cancelar esta compra')).toBeTruthy();
		expect(compraService.listarMisCompras).toHaveBeenCalledTimes(2);
	});
});
