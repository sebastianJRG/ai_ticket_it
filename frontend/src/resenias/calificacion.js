/**
 * @file Lógica de la calificación de un evento, pura (sin React ni servicios):
 *   escala de puntaje, validación del borrador, detección de reseña propia y
 *   mensajes de error (specs/006-mis-compras-comprador/data-model.md §5;
 *   research R11). La regla "una reseña por evento" la aplica el backend (409).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/** Largo máximo del comentario (igual que el backend). */
const MAX_DETALLE = 1000;

/**
 * Borrador del formulario (data-model.md › BorradorResenia).
 * @typedef {Object} BorradorResenia
 * @property {number|null} puntuacion Entero 1–5, o `null` sin elegir.
 * @property {string} detalle Comentario tal como se escribió.
 */

/**
 * Resultado de {@link validarResenia}.
 * @typedef {Object} ValidacionResenia
 * @property {boolean} valido Si se puede enviar.
 * @property {{puntuacion?: string, detalle?: string}} errores Mensaje por campo.
 */

/**
 * Aviso de error al crear la reseña.
 * @typedef {Object} MensajeErrorResenia
 * @property {string} titulo Título del aviso.
 * @property {string} cuerpo Detalle (puede ser `''`).
 * @property {boolean} yaCalificado Si el error implica que ya existe la reseña (409).
 */

/** Escala del puntaje (design-system › Rating › RatingInput). */
export const ESCALA_PUNTAJE = Object.freeze({
	1: 'Malo',
	2: 'Regular',
	3: 'Bueno',
	4: 'Muy bueno',
	5: 'Excelente'
});

/**
 * Indica si un valor es una puntuación válida.
 * @param {unknown} n Valor.
 * @returns {boolean} `true` si es entero entre 1 y 5.
 */
const esPuntuacion = (n) => Number.isInteger(n) && n >= 1 && n <= 5;

/**
 * Caption del puntaje elegido.
 * @param {number|null} puntuacion Puntuación.
 * @returns {string} "4/5 · Muy bueno", o `''` si no es válida.
 */
export function textoPuntaje(puntuacion) {
	return esPuntuacion(puntuacion)
		? `${puntuacion}/5 · ${ESCALA_PUNTAJE[puntuacion]}`
		: '';
}

/**
 * Valida el borrador antes de enviarlo (mismas reglas que el backend).
 * @param {BorradorResenia} borrador Puntuación y comentario.
 * @returns {ValidacionResenia} Validez y errores por campo.
 */
export function validarResenia({ puntuacion, detalle } = {}) {
	const errores = {};
	if (!esPuntuacion(puntuacion))
		errores.puntuacion = 'Elegí de 1 a 5 estrellas';
	const texto = typeof detalle === 'string' ? detalle.trim() : '';
	if (texto === '') errores.detalle = 'Escribí un comentario';
	else if (texto.length > MAX_DETALLE)
		errores.detalle = 'Máximo 1000 caracteres';
	return { valido: Object.keys(errores).length === 0, errores };
}

/**
 * Indica si el usuario ya reseñó el evento.
 * @param {object[]|null|undefined} resenias Reseñas públicas del evento.
 * @param {string|null|undefined} usuarioId ID del usuario de la sesión.
 * @returns {boolean} `true` si alguna reseña es suya.
 */
export function yaCalifico(resenias, usuarioId) {
	if (!usuarioId || !Array.isArray(resenias)) return false;
	return resenias.some((r) => r?.comprador?.id === usuarioId);
}

/**
 * Traduce el error de `crearResenia` a un aviso (research R11).
 * @param {{status?: number, message?: string}|null} error `ApiError` recibido.
 * @returns {MensajeErrorResenia} Aviso para la sección.
 */
export function mensajeErrorResenia(error) {
	const servidor = typeof error?.message === 'string' ? error.message : '';
	switch (error?.status) {
		case 409:
			return {
				titulo: 'Ya calificaste este evento',
				cuerpo: '',
				yaCalificado: true
			};
		case 400:
			return {
				titulo: 'No pudimos guardar tu reseña',
				cuerpo: servidor,
				yaCalificado: false
			};
		case 403:
			return {
				titulo:
					'Necesitás una entrada utilizada de este evento para calificarlo',
				cuerpo: '',
				yaCalificado: false
			};
		case 0:
			return {
				titulo: 'Sin conexión',
				cuerpo: 'Revisá tu conexión e intentá de nuevo.',
				yaCalificado: false
			};
		default:
			return {
				titulo: 'No pudimos guardar tu reseña',
				cuerpo: 'Intentá de nuevo en unos segundos.',
				yaCalificado: false
			};
	}
}
