import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { OrganizerPurchaseRow } from '../../src/components/OrganizerPurchaseRow';
import { formatPrice } from '../../src/theme/format';
import { renderConTema } from '../helpers/renderConTema';
import { crearCompraOrganizador } from '../helpers/comprasEjemplo';

const COMPRA = crearCompraOrganizador({ id: 'c1', estado: 'PENDIENTE' });

const montar = (props = {}, scheme = 'dark') =>
	renderConTema(
		<OrganizerPurchaseRow compra={COMPRA} alPresionar={() => {}} {...props} />,
		{ scheme }
	);

describe('OrganizerPurchaseRow — presentación (contracts/componentes.md)', () => {
	it.each(['dark', 'light'])(
		'muestra comprador, detalle y estado (%s)',
		async (scheme) => {
			await montar({}, scheme);
			expect(screen.getByText('Ana García')).toBeTruthy();
			expect(
				screen.getByText(`2 × Platea · ${formatPrice(80000)}`)
			).toBeTruthy();
			expect(screen.getByText('Pendiente')).toBeTruthy();
		}
	);

	it('sin acciones no hay botones de acción', async () => {
		await montar();
		expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Reembolsar' })).toBeNull();
	});

	it('tocar la fila llama a alPresionar', async () => {
		const alPresionar = jest.fn();
		await montar({ alPresionar });
		await fireEvent.press(screen.getByText('Ana García'));
		expect(alPresionar).toHaveBeenCalledTimes(1);
	});

	it('la fila tiene altura mínima 72', async () => {
		await montar();
		const fila = screen.getByTestId('organizer-purchase-row');
		const estilo = [fila.props.style]
			.flat(Infinity)
			.reduce((a, s) => ({ ...a, ...s }), {});
		expect(estilo.minHeight).toBe(72);
	});
});

describe('OrganizerPurchaseRow — acciones (research R11)', () => {
	it('muestra Confirmar y Cancelar, o Reembolsar y Cancelar', async () => {
		await montar({ acciones: ['confirmar', 'cancelar'] });
		expect(screen.getByRole('button', { name: 'Confirmar' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Reembolsar' })).toBeNull();
	});

	it('con reembolsar y cancelar', async () => {
		await montar({ acciones: ['reembolsar', 'cancelar'] });
		expect(screen.getByRole('button', { name: 'Reembolsar' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
	});

	it('tocar una acción llama a alAccion y no a alPresionar', async () => {
		const alAccion = jest.fn();
		const alPresionar = jest.fn();
		await montar({
			acciones: ['confirmar', 'cancelar'],
			alAccion,
			alPresionar
		});
		await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
		expect(alAccion).toHaveBeenCalledWith('confirmar');
		expect(alPresionar).not.toHaveBeenCalled();
	});

	it('con enCurso el botón queda ocupado y no responde', async () => {
		const alAccion = jest.fn();
		await montar({
			acciones: ['confirmar', 'cancelar'],
			enCurso: 'confirmar',
			alAccion
		});
		expect(
			screen.getByRole('button', { name: 'Confirmar' }).props.accessibilityState
		).toEqual(expect.objectContaining({ busy: true }));
		await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
		expect(alAccion).not.toHaveBeenCalled();
	});

	it('deshabilitada: ningún botón llama a alAccion', async () => {
		const alAccion = jest.fn();
		await montar({
			acciones: ['confirmar', 'cancelar'],
			deshabilitada: true,
			alAccion
		});
		await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
		await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
		expect(alAccion).not.toHaveBeenCalled();
		expect(
			screen.getByRole('button', { name: 'Cancelar' }).props.accessibilityState
		).toEqual(expect.objectContaining({ disabled: true }));
	});
});
