import { Router } from 'express';
import { requerirRol } from '../utils/autorizacion.js';

export default class UsuariosRoutes {
	/**
	 * Monta el router de usuarios en la aplicación Express.
	 *
	 * @param {import('express').Application} app Aplicación Express
	 * @param {import('../controllers/usuariosController.js').default} usuarioController Controlador de usuarios
	 * @param {import('express').RequestHandler} authMiddleware Middleware de autenticación JWT
	 * @param {import('../controllers/reseniaController.js').default} reseniaController Controlador de reseñas (reseñas por organizador)
	 * @returns {void}
	 */
	static init(app, usuarioController, authMiddleware, reseniaController) {
		const router = Router();

		// GET /api/usuarios - Perfil del usuario autenticado (COMPRADOR u ORGANIZADOR)
		router.get(
			'/',
			authMiddleware,
			requerirRol('COMPRADOR', 'ORGANIZADOR'),
			usuarioController.obtenerActual.bind(usuarioController)
		);

		// GET /api/usuarios/:idOrganizador/resenias - Reseñas de los eventos de un organizador (público)
		router.get(
			'/:idOrganizador/resenias',
			reseniaController.listarPorOrganizador.bind(reseniaController)
		);

		// POST /api/usuarios - Registro (público)
		router.post('/', usuarioController.crear.bind(usuarioController));

		app.use('/api/usuarios', router);
	}
}
