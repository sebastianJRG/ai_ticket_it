import RepositorioEnMemoria from './repositorioEnMemoria.js';

/**
 * Repositorio en memoria de reseñas.
 * @extends {RepositorioEnMemoria<import('../models/resenia.js').default>}
 */
export default class ReseniaRepository extends RepositorioEnMemoria {
	/**
	 * Obtiene las reseñas de un evento, en orden de creación.
	 * @param {string} eventoId - ID del evento
	 * @returns {Promise<import('../models/resenia.js').default[]>} Reseñas del evento (puede ser vacío)
	 */
	async buscarPorEventoId(eventoId) {
		return this.elementos
			.filter((r) => r.evento?.id === eventoId)
			.map((r) => this._clonar(r));
	}

	/**
	 * Busca la reseña que un comprador dejó sobre un evento.
	 * @param {string} compradorId - ID del comprador
	 * @param {string} eventoId - ID del evento
	 * @returns {Promise<import('../models/resenia.js').default|null>} La reseña, o null si no existe
	 */
	async buscarPorCompradorYEvento(compradorId, eventoId) {
		const encontrada = this.elementos.find(
			(r) => r.comprador?.id === compradorId && r.evento?.id === eventoId
		);
		return this._clonar(encontrada) ?? null;
	}
}
