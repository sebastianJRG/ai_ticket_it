import React from 'react';
import { StyleSheet, View } from 'react-native';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { Avatar } from '../../src/components/Avatar';
import { ReviewCard } from '../../src/components/ReviewCard';
import { renderConTema } from '../helpers/renderConTema';
import { DETALLE_LARGO } from '../helpers/comprasEjemplo';

describe.each(['dark', 'light'])('Avatar (%s)', (scheme) => {
	it('muestra las iniciales y no es accesible por sí mismo', async () => {
		await renderConTema(<Avatar nombre="Ana López" iniciales="AL" />, {
			scheme
		});
		const avatar = screen.getByTestId('avatar', {
			includeHiddenElements: true
		});
		expect(
			screen.getByText('AL', { includeHiddenElements: true })
		).toBeTruthy();
		expect(avatar.props.accessible).toBe(false);
	});

	it('mismo nombre → mismo color; tamaño configurable (32 por defecto)', async () => {
		await renderConTema(
			<View>
				<Avatar nombre="Ana López" iniciales="AL" />
				<Avatar nombre="Ana López" iniciales="AL" tamano={64} />
			</View>,
			{ scheme }
		);
		const [a, b] = screen
			.getAllByTestId('avatar', { includeHiddenElements: true })
			.map((n) => StyleSheet.flatten(n.props.style));
		expect(a.backgroundColor).toBe(b.backgroundColor);
		expect(a.width).toBe(32);
		expect(b.width).toBe(64);
	});
});

describe.each(['dark', 'light'])('ReviewCard (%s)', (scheme) => {
	it('muestra autor, estrellas y comentario con label completo', async () => {
		await renderConTema(
			<ReviewCard
				autor="Ana L."
				iniciales="AL"
				puntuacion={4}
				detalle="Muy buena noche"
			/>,
			{ scheme }
		);
		expect(screen.getByText('Ana L.')).toBeTruthy();
		expect(screen.getByText('Muy buena noche')).toBeTruthy();
		expect(
			screen.getByLabelText('Ana L., 4 de 5 estrellas: Muy buena noche')
		).toBeTruthy();
	});

	it('comentario corto no ofrece "Leer más"', async () => {
		await renderConTema(
			<ReviewCard
				autor="Ana L."
				iniciales="AL"
				puntuacion={5}
				detalle="Corto"
			/>,
			{ scheme }
		);
		await act(async () => {
			fireEvent(screen.getByText('Corto'), 'textLayout', {
				nativeEvent: { lines: [{}, {}] }
			});
		});
		expect(screen.queryByRole('button', { name: 'Leer más' })).toBeNull();
	});

	it('comentario de más de 6 líneas: "Leer más" lo expande y "Leer menos" lo contrae', async () => {
		await renderConTema(
			<ReviewCard
				autor="Diego S."
				iniciales="DS"
				puntuacion={4}
				detalle={DETALLE_LARGO}
			/>,
			{ scheme }
		);
		const texto = screen.getByText(DETALLE_LARGO);
		expect(texto.props.numberOfLines).toBe(6);
		await act(async () => {
			fireEvent(texto, 'textLayout', {
				nativeEvent: { lines: Array.from({ length: 9 }, () => ({})) }
			});
		});
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Leer más' }));
		});
		expect(screen.getByText(DETALLE_LARGO).props.numberOfLines).toBeUndefined();
		expect(screen.getByRole('button', { name: 'Leer menos' })).toBeTruthy();
	});
});
