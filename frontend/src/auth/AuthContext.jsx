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
	useState
} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as authService from '../services/authService';

const CLAVE = 'sesion';
const AuthContext = createContext(null);

/**
 * Provee la sesión a toda la app y la restaura al abrir.
 * @param {Object} props Propiedades.
 * @param {import('react').ReactNode} props.children Árbol de la aplicación.
 * @returns {JSX.Element} Proveedor de sesión.
 */
export function AuthProvider({ children }) {
	const [sesion, setSesion] = useState(null);
	const [cargando, setCargando] = useState(true);

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
	}, []);

	const guardar = useCallback(async (nueva) => {
		setSesion(nueva);
		await SecureStore.setItemAsync(CLAVE, JSON.stringify(nueva));
	}, []);

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
	}, [sesion]);

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
