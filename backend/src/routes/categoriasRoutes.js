import { Router } from 'express';

/**
 * Rutas para la gestión de categorías.
 * Crear requiere autenticación previa mediante el middleware inyectado; listar es público.
 */
export default class CategoriasRoutes {
	/**
	 * Monta el router de categorías en la aplicación Express.
	 * @param {import('express').Application} app - Aplicación Express
	 * @param {import('../controllers/categoriaController.js').default} categoriaController - Controlador de categorías
	 * @param {import('express').RequestHandler} authMiddleware - Middleware de autenticación JWT
	 * @returns {void}
	 */
	static init(app, categoriaController, authMiddleware) {
		const router = Router();

		// POST /api/categorias - Crear nueva categoría (solo para organizadores autenticados)
		router.post(
			'/',
			authMiddleware,
			categoriaController.crear.bind(categoriaController)
		);

		// GET /api/categorias - Listar categorías (público, sin autenticación)
		router.get('/', categoriaController.listar.bind(categoriaController));

		app.use('/api/categorias', router);
	}
}
