import Usuario from './usuario.js';

export default class Mensaje {
	/**
	 * @param {string|null} [id=null]
	 * @param {Usuario} usuario - Remitente del mensaje
	 * @param {string} mensaje
	 * @param {Date} [enviado=new Date()]
	 * @param {{id: string}|null} [compra=null] - Compra a la que pertenece el chat
	 */
	constructor(id = null, usuario, mensaje, enviado = new Date(), compra = null) {
		/** @type {string|null} */
		this.id = id;

		/** @type {Usuario} */
		this.usuario = usuario;

		/** @type {string} */
		this.mensaje = mensaje;

		/** @type {Date} */
		this.enviado = enviado;

		/** @type {{id: string}|null} */
		this.compra = compra;
	}
}
