/**
 * Controlador de reseñas.
 * La autenticación y el rol COMPRADOR de `crear` los exige el middleware de la ruta;
 * `listar` es público.
 *
 * @module controllers/reseniaController
 * @license ISC
 */
import { aReseniaRespuesta } from '../dto/resenia.js';

export default class ReseniaController {
	/**
	 * @param {import('../services/reseniaService.js').default} reseniaService Servicio de reseñas
	 */
	constructor(reseniaService) {
		/** @private */
		this.reseniaService = reseniaService;
	}

	/**
	 * Crea una reseña para el comprador autenticado.
	 * El `compradorId` se toma siempre del token JWT: si el cuerpo trae uno, se sobrescribe.
	 * @param {import('express').Request} req - Petición con `req.user` del token y el cuerpo { eventoId, detalle, puntuacion }
	 * @param {import('express').Response} res - Respuesta HTTP (201 con la reseña)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 403, 404, 409)
	 * @returns {Promise<void>}
	 */
	async crear(req, res, next) {
		try {
			const resenia = await this.reseniaService.crearResenia({
				...req.body,
				compradorId: req.user.id
			});
			return res.status(201).json(aReseniaRespuesta(resenia));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Lista las reseñas del evento indicado en la URL. Ruta pública.
	 * @param {import('express').Request} req - Petición con `req.params.idEvento`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la lista, posiblemente vacía)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 404)
	 * @returns {Promise<void>}
	 */
	async listar(req, res, next) {
		try {
			const resenias = await this.reseniaService.listarPorEvento(
				req.params.idEvento
			);
			return res.status(200).json(resenias.map(aReseniaRespuesta));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /api/usuarios/:idOrganizador/resenias — reseñas de los eventos de un organizador (público).
	 * @param {import('express').Request} req - Petición con `req.params.idOrganizador`
	 * @param {import('express').Response} res - 200 con las reseñas (posiblemente vacío)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 404)
	 * @returns {Promise<void>}
	 */
	async listarPorOrganizador(req, res, next) {
		try {
			const resenias = await this.reseniaService.listarPorOrganizador(
				req.params.idOrganizador
			);
			return res.status(200).json(resenias.map(aReseniaRespuesta));
		} catch (error) {
			next(error);
		}
	}
}
