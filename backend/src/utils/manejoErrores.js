/**
 * Middlewares de manejo centralizado de errores. Traducen los errores de la
 * aplicación (`AppError` y subclases) a la respuesta HTTP, para que servicios y
 * controladores no escriban códigos de estado de error.
 *
 * @module utils/manejoErrores
 * @owner backend
 * @license ISC
 */
import { AppError, NotFoundError } from '../errors/index.js';

/** Mensaje que recibe el cliente ante un error no controlado. */
const MENSAJE_ERROR_INTERNO = 'Error interno del servidor';

/**
 * Middleware para rutas inexistentes: delega un `NotFoundError` al manejador.
 * @param {import('express').Request} req - Petición HTTP (no se usa)
 * @param {import('express').Response} res - Respuesta HTTP (no se usa)
 * @param {import('express').NextFunction} next - Recibe el `NotFoundError`
 * @returns {void}
 */
export function rutaNoEncontrada(req, res, next) {
	next(new NotFoundError('No encontrada'));
}

/**
 * Indica si el error viene del body-parser de Express (por ejemplo, un JSON mal
 * formado o un cuerpo demasiado grande), que trae su propio código 4xx.
 * @param {unknown} error - Error recibido
 * @returns {boolean} `true` si es un error 4xx del parser
 */
function esErrorDelParser(error) {
	return (
		error instanceof Error &&
		typeof error.type === 'string' &&
		Number.isInteger(error.status) &&
		error.status >= 400 &&
		error.status < 500
	);
}

/**
 * Crea el middleware de errores de Express.
 * - `AppError`: responde con su `statusCode` y `{ message }`; log `warn`.
 * - Error 4xx del body-parser: responde con su código y mensaje; log `warn`.
 * - Cualquier otro: 500 con un mensaje genérico (sin detalles internos); log
 *   `error` con el stack.
 * Los logs son JSON de una línea e incluyen el `requestId` de la petición.
 * @param {object} [opciones] - Dependencias
 * @param {{warn: Function, error: Function}} [opciones.logger=console] - Logger estructurado
 * @returns {import('express').ErrorRequestHandler} Middleware `(error, req, res, next)`
 */
export function crearManejadorErrores({ logger = console } = {}) {
	// eslint-disable-next-line no-unused-vars
	return (error, req, res, next) => {
		const base = {
			requestId: req.id,
			metodo: req.method,
			ruta: req.originalUrl
		};

		if (error instanceof AppError || esErrorDelParser(error)) {
			const statusCode = error.statusCode ?? error.status;
			logger.warn(
				JSON.stringify({
					evento: 'error_controlado',
					...base,
					statusCode,
					nombre: error.name,
					mensaje: error.message
				})
			);
			return res.status(statusCode).json({ message: error.message });
		}

		logger.error(
			JSON.stringify({
				evento: 'error_inesperado',
				...base,
				statusCode: 500,
				nombre: error?.name,
				mensaje: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			})
		);
		return res.status(500).json({ message: MENSAJE_ERROR_INTERNO });
	};
}
