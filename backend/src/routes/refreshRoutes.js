import { Router } from 'express';

/**
 * Rutas de autenticación: refresh token.
 */
export default class RefreshRoutes {
	/**
	 * Monta el router de refresh en la aplicación Express.
	 * @param {import('express').Application} app Aplicación Express
	 * @param {import('../controllers/refreshController.js').default} refreshController Controlador de refresh
	 * @returns {void}
	 */
	static init(app, refreshController) {
		const router = Router();

		router.post('/', refreshController.renovar.bind(refreshController));

		app.use('/api/refresh', router);
	}
}
