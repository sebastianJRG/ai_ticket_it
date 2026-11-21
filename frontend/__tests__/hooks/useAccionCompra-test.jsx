import { act, renderHook } from '@testing-library/react-native';
import { useAccionCompra } from '../../src/hooks/useAccionCompra';
import * as compraService from '../../src/services/compraService';
import { ApiError } from '../../src/services/api';
import { diferido } from '../helpers/diferido';
import { crearCompraOrganizador } from '../helpers/comprasEjemplo';

jest.mock('../../src/services/compraService', () => ({
	confirmarCompra: jest.fn(),
	reembolsarCompra: jest.fn(),
	cancelarCompra: jest.fn()
}));

const COMPRA = crearCompraOrganizador({ id: 'c1', estado: 'PENDIENTE' });
const OTRA = crearCompraOrganizador({ id: 'c2', estado: 'CONFIRMADA' });

describe('useAccionCompra (data-model.md §5; research R11)', () => {
	beforeEach(() => jest.clearAllMocks());

	it.each([
		['confirmar', 'confirmarCompra'],
		['reembolsar', 'reembolsarCompra'],
		['cancelar', 'cancelarCompra']
	])('%s llama a %s con el ID', async (accion, servicio) => {
		compraService[servicio].mockResolvedValue({ ...COMPRA });
		const alTerminar = jest.fn();
		const { result } = await renderHook(() => useAccionCompra({ alTerminar }));
		await act(async () => {
			await result.current.ejecutar(accion, COMPRA);
		});
		expect(compraService[servicio]).toHaveBeenCalledWith('c1');
		expect(alTerminar).toHaveBeenCalledWith({
			ok: true,
			accion,
			compra: { ...COMPRA }
		});
	});

	it('enCurso vale { accion, idCompra } mientras espera y null al terminar', async () => {
		const d = diferido();
		compraService.confirmarCompra.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useAccionCompra());
		expect(result.current.enCurso).toBeNull();
		let p;
		await act(async () => {
			p = result.current.ejecutar('confirmar', COMPRA);
		});
		expect(result.current.enCurso).toEqual({
			accion: 'confirmar',
			idCompra: 'c1'
		});
		await act(async () => {
			d.resolver(COMPRA);
			await p;
		});
		expect(result.current.enCurso).toBeNull();
	});

	it('una segunda ejecución en curso se ignora, aunque sea otra compra', async () => {
		const d = diferido();
		compraService.confirmarCompra.mockReturnValue(d.promesa);
		const { result } = await renderHook(() => useAccionCompra());
		await act(async () => {
			result.current.ejecutar('confirmar', COMPRA);
			result.current.ejecutar('reembolsar', OTRA);
		});
		expect(compraService.confirmarCompra).toHaveBeenCalledTimes(1);
		expect(compraService.reembolsarCompra).not.toHaveBeenCalled();
		await act(async () => d.resolver(COMPRA));
	});

	it('error → alTerminar con ok false, sin lanzar', async () => {
		const error = new ApiError('El evento ya ocurrió.', 400);
		compraService.cancelarCompra.mockRejectedValue(error);
		const alTerminar = jest.fn();
		const { result } = await renderHook(() => useAccionCompra({ alTerminar }));
		await act(async () => {
			await expect(
				result.current.ejecutar('cancelar', COMPRA)
			).resolves.toBeUndefined();
		});
		expect(alTerminar).toHaveBeenCalledWith({
			ok: false,
			accion: 'cancelar',
			error
		});
		expect(result.current.enCurso).toBeNull();
	});

	it('no actualiza ni avisa tras desmontar', async () => {
		const d = diferido();
		compraService.confirmarCompra.mockReturnValue(d.promesa);
		const alTerminar = jest.fn();
		const errores = jest.spyOn(console, 'error').mockImplementation(() => {});
		const { result, unmount } = await renderHook(() =>
			useAccionCompra({ alTerminar })
		);
		await act(async () => {
			result.current.ejecutar('confirmar', COMPRA);
		});
		await unmount();
		await act(async () => d.resolver(COMPRA));
		expect(alTerminar).not.toHaveBeenCalled();
		expect(errores).not.toHaveBeenCalled();
		errores.mockRestore();
	});
});
