import LoginService from '../services/loginService.js';

/**
 * Controlador encargado del flujo de inicio de sesión.
 */
export default class LoginController {
	/**
	 * Crea una instancia de LoginController.
	 * @param {import('../services/loginService.js').default} loginService Servicio de login
	 */
	constructor(loginService) {
		/** @private {import('../services/loginService.js').default} */
		this.loginService = loginService;
	}

	/**
	 * Inicia sesión y emite access y refresh token.
	 * @param {import('express').Request} req Petición HTTP
	 * @param {import('express').Response} res Respuesta HTTP
	 * @param {import('express').NextFunction} next Función de error siguiente
	 * @returns {Promise<void>}
	 */
	async iniciarSesion(req, res, next) {
		try {
			const resultado = await this.loginService.iniciarSesion(req.body);
			return res.status(200).json(resultado);
		} catch (error) {
			next(error);
		}
	}
}
