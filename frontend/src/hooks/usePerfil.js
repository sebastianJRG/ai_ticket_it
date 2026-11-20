/**
 * @file Hook que carga el perfil del usuario de la sesión desde
 *   `GET /api/usuarios` (specs/003-navegacion-sesion contracts/componentes.md › usePerfil).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { obtenerPerfil } from '../services/usuarioService';

/**
 * Estado del perfil.
 * @typedef {Object} EstadoPerfil
 * @property {object|null} perfil Perfil del servidor (data-model.md › Perfil), o `null`.
 * @property {boolean} cargando Si hay una petición en curso.
 * @property {Error|null} error Último error (`ApiError` con `status`), o `null`.
 * @property {function(): Promise<void>} recargar Vuelve a pedir el perfil.
 */

/**
 * Carga el perfil al montar. Ante `404` (el usuario ya no existe) cierra la
 * sesión. Nunca lanza: los errores quedan en `error`.
 * @returns {EstadoPerfil} Estado del perfil.
 */
export function usePerfil() {
	const { cerrarSesion } = useAuth();
	const [perfil, setPerfil] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState(null);
	const montado = useRef(true);
	const cerrarRef = useRef(cerrarSesion);
	cerrarRef.current = cerrarSesion;

	const recargar = useCallback(async () => {
		setCargando(true);
		try {
			const datos = await obtenerPerfil();
			if (!montado.current) return;
			setPerfil(datos);
			setError(null);
		} catch (err) {
			if (!montado.current) return;
			setPerfil(null);
			setError(err);
			if (err?.status === 404) await cerrarRef.current?.();
		} finally {
			if (montado.current) setCargando(false);
		}
	}, []);

	useEffect(() => {
		montado.current = true;
		recargar();
		return () => {
			montado.current = false;
		};
	}, [recargar]);

	return { perfil, cargando, error, recargar };
}
