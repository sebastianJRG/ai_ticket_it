import RepositorioEnMemoria from './repositorioEnMemoria.js';

/**
 * Repositorio en memoria de mensajes.
 * @extends {RepositorioEnMemoria<import('../models/mensaje.js').default>}
 */
export default class MensajeRepository extends RepositorioEnMemoria {
	/**
	 * Obtiene los mensajes de una compra, en orden de creación.
	 * @param {string} compraId - ID de la compra
	 * @returns {Promise<import('../models/mensaje.js').default[]>} Mensajes de la compra (puede ser vacío)
	 */
	async buscarPorCompraId(compraId) {
		return this.elementos
			.filter((m) => m.compra?.id === compraId)
			.map((m) => this._clonar(m));
	}
}
