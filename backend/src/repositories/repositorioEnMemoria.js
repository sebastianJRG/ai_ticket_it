/**
 * Repositorio genérico en memoria con soporte para clonación de referencias.
 * @template T
 */
export default class RepositorioEnMemoria {
	constructor() {
		/** @type {T[]} */
		this.elementos = [];
		this.proximoId = 1;
	}

	/** Helper privado para clonar referencias simples y evitar mutación directa.
	 * Preserva la instancia del prototipo original.
	 * @private
	 */
	_clonar(elemento) {
		if (!elemento) return null;
		return Object.assign(
			Object.create(Object.getPrototypeOf(elemento)),
			elemento
		);
	}

	async crear(elemento) {
		const nuevoElemento = this._clonar(elemento);
		if (!nuevoElemento.id) {
			nuevoElemento.id = String(this.proximoId++);
		}
		this.elementos.push(nuevoElemento);
		return this._clonar(nuevoElemento);
	}

	async buscarPorId(id) {
		const encontrado = this.elementos.find((e) => e.id === String(id));
		return this._clonar(encontrado) ?? null;
	}

	async obtenerTodos() {
		return this.elementos.map((e) => this._clonar(e));
	}

	async buscarUno(filtro) {
		const encontrado = this.elementos.find((elemento) =>
			Object.entries(filtro).every(
				([campo, valor]) => elemento[campo] === valor
			)
		);
		return this._clonar(encontrado) ?? null;
	}

	async buscarVarios(filtro) {
		const filtrados = this.elementos.filter((elemento) =>
			Object.entries(filtro).every(
				([campo, valor]) => elemento[campo] === valor
			)
		);
		return filtrados.map((e) => this._clonar(e));
	}

	async actualizar(elemento) {
		const indice = this.elementos.findIndex(
			(e) => e.id === String(elemento.id)
		);
		if (indice === -1) return null;

		const elementoActualizado = this._clonar(elemento);
		this.elementos[indice] = elementoActualizado;
		return this._clonar(elementoActualizado);
	}

	async eliminar(id) {
		const indice = this.elementos.findIndex((e) => e.id === String(id));
		if (indice === -1) return null;

		const [eliminado] = this.elementos.splice(indice, 1);
		return this._clonar(eliminado);
	}

	/**
	 * Elimina todos los elementos del repositorio y resetea el contador de IDs.
	 * Útil para limpiar el estado entre tests unitarios.
	 */
	async eliminarTodos() {
		this.elementos = [];
		this.proximoId = 1;
	}

	async sembrarSiVacio(elementos) {
		if (this.elementos.length > 0) return;
		for (const elemento of elementos) {
			await this.crear(elemento);
		}
	}

	/** Busca un elemento por el campo nombreUsuario (filtro exacto). */
	async buscarPorNombreUsuario(nombreUsuario) {
		return await this.buscarUno({ nombreUsuario });
	}

	/** Indica si ya existe un usuario con ese nombre de usuario. */
	async existePorNombreUsuario(nombreUsuario) {
		const encontrado = await this.buscarPorNombreUsuario(nombreUsuario);
		return !!encontrado;
	}
}
