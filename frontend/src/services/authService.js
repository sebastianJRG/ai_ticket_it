/**
 * @file Servicio de autenticación: login, registro, refresh y logout.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { request } from './api';

export { ApiError } from './api';

/**
 * Inicia sesión.
 * @param {{nombreUsuario: string, contrasenia: string}} credenciales Credenciales.
 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object}>} Sesión.
 * @throws {ApiError} 400 (datos inválidos), 401 (credenciales incorrectas), 0 (sin conexión).
 */
export function login({ nombreUsuario, contrasenia }) {
	return request('/api/login', {
		method: 'POST',
		body: { nombreUsuario, contrasenia }
	});
}

/**
 * Registra un COMPRADOR u ORGANIZADOR.
 * @param {{nombre: string, apellido: string, nombreUsuario: string, contrasenia: string, rol: 'COMPRADOR'|'ORGANIZADOR'}} datos Datos de alta.
 * @returns {Promise<object>} Usuario creado.
 * @throws {ApiError} 400 con el mensaje del backend (p. ej. nombre de usuario en uso).
 */
export function registrar(datos) {
	return request('/api/usuarios', { method: 'POST', body: datos });
}

/**
 * Renueva la sesión con el refresh token.
 * @param {string} refreshToken Refresh token vigente.
 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object}>} Sesión nueva.
 * @throws {ApiError} Si el token es inválido.
 */
export function refrescar(refreshToken) {
	return request('/api/refresh', { method: 'POST', body: { refreshToken } });
}

/**
 * Cierra la sesión invalidando el refresh token.
 * @param {string} refreshToken Refresh token a invalidar.
 * @returns {Promise<any>} Respuesta del backend.
 * @throws {ApiError} Si falla la petición.
 */
export function cerrarSesion(refreshToken) {
	return request('/api/logout', { method: 'POST', body: { refreshToken } });
}
