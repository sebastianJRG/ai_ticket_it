export default class TipoEntrada {
	/**
	 * @param {string|null} [id=null]
	 * @param {string} nombre
	 * @param {string} descripcion
	 * @param {number} precio
	 * @param {number} cupo
	 */
	constructor(id = null, nombre, descripcion, precio, cupo) {
		/** @type {string|null} */
		this.id = id;

		/** @type {string} */
		this.nombre = nombre;

		/** @type {string} */
		this.descripcion = descripcion;

		/** @type {number} */
		this.precio = precio;

		/** @type {number} */
		this.cupo = cupo;
	}

	/**
	 * Verifica si hay suficiente cupo disponible para la cantidad solicitada.
	 * @param {number} cantidad
	 * @returns {boolean}
	 */
	hayCupoPara(cantidad) {
		return this.cupo >= cantidad;
	}
}
