import LogoutService from '../services/logoutService.js';

/**
 * Controlador encargado del cierre de sesión.
 */
export default class LogoutController {
	/**
	 * Crea una instancia de LogoutController.
	 * @param {import('../services/logoutService.js').default} logoutService Servicio de logout
	 */
	constructor(logoutService) {
		/** @private {import('../services/logoutService.js').default} */
		this.logoutService = logoutService;
	}

	/**
	 * Cierra la sesión invalidando el refresh token.
	 * @param {import('express').Request} req Petición HTTP
	 * @param {import('express').Response} res Respuesta HTTP
	 * @param {import('express').NextFunction} next Función de error siguiente
	 * @returns {Promise<void>}
	 */
	async cerrarSesion(req, res, next) {
		try {
			const resultado = await this.logoutService.cerrarSesion(req.body);
			return res.status(200).json(resultado);
		} catch (error) {
			next(error);
		}
	}
}
