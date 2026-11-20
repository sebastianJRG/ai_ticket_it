/**
 * @file Layout del área de autenticación (login y registro): Stack sin header.
 *   Si se entra al área ya con sesión, redirige al destino del rol (respetando
 *   `volverA`). Un login o registro hecho acá adentro no dispara esta
 *   redirección: la pantalla navega sola a su destino (evita dos navegaciones).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { Redirect, Stack, useGlobalSearchParams } from 'expo-router';
import { useAuth } from '../../auth/AuthContext';
import { destinoTrasLogin } from '../../navegacion/reglas';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Navegador del grupo `(auth)`.
 * @returns {JSX.Element} Stack de login y registro, o `Redirect` si hay sesión.
 */
export default function AuthLayout() {
	const t = useTheme();
	const { usuario } = useAuth();
	const { volverA } = useGlobalSearchParams();
	const [conSesionAlEntrar] = useState(() => !!usuario);
	if (conSesionAlEntrar && usuario) {
		return <Redirect href={destinoTrasLogin(usuario, volverA)} />;
	}
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: t.colors.bg }
			}}
		/>
	);
}
