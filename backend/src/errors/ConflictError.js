/**
 * Error por conflicto con el estado actual del recurso: duplicados, cupo o estado (HTTP 409).
 *
 * @module errors/ConflictError
 * @owner backend
 * @license ISC
 */
import AppError from './AppError.js';

/**
 * Error por conflicto con el estado actual del recurso: duplicados, cupo o estado (HTTP 409).
 * @extends AppError
 * @property {number} statusCode - Siempre 409
 */
export default class ConflictError extends AppError {
	/**
	 * @param {string} [message] - Mensaje para el cliente
	 */
	constructor(message = 'Conflicto con el estado actual') {
		super(message, 409);
	}
}
