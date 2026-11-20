/**
 * Controlador HTTP de los favoritos del comprador
 * (GET /api/usuarios/favoritos, PUT y DELETE /api/usuarios/favoritos/:idEvento).
 * El usuario sale siempre del token JWT; las reglas viven en `UsuarioService`
 * y la representación de los eventos en `EventoService` + `aEventoRespuesta`.
 *
 * @module controllers/favoritoController
 * @owner Equipo Al Ticket It — backend
 * @license ISC
 */
import { aEventoRespuesta } from '../dto/evento.js';

export default class FavoritoController {
	/**
	 * Crea una instancia de FavoritoController.
	 * @param {import('../services/usuarioService.js').default} usuarioService Servicio de usuarios (reglas de favoritos)
	 * @param {import('../services/eventoService.js').default} eventoService Servicio de eventos (resuelve IDs a eventos)
	 */
	constructor(usuarioService, eventoService) {
		/** @private {import('../services/usuarioService.js').default} */
		this.usuarioService = usuarioService;
		/** @private {import('../services/eventoService.js').default} */
		this.eventoService = eventoService;
	}

	/**
	 * GET /api/usuarios/favoritos — lista los favoritos del comprador.
	 * @param {import('express').Request} req - Petición con `req.user` (token) y `req.id`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con los eventos, `[]` si no hay)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (404)
	 * @returns {Promise<void>}
	 */
	async listar(req, res, next) {
		try {
			const contexto = { requestId: req.id };
			const ids = await this.usuarioService.listarFavoritos(
				req.user.id,
				contexto
			);
			await this._responderLista(ids, contexto, res);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * PUT /api/usuarios/favoritos/:idEvento — agrega el evento a favoritos (idempotente).
	 * @param {import('express').Request} req - Petición con `req.user` (token), `req.params.idEvento` y `req.id`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la lista actualizada)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 404)
	 * @returns {Promise<void>}
	 */
	async agregar(req, res, next) {
		try {
			const contexto = { requestId: req.id };
			const ids = await this.usuarioService.agregarAFavoritos(
				req.user.id,
				req.params.idEvento,
				contexto
			);
			await this._responderLista(ids, contexto, res);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /api/usuarios/favoritos/:idEvento — quita el evento de favoritos (idempotente).
	 * @param {import('express').Request} req - Petición con `req.user` (token), `req.params.idEvento` y `req.id`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la lista actualizada)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 404)
	 * @returns {Promise<void>}
	 */
	async quitar(req, res, next) {
		try {
			const contexto = { requestId: req.id };
			const ids = await this.usuarioService.removerDeFavoritos(
				req.user.id,
				req.params.idEvento,
				contexto
			);
			await this._responderLista(ids, contexto, res);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Resuelve los IDs de favoritos y responde 200 con los eventos públicos.
	 * @private
	 * @param {string[]} ids - IDs de eventos favoritos, en orden
	 * @param {{requestId?: string}} contexto - Datos de la petición
	 * @param {import('express').Response} res - Respuesta HTTP
	 * @returns {Promise<import('express').Response>} Respuesta enviada
	 */
	async _responderLista(ids, contexto, res) {
		const eventos = await this.eventoService.obtenerPorIds(ids, contexto);
		return res.status(200).json(eventos.map(aEventoRespuesta));
	}
}
