/**
 * @file Pantalla inicial provisoria (se reemplaza por Explorar).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Pantalla placeholder.
 * @returns Vista con el nombre de la app.
 */
export default function Index() {
	const t = useTheme();
	return (
		<View
			style={{
				flex: 1,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: t.colors.bg
			}}
		>
			<Text style={[t.typography.displayLg, { color: t.colors.text }]}>
				Al Ticket It
			</Text>
			<Text style={[t.typography.body, { color: t.colors.textMuted }]}>
				Tu próxima noche empieza acá
			</Text>
		</View>
	);
}
