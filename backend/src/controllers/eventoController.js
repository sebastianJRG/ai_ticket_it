import { aEventoRespuesta } from '../dto/evento.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';

/**
 * Controlador para la creación de eventos.
 * Solo usuarios con rol ORGANIZADOR pueden crear eventos.
 *
 * @param {import('express').Request} req - Petición HTTP con req.user del token JWT
 * @param {import('express').Response} res - Respuesta HTTP
 * @param {import('express').NextFunction} next - Función de manejo de errores
 * @returns {Promise<void>}
 * @throws {UnauthorizedError} Si no hay token/usuario no autenticado (vía next)
 * @throws {ForbiddenError} Si el usuario no es organizador (vía next)
 * @property {import('../models/evento.js').default} eventoCreado - El evento creado
 */
export default class EventoController {
	/**
	 * Crea una instancia de EventoController.
	 * @param {import('../services/eventoService.js').default} eventoService Servicio de eventos
	 */
	constructor(eventoService) {
		/** @private {import('../services/eventoService.js').default} */
		this.eventoService = eventoService;
	}

	/**
	 * Lista eventos con búsqueda (q), filtro (categoriaId) y ordenamiento (sortBy, order).
	 * Ruta pública: no requiere autenticación.
	 * @param {import('express').Request} req - Petición HTTP con los query params
	 * @param {import('express').Response} res - Respuesta HTTP
	 * @param {import('express').NextFunction} next - Función de error siguiente
	 * @returns {Promise<void>}
	 * @throws {BadRequestError} Si algún parámetro de consulta es inválido (vía next)
	 */
	async listar(req, res, next) {
		try {
			const eventos = await this.eventoService.buscarEventos({ ...req.query });
			return res.status(200).json(eventos.map(aEventoRespuesta));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Devuelve el detalle de un evento.
	 * Ruta pública: no requiere autenticación.
	 * @param {import('express').Request} req - Petición HTTP con `req.params.idEvento`
	 * @param {import('express').Response} res - Respuesta HTTP (200 con el evento)
	 * @param {import('express').NextFunction} next - Recibe los errores del servicio (400, 404)
	 * @returns {Promise<void>}
	 */
	async obtener(req, res, next) {
		try {
			const evento = await this.eventoService.obtenerPorId(req.params.idEvento);
			return res.status(200).json(aEventoRespuesta(evento));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Crea un nuevo evento después de validar autenticación y permisos.
	 * @param {import('express').Request} req - Petición HTTP
	 * @param {import('express').Response} res - Respuesta HTTP
	 * @param {import('express').NextFunction} next - Función de error siguiente
	 * @returns {Promise<void>}
	 */
	async crear(req, res, next) {
		try {
			// 1. Validar autenticación mediante JWT
			if (!req.user) {
				return next(
					new UnauthorizedError('No autorizado - token JWT inválido o ausente')
				);
			}

			// 2. Validar rol: solo ORGANIZADOR puede crear eventos
			if (req.user.rol !== 'ORGANIZADOR') {
				return next(
					new ForbiddenError(
						'Permisos denegados: solo organizadores pueden crear eventos'
					)
				);
			}

			// 3. Delegar creación al service (ya validará Zod y BD)
			const organizadorId = req.user.id;
			const datosEvento = {
				...req.body,
				organizadorId: organizadorId
			};
			const eventoCreado = await this.eventoService.crearEvento(datosEvento);

			// 4. Responder con el evento creado y estado 201
			return res.status(201).json(aEventoRespuesta(eventoCreado));
		} catch (error) {
			next(error);
		}
	}
}
