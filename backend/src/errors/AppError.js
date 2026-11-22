/**
 * Error base de la aplicación: lleva el código HTTP con el que debe responderse.
 * Las capas de negocio no lo instancian directamente: usan sus subclases, que
 * fijan el código. El middleware de `utils/manejoErrores.js` lo traduce a la
 * respuesta.
 *
 * @module errors/AppError
 * @owner backend
 * @license ISC
 */

/**
 * Error controlado de la aplicación con su código de estado HTTP.
 * @extends Error
 * @property {string} name - Nombre de la clase concreta (por ejemplo, 'NotFoundError')
 * @property {number} statusCode - Código de estado HTTP con el que se responde
 */
export default class AppError extends Error {
	/**
	 * @param {string} message - Mensaje para el cliente
	 * @param {number} statusCode - Código de estado HTTP
	 */
	constructor(message, statusCode) {
		super(message);
		/** @type {string} */
		this.name = new.target.name;
		/** @type {number} */
		this.statusCode = statusCode;
		Error.captureStackTrace?.(this, new.target);
	}
}
