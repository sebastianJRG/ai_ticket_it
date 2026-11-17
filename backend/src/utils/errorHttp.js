/**
 * Error con código de estado HTTP asociado.
 * El manejador central de errores de `app.js` usa `status` para responder.
 *
 * @module utils/errorHttp
 * @license ISC
 */

/**
 * Error que lleva consigo el código HTTP con el que debe responderse.
 * @extends Error
 * @property {number} status - Código de estado HTTP (400, 401, 403, 404, 409...)
 */
export default class ErrorHttp extends Error {
	/**
	 * @param {number} status - Código de estado HTTP
	 * @param {string} message - Mensaje para el cliente
	 */
	constructor(status, message) {
		super(message);
		/** @type {string} */
		this.name = 'ErrorHttp';
		/** @type {number} */
		this.status = status;
	}
}
