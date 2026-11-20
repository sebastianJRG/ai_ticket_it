/**
 * @file Pantalla de registro de COMPRADOR u ORGANIZADOR.
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import * as authService from '../../services/authService';
import {
	validarContrasenia,
	validarNombreUsuario,
	validarTexto
} from '../../services/validacion';
import { Button } from '../../components/Button';
import { RoleSelector } from '../../components/RoleSelector';
import { TextField } from '../../components/TextField';
import { TextLink } from '../../components/TextLink';
import { destinoTrasRegistro } from '../../navegacion/reglas';

/**
 * Pantalla de alta de cuenta; al terminar inicia sesión y entra a la app.
 * @returns {JSX.Element} Formulario de registro.
 */
export default function Registro() {
	const t = useTheme();
	const router = useRouter();
	const { volverA } = useLocalSearchParams();
	const { iniciarSesion } = useAuth();
	const [rol, setRol] = useState('COMPRADOR');
	const [campos, setCampos] = useState({
		nombre: '',
		apellido: '',
		nombreUsuario: '',
		contrasenia: ''
	});
	const [errores, setErrores] = useState({});
	const [cargando, setCargando] = useState(false);

	const cambiar = (k) => (v) => setCampos((c) => ({ ...c, [k]: v }));
	const validar = {
		nombre: (v) => validarTexto(v, 'El nombre'),
		apellido: (v) => validarTexto(v, 'El apellido'),
		nombreUsuario: validarNombreUsuario,
		contrasenia: validarContrasenia
	};
	const alPerderFoco = (k) => () =>
		setErrores((e) => ({ ...e, [k]: validar[k](campos[k]) }));

	const enviar = async () => {
		const e = Object.fromEntries(
			Object.keys(validar).map((k) => [k, validar[k](campos[k])])
		);
		if (Object.values(e).some(Boolean)) {
			setErrores(e);
			return;
		}
		setErrores({});
		setCargando(true);
		try {
			const datos = {
				nombre: campos.nombre.trim(),
				apellido: campos.apellido.trim(),
				nombreUsuario: campos.nombreUsuario.trim(),
				contrasenia: campos.contrasenia,
				rol
			};
			await authService.registrar(datos);
			// El destino sale del usuario autenticado, no del rol del formulario.
			const usuario = await iniciarSesion({
				nombreUsuario: datos.nombreUsuario,
				contrasenia: datos.contrasenia
			});
			router.replace(destinoTrasRegistro(usuario, volverA));
		} catch (err) {
			setErrores({ general: err.message });
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
				contentContainerStyle={{
					padding: t.spacing[4],
					paddingTop: 56,
					gap: t.spacing[4]
				}}
			>
				<Text style={[t.typography.titleLg, { color: t.colors.text }]}>
					Crear cuenta
				</Text>
				<RoleSelector value={rol} onChange={setRol} />
				<TextField
					label="Nombre"
					required
					value={campos.nombre}
					onChangeText={cambiar('nombre')}
					onBlur={alPerderFoco('nombre')}
					error={errores.nombre ?? undefined}
				/>
				<TextField
					label="Apellido"
					required
					value={campos.apellido}
					onChangeText={cambiar('apellido')}
					onBlur={alPerderFoco('apellido')}
					error={errores.apellido ?? undefined}
				/>
				<TextField
					label="Nombre de usuario"
					required
					value={campos.nombreUsuario}
					onChangeText={cambiar('nombreUsuario')}
					onBlur={alPerderFoco('nombreUsuario')}
					autoCapitalize="none"
					autoComplete="username"
					error={errores.nombreUsuario ?? errores.general}
				/>
				<TextField
					label="Contraseña"
					required
					secureTextEntry
					value={campos.contrasenia}
					onChangeText={cambiar('contrasenia')}
					onBlur={alPerderFoco('contrasenia')}
					autoComplete="new-password"
					helper="8 a 32 caracteres, con mayúscula, minúscula, número y un especial (!@#$%^&*_-)."
					error={errores.contrasenia ?? undefined}
				/>
				<Button size="lg" loading={cargando} onPress={enviar}>
					Crear cuenta
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
						¿Ya tenés cuenta?
					</Text>
					<TextLink
						onPress={() =>
							router.replace(
								volverA ? { pathname: '/login', params: { volverA } } : '/login'
							)
						}
					>
						Iniciá sesión
					</TextLink>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
