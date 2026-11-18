/**
 * @file Pantalla inicial provisoria (se reemplaza por Explorar).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/Button';

/**
 * Pantalla placeholder con el estado de sesión.
 * @returns {JSX.Element} Vista con el nombre de la app y acciones de sesión.
 */
export default function Index() {
	const t = useTheme();
	const router = useRouter();
	const { usuario, cerrarSesion } = useAuth();
	return (
		<View
			style={{
				flex: 1,
				alignItems: 'center',
				justifyContent: 'center',
				gap: t.spacing[2],
				padding: t.spacing[4],
				backgroundColor: t.colors.bg
			}}
		>
			<Text style={[t.typography.displayLg, { color: t.colors.text }]}>
				Al Ticket It
			</Text>
			<Text style={[t.typography.body, { color: t.colors.textMuted }]}>
				{usuario
					? `Hola, ${usuario.nombre ?? usuario.nombreUsuario} (${usuario.rol})`
					: 'Tu próxima noche empieza acá'}
			</Text>
			{usuario ? (
				<Button variant="secondary" onPress={cerrarSesion}>
					Cerrar sesión
				</Button>
			) : (
				<Button onPress={() => router.push('/login')}>Iniciar sesión</Button>
			)}
		</View>
	);
}
