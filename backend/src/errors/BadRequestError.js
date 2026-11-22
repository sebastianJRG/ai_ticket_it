/**
 * Error por datos o parámetros inválidos, o por una regla de negocio incumplida por la petición (HTTP 400).
 *
 * @module errors/BadRequestError
 * @owner backend
 * @license ISC
 */
import AppError from './AppError.js';

/**
 * Error por datos o parámetros inválidos, o por una regla de negocio incumplida por la petición (HTTP 400).
 * @extends AppError
 * @property {number} statusCode - Siempre 400
 */
export default class BadRequestError extends AppError {
	/**
	 * @param {string} [message] - Mensaje para el cliente
	 */
	constructor(message = 'Solicitud inválida') {
		super(message, 400);
	}
}
