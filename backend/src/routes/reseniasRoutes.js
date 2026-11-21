import { Router } from 'express';
import { requerirRol } from '../utils/autorizacion.js';

/**
 * Rutas de reseñas.
 * Crear requiere autenticación (token JWT) y rol COMPRADOR; listar es público.
 */
export default class ReseniasRoutes {
	/**
	 * Monta el router de reseñas en la aplicación Express.
	 * @param {import('express').Application} app - Aplicación Express
	 * @param {import('../controllers/reseniaController.js').default} reseniaController - Controlador de reseñas
	 * @param {import('express').RequestHandler} authMiddleware - Middleware de autenticación JWT
	 * @returns {void}
	 */
	static init(app, reseniaController, authMiddleware) {
		const router = Router();

		// POST /api/resenias - Crear reseña (solo compradores autenticados)
		router.post(
			'/',
			authMiddleware,
			requerirRol('COMPRADOR'),
			reseniaController.crear.bind(reseniaController)
		);

		// GET /api/resenias/:idEvento - Listar reseñas de un evento (público)
		router.get('/:idEvento', reseniaController.listar.bind(reseniaController));

		app.use('/api/resenias', router);
	}
}
