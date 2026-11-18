/**
 * @file Cliente HTTP mínimo hacia el backend de Al Ticket It.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

import { Platform } from 'react-native';

/**
 * Host por defecto: el emulador de Android no alcanza el `localhost` del PC y
 * usa `10.0.2.2`; en el resto de plataformas basta `localhost`.
 */
const HOST_POR_DEFECTO = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

/** URL base del backend; en el celular debe ser la IP LAN del PC (ver .env.example). */
export const API_URL =
	process.env.EXPO_PUBLIC_API_URL || `http://${HOST_POR_DEFECTO}:3000`;

/** Error de la API: `status` 0 significa que no hubo conexión. */
export class ApiError extends Error {
	/**
	 * @param {string} message Mensaje legible (del backend cuando existe).
	 * @param {number} status Código HTTP, o 0 sin conexión.
	 */
	constructor(message, status) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

/**
 * Hace una petición JSON al backend.
 * @param {string} ruta Ruta que empieza con `/api`.
 * @param {{method?: string, body?: object, token?: string}} [opciones] Método, cuerpo y access token.
 * @returns {Promise<any>} Cuerpo JSON de la respuesta.
 * @throws {ApiError} Si la respuesta no es 2xx o no hay conexión.
 */
export async function request(ruta, { method = 'GET', body, token } = {}) {
	let res;
	try {
		res = await fetch(`${API_URL}${ruta}`, {
			method,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			},
			body: body === undefined ? undefined : JSON.stringify(body)
		});
	} catch {
		throw new ApiError(
			'No pudimos conectar con el servidor. Revisá tu conexión.',
			0
		);
	}
	const data = await res.json().catch(() => null);
	if (!res.ok) {
		throw new ApiError(
			data?.message || 'Ocurrió un error inesperado.',
			res.status
		);
	}
	return data;
}
