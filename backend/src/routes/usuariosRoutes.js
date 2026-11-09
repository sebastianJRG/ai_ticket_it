import { Router } from 'express';

export default class UsuariosRoutes {
	/**
	 * Monta el router de usuarios en la aplicación Express.
	 *
	 * @param {import('express').Application} app Aplicación Express
	 * @param {import('../controllers/usuariosController.js').default} usuarioController Controlador de usuarios
	 * @returns {void}
	 */
	static init(app, usuarioController) {
		const router = Router();

		router.post('/', usuarioController.crear.bind(usuarioController));

		app.use('/api/usuarios', router);
	}
}
