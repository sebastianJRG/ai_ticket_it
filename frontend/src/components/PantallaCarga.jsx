/**
 * @file Pantalla de carga mientras se restaura la sesión (research R5): marca
 *   estática, sin spinner, para no mostrar un parpadeo de login.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Vista de marca a pantalla completa, anunciada como "Cargando sesión".
 * @returns {JSX.Element} Pantalla de carga.
 */
export function PantallaCarga() {
	const t = useTheme();
	return (
		<View
			accessible
			accessibilityLabel="Cargando sesión"
			style={{
				flex: 1,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: t.colors.bg
			}}
		>
			<Text
				maxFontSizeMultiplier={1.4}
				style={[t.typography.displayLg, { color: t.colors.text }]}
			>
				Al Ticket It
			</Text>
		</View>
	);
}
