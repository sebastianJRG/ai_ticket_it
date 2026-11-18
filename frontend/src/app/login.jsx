/**
 * @file Pantalla de inicio de sesión (nombre de usuario y contraseña).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../services/api';
import { validarNombreUsuario, validarTexto } from '../services/validacion';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { TextLink } from '../components/TextLink';

/**
 * Pantalla de login; explorar eventos no requiere cuenta.
 * @returns {JSX.Element} Formulario de inicio de sesión.
 */
export default function Login() {
	const t = useTheme();
	const router = useRouter();
	const { iniciarSesion } = useAuth();
	const [nombreUsuario, setNombreUsuario] = useState('');
	const [contrasenia, setContrasenia] = useState('');
	const [errores, setErrores] = useState({});
	const [cargando, setCargando] = useState(false);

	const enviar = async () => {
		const e = {
			nombreUsuario: validarNombreUsuario(nombreUsuario),
			contrasenia: validarTexto(contrasenia, 'La contraseña')
		};
		if (e.nombreUsuario || e.contrasenia) {
			setErrores(e);
			return;
		}
		setErrores({});
		setCargando(true);
		try {
			await iniciarSesion({ nombreUsuario: nombreUsuario.trim(), contrasenia });
			router.replace('/');
		} catch (err) {
			const mensaje =
				err instanceof ApiError && err.status === 401
					? 'El usuario o la contraseña no coinciden.'
					: err.message;
			setErrores({ contrasenia: mensaje });
		} finally {
			setCargando(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: t.colors.bg }}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{ flexGrow: 1 }}
			>
				<LinearGradient
					colors={[t.colors.primarySoft, t.colors.bg]}
					style={{
						height: 240,
						justifyContent: 'flex-end',
						padding: t.spacing[4]
					}}
				>
					<Text style={[t.typography.displayLg, { color: t.colors.text }]}>
						Al Ticket It
					</Text>
					<Text style={[t.typography.body, { color: t.colors.textMuted }]}>
						Tu próxima noche empieza acá
					</Text>
				</LinearGradient>
				<View style={{ padding: t.spacing[4], gap: t.spacing[4] }}>
					<TextField
						label="Nombre de usuario"
						required
						value={nombreUsuario}
						onChangeText={setNombreUsuario}
						autoCapitalize="none"
						autoComplete="username"
						error={errores.nombreUsuario ?? undefined}
					/>
					<TextField
						label="Contraseña"
						required
						secureTextEntry
						value={contrasenia}
						onChangeText={setContrasenia}
						autoComplete="current-password"
						error={errores.contrasenia ?? undefined}
					/>
					<Button size="lg" loading={cargando} onPress={enviar}>
						Iniciar sesión
					</Button>
					<Button
						size="lg"
						variant="secondary"
						onPress={() => router.replace('/')}
					>
						Explorar eventos sin cuenta
					</Button>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: t.spacing[1]
						}}
					>
						<Text style={[t.typography.body, { color: t.colors.textMuted }]}>
							¿No tenés cuenta?
						</Text>
						<TextLink onPress={() => router.push('/registro')}>
							Creá una cuenta
						</TextLink>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
