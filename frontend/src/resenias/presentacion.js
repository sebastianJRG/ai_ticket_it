/**
 * @file Lógica de presentación de reseñas, pura (sin React ni servicios):
 *   más recientes, promedio y autor visible
 *   (specs/005-detalle-evento-compra/data-model.md §3, §9; research R4).
 *   Las reseñas no traen fecha: "más recientes" = últimas en orden de creación.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/**
 * Reseña lista para `ReviewCard`.
 * @typedef {Object} ReseniaVista
 * @property {string} id ID de la reseña.
 * @property {string} autor "Nombre A.", o "Comprador" sin datos.
 * @property {string} iniciales Iniciales para el avatar.
 * @property {number} puntuacion Entero 1–5.
 * @property {string} detalle Comentario.
 */

/**
 * Lista segura.
 * @param {unknown} resenias Lista recibida.
 * @returns {object[]} La lista, o `[]`.
 */
const lista = (resenias) => (Array.isArray(resenias) ? resenias : []);

/**
 * Todas las reseñas, de la más nueva a la más vieja. No muta la entrada.
 * @param {object[]} resenias Reseñas en orden de creación.
 * @returns {object[]} Reseñas invertidas.
 */
export function ordenRecientes(resenias) {
	return [...lista(resenias)].reverse();
}

/**
 * Las `n` reseñas más recientes.
 * @param {object[]} resenias Reseñas en orden de creación.
 * @param {number} [n] Cantidad (2 por defecto, design-system › ReviewCard).
 * @returns {object[]} Hasta `n` reseñas, de la más nueva a la más vieja.
 */
export function recientes(resenias, n = 2) {
	return ordenRecientes(resenias).slice(0, n);
}

/**
 * Promedio a mostrar: el del servidor (`puntajeOrganizador`) o, si falta, el local.
 * @param {object[]} resenias Reseñas del organizador.
 * @param {number|null|undefined} puntajeServidor Promedio calculado por el backend.
 * @returns {number|null} Promedio, o `null` sin reseñas.
 */
export function promedio(resenias, puntajeServidor) {
	if (typeof puntajeServidor === 'number') return puntajeServidor;
	const puntos = lista(resenias)
		.map((r) => r?.puntuacion)
		.filter((p) => typeof p === 'number');
	if (!puntos.length) return null;
	return puntos.reduce((a, b) => a + b, 0) / puntos.length;
}

/**
 * Deriva la vista de una reseña.
 * @param {object} resenia Reseña de la API.
 * @returns {ReseniaVista} Datos para la tarjeta.
 */
export function aResenia(resenia) {
	const nombre = resenia?.comprador?.nombre?.trim() ?? '';
	const apellido = resenia?.comprador?.apellido?.trim() ?? '';
	const autor = nombre
		? `${nombre}${apellido ? ` ${apellido[0].toUpperCase()}.` : ''}`
		: 'Comprador';
	const iniciales = nombre
		? `${nombre[0]}${apellido[0] ?? ''}`.toUpperCase()
		: 'C';
	return {
		id: resenia?.id,
		autor,
		iniciales,
		puntuacion: resenia?.puntuacion ?? 0,
		detalle: resenia?.detalle ?? ''
	};
}
