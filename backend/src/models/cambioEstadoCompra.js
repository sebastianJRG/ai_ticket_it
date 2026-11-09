import Compra from './compra.js';
import EstadoCompra from './estadoCompra.js';
import Usuario from './usuario.js';

export default class CambioEstadoCompra {
	/**
	 * @param {string|null} [id=null]
	 * @param {Compra} compra
	 * @param {EstadoCompra} estado
	 * @param {Usuario} quien
	 * @param {Date} [fechaHora=new Date()]
	 */
	constructor(id = null, compra, estado, quien, fechaHora = new Date()) {
		/** @type {string|null} */
		this.id = id;

		/** @type {Compra} */
		this.compra = compra;

		/** @type {EstadoCompra} */
		this.estado = estado;

		/** @type {Usuario} */
		this.quien = quien;

		/** @type {Date} */
		this.fechaHora = fechaHora;
	}
}
