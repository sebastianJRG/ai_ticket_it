/**
 * Middleware que asigna un ID de petición (`req.id`) para correlacionar los logs
 * estructurados de los servicios (constitución, principio 5).
 *
 * @module utils/requestId
 * @owner Equipo Al Ticket It — backend
 * @license ISC
 */
import { randomUUID } from 'node:crypto';

/**
 * Formato aceptado para un `X-Request-Id` enviado por el cliente.
 * Restringido para que no se pueda inyectar texto arbitrario en los logs.
 * @type {RegExp}
 */
const FORMATO_REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Asigna `req.id`: el header `X-Request-Id` si es válido (1–128 caracteres de
 * `[A-Za-z0-9_-]`) o, si no, un UUID nuevo. Nunca falla ni modifica la respuesta.
 *
 * @param {import('express').Request} req - Petición; recibe la propiedad `id`
 * @param {import('express').Response} res - Respuesta (no se usa)
 * @param {import('express').NextFunction} next - Continúa la cadena sin error
 * @returns {void}
 */
export function asignarRequestId(req, res, next) {
	const recibido = req.get('X-Request-Id');
	req.id =
		typeof recibido === 'string' && FORMATO_REQUEST_ID.test(recibido)
			? recibido
			: randomUUID();
	next();
}
