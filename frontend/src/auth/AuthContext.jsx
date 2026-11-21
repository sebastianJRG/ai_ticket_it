/**
 * @file Contexto de sesión: usuario, tokens y persistencia (SecureStore en
 *   Android e iOS, `localStorage` en web; ver `almacenSesion.js`).
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
import { borrarSesion, guardarSesion, leerSesion } from './almacenSesion';
import * as authService from '../services/authService';
import { configurarSesion } from '../services/api';

const CLAVE = 'sesion';
const AuthContext = createContext(null);

/**
 * Provee la sesión a toda la app, la restaura al abrir y se registra como
 * proveedor de sesión del cliente HTTP (renovación automática de tokens).
 * @param {Object} props Propiedades.
 * @param {import('react').ReactNode} props.children Árbol de la aplicación.
 * @param {function(): void} [props.alExpirar] Aviso a la UI cuando la sesión
 *   expira y no se pudo renovar; se llama una vez, después de limpiar la sesión
 *   (specs/003-navegacion-sesion research R6).
 * @returns {JSX.Element} Proveedor de sesión.
 */
export function AuthProvider({ children, alExpirar }) {
	const [sesion, setSesionEstado] = useState(null);
	const [cargando, setCargando] = useState(true);
	// `true` entre un cierre de sesión voluntario y el fin de la navegación que
	// lo sigue: las guardias no mandan a login mientras tanto.
	const [cierreVoluntario, setCierreVoluntario] = useState(false);
	// Copia sincrónica de la sesión para que el cliente HTTP lea siempre la vigente.
	const sesionRef = useRef(null);
	// En un ref para no reconfigurar el cliente HTTP cada vez que cambia la prop.
	const avisoExpiracionRef = useRef(alExpirar);
	avisoExpiracionRef.current = alExpirar;

	const setSesion = useCallback((nueva) => {
		sesionRef.current = nueva;
		setSesionEstado(nueva);
	}, []);

	useEffect(() => {
		let vivo = true;
		leerSesion(CLAVE)
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
			await guardarSesion(CLAVE, JSON.stringify(nueva));
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
				setCierreVoluntario(false);
				setSesion(null);
				await borrarSesion(CLAVE);
				avisoExpiracionRef.current?.();
			}
		});
		return () => configurarSesion(null);
	}, [guardar, setSesion]);

	const iniciarSesion = useCallback(
		async (credenciales) => {
			const { accessToken, refreshToken, usuario } =
				await authService.login(credenciales);
			setCierreVoluntario(false);
			await guardar({ accessToken, refreshToken, usuario });
			return usuario;
		},
		[guardar]
	);

	const cerrarSesion = useCallback(async () => {
		const refreshToken = sesion?.refreshToken;
		setCierreVoluntario(true);
		setSesion(null);
		await borrarSesion(CLAVE);
		if (refreshToken)
			await authService.cerrarSesion(refreshToken).catch(() => {});
	}, [sesion, setSesion]);

	const terminarCierre = useCallback(() => setCierreVoluntario(false), []);

	const valor = useMemo(
		() => ({
			usuario: sesion?.usuario ?? null,
			accessToken: sesion?.accessToken ?? null,
			cargando,
			cierreVoluntario,
			iniciarSesion,
			cerrarSesion,
			terminarCierre
		}),
		[
			sesion,
			cargando,
			cierreVoluntario,
			iniciarSesion,
			cerrarSesion,
			terminarCierre
		]
	);
	return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/**
 * Devuelve la sesión actual y sus acciones.
 * @returns {{usuario: object|null, accessToken: string|null, cargando: boolean, cierreVoluntario: boolean, iniciarSesion: function(object): Promise<object>, cerrarSesion: function(): Promise<void>, terminarCierre: function(): void}} Estado de sesión. `cierreVoluntario` es `true` desde `cerrarSesion` hasta `terminarCierre` (o un nuevo login): mientras tanto las guardias no redirigen a login.
 * @throws {Error} Si se usa fuera de AuthProvider.
 */
export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider.');
	return ctx;
}
