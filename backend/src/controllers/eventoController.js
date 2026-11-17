import { aEventoRespuesta } from '../dto/evento.js';

/**
 * Controlador para la creación de eventos.
 * Solo usuarios con rol ORGANIZADOR pueden crear eventos.
 *
 * @param {import('express').Request} req - Petición HTTP con req.user del token JWT
 * @param {import('express').Response} res - Respuesta HTTP
 * @param {import('express').NextFunction} next - Función de manejo de errores
 * @returns {Promise<void>}
 * @throws {Error} 401 si no hay token/usuario no autenticado
 * @throws {Error} 403 si el usuario no es organizador
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
	 * @throws {Error} 400 si algún parámetro de consulta es inválido (vía next)
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
				const error = new Error('No autorizado - token JWT inválido o ausente');
				error.status = 401;
				return next(error);
			}

			// 2. Validar rol: solo ORGANIZADOR puede crear eventos
			if (req.user.rol !== 'ORGANIZADOR') {
				const error = new Error(
					'Permisos denegados: solo organizadores pueden crear eventos'
				);
				error.status = 403;
				return next(error);
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
