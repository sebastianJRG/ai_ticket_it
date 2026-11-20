/**
 * @file Helper de pruebas: render con safe areas fijas y theme.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/theme/ThemeContext';

/** Métricas fijas para que `useSafeAreaInsets` devuelva valores conocidos. */
export const METRICAS = {
	frame: { x: 0, y: 0, width: 390, height: 844 },
	insets: { top: 47, left: 0, right: 0, bottom: 34 }
};

/**
 * Renderiza `ui` dentro de `SafeAreaProvider` y `ThemeProvider`.
 * @param {import('react').ReactElement} ui Elemento a renderizar.
 * @param {Object} [opciones] Opciones.
 * @param {'dark'|'light'} [opciones.scheme] Tema forzado (dark por defecto).
 * @returns {ReturnType<typeof render>} Promesa con el resultado de `render` (RNTL 14 es asíncrono: usar `await`).
 */
export function renderConTema(ui, { scheme = 'dark' } = {}) {
	return render(
		<SafeAreaProvider initialMetrics={METRICAS}>
			<ThemeProvider scheme={scheme}>{ui}</ThemeProvider>
		</SafeAreaProvider>
	);
}
