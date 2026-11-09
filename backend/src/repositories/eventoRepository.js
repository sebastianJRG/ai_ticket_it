import RepositorioEnMemoria from './repositorioEnMemoria.js';

export default class EventoRepository extends RepositorioEnMemoria {
	/**
	 * Búsqueda específica con filtros de texto, categoría y ordenamiento[cite: 8].
	 */
	async buscarEventos({ texto, categoriaId, orden }) {
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

		if (orden === 'precio') {
			resultados.sort((a, b) => {
				const minA = Math.min(...a.tiposEntrada.map((t) => t.precio));
				const minB = Math.min(...b.tiposEntrada.map((t) => t.precio));
				return minA - minB;
			});
		} else if (orden === 'fecha') {
			resultados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
		}

		return resultados;
	}
}
