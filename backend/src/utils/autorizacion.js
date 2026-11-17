/**
 * Middlewares de autorización por rol.
 * Se usan después de `authMiddleware`, que solo identifica al usuario (es permisivo).
 *
 * @module utils/autorizacion
 * @license ISC
 */
import ErrorHttp from './errorHttp.js';

/**
 * Crea un middleware que exige un usuario autenticado con alguno de los roles dados.
 * @param {...string} roles - Roles permitidos (por ejemplo, 'COMPRADOR')
 * @returns {import('express').RequestHandler} Middleware que llama a `next(ErrorHttp)` con 401 o 403, o a `next()` si se cumple
 * @throws {ErrorHttp} 401 si no hay usuario autenticado (vía next)
 * @throws {ErrorHttp} 403 si el rol del usuario no está permitido (vía next)
 */
export function requerirRol(...roles) {
	return (req, res, next) => {
		if (!req.user) {
			return next(
				new ErrorHttp(401, 'No autorizado - token JWT inválido o ausente')
			);
		}
		if (!roles.includes(req.user.rol)) {
			return next(
				new ErrorHttp(
					403,
					`Permisos denegados: se requiere el rol ${roles.join(' o ')}`
				)
			);
		}
		return next();
	};
}
