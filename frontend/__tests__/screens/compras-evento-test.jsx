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
import * as compraService from '../../src/services/compraService';
import { ApiError } from '../../src/services/api';
import { formatDate, formatPrice } from '../../src/theme/format';
import { COMPRADOR, ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { crearEventoDe } from '../helpers/eventosEjemplo';
import {
	COMPRAS_ORGANIZADOR,
	DISPONIBILIDAD_EJEMPLO,
	crearCompraOrganizador
} from '../helpers/comprasEjemplo';
import { diferido } from '../helpers/diferido';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(() => Promise.resolve([])),
	obtenerEvento: jest.fn(),
	obtenerComprasEvento: jest.fn(),
	crearEvento: jest.fn()
}));
jest.mock('../../src/services/compraService', () => ({
	listarMisCompras: jest.fn(() => Promise.resolve([])),
	confirmarCompra: jest.fn(),
	reembolsarCompra: jest.fn(),
	cancelarCompra: jest.fn()
}));
jest.mock('../../src/services/reseniaService', () => ({
	listarReseniasOrganizador: jest.fn(() => Promise.resolve([])),
	listarReseniasEvento: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(() => Promise.resolve([])),
	crearCategoria: jest.fn()
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarReseniasOrganizador: jest.fn(() => Promise.resolve([])),
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(),
	quitarFavorito: jest.fn()
}));

const APP = path.resolve(__dirname, '../../src/app');
const DIA = 24 * 60 * 60 * 1000;
const PROPIO = { id: 'u-organizador', nombre: 'Bruno', apellido: 'Pérez' };
let EVENTO;
let COMPRAS;

/** Compras de ejemplo apuntando al evento de la prueba. */
const comprasDe = (evento) =>
	COMPRAS_ORGANIZADOR.map((c) => ({
		...c,
		evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha }
	}));

async function abrir(usuario = ORGANIZADOR, url = '/evento/ev-1/compras') {
	mockAuth = crearAuthFalso({ usuario });
	await renderRouter(APP, { initialUrl: url });
	await act(async () => {});
}

const filas = () => screen.queryAllByTestId('organizer-purchase-row');

beforeEach(() => {
	jest.clearAllMocks();
	EVENTO = crearEventoDe(PROPIO, {
		id: 'ev-1',
		nombre: 'Noche de jazz',
		fecha: new Date(Date.now() + 10 * DIA).toISOString()
	});
	COMPRAS = comprasDe(EVENTO);
	eventoService.obtenerEvento.mockResolvedValue(EVENTO);
	eventoService.obtenerComprasEvento.mockResolvedValue({
		compras: COMPRAS,
		disponibilidad: DISPONIBILIDAD_EJEMPLO
	});
});

describe('Compras del evento — US3 (contracts/pantallas.md › /evento/[idEvento]/compras)', () => {
	it('muestra nombre y fecha del evento y la disponibilidad del servidor (US3-1)', async () => {
		await abrir();
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledWith('ev-1');
		expect(eventoService.obtenerEvento).toHaveBeenCalledWith('ev-1');
		expect(screen.getAllByText('Noche de jazz').length).toBeGreaterThan(0);
		expect(screen.getByText(formatDate(EVENTO.fecha, 'long'))).toBeTruthy();
		expect(screen.getByText('Vendidas 199 de 220 (90%)')).toBeTruthy();
		expect(screen.getByText('89 / 100')).toBeTruthy();
		expect(screen.getByText('Agotado')).toBeTruthy();
	});

	it('pestañas con contadores; la inicial es Pendientes', async () => {
		await abrir();
		expect(screen.getByTestId('tabs-scroll').props.horizontal).toBe(true);
		expect(screen.getByLabelText('Pendientes, 2')).toBeTruthy();
		expect(screen.getByLabelText('Confirmadas, 1')).toBeTruthy();
		expect(screen.getByLabelText('Utilizadas, 1')).toBeTruthy();
		expect(screen.getByLabelText('Canceladas, 2')).toBeTruthy();
		expect(
			screen.getByLabelText('Pendientes, 2').props.accessibilityState
		).toEqual(expect.objectContaining({ selected: true }));
		expect(filas()).toHaveLength(2);
	});

	it('al cambiar de pestaña ve las de ese estado con comprador, detalle y badge (US3-2)', async () => {
		await abrir();
		await fireEvent.press(screen.getByLabelText('Canceladas, 2'));
		expect(filas()).toHaveLength(2);
		expect(within(filas()[0]).getByText('Reembolsada')).toBeTruthy();
		expect(within(filas()[1]).getByText('Cancelada')).toBeTruthy();
		await fireEvent.press(screen.getByLabelText('Confirmadas, 1'));
		expect(within(filas()[0]).getByText('Lucas Díaz')).toBeTruthy();
		expect(within(filas()[0]).getByText('Confirmada')).toBeTruthy();
	});

	it('una pestaña vacía muestra su texto', async () => {
		eventoService.obtenerComprasEvento.mockResolvedValue({
			compras: [COMPRAS[0]],
			disponibilidad: DISPONIBILIDAD_EJEMPLO
		});
		await abrir();
		await fireEvent.press(screen.getByLabelText('Utilizadas, 0'));
		expect(screen.getByText('Todavía no se usaron entradas')).toBeTruthy();
	});

	it('sin compras: resumen visible y "Todavía no hay compras"', async () => {
		eventoService.obtenerComprasEvento.mockResolvedValue({
			compras: [],
			disponibilidad: DISPONIBILIDAD_EJEMPLO
		});
		await abrir();
		expect(screen.getByText('Vendidas 199 de 220 (90%)')).toBeTruthy();
		expect(screen.getByText('Todavía no hay compras')).toBeTruthy();
		expect(screen.getByLabelText('Pendientes, 0')).toBeTruthy();
	});

	it('tocar una fila abre el detalle de la compra con ?evento=', async () => {
		await abrir();
		await fireEvent.press(within(filas()[0]).getByText('Lucas Díaz'));
		expect(screen).toHavePathname('/compra/co-pen-2');
		expect(screen).toHaveSearchParams({ idCompra: 'co-pen-2', evento: 'ev-1' });
	});

	it('403 → "No tenés acceso a este evento" con "Ver mis eventos" (US3-3)', async () => {
		eventoService.obtenerComprasEvento.mockRejectedValue(
			new ApiError('No', 403)
		);
		await abrir();
		expect(screen.getByText('No tenés acceso a este evento')).toBeTruthy();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Ver mis eventos' })
		);
		expect(screen).toHavePathname('/organizador/eventos');
	});

	it('404 → "Este evento no existe"', async () => {
		eventoService.obtenerComprasEvento.mockRejectedValue(
			new ApiError('No', 404)
		);
		await abrir();
		expect(screen.getByText('Este evento no existe')).toBeTruthy();
	});

	it('otro error → "Reintentar" vuelve a pedir', async () => {
		eventoService.obtenerComprasEvento.mockRejectedValueOnce(
			new ApiError('', 0)
		);
		await abrir();
		expect(screen.getByText('Sin conexión')).toBeTruthy();
		await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		await act(async () => {});
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledTimes(2);
		expect(screen.getByText('Vendidas 199 de 220 (90%)')).toBeTruthy();
	});

	it('si obtenerEvento falla, el título sale de compras[0].evento.nombre', async () => {
		eventoService.obtenerEvento.mockRejectedValue(new ApiError('x', 500));
		await abrir();
		expect(screen.getAllByText('Noche de jazz').length).toBeGreaterThan(0);
	});

	it('mientras carga muestra el esqueleto', async () => {
		eventoService.obtenerComprasEvento.mockReturnValue(diferido().promesa);
		mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
		await renderRouter(APP, { initialUrl: '/evento/ev-1/compras' });
		expect(screen.getByLabelText('Cargando compras del evento')).toBeTruthy();
	});

	it('un COMPRADOR es redirigido al detalle del evento', async () => {
		await abrir(COMPRADOR);
		expect(screen).toHavePathname('/evento/ev-1');
	});

	it('un evento finalizado muestra el rótulo "Finalizado"', async () => {
		EVENTO = { ...EVENTO, fecha: new Date(Date.now() - DIA).toISOString() };
		eventoService.obtenerEvento.mockResolvedValue(EVENTO);
		await abrir();
		expect(screen.getByText('Finalizado')).toBeTruthy();
	});

	it('usa crearCompraOrganizador (sanidad de helpers)', () => {
		expect(crearCompraOrganizador().estado).toBe('PENDIENTE');
	});
});

describe('Compras del evento — US4 acciones (research R11)', () => {
	const conEstados = (cambios) => ({
		compras: COMPRAS.map((c) => ({ ...c, ...(cambios[c.id] ?? {}) })),
		disponibilidad: DISPONIBILIDAD_EJEMPLO
	});
	const enFila = (i, nombre) =>
		within(filas()[i]).queryByRole('button', { name: nombre });

	it('PENDIENTE: Confirmar y Cancelar; CONFIRMADA: Reembolsar y Cancelar (US4-1, US4-2)', async () => {
		await abrir();
		expect(enFila(0, 'Confirmar')).toBeTruthy();
		expect(enFila(0, 'Cancelar')).toBeTruthy();
		expect(enFila(0, 'Reembolsar')).toBeNull();
		await fireEvent.press(screen.getByLabelText('Confirmadas, 1'));
		expect(enFila(0, 'Reembolsar')).toBeTruthy();
		expect(enFila(0, 'Cancelar')).toBeTruthy();
		expect(enFila(0, 'Confirmar')).toBeNull();
	});

	it('UTILIZADA, CANCELADA y REEMBOLSADA no ofrecen acciones (US4-3)', async () => {
		await abrir();
		for (const pestana of ['Utilizadas, 1', 'Canceladas, 2']) {
			await fireEvent.press(screen.getByLabelText(pestana));
			for (let i = 0; i < filas().length; i += 1) {
				expect(enFila(i, 'Confirmar')).toBeNull();
				expect(enFila(i, 'Cancelar')).toBeNull();
				expect(enFila(i, 'Reembolsar')).toBeNull();
			}
		}
	});

	it('con el evento ocurrido ninguna fila ofrece acciones (US4-3)', async () => {
		EVENTO = { ...EVENTO, fecha: new Date(Date.now() - DIA).toISOString() };
		eventoService.obtenerEvento.mockResolvedValue(EVENTO);
		eventoService.obtenerComprasEvento.mockResolvedValue({
			compras: comprasDe(EVENTO),
			disponibilidad: DISPONIBILIDAD_EJEMPLO
		});
		await abrir();
		expect(screen.queryAllByRole('button', { name: 'Confirmar' })).toHaveLength(
			0
		);
		expect(screen.queryAllByRole('button', { name: 'Cancelar' })).toHaveLength(
			0
		);
	});

	it('Confirmar ejecuta sin diálogo, avisa y recarga contadores y disponibilidad (US4-5)', async () => {
		compraService.confirmarCompra.mockResolvedValue({
			...COMPRAS[4],
			estado: 'CONFIRMADA'
		});
		await abrir();
		eventoService.obtenerComprasEvento.mockResolvedValue({
			...conEstados({ 'co-pen-2': { estado: 'CONFIRMADA' } }),
			disponibilidad: DISPONIBILIDAD_EJEMPLO.map((d) =>
				d.tipoEntradaId === 'te-gen'
					? { ...d, vendidas: 90, disponibles: 10 }
					: d
			)
		});
		await fireEvent.press(enFila(0, 'Confirmar'));
		await act(async () => {});
		expect(screen.queryByText('¿Confirmar esta compra?')).toBeNull();
		expect(compraService.confirmarCompra).toHaveBeenCalledWith('co-pen-2');
		expect(screen.getByText('Compra confirmada')).toBeTruthy();
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledTimes(2);
		expect(screen.getByLabelText('Pendientes, 1')).toBeTruthy();
		expect(screen.getByLabelText('Confirmadas, 2')).toBeTruthy();
		expect(screen.getByText('Vendidas 200 de 220 (90%)')).toBeTruthy();
	});

	it('Reembolsar abre el diálogo destructivo; "Volver" no llama al servicio (US4-4)', async () => {
		compraService.reembolsarCompra.mockResolvedValue({
			...COMPRAS[1],
			estado: 'REEMBOLSADA'
		});
		await abrir();
		await fireEvent.press(screen.getByLabelText('Confirmadas, 1'));
		await fireEvent.press(enFila(0, 'Reembolsar'));
		expect(screen.getByText('¿Reembolsar esta compra?')).toBeTruthy();
		expect(
			screen.getByText(
				`Vas a reembolsar 2 × Platea a Lucas Díaz por ${formatPrice(80000)}. No se puede deshacer.`
			)
		).toBeTruthy();
		await fireEvent.press(
			screen.getAllByRole('button', { name: 'Volver' }).at(-1)
		);
		expect(compraService.reembolsarCompra).not.toHaveBeenCalled();

		await fireEvent.press(enFila(0, 'Reembolsar'));
		eventoService.obtenerComprasEvento.mockResolvedValue(
			conEstados({ 'co-con': { estado: 'REEMBOLSADA' } })
		);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Sí, reembolsar' })
		);
		await act(async () => {});
		expect(compraService.reembolsarCompra).toHaveBeenCalledWith('co-con');
		expect(screen.queryByText('¿Reembolsar esta compra?')).toBeNull();
		expect(screen.getByText('Compra reembolsada')).toBeTruthy();
		expect(screen.getByLabelText('Canceladas, 3')).toBeTruthy();
	});

	it('un 400 al cancelar muestra el error y recarga', async () => {
		compraService.cancelarCompra.mockRejectedValue(
			new ApiError('El evento ya ocurrió.', 400)
		);
		await abrir();
		await fireEvent.press(enFila(0, 'Cancelar'));
		expect(screen.getByText('¿Cancelar esta compra?')).toBeTruthy();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Sí, cancelar compra' })
		);
		await act(async () => {});
		expect(compraService.cancelarCompra).toHaveBeenCalledWith('co-pen-2');
		expect(screen.getByText('No se pudo cancelar la compra')).toBeTruthy();
		expect(screen.getByText('El evento ya ocurrió.')).toBeTruthy();
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledTimes(2);
	});

	it('con una acción en curso los botones se deshabilitan y no hay segunda petición', async () => {
		const d = diferido();
		compraService.confirmarCompra.mockReturnValue(d.promesa);
		await abrir();
		await fireEvent.press(enFila(0, 'Confirmar'));
		expect(enFila(1, 'Confirmar').props.accessibilityState).toEqual(
			expect.objectContaining({ disabled: true })
		);
		await fireEvent.press(enFila(1, 'Confirmar'));
		await fireEvent.press(enFila(0, 'Confirmar'));
		expect(compraService.confirmarCompra).toHaveBeenCalledTimes(1);
		await act(async () => d.resolver(COMPRAS[4]));
	});
});
