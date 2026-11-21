import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { ChatBubble } from '../../src/components/ChatBubble';
import { getTheme } from '../../src/theme/theme';
import { renderConTema } from '../helpers/renderConTema';

const colores = (scheme) => getTheme(scheme).colors;

const BASE = { texto: 'Hola', hora: '10:00', autor: 'Bruno Pérez' };

const montar = (props = {}, scheme = 'dark') =>
	renderConTema(<ChatBubble {...BASE} {...props} />, { scheme });

/** Aplana el estilo de un nodo. */
const estilo = (nodo) =>
	[nodo.props.style].flat(Infinity).reduce((a, s) => ({ ...a, ...s }), {});

describe('ChatBubble (contracts/componentes.md › ChatBubble)', () => {
	it.each(['dark', 'light'])(
		'propia: derecha y bubbleOwn (%s)',
		async (scheme) => {
			await montar({ propio: true, autor: 'Vos' }, scheme);
			const fila = screen.getByTestId('chat-bubble');
			expect(estilo(fila).alignItems).toBe('flex-end');
			expect(
				estilo(screen.getByTestId('chat-bubble-cuerpo')).backgroundColor
			).toBe(colores(scheme).bubbleOwn);
			expect(screen.getByText('Hola')).toBeTruthy();
			expect(screen.getByText('10:00')).toBeTruthy();
		}
	);

	it.each(['dark', 'light'])(
		'ajena: izquierda y surfaceRaised (%s)',
		async (scheme) => {
			await montar({ propio: false }, scheme);
			expect(estilo(screen.getByTestId('chat-bubble')).alignItems).toBe(
				'flex-start'
			);
			expect(
				estilo(screen.getByTestId('chat-bubble-cuerpo')).backgroundColor
			).toBe(colores(scheme).surfaceRaised);
		}
	);

	it('el autor se ve solo con mostrarAutor en una ajena', async () => {
		await montar({ propio: false });
		expect(screen.queryByText('Bruno Pérez')).toBeNull();
		await montar({ propio: false, mostrarAutor: true });
		expect(screen.getByText('Bruno Pérez')).toBeTruthy();
		await montar({ propio: true, autor: 'Vos', mostrarAutor: true });
		expect(screen.queryByText('Vos')).toBeNull();
	});

	it('accessibilityLabel con autor, hora y texto', async () => {
		await montar({ propio: false });
		expect(screen.getByLabelText('Bruno Pérez, 10:00: Hola')).toBeTruthy();
	});

	it('enviando: sufijo y texto "Enviando…"', async () => {
		await montar({ propio: true, autor: 'Vos', estado: 'enviando' });
		expect(screen.getByLabelText('Vos, 10:00: Hola. Enviando')).toBeTruthy();
		expect(screen.getByText('Enviando…')).toBeTruthy();
	});

	it('error: sufijo, texto del error y "Reintentar" de 44', async () => {
		const alReintentar = jest.fn();
		await montar({
			propio: true,
			autor: 'Vos',
			estado: 'error',
			error: 'Revisá tu conexión e intentá de nuevo.',
			alReintentar
		});
		expect(screen.getByLabelText('Vos, 10:00: Hola. No se envió')).toBeTruthy();
		expect(screen.getByText('No se envió')).toBeTruthy();
		expect(
			screen.getByText('Revisá tu conexión e intentá de nuevo.')
		).toBeTruthy();
		const boton = screen.getByRole('button', { name: 'Reintentar' });
		expect(estilo(boton).minHeight).toBeGreaterThanOrEqual(44);
		await fireEvent.press(boton);
		expect(alReintentar).toHaveBeenCalledTimes(1);
	});

	it('error sin alReintentar no muestra el botón', async () => {
		await montar({ propio: true, autor: 'Vos', estado: 'error' });
		expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
	});
});
