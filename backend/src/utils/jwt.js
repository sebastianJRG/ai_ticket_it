/**
 * Verificación de JWT y middleware de autenticación.
 *
 * Ownership: equipo backend de Al Ticket It.
 *
 * @license ISC
 */
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './configJwt.js';

/**
 * Verifica un token JWT y retorna los datos decodificados.
 * @param {string} token Access token JWT.
 * @returns {{id: string, rol: string, permisos: string[]}} Datos del usuario del token.
 * @throws {Error} Si el token es inválido o expiró.
 */
export function verifyToken(token) {
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		return {
			id: decoded.id,
			rol: decoded.rol,
			permisos: decoded.permisos
		};
	} catch (error) {
		throw new Error('Token inválido o expirado');
	}
}

/**
 * Middleware de autenticación JWT: asigna `req.user` (o `null` si el token es inválido).
 * @param {import('express').Request} req Petición.
 * @param {import('express').Response} res Respuesta.
 * @param {import('express').NextFunction} next Siguiente middleware.
 * @returns {void}
 */
export function authMiddleware(req, res, next) {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return next(); // No token - el controlador decidirá
		}

		const token = authHeader.split(' ')[1]; // "Bearer <token>"
		if (!token) {
			return next();
		}

		req.user = verifyToken(token);
		next();
	} catch (error) {
		req.user = null;
		next();
	}
}
