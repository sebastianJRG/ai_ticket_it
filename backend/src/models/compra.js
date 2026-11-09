import EstadoCompra from './estadoCompra.js';
import Evento from './evento.js';
import Mensaje from './mensaje.js';
import TipoEntrada from './tipoEntrada.js';
import Usuario from './usuario.js';

export default class Compra {
	/**
	 * @param {string|null} [id=null]
	 * @param {Usuario} comprador
	 * @param {Evento} evento
	 * @param {TipoEntrada} tipoEntrada
	 * @param {number} cantidad
	 * @param {number} total
	 * @param {EstadoCompra} [estado=EstadoCompra.PENDIENTE]
	 * @param {Mensaje[]} [mensajes=[]]
	 */
	constructor(
		id = null,
		comprador,
		evento,
		tipoEntrada,
		cantidad,
		total,
		estado = EstadoCompra.PENDIENTE,
		mensajes = []
	) {
		/** @type {string|null} */
		this.id = id;

		/** @type {Usuario} */
		this.comprador = comprador;

		/** @type {Evento} */
		this.evento = evento;

		/** @type {TipoEntrada} */
		this.tipoEntrada = tipoEntrada;

		/** @type {number} */
		this.cantidad = cantidad;

		/** @type {number} */
		this.total = total;

		/** @type {EstadoCompra} */
		this.estado = estado;

		/** @type {Mensaje[]} */
		this.mensajes = mensajes;
	}

	/**
	 * Actualiza el estado actual de la compra.
	 * @param {EstadoCompra} nuevoEstado
	 * @returns {void}
	 */
	actualizarEstado(nuevoEstado) {
		//this.estado = nuevoEstado;
	}
}
