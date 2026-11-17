import RepositorioEnMemoria from './repositorioEnMemoria.js';

/**
 * Repositorio en memoria de eventos.
 * @extends {RepositorioEnMemoria<import('../models/evento.js').default>}
 */
export default class EventoRepository extends RepositorioEnMemoria {
	/**
	 * Busca eventos aplicando filtros de texto y categoría.
	 * El ordenamiento no es responsabilidad del repositorio: lo resuelve el servicio.
	 * @param {object} [filtros]
	 * @param {string} [filtros.texto] - Texto a buscar en nombre o descripción (sin distinguir mayúsculas)
	 * @param {string} [filtros.categoriaId] - ID de la categoría por la que filtrar
	 * @returns {Promise<import('../models/evento.js').default[]>} Eventos que cumplen los filtros, en orden de creación
	 */
	async buscarEventos({ texto, categoriaId } = {}) {
		let resultados = await this.obtenerTodos();

		if (texto) {
			const query = texto.toLowerCase();
			resultados = resultados.filter(
				(e) =>
					e.nombre.toLowerCase().includes(query) ||
					e.descripcion.toLowerCase().includes(query)
			);
		}

		if (categoriaId) {
			resultados = resultados.filter((e) => e.categoria.id === categoriaId);
		}

		return resultados;
	}
}
