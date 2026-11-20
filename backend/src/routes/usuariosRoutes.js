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
	 * @param {import('../controllers/favoritoController.js').default} favoritoController Controlador de favoritos del comprador
	 * @returns {void}
	 */
	static init(
		app,
		usuarioController,
		authMiddleware,
		reseniaController,
		favoritoController
	) {
		const router = Router();

		// GET /api/usuarios - Perfil del usuario autenticado (COMPRADOR u ORGANIZADOR)
		router.get(
			'/',
			authMiddleware,
			requerirRol('COMPRADOR', 'ORGANIZADOR'),
			usuarioController.obtenerActual.bind(usuarioController)
		);

		// Favoritos del comprador. Se declaran antes de /:idOrganizador/... para que
		// ninguna ruta con parámetro capture el segmento "favoritos".
		// GET /api/usuarios/favoritos - Listar favoritos
		router.get(
			'/favoritos',
			authMiddleware,
			requerirRol('COMPRADOR'),
			favoritoController.listar.bind(favoritoController)
		);

		// PUT /api/usuarios/favoritos/:idEvento - Agregar a favoritos (idempotente)
		router.put(
			'/favoritos/:idEvento',
			authMiddleware,
			requerirRol('COMPRADOR'),
			favoritoController.agregar.bind(favoritoController)
		);

		// DELETE /api/usuarios/favoritos/:idEvento - Quitar de favoritos (idempotente)
		router.delete(
			'/favoritos/:idEvento',
			authMiddleware,
			requerirRol('COMPRADOR'),
			favoritoController.quitar.bind(favoritoController)
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
