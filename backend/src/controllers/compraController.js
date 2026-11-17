/**
 * Controlador de compras.
 * La autenticación y el rol los exige el middleware de cada ruta.
 *
 * @module controllers/compraController
 * @license ISC
 */
import { aCompraRespuesta } from '../dto/compra.js';

export default class CompraController {
	/**
	 * @param {import('../services/compraService.js').default} compraService Servicio de compras
	 */
	constructor(compraService) {
		/** @private */
		this.compraService = compraService;
	}

	/**
	 * Crea una compra para el comprador autenticado.
	 * El `compradorId` se toma siempre del token JWT: si el cuerpo trae uno, se sobrescribe.
	 * @param {import('express').Request} req - Petición con `req.user` del token y el cuerpo { eventoId, tipoEntradaId, cantidad }
	 * @param {import('express').Response} res - Respuesta HTTP (201 con la compra)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 403, 404, 409)
	 * @returns {Promise<void>}
	 */
	async crear(req, res, next) {
		try {
			const compra = await this.compraService.crearCompra({
				...req.body,
				compradorId: req.user.id
			});
			return res.status(201).json(aCompraRespuesta(compra));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Cancela la compra indicada en la URL. Pueden hacerlo su comprador o el organizador del evento.
	 * El usuario se toma siempre del token JWT, nunca del cuerpo.
	 * @param {import('express').Request} req - Petición con `req.user` del token y `req.params.idCompra`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la compra actualizada)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 403, 404, 409)
	 * @returns {Promise<void>}
	 */
	async cancelar(req, res, next) {
		try {
			const compra = await this.compraService.cancelarCompra({
				compraId: req.params.idCompra,
				usuarioId: req.user.id
			});
			return res.status(200).json(aCompraRespuesta(compra));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Confirma la compra indicada en la URL (solo el organizador del evento).
	 * El usuario se toma siempre del token JWT, nunca del cuerpo.
	 * @param {import('express').Request} req - Petición con `req.user` del token y `req.params.idCompra`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la compra actualizada)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 403, 404, 409)
	 * @returns {Promise<void>}
	 */
	async confirmar(req, res, next) {
		try {
			const compra = await this.compraService.confirmarCompra({
				compraId: req.params.idCompra,
				usuarioId: req.user.id
			});
			return res.status(200).json(aCompraRespuesta(compra));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Reembolsa la compra indicada en la URL (solo el organizador del evento).
	 * El usuario se toma siempre del token JWT, nunca del cuerpo.
	 * @param {import('express').Request} req - Petición con `req.user` del token y `req.params.idCompra`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la compra actualizada)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 403, 404, 409)
	 * @returns {Promise<void>}
	 */
	async reembolsar(req, res, next) {
		try {
			const compra = await this.compraService.reembolsarCompra({
				compraId: req.params.idCompra,
				usuarioId: req.user.id
			});
			return res.status(200).json(aCompraRespuesta(compra));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Lista las compras del evento indicado en la URL (solo su organizador).
	 * El usuario se toma siempre del token JWT.
	 * @param {import('express').Request} req - Petición con `req.user` del token y `req.params.idEvento`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la lista, posiblemente vacía)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 403, 404)
	 * @returns {Promise<void>}
	 */
	async listarPorEvento(req, res, next) {
		try {
			const compras = await this.compraService.listarComprasDeEvento({
				eventoId: req.params.idEvento,
				usuarioId: req.user.id
			});
			return res.status(200).json(compras.map(aCompraRespuesta));
		} catch (error) {
			next(error);
		}
	}
}
