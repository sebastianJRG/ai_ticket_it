/**
 * @file Contexto de theme de Al Ticket It (dark por defecto, light alternativo).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, darkTheme } from './theme';

/** Theme activo (colores, tipografías, espaciados, etc.). */
export type Theme = typeof darkTheme;

/** Contexto interno; usar {@link useTheme} para leerlo. */
const ThemeContext = createContext<Theme>(darkTheme);

/**
 * Provee el theme según el esquema de color del sistema (dark por defecto).
 * @param props.scheme Fuerza un esquema ('dark' | 'light'); si se omite usa el del sistema.
 * @param props.children Árbol de la aplicación.
 * @returns Proveedor de theme.
 */
export function ThemeProvider({
	scheme,
	children
}: {
	scheme?: 'dark' | 'light';
	children: React.ReactNode;
}) {
	const system = useColorScheme();
	const theme = useMemo(
		() => getTheme(scheme ?? system ?? 'dark') as Theme,
		[scheme, system]
	);
	return (
		<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
	);
}

/**
 * Devuelve el theme activo.
 * @returns Theme actual.
 */
export function useTheme(): Theme {
	return useContext(ThemeContext);
}
