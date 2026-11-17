import { aUsuarioPerfil } from '../dto/usuarioPerfil.js';

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

	/**
	 * Devuelve el perfil del usuario autenticado.
	 * El usuario se toma siempre del token JWT, nunca de la URL ni del cuerpo.
	 *
	 * @param {import('express').Request} req Petición con `req.user`
	 * @param {import('express').Response} res Respuesta HTTP (200 con el perfil)
	 * @param {import('express').NextFunction} next Recibe los errores del servicio (404)
	 * @returns {Promise<void>}
	 */
	async obtenerActual(req, res, next) {
		try {
			const usuario = await this.usuarioService.obtenerPerfil(req.user.id);
			return res.status(200).json(aUsuarioPerfil(usuario));
		} catch (error) {
			next(error);
		}
	}
}
