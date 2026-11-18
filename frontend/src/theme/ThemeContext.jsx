/**
 * @file Contexto de theme de Al Ticket It (dark por defecto, light alternativo).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, darkTheme } from './theme';

/**
 * Theme activo (colores, tipografías, espaciados, etc.).
 * @typedef {typeof darkTheme} Theme
 */

/** Contexto interno; usar {@link useTheme} para leerlo. */
const ThemeContext = createContext(darkTheme);

/**
 * Provee el theme según el esquema de color del sistema (dark por defecto).
 * @param {Object} props Propiedades.
 * @param {'dark'|'light'} [props.scheme] Fuerza un esquema; si se omite usa el del sistema.
 * @param {import('react').ReactNode} props.children Árbol de la aplicación.
 * @returns Proveedor de theme.
 */
export function ThemeProvider({ scheme, children }) {
	const system = useColorScheme();
	const theme = useMemo(
		() => getTheme(scheme ?? system ?? 'dark'),
		[scheme, system]
	);
	return (
		<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
	);
}

/**
 * Devuelve el theme activo.
 * @returns {Theme} Theme actual.
 */
export function useTheme() {
	return useContext(ThemeContext);
}
