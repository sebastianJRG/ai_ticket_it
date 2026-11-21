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
import * as eventoService from '../../src/services/eventoService';
import * as mensajeService from '../../src/services/mensajeService';
import { ApiError } from '../../src/services/api';
import { formatDate, formatPrice } from '../../src/theme/format';
import { COMPRADOR, ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import {
	comprasPorEstado,
	crearCompraOrganizador,
	crearResenia
} from '../helpers/comprasEjemplo';
import { CONVERSACION, crearMensaje } from '../helpers/mensajesEjemplo';

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
	obtenerEvento: jest.fn(() => new Promise(() => {})),
	obtenerComprasEvento: jest.fn()
}));
jest.mock('../../src/services/mensajeService', () => ({
	listarMensajes: jest.fn(),
	enviarMensaje: jest.fn()
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
	mensajeService.listarMensajes.mockResolvedValue([]);
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

	it('en la pestaña Detalle no pide mensajes', async () => {
		await abrir('c-con3');
		expect(mensajeService.listarMensajes).not.toHaveBeenCalled();
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

	it('ORGANIZADOR ya no es redirigido (feature 007, research R1/R9)', async () => {
		await abrir('c-con3', ORGANIZADOR);
		expect(screen).toHavePathname('/compra/c-con3');
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

describe('Detalle de compra — variante ORGANIZADOR (feature 007 US5; research R9)', () => {
	const COMPRA_ORG = crearCompraOrganizador({
		id: 'c1',
		estado: 'CONFIRMADA',
		evento: {
			id: 'ev-1',
			nombre: 'Noche de jazz',
			fecha: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
		}
	});

	async function abrirOrg(url) {
		mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
		await renderRouter(APP, { initialUrl: url });
		await act(async () => {});
	}

	beforeEach(() => {
		eventoService.obtenerComprasEvento.mockResolvedValue({
			compras: [COMPRA_ORG],
			disponibilidad: []
		});
	});

	it('carga las compras del evento (no listarMisCompras) y muestra la compra', async () => {
		await abrirOrg('/compra/c1?evento=ev-1');
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledWith('ev-1');
		expect(compraService.listarMisCompras).not.toHaveBeenCalled();
		expect(screen.getAllByText('Noche de jazz').length).toBeGreaterThan(0);
		expect(screen.getByText('2 × Platea')).toBeTruthy();
		expect(screen.getByText('Comprador: Ana García')).toBeTruthy();
		expect(screen.getAllByText('Confirmada').length).toBeGreaterThan(1);
		expect(screen.getByText('Estado de la compra')).toBeTruthy();
		expect(screen.getByLabelText('Detalle')).toBeTruthy();
		await fireEvent.press(screen.getByLabelText('Chat'));
		expect(screen.getByText('Chat de la compra')).toBeTruthy();
	});

	it('no ofrece acciones de estado', async () => {
		await abrirOrg('/compra/c1?evento=ev-1');
		expect(
			screen.queryByRole('button', { name: 'Cancelar compra' })
		).toBeNull();
		expect(screen.queryByRole('button', { name: 'Reembolsar' })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
	});

	it('sin ?evento: "No encontramos esta compra" sin pedir nada', async () => {
		await abrirOrg('/compra/c1');
		expect(eventoService.obtenerComprasEvento).not.toHaveBeenCalled();
		expect(screen.getByText('No encontramos esta compra')).toBeTruthy();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Ver mis eventos' })
		);
		expect(screen).toHavePathname('/organizador/eventos');
	});

	it('compra que no está en la respuesta → "No encontramos esta compra"', async () => {
		await abrirOrg('/compra/otra?evento=ev-1');
		expect(screen.getByText('No encontramos esta compra')).toBeTruthy();
	});

	it('403 → "No tenés acceso a esta compra"', async () => {
		eventoService.obtenerComprasEvento.mockRejectedValue(
			new ApiError('No', 403)
		);
		await abrirOrg('/compra/c1?evento=ev-1');
		expect(screen.getByText('No tenés acceso a esta compra')).toBeTruthy();
	});
});

describe('Detalle de compra — Chat del COMPRADOR (feature 008 US1)', () => {
	/** Abre la compra y toca la pestaña Chat. */
	async function abrirChat(id) {
		await abrir(id);
		await act(async () => {
			fireEvent.press(screen.getByLabelText('Chat'));
		});
		await act(async () => {});
	}

	it('la pestaña Chat pide los mensajes de la compra y los muestra', async () => {
		mensajeService.listarMensajes.mockResolvedValue(CONVERSACION);
		await abrirChat('c-con3');
		expect(mensajeService.listarMensajes).toHaveBeenCalledWith('c-con3');
		expect(screen.getByText(CONVERSACION[2].mensaje)).toBeTruthy();
		expect(screen.queryByLabelText('Confirmada, estado actual')).toBeNull();
		expect(
			screen.queryByText(
				'Muy pronto vas a poder escribirle al organizador desde acá.'
			)
		).toBeNull();
	});

	it('se puede enviar un mensaje', async () => {
		mensajeService.enviarMensaje.mockResolvedValue(
			crearMensaje({ id: 'm-9', compraId: 'c-con3', mensaje: 'Hola' })
		);
		await abrirChat('c-con3');
		await fireEvent.changeText(
			screen.getByPlaceholderText('Escribí un mensaje'),
			'Hola'
		);
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Enviar mensaje' }));
		});
		expect(mensajeService.enviarMensaje).toHaveBeenCalledWith('c-con3', 'Hola');
		expect(screen.getByText('Hola')).toBeTruthy();
	});

	it.each(['c-can', 'c-uti1'])(
		'%s (cancelada o evento pasado) también permite escribir',
		async (id) => {
			await abrirChat(id);
			await fireEvent.changeText(
				screen.getByPlaceholderText('Escribí un mensaje'),
				'Hola'
			);
			expect(
				screen.getByRole('button', { name: 'Enviar mensaje' }).props
					.accessibilityState
			).toEqual(expect.objectContaining({ disabled: false }));
		}
	);
});
