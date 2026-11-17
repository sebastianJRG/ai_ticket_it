/**
 * Controlador de compras.
 * La autenticación y el rol COMPRADOR los exige el middleware de la ruta.
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
}
