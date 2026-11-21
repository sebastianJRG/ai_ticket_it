import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { ConfirmarCancelacion } from '../../src/compras/ConfirmarCancelacion';
import { ToastProvider } from '../../src/feedback/ToastContext';
import { cuerpoCancelacion } from '../../src/compras/misCompras';
import * as compraService from '../../src/services/compraService';
import { ApiError } from '../../src/services/api';
import { renderConTema } from '../helpers/renderConTema';
import { diferido } from '../helpers/diferido';
import { crearCompraListado } from '../helpers/comprasEjemplo';

jest.mock('../../src/services/compraService', () => ({
	cancelarCompra: jest.fn()
}));

const COMPRA = crearCompraListado({
	id: 'c1',
	estado: 'CONFIRMADA',
	evento: { id: 'e', nombre: 'Gran recital', fecha: '2030-01-01T21:00:00Z' }
});

const montar = (props) =>
	renderConTema(
		<ToastProvider>
			<ConfirmarCancelacion
				compra={COMPRA}
				alCerrar={() => {}}
				alTerminar={() => {}}
				{...props}
			/>
		</ToastProvider>
	);

describe('ConfirmarCancelacion (contracts/componentes.md)', () => {
	beforeEach(() => jest.clearAllMocks());

	it('con compra null no muestra el diálogo', async () => {
		await montar({ compra: null });
		expect(screen.queryByText('¿Cancelar esta compra?')).toBeNull();
	});

	it('muestra título, impacto y las dos acciones (US2-1)', async () => {
		await montar();
		expect(
			screen.getByRole('header', { name: '¿Cancelar esta compra?' })
		).toBeTruthy();
		expect(screen.getByText(cuerpoCancelacion(COMPRA))).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Sí, cancelar compra' })
		).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'No, conservar entradas' })
		).toBeTruthy();
	});

	it('"No, conservar entradas" cierra sin petición', async () => {
		const alCerrar = jest.fn();
		await montar({ alCerrar });
		await fireEvent.press(
			screen.getByRole('button', { name: 'No, conservar entradas' })
		);
		expect(alCerrar).toHaveBeenCalledTimes(1);
		expect(compraService.cancelarCompra).not.toHaveBeenCalled();
	});

	it('mientras envía: confirmar ocupado y conservar deshabilitado', async () => {
		const d = diferido();
		compraService.cancelarCompra.mockReturnValue(d.promesa);
		await montar();
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Sí, cancelar compra' })
			);
		});
		expect(compraService.cancelarCompra).toHaveBeenCalledWith('c1');
		expect(
			screen.getByRole('button', { name: 'No, conservar entradas' }).props
				.accessibilityState
		).toEqual(expect.objectContaining({ disabled: true }));
		await act(async () => d.resolver(COMPRA));
	});

	it('200 → toast "Compra cancelada", alTerminar ok y cierra (US2-2)', async () => {
		compraService.cancelarCompra.mockResolvedValue({
			...COMPRA,
			estado: 'CANCELADA'
		});
		const alTerminar = jest.fn();
		const alCerrar = jest.fn();
		await montar({ alTerminar, alCerrar });
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Sí, cancelar compra' })
			);
		});
		expect(screen.getByText('Compra cancelada')).toBeTruthy();
		expect(alTerminar).toHaveBeenCalledWith(
			expect.objectContaining({ ok: true })
		);
		expect(alCerrar).toHaveBeenCalled();
	});

	it('400 → toast con el error, alTerminar no ok y cierra (US2-4)', async () => {
		compraService.cancelarCompra.mockRejectedValue(
			new ApiError('El evento ya ocurrió.', 400)
		);
		const alTerminar = jest.fn();
		const alCerrar = jest.fn();
		await montar({ alTerminar, alCerrar });
		await act(async () => {
			fireEvent.press(
				screen.getByRole('button', { name: 'Sí, cancelar compra' })
			);
		});
		expect(screen.getByText('No se puede cancelar esta compra')).toBeTruthy();
		expect(alTerminar).toHaveBeenCalledWith(
			expect.objectContaining({ ok: false })
		);
		expect(alCerrar).toHaveBeenCalled();
	});
});
