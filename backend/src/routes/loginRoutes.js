import { Router } from 'express';

/**
 * Rutas de autenticación: login.
 */
export default class LoginRoutes {
	/**
	 * Monta el router de login en la aplicación Express.
	 * @param {import('express').Application} app Aplicación Express
	 * @param {import('../controllers/loginController.js').default} loginController Controlador de login
	 * @returns {void}
	 */
	static init(app, loginController) {
		const router = Router();

		router.post('/', loginController.iniciarSesion.bind(loginController));

		app.use('/api/login', router);
	}
}
