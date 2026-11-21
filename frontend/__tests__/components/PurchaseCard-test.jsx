import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { PurchaseCard } from '../../src/components/PurchaseCard';
import { formatDate } from '../../src/theme/format';
import { renderConTema } from '../helpers/renderConTema';
import { crearCompraListado } from '../helpers/comprasEjemplo';

const FECHA = '2026-12-12T21:00:00.000Z';
const compra = (parcial) =>
	crearCompraListado({
		evento: { id: 'ev', nombre: 'Gran recital', fecha: FECHA },
		...parcial
	});

const montar = (props, scheme = 'dark') =>
	renderConTema(
		<PurchaseCard
			cancelable={false}
			alPresionar={() => {}}
			alCancelar={() => {}}
			{...props}
		/>,
		{ scheme }
	);

describe('PurchaseCard (contracts/componentes.md › PurchaseCard)', () => {
	it.each(['dark', 'light'])(
		'muestra evento, fecha, cantidad × tipo y total (%s)',
		async (scheme) => {
			await montar({ compra: compra({ estado: 'PENDIENTE' }) }, scheme);
			expect(screen.getByText('Gran recital')).toBeTruthy();
			expect(screen.getByText(formatDate(FECHA))).toBeTruthy();
			expect(screen.getByText('2 × Platea')).toBeTruthy();
			expect(screen.getByText('$ 80.000')).toBeTruthy();
		}
	);

	it('CONFIRMADA con 3 días: badge y cuenta regresiva destacada', async () => {
		await montar({
			compra: compra({ estado: 'CONFIRMADA', diasRestantes: 3 })
		});
		expect(screen.getByText('Confirmada · faltan 3 días')).toBeTruthy();
		expect(screen.getByText('Faltan 3 días')).toBeTruthy();
	});

	it('CONFIRMADA de hoy: "Es hoy"', async () => {
		await montar({
			compra: compra({ estado: 'CONFIRMADA', diasRestantes: 0 })
		});
		expect(screen.getByText('Es hoy')).toBeTruthy();
	});

	it('PENDIENTE: texto corto y ayuda de confirmación', async () => {
		await montar({ compra: compra({ estado: 'PENDIENTE' }) });
		expect(screen.getByText('Pendiente')).toBeTruthy();
		expect(screen.queryByText('Pendiente de pago')).toBeNull();
		expect(
			screen.getByText('Esperando la confirmación del organizador')
		).toBeTruthy();
	});

	it.each(['CANCELADA', 'REEMBOLSADA'])(
		'%s se muestra atenuada',
		async (estado) => {
			await montar({ compra: compra({ estado }) });
			expect(screen.getByTestId('purchase-card').props.style).toEqual(
				expect.objectContaining({ opacity: 0.5 })
			);
		}
	);

	it('UTILIZADA no se atenúa', async () => {
		await montar({ compra: compra({ estado: 'UTILIZADA' }) });
		expect(screen.getByTestId('purchase-card').props.style).toEqual(
			expect.objectContaining({ opacity: 1 })
		);
	});

	it('tocar la tarjeta llama alPresionar; label con evento, fecha y estado', async () => {
		const alPresionar = jest.fn();
		await montar({ compra: compra({ estado: 'UTILIZADA' }), alPresionar });
		const boton = screen.getByRole('button', {
			name: `Gran recital, ${formatDate(FECHA)}, Utilizada`
		});
		await fireEvent.press(boton);
		expect(alPresionar).toHaveBeenCalledTimes(1);
	});

	it('sin cancelable no hay botón "Cancelar"', async () => {
		await montar({ compra: compra({ estado: 'PENDIENTE' }) });
		expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
	});

	it('con cancelable el botón llama alCancelar y no alPresionar', async () => {
		const alPresionar = jest.fn();
		const alCancelar = jest.fn();
		await montar({
			compra: compra({ estado: 'PENDIENTE' }),
			cancelable: true,
			alPresionar,
			alCancelar
		});
		await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
		expect(alCancelar).toHaveBeenCalledTimes(1);
		expect(alPresionar).not.toHaveBeenCalled();
	});
});
