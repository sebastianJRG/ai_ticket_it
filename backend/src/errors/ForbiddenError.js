/**
 * Error por un usuario autenticado sin permiso para la operación (HTTP 403).
 *
 * @module errors/ForbiddenError
 * @owner backend
 * @license ISC
 */
import AppError from './AppError.js';

/**
 * Error por un usuario autenticado sin permiso para la operación (HTTP 403).
 * @extends AppError
 * @property {number} statusCode - Siempre 403
 */
export default class ForbiddenError extends AppError {
	/**
	 * @param {string} [message] - Mensaje para el cliente
	 */
	constructor(message = 'Permisos denegados') {
		super(message, 403);
	}
}
