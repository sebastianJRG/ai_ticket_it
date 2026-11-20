/**
 * @file Servicio de autenticación: login, registro, refresh y logout.
 *   Todas las llamadas van marcadas `sinSesion`: no llevan credencial y un 401
 *   nunca dispara la renovación automática (FR-007).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { cliente } from './api';

export { ApiError } from './api';

/** Config de las rutas de autenticación (data-model.md `ConfigPeticion.sinSesion`). */
const SIN_SESION = { sinSesion: true };

/**
 * Inicia sesión.
 * @param {{nombreUsuario: string, contrasenia: string}} credenciales Credenciales.
 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object}>} Sesión.
 * @throws {import('./api').ApiError} 400 (datos inválidos), 401 (credenciales incorrectas), 0 (sin conexión).
 */
export async function login({ nombreUsuario, contrasenia }) {
	const { data } = await cliente.post(
		'/api/login',
		{ nombreUsuario, contrasenia },
		SIN_SESION
	);
	return data;
}

/**
 * Registra un COMPRADOR u ORGANIZADOR.
 * @param {{nombre: string, apellido: string, nombreUsuario: string, contrasenia: string, rol: 'COMPRADOR'|'ORGANIZADOR'}} datos Datos de alta.
 * @returns {Promise<object>} Usuario creado.
 * @throws {import('./api').ApiError} 400 con el mensaje del backend (p. ej. nombre de usuario en uso), 0 (sin conexión).
 */
export async function registrar(datos) {
	const { data } = await cliente.post('/api/usuarios', datos, SIN_SESION);
	return data;
}

/**
 * Renueva la sesión con el refresh token. El backend rota el refresh token:
 * el recibido deja de servir.
 * @param {string} refreshToken Refresh token vigente.
 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object}>} Sesión nueva.
 * @throws {import('./api').ApiError} 400 (sin token), 401 (token inválido o expirado), 0 (sin conexión).
 */
export async function refrescar(refreshToken) {
	const { data } = await cliente.post(
		'/api/refresh',
		{ refreshToken },
		SIN_SESION
	);
	return data;
}

/**
 * Cierra la sesión invalidando el refresh token.
 * @param {string} refreshToken Refresh token a invalidar.
 * @returns {Promise<any>} Respuesta del backend.
 * @throws {import('./api').ApiError} 400, 401 (token inválido), 0 (sin conexión).
 */
export async function cerrarSesion(refreshToken) {
	const { data } = await cliente.post(
		'/api/logout',
		{ refreshToken },
		SIN_SESION
	);
	return data;
}
