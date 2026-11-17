/**
 * Configuración JWT centralizada (secreto y duración del access token).
 *
 * Propósito: única fuente de verdad para `JWT_SECRET` y `JWT_ACCESS_EXPIRATION`.
 * Ownership: equipo backend de Al Ticket It.
 *
 * @license ISC
 */

/**
 * Secreto con el que se firman y verifican los JWT.
 * @type {string}
 */
export const JWT_SECRET =
	process.env.JWT_SECRET || 'clave-generica-cambiar-en-produccion';

/**
 * Duración del access token.
 * @type {string}
 */
export const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
