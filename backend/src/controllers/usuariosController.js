import UsuarioService from '../services/usuarioService.js';

export default class UsuariosController {
	/**
	 * Crea una instancia de UsuariosController.
	 *
	 * @param {import('../services/usuarioService.js').default} usuarioService Servicio de usuarios
	 */
	constructor(usuarioService) {
		/** @private {import('../services/usuarioService.js').default} */
		this.usuarioService = usuarioService;
	}

	/**
	 * Crea un nuevo usuario a partir del body de la petición.
	 *
	 * @param {import('express').Request} req Petición HTTP
	 * @param {import('express').Response} res Respuesta HTTP
	 * @param {import('express').NextFunction} next Función de error siguiente
	 * @returns {Promise<void>}
	 */
	async crear(req, res, next) {
		try {
			const usuarioCreado = await this.usuarioService.crearUsuario(req.body);
			return res.status(201).json(usuarioCreado);
		} catch (error) {
			next(error);
		}
	}
}
