/**
 * @file Layout raíz: carga de fuentes, safe areas, theme, avisos, sesión,
 *   favoritos del comprador (feature 004, research R7) y Stack raíz.
 *   Mientras se restaura la sesión muestra `PantallaCarga` y no monta rutas
 *   (specs/003-navegacion-sesion/research.md R5).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback } from 'react';
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
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { PantallaCarga } from '../components/PantallaCarga';
import { ToastProvider, useToast } from '../feedback/ToastContext';
import { FavoritosProvider } from '../favoritos/FavoritosContext';

/**
 * Stack raíz; no se monta hasta conocer la sesión para que ninguna guardia
 * decida con datos incompletos.
 * @returns {JSX.Element} Pantalla de carga o navegador.
 */
function Navigator() {
	const t = useTheme();
	const { cargando } = useAuth();
	return (
		<>
			<StatusBar style={t.dark ? 'light' : 'dark'} />
			{cargando ? (
				<PantallaCarga />
			) : (
				<Stack
					screenOptions={{
						headerShown: false,
						contentStyle: { backgroundColor: t.colors.bg }
					}}
				/>
			)}
		</>
	);
}

/**
 * `AuthProvider` con el aviso de sesión expirada (FR-006); vive bajo
 * `ToastProvider` para poder mostrar el toast.
 * @param {Object} props Propiedades.
 * @param {import('react').ReactNode} props.children Árbol de la aplicación.
 * @returns {JSX.Element} Proveedor de sesión.
 */
function SesionConAviso({ children }) {
	const { mostrar } = useToast();
	const avisarExpiracion = useCallback(
		() =>
			mostrar({
				tono: 'warning',
				titulo: 'Tu sesión expiró',
				mensaje: 'Iniciá sesión de nuevo para continuar.'
			}),
		[mostrar]
	);
	return <AuthProvider alExpirar={avisarExpiracion}>{children}</AuthProvider>;
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
				<ToastProvider>
					<SesionConAviso>
						<FavoritosProvider>
							<Navigator />
						</FavoritosProvider>
					</SesionConAviso>
				</ToastProvider>
			</ThemeProvider>
		</SafeAreaProvider>
	);
}
