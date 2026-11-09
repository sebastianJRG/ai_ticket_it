import { Router } from 'express';

/**
 * Rutas de autenticación: logout.
 */
export default class LogoutRoutes {
	/**
	 * Monta el router de logout en la aplicación Express.
	 * @param {import('express').Application} app Aplicación Express
	 * @param {import('../controllers/logoutController.js').default} logoutController Controlador de logout
	 * @returns {void}
	 */
	static init(app, logoutController) {
		const router = Router();

		router.post('/', logoutController.cerrarSesion.bind(logoutController));

		app.use('/api/logout', router);
	}
}
