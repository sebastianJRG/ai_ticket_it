/**
 * Controlador de mensajes del chat de una compra.
 * La autenticación y el rol los exige el middleware de la ruta; la participación
 * en la compra la valida el servicio. Pasa `{ requestId: req.id }` al servicio
 * para sus logs estructurados.
 *
 * @module controllers/mensajeController
 * @license ISC
 */
import { aMensajeRespuesta } from '../dto/mensaje.js';

export default class MensajeController {
	/**
	 * @param {import('../services/mensajeService.js').default} mensajeService Servicio de mensajes
	 */
	constructor(mensajeService) {
		/** @private */
		this.mensajeService = mensajeService;
	}

	/**
	 * Envía un mensaje en el chat de la compra indicada en la URL.
	 * El remitente se toma siempre del token JWT, nunca del cuerpo.
	 * @param {import('express').Request} req - Petición con `req.user`, `req.params.idCompra` y el cuerpo { mensaje }
	 * @param {import('express').Response} res - Respuesta HTTP (201 con el mensaje)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 403, 404)
	 * @returns {Promise<void>}
	 */
	async crear(req, res, next) {
		try {
			const mensaje = await this.mensajeService.crearMensaje(
				{
					compraId: req.params.idCompra,
					usuarioId: req.user.id,
					mensaje: req.body?.mensaje
				},
				{ requestId: req.id }
			);
			return res.status(201).json(aMensajeRespuesta(mensaje));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Lista los mensajes del chat de la compra indicada en la URL.
	 * @param {import('express').Request} req - Petición con `req.user` y `req.params.idCompra`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la lista, posiblemente vacía)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 403, 404)
	 * @returns {Promise<void>}
	 */
	async listar(req, res, next) {
		try {
			const mensajes = await this.mensajeService.listarPorCompra(
				{
					compraId: req.params.idCompra,
					usuarioId: req.user.id
				},
				{ requestId: req.id }
			);
			return res.status(200).json(mensajes.map(aMensajeRespuesta));
		} catch (error) {
			next(error);
		}
	}
}
