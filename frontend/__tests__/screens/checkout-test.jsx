/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen
} from 'expo-router/testing-library';
import * as eventoService from '../../src/services/eventoService';
import * as compraService from '../../src/services/compraService';
import { ApiError } from '../../src/services/api';
import { COMPRADOR, crearAuthFalso } from '../helpers/authFalso';
import { crearEvento } from '../helpers/eventosEjemplo';
import { diferido } from '../helpers/diferido';
import {
	TIPOS_CHECKOUT,
	crearCompraRespuesta
} from '../helpers/comprasEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(() => Promise.resolve([])),
	obtenerEvento: jest.fn()
}));
jest.mock('../../src/services/compraService', () => ({
	crearCompra: jest.fn()
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarReseniasOrganizador: jest.fn(() => Promise.resolve([])),
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(() => Promise.resolve([])),
	quitarFavorito: jest.fn(() => Promise.resolve([]))
}));

const APP = path.resolve(__dirname, '../../src/app');
const DIA = 86400000;
const enDias = (n) => new Date(Date.now() + n * DIA).toISOString();

const EVENTO = crearEvento({
	id: 'ev-1',
	nombre: 'Gran recital',
	fecha: enDias(10),
	tiposEntrada: TIPOS_CHECKOUT
});

/**
 * Monta la app real en el checkout de `ev-1` con sesión de COMPRADOR.
 * @returns {Promise<void>}
 */
async function abrir() {
	mockAuth = crearAuthFalso({ usuario: COMPRADOR });
	await renderRouter(APP, { initialUrl: '/evento/ev-1/comprar' });
	await screen.findByRole('header', { name: 'Comprar entradas' });
}

const fila = (nombre) =>
	screen.getByRole('radio', { name: new RegExp(`^${nombre},`) });
const confirmar = () =>
	screen.getByRole('button', {
		name: /^(Confirmar compra|Elegí|Evento finalizado)/
	});
const presionar = async (el) => {
	await act(async () => {
		fireEvent.press(el);
	});
};

/**
 * Elige Platea y sube a 2 entradas.
 * @returns {Promise<void>}
 */
async function elegirPlateaPorDos() {
	await presionar(await screen.findByRole('radio', { name: /^Platea,/ }));
	await presionar(screen.getByRole('button', { name: 'Sumar una' }));
}

describe('Checkout — US3 (contracts/pantallas.md › /evento/[idEvento]/comprar)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		eventoService.obtenerEvento.mockResolvedValue(EVENTO);
	});

	it('header con el evento; con varios tipos ninguno elegido y botón deshabilitado', async () => {
		await abrir();
		expect(await screen.findByText('Gran recital')).toBeTruthy();
		expect(eventoService.obtenerEvento).toHaveBeenCalledWith('ev-1');
		for (const n of ['General', 'Platea', 'Invitación', 'Agotada']) {
			expect(fila(n)).not.toBeChecked();
		}
		expect(confirmar()).toHaveTextContent('Elegí un tipo de entrada');
		expect(confirmar()).toBeDisabled();
	});

	it('muestra el cupo disponible y topa la cantidad (corrección 2)', async () => {
		const [general, ...resto] = TIPOS_CHECKOUT;
		eventoService.obtenerEvento.mockResolvedValue({
			...EVENTO,
			tiposEntrada: [{ ...general, cupo: 10, disponibles: 5 }, ...resto]
		});
		await abrir();
		expect(await screen.findByText('Quedan 5 entradas')).toBeTruthy();
		await presionar(fila('General'));
		const sumar = screen.getByRole('button', { name: 'Sumar una' });
		for (let i = 0; i < 6; i += 1) await presionar(sumar);
		expect(screen.getByText('5')).toBeTruthy();
		expect(screen.getByText('Solo quedan 5 entradas de General.')).toBeTruthy();
	});

	it('elegir un tipo y cantidad muestra el total y el monto en el botón (US3-1, FR-005)', async () => {
		await abrir();
		await elegirPlateaPorDos();
		expect(fila('Platea')).toBeChecked();
		expect(screen.getAllByText(/^\$\s80\.000$/).length).toBeGreaterThan(0);
		expect(confirmar()).toHaveTextContent(/^Confirmar compra · \$\s80\.000$/);
		expect(confirmar()).not.toBeDisabled();
	});

	it('en el cupo el "+" se deshabilita e informa el máximo (US3-2, SC-002)', async () => {
		await abrir();
		await elegirPlateaPorDos();
		expect(screen.getByRole('button', { name: 'Sumar una' })).toBeDisabled();
		expect(screen.getByText('Máximo 2')).toBeTruthy();
	});

	it('el tipo agotado no se puede elegir', async () => {
		await abrir();
		await presionar(fila('Agotada'));
		expect(fila('Agotada')).not.toBeChecked();
		expect(fila('Agotada')).toBeDisabled();
	});

	it('cambiar de tipo reinicia la cantidad a 1', async () => {
		await abrir();
		await elegirPlateaPorDos();
		await presionar(fila('General'));
		expect(confirmar()).toHaveTextContent(/^Confirmar compra · \$\s25\.000$/);
	});

	it('confirmar crea la compra con tipo y cantidad elegidos', async () => {
		compraService.crearCompra.mockResolvedValue(crearCompraRespuesta());
		await abrir();
		await elegirPlateaPorDos();
		await presionar(confirmar());
		expect(compraService.crearCompra).toHaveBeenCalledWith({
			eventoId: 'ev-1',
			tipoEntradaId: 'te-pla',
			cantidad: 2
		});
	});

	it('doble toque en confirmar → una sola compra y botón ocupado (SC-003)', async () => {
		const d = diferido();
		compraService.crearCompra.mockReturnValue(d.promesa);
		await abrir();
		await elegirPlateaPorDos();
		const boton = confirmar();
		await act(async () => {
			fireEvent.press(boton);
			fireEvent.press(boton);
		});
		expect(compraService.crearCompra).toHaveBeenCalledTimes(1);
		expect(confirmar().props.accessibilityState.busy).toBe(true);
		await act(async () => d.resolver(crearCompraRespuesta()));
	});

	it('409 → "No quedan suficientes entradas de este tipo" y sigue editable (US3-3)', async () => {
		compraService.crearCompra.mockRejectedValue(
			new ApiError('Cupo insuficiente: queda 1 entrada disponible.', 409)
		);
		await abrir();
		await elegirPlateaPorDos();
		await presionar(confirmar());
		expect(
			await screen.findByText('No quedan suficientes entradas de este tipo')
		).toBeTruthy();
		expect(
			screen.getByText('Cupo insuficiente: queda 1 entrada disponible.')
		).toBeTruthy();
		expect(confirmar()).not.toBeDisabled();
		expect(eventoService.obtenerEvento).toHaveBeenCalledTimes(2);
		await presionar(screen.getByRole('button', { name: 'Restar una' }));
		expect(
			screen.queryByText('No quedan suficientes entradas de este tipo')
		).toBeNull();
		expect(confirmar()).toHaveTextContent(/^Confirmar compra · \$\s40\.000$/);
	});

	it('400 con el evento ya ocurrido → mensaje del servidor y "Evento finalizado" (US3-4)', async () => {
		const fecha = Date.now() + DIA;
		eventoService.obtenerEvento.mockResolvedValue({
			...EVENTO,
			fecha: new Date(fecha).toISOString()
		});
		compraService.crearCompra.mockRejectedValue(
			new ApiError('El evento ya ocurrió.', 400)
		);
		await abrir();
		await elegirPlateaPorDos();
		// El reloj avanza más allá del evento mientras el comprador decide: solo
		// se falsea Date, los timers siguen reales.
		jest.useFakeTimers({
			doNotFake: [
				'hrtime',
				'nextTick',
				'performance',
				'queueMicrotask',
				'requestAnimationFrame',
				'cancelAnimationFrame',
				'requestIdleCallback',
				'cancelIdleCallback',
				'setImmediate',
				'clearImmediate',
				'setInterval',
				'clearInterval',
				'setTimeout',
				'clearTimeout'
			]
		});
		try {
			jest.setSystemTime(fecha + 1000);
			await presionar(confirmar());
			expect(await screen.findByText('El evento ya ocurrió.')).toBeTruthy();
			expect(confirmar()).toHaveTextContent('Evento finalizado');
			expect(confirmar()).toBeDisabled();
		} finally {
			jest.useRealTimers();
		}
	});

	it('403 → mensaje y botón deshabilitado', async () => {
		compraService.crearCompra.mockRejectedValue(new ApiError('x', 403));
		await abrir();
		await elegirPlateaPorDos();
		await presionar(confirmar());
		expect(
			await screen.findByText('Solo los compradores pueden comprar entradas')
		).toBeTruthy();
		expect(confirmar()).toBeDisabled();
	});

	it('404 → mensaje y "Volver a Explorar"', async () => {
		compraService.crearCompra.mockRejectedValue(new ApiError('x', 404));
		await abrir();
		await elegirPlateaPorDos();
		await presionar(confirmar());
		expect(
			await screen.findByText('Este evento o tipo de entrada ya no existe')
		).toBeTruthy();
		await presionar(screen.getByRole('button', { name: 'Volver a Explorar' }));
		expect(screen).toHavePathname('/explorar');
	});

	it('sin conexión → "Sin conexión" y se puede reintentar', async () => {
		compraService.crearCompra
			.mockRejectedValueOnce(new ApiError('x', 0))
			.mockResolvedValueOnce(crearCompraRespuesta());
		await abrir();
		await elegirPlateaPorDos();
		await presionar(confirmar());
		expect(await screen.findByText('Sin conexión')).toBeTruthy();
		await presionar(confirmar());
		expect(compraService.crearCompra).toHaveBeenCalledTimes(2);
		expect(await screen.findByText('Compra creada')).toBeTruthy();
	});

	it('éxito → aviso de pendiente con el total del servidor y "Ver mis compras" (US3-6, FR-007)', async () => {
		compraService.crearCompra.mockResolvedValue(
			crearCompraRespuesta({ total: 79999, cantidad: 2 })
		);
		await abrir();
		await elegirPlateaPorDos();
		await presionar(confirmar());
		expect(await screen.findByText('Compra creada')).toBeTruthy();
		expect(
			screen.getByText('Quedó pendiente de confirmación del organizador.')
		).toBeTruthy();
		expect(screen.getByText(/^\$\s79\.999$/)).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Volver' })).toBeNull();
		await presionar(screen.getByRole('button', { name: 'Ver mis compras' }));
		expect(screen).toHavePathname('/compras');
	});

	it('éxito → "Volver al evento" lleva al detalle', async () => {
		compraService.crearCompra.mockResolvedValue(crearCompraRespuesta());
		await abrir();
		await elegirPlateaPorDos();
		await presionar(confirmar());
		await screen.findByText('Compra creada');
		await presionar(screen.getByRole('button', { name: 'Volver al evento' }));
		expect(screen).toHavePathname('/evento/ev-1');
	});

	it('un solo tipo disponible → preseleccionado (SC-001)', async () => {
		eventoService.obtenerEvento.mockResolvedValue({
			...EVENTO,
			tiposEntrada: [TIPOS_CHECKOUT[1], TIPOS_CHECKOUT[3]]
		});
		await abrir();
		expect(
			await screen.findByRole('radio', { name: /^Platea,/ })
		).toBeChecked();
		expect(confirmar()).toHaveTextContent(/^Confirmar compra · \$\s40\.000$/);
	});

	it('evento ya ocurrido al cargar → "Evento finalizado"', async () => {
		eventoService.obtenerEvento.mockResolvedValue({
			...EVENTO,
			fecha: enDias(-1)
		});
		await abrir();
		expect(await screen.findByText('Este evento ya ocurrió')).toBeTruthy();
		expect(confirmar()).toHaveTextContent('Evento finalizado');
		expect(confirmar()).toBeDisabled();
	});

	it('evento inexistente → "Evento no encontrado"', async () => {
		eventoService.obtenerEvento.mockRejectedValue(new ApiError('x', 404));
		mockAuth = crearAuthFalso({ usuario: COMPRADOR });
		await renderRouter(APP, { initialUrl: '/evento/ev-1/comprar' });
		expect(await screen.findByText('Evento no encontrado')).toBeTruthy();
	});
});
