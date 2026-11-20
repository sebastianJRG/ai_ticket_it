import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('EmptyState (%s)', (scheme) => {
	it('muestra título como encabezado y cuerpo', async () => {
		await renderConTema(
			<EmptyState
				titulo="Todavía no compraste entradas"
				cuerpo="Tus compras van a aparecer acá."
			/>,
			{ scheme }
		);
		expect(
			screen.getByRole('header', { name: 'Todavía no compraste entradas' })
		).toBeTruthy();
		expect(screen.getByText('Tus compras van a aparecer acá.')).toBeTruthy();
	});

	it('sin acción no muestra botón', async () => {
		await renderConTema(<EmptyState titulo="Nada" />, { scheme });
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('con acción muestra el botón y lo ejecuta', async () => {
		const alPresionar = jest.fn();
		await renderConTema(
			<EmptyState
				titulo="Sin resultados"
				accion={{ etiqueta: 'Limpiar filtros', alPresionar }}
			/>,
			{ scheme }
		);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Limpiar filtros' })
		);
		expect(alPresionar).toHaveBeenCalledTimes(1);
	});

	it.each(['ticket', 'search', 'heart', 'message'])(
		'acepta el ícono %s',
		async (icono) => {
			await renderConTema(<EmptyState icono={icono} titulo="Vacío" />, {
				scheme
			});
			expect(screen.getByRole('header', { name: 'Vacío' })).toBeTruthy();
		}
	);
});
