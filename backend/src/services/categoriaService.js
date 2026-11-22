import {
	actualizarCategoriaSchema,
	crearCategoriaSchema
} from '../dto/categoria.js';
import Categoria from '../models/categoria.js';
import CategoriaRepository from '../repositories/categoriaRepository.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';

export default class CategoriaService {
	/**
	 * @param {CategoriaRepository} categoriaRepository
	 */
	constructor(categoriaRepository) {
		/** @private */
		this.categoriaRepository = categoriaRepository;
	}

	/**
	 * Obtiene todas las categorías disponibles.
	 * @returns {Promise<Categoria[]>}
	 */
	async obtenerTodas() {
		return await this.categoriaRepository.obtenerTodos();
	}

	/**
	 * Obtiene una categoría por su ID.
	 * @param {string} id
	 * @returns {Promise<Categoria>}
	 * @throws {NotFoundError} Si la categoría no existe
	 */
	async obtenerPorId(id) {
		const categoria = await this.categoriaRepository.buscarPorId(id);
		if (!categoria) {
			throw new NotFoundError(`La categoría con ID ${id} no existe.`);
		}
		return categoria;
	}

	/**
	 * Crea una nueva categoría validando que los campos requeridos estén presentes.
	 * @param {object} datosCategoria
	 * @returns {Promise<Categoria>}
	 * @throws {BadRequestError} Si los datos son inválidos
	 */
	async crearCategoria(datosCategoria) {
		// 1. Validar los datos
		const resultado = crearCategoriaSchema.safeParse(datosCategoria);
		if (!resultado.success) {
			let message;
			if (
				resultado.error.issues &&
				resultado.error.issues.length > 0 &&
				resultado.error.issues[0] &&
				resultado.error.issues[0].message
			) {
				message = resultado.error.issues[0].message;
			} else {
				message = 'Error de validación';
			}
			throw new BadRequestError(message);
		}

		const { nombre, descripcion } = resultado.data;

		// 2. Instanciar y guardar
		const nuevaCategoria = new Categoria(null, nombre, descripcion);

		return await this.categoriaRepository.crear(nuevaCategoria);
	}

	/**
	 * Actualiza una categoría existente.
	 * @param {string} categoriaId - ID de la categoría
	 * @param {object} datosActualizacion - Campos a actualizar (nombre, descripción)
	 * @returns {Promise<Categoria>} La categoría actualizada
	 * @throws {NotFoundError} Si la categoría no existe
	 * @throws {BadRequestError} Si los datos son inválidos o no hay nada que actualizar
	 */
	async actualizarCategoria(categoriaId, datosActualizacion) {
		// 1. Verificar si existe (recordando que los IDs son strings)
		const categoria = await this.categoriaRepository.buscarPorId(categoriaId);
		if (!categoria) {
			throw new NotFoundError(`La categoría con ID ${categoriaId} no existe.`);
		}

		// 2. Validar qué campos enviaron para actualizar
		const resultado = actualizarCategoriaSchema.safeParse(datosActualizacion);
		if (!resultado.success) {
			let message;
			if (
				resultado.error.issues &&
				resultado.error.issues.length > 0 &&
				resultado.error.issues[0] &&
				resultado.error.issues[0].message
			) {
				message = resultado.error.issues[0].message;
			} else {
				message = 'Error de validación';
			}
			throw new BadRequestError(message);
		}

		const datosValidados = resultado.data;

		if (Object.keys(datosValidados).length === 0) {
			throw new BadRequestError(
				'No se enviaron datos válidos para actualizar la categoría.'
			);
		}

		// 3. Aplicar los cambios
		if (datosValidados.nombre) categoria.nombre = datosValidados.nombre;
		if (datosValidados.descripcion)
			categoria.descripcion = datosValidados.descripcion;

		// 4. Guardar
		return await this.categoriaRepository.actualizar(categoria);
	}
}
