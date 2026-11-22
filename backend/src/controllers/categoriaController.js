import { crearCategoriaSchema } from '../dto/categoria.js';
import Categoria from '../models/categoria.js';
import {
	BadRequestError,
	ForbiddenError,
	UnauthorizedError
} from '../errors/index.js';

/**
 * Controlador para la creación de categorías.
 * Solo usuarios con rol ORGANIZADOR pueden crear categorías.
 *
 * @param {import('express').Request} req - Petición HTTP con req.user del token JWT
 * @param {import('express').Response} res - Respuesta HTTP
 * @param {import('express').NextFunction} next - Función de manejo de errores
 * @returns {Promise<void>}
 * @throws {UnauthorizedError} Si no hay token/usuario no autenticado (vía next)
 * @throws {ForbiddenError} Si el usuario no es organizador (vía next)
 * @throws {BadRequestError} Si la validación Zod falla (vía next)
 * @property {import('../models/categoria.js').default} categoriaCreada - La categoría creada
 */
export default class CategoriaController {
	/** Crea una instancia de CategoriaController.
	 * @param {import('../services/categoriaService.js').default} categoriaService Servicio de categorías
	 */
	constructor(categoriaService) {
		/** @private {import('../services/categoriaService.js').default} */
		this.categoriaService = categoriaService;
	}

	/** Crea una nueva categoría después de validar autenticación y permisos.
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

			// 2. Validar rol: solo ORGANIZADOR puede crear categorías
			if (req.user.rol !== 'ORGANIZADOR') {
				return next(
					new ForbiddenError(
						'Permisos denegados: solo organizadores pueden crear categorías'
					)
				);
			}

			// 3. Validar estructura con Zod
			const resultado = crearCategoriaSchema.safeParse(req.body);
			if (!resultado.success) {
				const message =
					resultado.error.issues[0]?.message || 'Error de validación';
				return next(new BadRequestError(message));
			}

			// 4. Delegar creación al service (validará Zod y BD)
			const categoriaCreada = await this.categoriaService.crearCategoria(
				resultado.data
			);

			// 5. Responder con la categoría creada y estado 201
			return res.status(201).json(categoriaCreada);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Lista todas las categorías, en orden de creación. Ruta pública: no requiere
	 * autenticación ni rol.
	 * @param {import('express').Request} req - Petición HTTP (no se usa)
	 * @param {import('express').Response} res - Respuesta HTTP (200 con la lista, posiblemente vacía)
	 * @param {import('express').NextFunction} next - Recibe los errores inesperados del servicio
	 * @returns {Promise<void>}
	 */
	async listar(req, res, next) {
		try {
			const categorias = await this.categoriaService.obtenerTodas();
			return res.status(200).json(categorias);
		} catch (error) {
			next(error);
		}
	}
}
