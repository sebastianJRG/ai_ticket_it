/**
 * Esquemas de validación y serializador de reseñas.
 *
 * @module dto/resenia
 * @license ISC
 */
import { z } from 'zod';
import { aUsuarioPublico } from './usuarioPublico.js';

const MENSAJE_PUNTUACION = 'La puntuación debe estar entre 1 y 5.';

/**
 * Esquema para CREAR una reseña.
 * Nota: `compradorId` NO lo envía el cliente; el controlador lo toma del token JWT.
 */
export const crearReseniaSchema = z.object({
	compradorId: z
		.string({
			message: 'El ID del comprador es obligatorio y debe ser un texto.'
		})
		.trim()
		.min(1, 'El ID del comprador no puede estar vacío.'),

	eventoId: z
		.string({ message: 'El ID del evento es obligatorio y debe ser un texto.' })
		.trim()
		.min(1, 'El ID del evento no puede estar vacío.'),

	detalle: z
		.string({ message: 'El detalle es obligatorio y debe ser un texto.' })
		.trim()
		.min(1, 'El detalle no puede estar vacío.')
		.max(1000, 'El detalle no puede superar los 1000 caracteres.'),

	puntuacion: z
		.number({ message: 'La puntuación es obligatoria y debe ser un número.' })
		.int(MENSAJE_PUNTUACION)
		.min(1, MENSAJE_PUNTUACION)
		.max(5, MENSAJE_PUNTUACION)
});

/** Esquema del ID de evento recibido en la URL (`:idEvento`). */
export const idEventoSchema = z
	.string({ message: 'El ID del evento es obligatorio y debe ser un texto.' })
	.trim()
	.min(1, 'El ID del evento no puede estar vacío.');

/**
 * ID de usuario recibido por URL (por ejemplo, el organizador cuyas reseñas se listan).
 * @type {import('zod').ZodString}
 */
export const idUsuarioSchema = z
	.string({ message: 'El ID del usuario es obligatorio y debe ser un texto.' })
	.trim()
	.min(1, 'El ID del usuario no puede estar vacío.');

/**
 * Convierte una reseña de dominio en su representación para respuestas HTTP.
 * Expone solo el nombre del comprador y el ID del evento.
 * @param {import('../models/resenia.js').default} resenia
 * @returns {{id: string, comprador: {id: string, nombre: string, apellido: string}|null, eventoId: string, detalle: string, puntuacion: number}}
 */
export function aReseniaRespuesta(resenia) {
	const comprador = aUsuarioPublico(resenia.comprador);
	return {
		id: resenia.id,
		comprador: comprador && {
			id: comprador.id,
			nombre: comprador.nombre,
			apellido: comprador.apellido
		},
		eventoId: resenia.evento.id,
		detalle: resenia.detalle,
		puntuacion: resenia.puntuacion
	};
}
