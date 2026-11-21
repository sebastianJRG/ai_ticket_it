/**
 * @file Barra inferior fija para el botón principal de una pantalla (detalle y
 *   checkout), con el margen de la safe area
 *   (specs/005-detalle-evento-compra/contracts/componentes.md › BarraAccion).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

/**
 * Props de {@link BarraAccion}.
 * @typedef {Object} BarraAccionProps
 * @property {import('react').ReactNode} children Contenido (normalmente un `Button`).
 */

/**
 * Barra inferior con fondo `surface` y borde superior.
 * @param {BarraAccionProps} props Ver {@link BarraAccionProps}.
 * @returns {JSX.Element} Barra fija.
 */
export function BarraAccion({ children }) {
	const t = useTheme();
	const insets = useSafeAreaInsets();
	return (
		<View
			testID="barra-accion"
			style={{
				backgroundColor: t.colors.surface,
				borderTopWidth: 1,
				borderTopColor: t.colors.border,
				paddingHorizontal: t.spacing[4],
				paddingTop: t.spacing[3],
				paddingBottom: insets.bottom + t.spacing[3]
			}}
		>
			{children}
		</View>
	);
}
