import Categoria from './categoria.js';
import TipoEntrada from './tipoEntrada.js';
import Usuario from './usuario.js';

export default class Evento {
	/**
	 * @param {string|null} [id=null]
	 * @param {string} nombre
	 * @param {string} descripcion
	 * @param {Categoria} categoria
	 * @param {Date} fecha
	 * @param {TipoEntrada[]} tiposEntrada
	 * @param {string[]} multimedia
	 * @param {Usuario} organizador
	 */
	constructor(
		id = null,
		nombre,
		descripcion,
		categoria, // tipo Categoria
		fecha,
		tiposEntrada, // tipo TipoEntrada[]
		multimedia, // tipo String
		organizador // tipo Usuario
	) {
		/** @type {string|null} */
		this.id = id;

		/** @type {string} */
		this.nombre = nombre;

		/** @type {string} */
		this.descripcion = descripcion;

		/** @type {Categoria} */
		this.categoria = categoria;

		/** @type {Date} */
		this.fecha = fecha;

		/** @type {TipoEntrada[]} */
		this.tiposEntrada = tiposEntrada;

		/** @type {string[]} */
		this.multimedia = multimedia;

		/** @type {Usuario} */
		this.organizador = organizador;
	}
}
