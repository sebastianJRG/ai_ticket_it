import Usuario from './usuario.js';

export default class Mensaje {
	/**
	 * @param {string|null} [id=null]
	 * @param {Usuario} usuario
	 * @param {string} mensaje
	 * @param {Date} [enviado=new Date()]
	 */
	constructor(id = null, usuario, mensaje, enviado = new Date()) {
		/** @type {string|null} */
		this.id = id;

		/** @type {Usuario} */
		this.usuario = usuario;

		/** @type {string} */
		this.mensaje = mensaje;

		/** @type {Date} */
		this.enviado = enviado;
	}
}
