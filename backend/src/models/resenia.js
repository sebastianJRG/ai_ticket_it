import Evento from './evento.js';
import Usuario from './usuario.js';

export default class Resenia {
	/**
	 * @param {string|null} [id=null]
	 * @param {Usuario} comprador
	 * @param {Evento} evento
	 * @param {string} detalle
	 * @param {number} puntuacion
	 */
	constructor(id = null, comprador, evento, detalle, puntuacion) {
		/** @type {string|null} */
		this.id = id;

		/** @type {Usuario} */
		this.comprador = comprador;

		/** @type {Evento} */
		this.evento = evento;

		/** @type {string} */
		this.detalle = detalle;

		/** @type {number} */
		this.puntuacion = puntuacion;
	}
}
