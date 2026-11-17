import RepositorioEnMemoria from './repositorioEnMemoria.js';

/**
 * Repositorio en memoria de compras.
 * @extends {RepositorioEnMemoria<import('../models/compra.js').default>}
 */
export default class CompraRepository extends RepositorioEnMemoria {
	/**
	 * Obtiene las compras de un comprador para un evento, en orden de creación.
	 * @param {string} compradorId - ID del comprador
	 * @param {string} eventoId - ID del evento
	 * @returns {Promise<import('../models/compra.js').default[]>} Compras encontradas (puede ser vacío)
	 */
	async buscarPorCompradorYEvento(compradorId, eventoId) {
		return this.elementos
			.filter(
				(c) => c.comprador?.id === compradorId && c.evento?.id === eventoId
			)
			.map((c) => this._clonar(c));
	}

	/**
	 * Obtiene todas las compras de un comprador, en orden de creación.
	 * @param {string} compradorId - ID del comprador
	 * @returns {Promise<import('../models/compra.js').default[]>} Compras del comprador (puede ser vacío)
	 */
	async buscarPorCompradorId(compradorId) {
		return this.elementos
			.filter((c) => c.comprador?.id === compradorId)
			.map((c) => this._clonar(c));
	}

	/**
	 * Obtiene todas las compras de un evento, en orden de creación.
	 * @param {string} eventoId - ID del evento
	 * @returns {Promise<import('../models/compra.js').default[]>} Compras del evento (puede ser vacío)
	 */
	async buscarPorEventoId(eventoId) {
		return this.elementos
			.filter((c) => c.evento?.id === eventoId)
			.map((c) => this._clonar(c));
	}
}
