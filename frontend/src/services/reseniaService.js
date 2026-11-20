/**
 * @file Servicio de reseñas: alta por el comprador y listado por evento
 *   (contracts/servicios.md › reseniaService).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { cliente } from './api';

/**
 * Crea una reseña del COMPRADOR de la sesión sobre un evento ya ocurrido.
 * @param {{eventoId: string, detalle: string, puntuacion: number}} datos Evento, comentario (hasta 1000 caracteres) y puntuación entera 1–5.
 * @returns {Promise<object>} Reseña creada.
 * @throws {import('./api').ApiError} 400 (datos inválidos o evento no ocurrido), 401, 403 (sin compra UTILIZADA), 409 (ya reseñó), 0.
 */
export async function crearResenia({ eventoId, detalle, puntuacion }) {
	const { data } = await cliente.post('/api/resenias', {
		eventoId,
		detalle,
		puntuacion
	});
	return data;
}

/**
 * Lista las reseñas de un evento. Pública.
 * @param {string} idEvento ID del evento.
 * @returns {Promise<object[]>} Reseñas del evento.
 * @throws {import('./api').ApiError} 404 (el evento no existe), 0 (sin conexión).
 */
export async function listarReseniasEvento(idEvento) {
	const { data } = await cliente.get(
		`/api/resenias/${encodeURIComponent(idEvento)}`
	);
	return data;
}
