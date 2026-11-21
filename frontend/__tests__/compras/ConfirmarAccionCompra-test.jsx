import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { ConfirmarAccionCompra } from '../../src/compras/ConfirmarAccionCompra';
import { cuerpoAccion } from '../../src/compras/gestionCompras';
import { renderConTema } from '../helpers/renderConTema';
import { crearCompraOrganizador } from '../helpers/comprasEjemplo';

const COMPRA = crearCompraOrganizador({ id: 'c1', estado: 'CONFIRMADA' });

const montar = (props) =>
	renderConTema(
		<ConfirmarAccionCompra
			pedido={null}
			alConfirmar={() => {}}
			alCerrar={() => {}}
			{...props}
		/>
	);

describe('ConfirmarAccionCompra (contracts/componentes.md)', () => {
	it('con pedido null no muestra nada', async () => {
		await montar({ pedido: null });
		expect(screen.queryByText('¿Reembolsar esta compra?')).toBeNull();
		expect(screen.queryByText('¿Cancelar esta compra?')).toBeNull();
	});

	it('reembolsar: título, impacto y etiquetas exactas', async () => {
		const alConfirmar = jest.fn();
		const alCerrar = jest.fn();
		await montar({
			pedido: { accion: 'reembolsar', compra: COMPRA },
			alConfirmar,
			alCerrar
		});
		expect(screen.getByText('¿Reembolsar esta compra?')).toBeTruthy();
		expect(screen.getByText(cuerpoAccion('reembolsar', COMPRA))).toBeTruthy();
		await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
		expect(alCerrar).toHaveBeenCalledTimes(1);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Sí, reembolsar' })
		);
		expect(alConfirmar).toHaveBeenCalledTimes(1);
	});

	it('cancelar: título y etiqueta', async () => {
		await montar({ pedido: { accion: 'cancelar', compra: COMPRA } });
		expect(screen.getByText('¿Cancelar esta compra?')).toBeTruthy();
		expect(screen.getByText(cuerpoAccion('cancelar', COMPRA))).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Sí, cancelar compra' })
		).toBeTruthy();
	});

	it('cargando deshabilita "Volver"', async () => {
		const alCerrar = jest.fn();
		await montar({
			pedido: { accion: 'cancelar', compra: COMPRA },
			cargando: true,
			alCerrar
		});
		expect(
			screen.getByRole('button', { name: 'Volver' }).props.accessibilityState
		).toEqual(expect.objectContaining({ disabled: true }));
	});
});
