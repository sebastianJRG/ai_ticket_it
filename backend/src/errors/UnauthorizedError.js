/**
 * Error por falta de autenticación o credenciales inválidas (HTTP 401).
 *
 * @module errors/UnauthorizedError
 * @owner backend
 * @license ISC
 */
import AppError from './AppError.js';

/**
 * Error por falta de autenticación o credenciales inválidas (HTTP 401).
 * @extends AppError
 * @property {number} statusCode - Siempre 401
 */
export default class UnauthorizedError extends AppError {
	/**
	 * @param {string} [message] - Mensaje para el cliente
	 */
	constructor(message = 'No autorizado - token JWT inválido o ausente') {
		super(message, 401);
	}
}
