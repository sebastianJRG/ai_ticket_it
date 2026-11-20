/**
 * @file Contexto de sesión: usuario, tokens y persistencia segura.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as authService from '../services/authService';
import { configurarSesion } from '../services/api';

const CLAVE = 'sesion';
const AuthContext = createContext(null);

/**
 * Provee la sesión a toda la app, la restaura al abrir y se registra como
 * proveedor de sesión del cliente HTTP (renovación automática de tokens).
 * @param {Object} props Propiedades.
 * @param {import('react').ReactNode} props.children Árbol de la aplicación.
 * @returns {JSX.Element} Proveedor de sesión.
 */
export function AuthProvider({ children }) {
	const [sesion, setSesionEstado] = useState(null);
	const [cargando, setCargando] = useState(true);
	// Copia sincrónica de la sesión para que el cliente HTTP lea siempre la vigente.
	const sesionRef = useRef(null);

	const setSesion = useCallback((nueva) => {
		sesionRef.current = nueva;
		setSesionEstado(nueva);
	}, []);

	useEffect(() => {
		let vivo = true;
		SecureStore.getItemAsync(CLAVE)
			.then((raw) => {
				if (vivo && raw) setSesion(JSON.parse(raw));
			})
			.catch(() => {})
			.finally(() => vivo && setCargando(false));
		return () => {
			vivo = false;
		};
	}, [setSesion]);

	const guardar = useCallback(
		async (nueva) => {
			setSesion(nueva);
			await SecureStore.setItemAsync(CLAVE, JSON.stringify(nueva));
		},
		[setSesion]
	);

	useEffect(() => {
		configurarSesion({
			obtenerTokens: () => {
				const actual = sesionRef.current;
				return actual
					? {
							accessToken: actual.accessToken,
							refreshToken: actual.refreshToken
						}
					: null;
			},
			guardarTokens: guardar,
			// El refresh ya es inválido: se cierra solo la sesión local, sin logout.
			alExpirar: async () => {
				setSesion(null);
				await SecureStore.deleteItemAsync(CLAVE);
			}
		});
		return () => configurarSesion(null);
	}, [guardar, setSesion]);

	const iniciarSesion = useCallback(
		async (credenciales) => {
			const { accessToken, refreshToken, usuario } =
				await authService.login(credenciales);
			await guardar({ accessToken, refreshToken, usuario });
			return usuario;
		},
		[guardar]
	);

	const cerrarSesion = useCallback(async () => {
		const refreshToken = sesion?.refreshToken;
		setSesion(null);
		await SecureStore.deleteItemAsync(CLAVE);
		if (refreshToken)
			await authService.cerrarSesion(refreshToken).catch(() => {});
	}, [sesion, setSesion]);

	const valor = useMemo(
		() => ({
			usuario: sesion?.usuario ?? null,
			accessToken: sesion?.accessToken ?? null,
			cargando,
			iniciarSesion,
			cerrarSesion
		}),
		[sesion, cargando, iniciarSesion, cerrarSesion]
	);
	return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/**
 * Devuelve la sesión actual y sus acciones.
 * @returns {{usuario: object|null, accessToken: string|null, cargando: boolean, iniciarSesion: function(object): Promise<object>, cerrarSesion: function(): Promise<void>}} Estado de sesión.
 * @throws {Error} Si se usa fuera de AuthProvider.
 */
export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider.');
	return ctx;
}
