/**
 * Error por un recurso que no existe (HTTP 404).
 *
 * @module errors/NotFoundError
 * @owner backend
 * @license ISC
 */
import AppError from './AppError.js';

/**
 * Error por un recurso que no existe (HTTP 404).
 * @extends AppError
 * @property {number} statusCode - Siempre 404
 */
export default class NotFoundError extends AppError {
	/**
	 * @param {string} [message] - Mensaje para el cliente
	 */
	constructor(message = 'No encontrado') {
		super(message, 404);
	}
}
