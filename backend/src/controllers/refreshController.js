import RefreshService from '../services/refreshService.js';

/**
 * Controlador encargado de la renovación de tokens.
 */
export default class RefreshController {
	/**
	 * Crea una instancia de RefreshController.
	 * @param {import('../services/refreshService.js').default} refreshService Servicio de refresh
	 */
	constructor(refreshService) {
		/** @private {import('../services/refreshService.js').default} */
		this.refreshService = refreshService;
	}

	/**
	 * Renueva el access token y rota el refresh token.
	 * @param {import('express').Request} req Petición HTTP
	 * @param {import('express').Response} res Respuesta HTTP
	 * @param {import('express').NextFunction} next Función de error siguiente
	 * @returns {Promise<void>}
	 */
	async renovar(req, res, next) {
		try {
			const resultado = await this.refreshService.renovar(req.body);
			return res.status(200).json(resultado);
		} catch (error) {
			next(error);
		}
	}
}
