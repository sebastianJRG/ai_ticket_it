import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { SelectorCategoria } from '../../src/eventos/SelectorCategoria';
import { ToastProvider } from '../../src/feedback/ToastContext';
import * as categoriaService from '../../src/services/categoriaService';
import { ApiError } from '../../src/services/api';
import { renderConTema } from '../helpers/renderConTema';
import { CATEGORIAS } from '../helpers/eventosEjemplo';

jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(),
	crearCategoria: jest.fn()
}));

async function montar(props = {}) {
	const alElegir = jest.fn();
	const alPerderFoco = jest.fn();
	await renderConTema(
		<ToastProvider>
			<SelectorCategoria
				valor={null}
				alElegir={alElegir}
				alPerderFoco={alPerderFoco}
				{...props}
			/>
		</ToastProvider>
	);
	await act(async () => {});
	return { alElegir, alPerderFoco };
}

const abrir = () =>
	fireEvent.press(
		screen.getByRole('button', { name: 'Categoría, sin elegir' })
	);

describe('SelectorCategoria (research R8; contracts/pantallas.md › Selector de categoría)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		categoriaService.listarCategorias.mockResolvedValue(CATEGORIAS);
	});

	it('abre el sheet con las categorías y "+ Crear categoría"; elegir avisa y cierra', async () => {
		const { alElegir } = await montar();
		await abrir();
		expect(screen.getByRole('radio', { name: 'Recitales' })).toBeTruthy();
		expect(screen.getByRole('radio', { name: 'Teatro' })).toBeTruthy();
		expect(
			screen.getByRole('button', { name: '+ Crear categoría' })
		).toBeTruthy();
		await fireEvent.press(screen.getByRole('radio', { name: 'Teatro' }));
		expect(alElegir).toHaveBeenCalledWith('cat-tea');
		expect(screen.queryByRole('radio', { name: 'Teatro' })).toBeNull();
	});

	it('crea una categoría, la agrega, la elige y avisa con toast (US1-4)', async () => {
		const jazz = {
			id: 'cat-jazz',
			nombre: 'Jazz',
			descripcion: 'Música en vivo'
		};
		categoriaService.crearCategoria.mockResolvedValue(jazz);
		const { alElegir } = await montar();
		await abrir();
		await fireEvent.press(
			screen.getByRole('button', { name: '+ Crear categoría' })
		);
		await fireEvent.changeText(
			screen.getByLabelText('Nombre de la categoría'),
			' Jazz '
		);
		await fireEvent.changeText(
			screen.getByLabelText('Descripción de la categoría'),
			'Música en vivo '
		);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Crear y elegir' })
		);
		await act(async () => {});
		expect(categoriaService.crearCategoria).toHaveBeenCalledWith({
			nombre: 'Jazz',
			descripcion: 'Música en vivo'
		});
		expect(alElegir).toHaveBeenCalledWith('cat-jazz');
		expect(screen.getByText('Categoría creada')).toBeTruthy();
		await abrir();
		expect(screen.getByRole('radio', { name: 'Jazz' })).toBeTruthy();
	});

	it('valida antes de enviar: sin datos no llama al servicio', async () => {
		await montar();
		await abrir();
		await fireEvent.press(
			screen.getByRole('button', { name: '+ Crear categoría' })
		);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Crear y elegir' })
		);
		expect(screen.getByText('Escribí el nombre de la categoría.')).toBeTruthy();
		expect(
			screen.getByText('Escribí una descripción de la categoría.')
		).toBeTruthy();
		expect(categoriaService.crearCategoria).not.toHaveBeenCalled();
	});

	it('error 400: el mensaje del servidor queda en el sheet y conserva lo escrito', async () => {
		categoriaService.crearCategoria.mockRejectedValue(
			new ApiError('El nombre de la categoría no puede estar vacío.', 400)
		);
		await montar();
		await abrir();
		await fireEvent.press(
			screen.getByRole('button', { name: '+ Crear categoría' })
		);
		await fireEvent.changeText(
			screen.getByLabelText('Nombre de la categoría'),
			'Jazz'
		);
		await fireEvent.changeText(
			screen.getByLabelText('Descripción de la categoría'),
			'Música'
		);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Crear y elegir' })
		);
		await act(async () => {});
		expect(
			screen.getByText('El nombre de la categoría no puede estar vacío.')
		).toBeTruthy();
		expect(screen.getByLabelText('Nombre de la categoría').props.value).toBe(
			'Jazz'
		);
	});

	it('sin categorías muestra solo "+ Crear categoría" y la ayuda', async () => {
		categoriaService.listarCategorias.mockResolvedValue([]);
		await montar();
		await abrir();
		expect(screen.queryAllByRole('radio')).toHaveLength(0);
		expect(screen.getByText('Todavía no hay categorías')).toBeTruthy();
		expect(
			screen.getByRole('button', { name: '+ Crear categoría' })
		).toBeTruthy();
	});

	it('cerrar el sheet marca el campo como tocado', async () => {
		const { alPerderFoco } = await montar();
		await abrir();
		await fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));
		expect(alPerderFoco).toHaveBeenCalled();
	});
});
