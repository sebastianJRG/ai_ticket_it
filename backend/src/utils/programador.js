/**
 * Programador de tareas periódicas.
 * Infraestructura sin lógica de negocio: la tarea que se ejecuta la decide el llamador.
 *
 * @module utils/programador
 * @license ISC
 */

/**
 * Ejecuta `tarea` cada `intervaloMs` milisegundos.
 * No solapa ejecuciones (si la anterior no terminó, se salta el ciclo), captura los
 * errores de la tarea para que un fallo no cancele el temporizador y no impide que
 * el proceso termine (`unref`).
 * @param {() => Promise<unknown>|unknown} tarea - Trabajo a repetir; puede ser síncrono o asíncrono
 * @param {number} intervaloMs - Milisegundos entre ejecuciones
 * @param {object} [opciones]
 * @param {(error: unknown) => void} [opciones.alError] - Se llama con el error cuando la tarea falla
 * @returns {{detener: () => void}} Manejador para cancelar las ejecuciones siguientes
 */
export function programarTarea(tarea, intervaloMs, { alError } = {}) {
	let enCurso = false;

	const temporizador = setInterval(async () => {
		if (enCurso) return;
		enCurso = true;
		try {
			await tarea();
		} catch (error) {
			alError?.(error);
		} finally {
			enCurso = false;
		}
	}, intervaloMs);
	temporizador.unref?.();

	return { detener: () => clearInterval(temporizador) };
}
