/**
 * Exclusión mutua para secciones críticas asíncronas.
 *
 * @module utils/exclusionMutua
 * @license ISC
 */

/**
 * Serializa tareas asíncronas: cada una empieza cuando termina la anterior.
 * Sirve para que operaciones del tipo "leer, validar y escribir" sobre memoria
 * compartida no se intercalen entre peticiones concurrentes (por ejemplo, la
 * validación transaccional del cupo de un tipo de entrada).
 */
export default class ExclusionMutua {
	constructor() {
		/**
		 * Cola de tareas; nunca queda rechazada para no bloquear las siguientes.
		 * @private
		 * @type {Promise<void>}
		 */
		this._cola = Promise.resolve();
	}

	/**
	 * Ejecuta la tarea en exclusión mutua respecto de las demás tareas de esta instancia.
	 * @template T
	 * @param {() => Promise<T>|T} tarea - Sección crítica a ejecutar
	 * @returns {Promise<T>} Resultado de la tarea; si falla, se propaga su error
	 */
	ejecutar(tarea) {
		const resultado = this._cola.then(() => tarea());
		this._cola = resultado.then(
			() => undefined,
			() => undefined
		);
		return resultado;
	}
}
