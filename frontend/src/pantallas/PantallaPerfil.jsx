/**
 * @file Pantalla Perfil común a COMPRADOR y ORGANIZADOR: datos del servidor
 *   (con respaldo en la sesión guardada) y cerrar sesión
 *   (specs/003-navegacion-sesion research R7, FR-005).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../feedback/ToastContext';
import { usePerfil } from '../hooks/usePerfil';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';

/** Etiqueta legible de cada rol (data-model.md › Perfil.rol). */
const ETIQUETA_ROL = { COMPRADOR: 'Comprador', ORGANIZADOR: 'Organizador' };

/**
 * Fila etiqueta / valor del perfil.
 * @param {Object} props Propiedades.
 * @param {string} props.etiqueta Nombre del dato.
 * @param {string} props.valor Valor a mostrar.
 * @returns {JSX.Element} Fila.
 */
function Fila({ etiqueta, valor }) {
	const t = useTheme();
	return (
		<View
			accessible
			accessibilityLabel={`${etiqueta}: ${valor}`}
			style={{ paddingVertical: t.spacing[3], gap: 2 }}
		>
			<Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
				{etiqueta}
			</Text>
			<Text style={[t.typography.bodyLg, { color: t.colors.text }]}>
				{valor}
			</Text>
		</View>
	);
}

/**
 * Espera a la tarea siguiente del event loop.
 * @returns {Promise<void>} Se resuelve en la tarea siguiente.
 */
const siguienteTarea = () => new Promise((resolver) => setTimeout(resolver, 0));

/**
 * Perfil del usuario de la sesión. Errores: sin conexión u otro → datos de la
 * sesión y aviso; 404 → aviso, sesión cerrada (en `usePerfil`) y Explorar.
 * @returns {JSX.Element} Pantalla de perfil.
 */
export function PantallaPerfil() {
	const t = useTheme();
	const router = useRouter();
	const { usuario, cerrarSesion } = useAuth();
	const { mostrar } = useToast();
	const { perfil, cargando, error, recargar } = usePerfil();

	useEffect(() => {
		if (!error) return;
		if (error.status === 0) {
			mostrar({
				tono: 'warning',
				titulo: 'No pudimos actualizar tu perfil',
				mensaje: 'Te mostramos los datos guardados.',
				accion: { etiqueta: 'Reintentar', alPresionar: recargar }
			});
		} else if (error.status === 404) {
			mostrar({ tono: 'info', titulo: 'Tu cuenta ya no existe' });
			router.replace('/explorar');
		} else if (error.status !== 401) {
			// 401: lo resuelve el cliente HTTP y el aviso de sesión expirada.
			mostrar({ tono: 'error', titulo: error.message });
		}
	}, [error, mostrar, recargar, router]);

	// Cerrar sesión y navegar van en tareas separadas: si pasan en el mismo
	// render, la guardia del área puede ganar y mandar a login, y expo-router
	// avisa que ROUTE_NAMES_CHANGED quedó sin manejar. Mientras dura el cierre
	// voluntario las guardias no redirigen; lo termina AreaConPestanas al llegar
	// a Explorar (pública para el visitante).
	const salir = async () => {
		const cierre = cerrarSesion();
		await siguienteTarea();
		router.replace('/explorar');
		return cierre;
	};

	const datos = perfil ?? usuario;
	const primeraCarga = cargando && !perfil && !error;
	const c = t.colors;

	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			<AppHeader variante="large" titulo="Perfil" />
			<ScrollView
				contentContainerStyle={{ padding: t.spacing[4], gap: t.spacing[6] }}
			>
				<View
					style={{
						paddingHorizontal: t.spacing[4],
						paddingVertical: t.spacing[1],
						borderRadius: t.radius.lg,
						backgroundColor: c.surface
					}}
				>
					{primeraCarga || !datos ? (
						<View
							testID="perfil-cargando"
							accessible
							accessibilityLabel="Cargando perfil"
							style={{ paddingVertical: t.spacing[3], gap: t.spacing[4] }}
						>
							{[0, 1, 2, 3].map((i) => (
								<View key={i} style={{ gap: t.spacing[1] }}>
									<Skeleton
										ancho={90}
										alto={12}
										testID={`perfil-skeleton-${i}`}
									/>
									<Skeleton
										ancho="60%"
										alto={20}
										testID={`perfil-skeleton-valor-${i}`}
									/>
								</View>
							))}
						</View>
					) : (
						<>
							<Fila etiqueta="Nombre" valor={datos.nombre ?? ''} />
							<Fila etiqueta="Apellido" valor={datos.apellido ?? ''} />
							<Fila
								etiqueta="Nombre de usuario"
								valor={`@${datos.nombreUsuario}`}
							/>
							<Fila
								etiqueta="Rol"
								valor={ETIQUETA_ROL[datos.rol] ?? datos.rol}
							/>
						</>
					)}
				</View>
				<Button variant="secondary" size="lg" onPress={salir}>
					Cerrar sesión
				</Button>
			</ScrollView>
		</View>
	);
}
