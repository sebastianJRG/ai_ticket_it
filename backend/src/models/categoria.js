export default class Categoria {
	/**
	 * @param {string|null} [id=null]
	 * @param {string} nombre
	 * @param {string} descripcion
	 */
	constructor(id = null, nombre, descripcion) {
		/** @type {string|null} */
		this.id = id;

		/** @type {string} */
		this.nombre = nombre;

		/** @type {string} */
		this.descripcion = descripcion;
	}
}
