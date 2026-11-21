import { act, renderHook } from '@testing-library/react-native';
import { useComprasOrganizador } from '../../src/hooks/useComprasOrganizador';
import * as eventoService from '../../src/services/eventoService';
import { ApiError } from '../../src/services/api';
import { ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { EVENTOS_ORGANIZADOR } from '../helpers/eventosEjemplo';
import { crearCompraOrganizador } from '../helpers/comprasEjemplo';
import { diferido } from '../helpers/diferido';
import { separarMisEventos } from '../../src/eventos/misEventos';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(),
	obtenerComprasEvento: jest.fn()
}));

const PROPIOS = [
	'ev-prop-fut-1',
	'ev-prop-fut-2',
	'ev-prop-pas-2',
	'ev-prop-pas-1'
];
const respuesta = (id) => ({
	compras: [crearCompraOrganizador({ id: `c-${id}`, evento: { id } })],
	disponibilidad: []
});

describe('useComprasOrganizador (data-model.md §5; research R12)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
		eventoService.listarEventos.mockResolvedValue(EVENTOS_ORGANIZADOR);
		eventoService.obtenerComprasEvento.mockImplementation((id) =>
			Promise.resolve(respuesta(id))
		);
	});

	it('pide las compras solo de los eventos propios y arma las secciones', async () => {
		const { result } = await renderHook(() => useComprasOrganizador());
		await act(async () => {});
		const pedidos = eventoService.obtenerComprasEvento.mock.calls.map(
			(c) => c[0]
		);
		expect(pedidos.sort()).toEqual([...PROPIOS].sort());
		expect(result.current.cargando).toBe(false);
		const { proximos, finalizados } = separarMisEventos(
			EVENTOS_ORGANIZADOR,
			'u-organizador'
		);
		expect(result.current.secciones.map((s) => s.evento.id)).toEqual(
			[...proximos, ...finalizados].map((e) => e.id)
		);
		expect(result.current.fallidos).toBe(0);
		expect(result.current.error).toBeNull();
	});

	it('pide en paralelo (todas antes de que responda alguna)', async () => {
		const d = diferido();
		eventoService.obtenerComprasEvento.mockReturnValue(d.promesa);
		await renderHook(() => useComprasOrganizador());
		await act(async () => {});
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledTimes(4);
		await act(async () => d.resolver(respuesta('x')));
	});

	it('algunas fallas → fallidos; todas fallan → error', async () => {
		eventoService.obtenerComprasEvento.mockImplementation((id) =>
			id === 'ev-prop-fut-1'
				? Promise.reject(new ApiError('x', 500))
				: Promise.resolve(respuesta(id))
		);
		const { result } = await renderHook(() => useComprasOrganizador());
		await act(async () => {});
		expect(result.current.fallidos).toBe(1);
		expect(result.current.secciones).toHaveLength(3);
		expect(result.current.error).toBeNull();

		eventoService.obtenerComprasEvento.mockRejectedValue(new ApiError('', 0));
		await act(async () => {
			await result.current.recargar();
		});
		expect(result.current.error.status).toBe(0);
	});

	it('si falla el listado de eventos expone ese error', async () => {
		eventoService.listarEventos.mockRejectedValue(new ApiError('', 0));
		const { result } = await renderHook(() => useComprasOrganizador());
		await act(async () => {});
		expect(result.current.error.status).toBe(0);
		expect(result.current.cargando).toBe(false);
	});

	it('recargar vuelve a pedir eventos y compras', async () => {
		const { result } = await renderHook(() => useComprasOrganizador());
		await act(async () => {});
		await act(async () => {
			await result.current.recargar();
		});
		expect(eventoService.listarEventos).toHaveBeenCalledTimes(2);
		expect(eventoService.obtenerComprasEvento).toHaveBeenCalledTimes(8);
	});

	it('sin eventos propios: sin secciones y sin peticiones de compras', async () => {
		eventoService.listarEventos.mockResolvedValue([]);
		const { result } = await renderHook(() => useComprasOrganizador());
		await act(async () => {});
		expect(result.current.secciones).toEqual([]);
		expect(result.current.cargando).toBe(false);
		expect(eventoService.obtenerComprasEvento).not.toHaveBeenCalled();
	});

	it('no actualiza tras desmontar', async () => {
		const d = diferido();
		eventoService.obtenerComprasEvento.mockReturnValue(d.promesa);
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { unmount } = await renderHook(() => useComprasOrganizador());
		await act(async () => {});
		await unmount();
		await act(async () => d.resolver(respuesta('x')));
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
