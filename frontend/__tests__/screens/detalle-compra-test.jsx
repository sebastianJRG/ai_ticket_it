/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen
} from 'expo-router/testing-library';
import * as compraService from '../../src/services/compraService';
import * as reseniaService from '../../src/services/reseniaService';
import { ApiError } from '../../src/services/api';
import { formatDate, formatPrice } from '../../src/theme/format';
import { COMPRADOR, ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { comprasPorEstado, crearResenia } from '../helpers/comprasEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/compraService', () => ({
	listarMisCompras: jest.fn(),
	cancelarCompra: jest.fn()
}));
jest.mock('../../src/services/reseniaService', () => ({
	listarReseniasEvento: jest.fn(),
	crearResenia: jest.fn()
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(() => Promise.resolve([])),
	obtenerEvento: jest.fn(() => new Promise(() => {}))
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(),
	quitarFavorito: jest.fn()
}));

const APP = path.resolve(__dirname, '../../src/app');
let COMPRAS;
const porId = (id) => COMPRAS.find((c) => c.id === id);

/** Monta la app real en el detalle de una compra. */
async function abrir(id, usuario = COMPRADOR) {
	mockAuth = crearAuthFalso({ usuario });
	await renderRouter(APP, { initialUrl: `/compra/${id}` });
	await act(async () => {});
}

beforeEach(() => {
	jest.clearAllMocks();
	COMPRAS = comprasPorEstado(new Date());
	compraService.listarMisCompras.mockResolvedValue(COMPRAS);
	reseniaService.listarReseniasEvento.mockResolvedValue([]);
});

describe('Detalle de compra — US3 (contracts/pantallas.md › /compra/[idCompra])', () => {
	it('mientras carga muestra el esqueleto', async () => {
		compraService.listarMisCompras.mockReturnValue(new Promise(() => {}));
		mockAuth = crearAuthFalso({ usuario: COMPRADOR });
		await renderRouter(APP, { initialUrl: '/compra/c-con3' });
		expect(screen.getByLabelText('Cargando compra')).toBeTruthy();
	});

	it('muestra el resumen, el estado con días y las pestañas (US3-1)', async () => {
		await abrir('c-con3');
		const c = porId('c-con3');
		expect(compraService.listarMisCompras).toHaveBeenCalledTimes(1);
		expect(screen.getAllByText('Teatro en 3 días').length).toBeGreaterThan(0);
		expect(screen.getByText(formatDate(c.evento.fecha, 'long'))).toBeTruthy();
		expect(screen.getByText('2 × Platea')).toBeTruthy();
		expect(screen.getByText(formatPrice(80000))).toBeTruthy();
		expect(screen.getByText('Confirmada · faltan 3 días')).toBeTruthy();
		expect(screen.getByLabelText('Detalle').props.accessibilityState).toEqual(
			expect.objectContaining({ selected: true })
		);
		expect(screen.getByLabelText('Chat')).toBeTruthy();
	});

	it('la línea de estado marca el estado actual (US3-2)', async () => {
		await abrir('c-con3');
		expect(screen.getByLabelText('Confirmada, estado actual')).toBeTruthy();
		expect(screen.getByLabelText('Pendiente, completado')).toBeTruthy();
		expect(screen.getByLabelText('Utilizada, pendiente')).toBeTruthy();
	});

	it('CANCELADA: Pendiente → Cancelada; REEMBOLSADA: Pendiente → Confirmada → Reembolsada', async () => {
		await abrir('c-can');
		expect(screen.getByLabelText('Cancelada, estado actual')).toBeTruthy();
		expect(screen.queryByLabelText(/^Confirmada, /)).toBeNull();
		await abrir('c-ree');
		expect(screen.getByLabelText('Reembolsada, estado actual')).toBeTruthy();
		expect(screen.getByLabelText('Confirmada, completado')).toBeTruthy();
	});

	it('la pestaña Chat muestra el estado provisorio', async () => {
		await abrir('c-con3');
		await act(async () => {
			fireEvent.press(screen.getByLabelText('Chat'));
		});
		expect(
			screen.getByRole('header', { name: 'Chat de la compra' })
		).toBeTruthy();
		expect(screen.queryByLabelText('Confirmada, estado actual')).toBeNull();
	});

	it('compra ausente del listado → no encontrada y "Ver mis compras"', async () => {
		await abrir('no-existe');
		expect(
			screen.getByRole('header', { name: 'No encontramos esta compra' })
		).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Ver mis compras' }));
		});
		expect(screen).toHavePathname('/compras');
	});

	it('error → mensaje y "Reintentar"', async () => {
		compraService.listarMisCompras.mockRejectedValue(new ApiError('x', 0));
		await abrir('c-con3');
		expect(screen.getByRole('header', { name: 'Sin conexión' })).toBeTruthy();
		compraService.listarMisCompras.mockResolvedValue(COMPRAS);
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		expect(screen.getByText('Confirmada · faltan 3 días')).toBeTruthy();
	});

	it('cancelable: "Cancelar compra" → confirmar → recarga y muestra CANCELADA', async () => {
		compraService.cancelarCompra.mockResolvedValue({
			...porId('c-con3'),
			estado: 'CANCELADA'
		});
		await abrir('c-con3');
		compraService.listarMisCompras.mockResolvedValue(
			COMPRAS.map((c) =>
				c.id === 'c-con3'
					? { ...c, estado: 'CANCELADA', diasRestantes: null }
					: c
			)
		);
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Cancelar compra' }));
		});
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Sí, cancelar compra' })
			);
		});
		expect(compraService.cancelarCompra).toHaveBeenCalledWith('c-con3');
		expect(compraService.listarMisCompras).toHaveBeenCalledTimes(2);
		expect(screen.getByLabelText('Cancelada, estado actual')).toBeTruthy();
		expect(
			screen.queryByRole('button', { name: 'Cancelar compra' })
		).toBeNull();
	});

	it.each(['c-uti1', 'c-can', 'c-ree'])('%s no ofrece cancelar', async (id) => {
		await abrir(id);
		expect(
			screen.queryByRole('button', { name: 'Cancelar compra' })
		).toBeNull();
	});

	it('visitante → login con volverA del detalle', async () => {
		await abrir('c-con3', null);
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/compra/c-con3' });
	});

	it('ORGANIZADOR → Mis eventos', async () => {
		await abrir('c-con3', ORGANIZADOR);
		expect(screen).toHavePathname('/organizador/eventos');
	});
});

describe('Detalle de compra — US4 reseña', () => {
	it('UTILIZADA: verifica las reseñas del evento y ofrece calificar', async () => {
		await abrir('c-uti1');
		expect(reseniaService.listarReseniasEvento).toHaveBeenCalledWith(
			'ev-pasado'
		);
		expect(
			screen.getByRole('button', { name: 'Calificar evento' })
		).toBeTruthy();
	});

	it.each(['c-con3', 'c-can', 'c-ree', 'c-pen'])(
		'%s no pide reseñas ni ofrece calificar',
		async (id) => {
			await abrir(id);
			expect(reseniaService.listarReseniasEvento).not.toHaveBeenCalled();
			expect(
				screen.queryByRole('button', { name: 'Calificar evento' })
			).toBeNull();
		}
	);

	it.each(['c-uti1', 'c-uti2'])(
		'dos compras del mismo evento ya reseñado: %s no ofrece calificar',
		async (id) => {
			reseniaService.listarReseniasEvento.mockResolvedValue([
				crearResenia({
					eventoId: 'ev-pasado',
					comprador: { id: COMPRADOR.id, nombre: 'Ana', apellido: 'G' }
				})
			]);
			await abrir(id);
			expect(screen.getByText('Ya calificaste este evento')).toBeTruthy();
			expect(
				screen.queryByRole('button', { name: 'Calificar evento' })
			).toBeNull();
		}
	);
});
