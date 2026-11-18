/**
 * @file Layout raíz: carga de fuentes, safe areas, theme y navegación.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
	BricolageGrotesque_600SemiBold,
	BricolageGrotesque_700Bold,
	BricolageGrotesque_800ExtraBold
} from '@expo-google-fonts/bricolage-grotesque';
import {
	Manrope_500Medium,
	Manrope_600SemiBold,
	Manrope_700Bold,
	Manrope_800ExtraBold
} from '@expo-google-fonts/manrope';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { AuthProvider } from '../auth/AuthContext';

function Navigator() {
	const t = useTheme();
	return (
		<>
			<StatusBar style={t.dark ? 'light' : 'dark'} />
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: t.colors.bg }
				}}
			/>
		</>
	);
}

/**
 * Layout raíz de la app.
 * @returns Árbol raíz, o null mientras cargan las fuentes.
 */
export default function RootLayout() {
	const [loaded] = useFonts({
		BricolageGrotesque_600SemiBold,
		BricolageGrotesque_700Bold,
		BricolageGrotesque_800ExtraBold,
		Manrope_500Medium,
		Manrope_600SemiBold,
		Manrope_700Bold,
		Manrope_800ExtraBold
	});
	if (!loaded) return null;
	return (
		<SafeAreaProvider>
			<ThemeProvider>
				<AuthProvider>
					<Navigator />
				</AuthProvider>
			</ThemeProvider>
		</SafeAreaProvider>
	);
}
