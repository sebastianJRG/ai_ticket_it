import EstadoCompra from './estadoCompra.js';
import Evento from './evento.js';
import TipoEntrada from './tipoEntrada.js';
import Usuario from './usuario.js';

/**
 * Transiciones válidas de `EstadoCompra`. UTILIZADA, CANCELADA y REEMBOLSADA son terminales.
 * @type {Readonly<Record<string, string[]>>}
 */
const TRANSICIONES_PERMITIDAS = Object.freeze({
	[EstadoCompra.PENDIENTE]: [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA],
	[EstadoCompra.CONFIRMADA]: [
		EstadoCompra.UTILIZADA,
		EstadoCompra.CANCELADA,
		EstadoCompra.REEMBOLSADA
	],
	[EstadoCompra.UTILIZADA]: [],
	[EstadoCompra.CANCELADA]: [],
	[EstadoCompra.REEMBOLSADA]: []
});

export default class Compra {
	/**
	 * @param {string|null} [id=null]
	 * @param {Usuario} comprador
	 * @param {Evento} evento
	 * @param {TipoEntrada} tipoEntrada
	 * @param {number} cantidad
	 * @param {number} total
	 * @param {EstadoCompra} [estado=EstadoCompra.PENDIENTE]
	 */
	constructor(
		id = null,
		comprador,
		evento,
		tipoEntrada,
		cantidad,
		total,
		estado = EstadoCompra.PENDIENTE
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
	}

	/**
	 * Indica si la compra puede pasar a `nuevoEstado` según las transiciones permitidas.
	 * @param {EstadoCompra} nuevoEstado
	 * @returns {boolean} true si la transición desde el estado actual es válida
	 */
	puedeTransicionarA(nuevoEstado) {
		return TRANSICIONES_PERMITIDAS[this.estado]?.includes(nuevoEstado) ?? false;
	}

	/**
	 * Actualiza el estado actual de la compra respetando las transiciones permitidas.
	 * @param {EstadoCompra} nuevoEstado
	 * @returns {void}
	 * @throws {Error} Si la transición desde el estado actual no está permitida (el estado no cambia)
	 */
	actualizarEstado(nuevoEstado) {
		if (!this.puedeTransicionarA(nuevoEstado)) {
			throw new Error(
				`Transición de estado no permitida: ${this.estado} → ${nuevoEstado}.`
			);
		}
		this.estado = nuevoEstado;
	}
}
