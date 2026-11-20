/**
 * @file Servicio de mensajería: chat de una compra entre el comprador dueño y
 *   el organizador del evento (contracts/servicios.md › mensajeService).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { cliente } from './api';

/**
 * Ruta del chat de una compra.
 * @param {string} idCompra ID de la compra.
 * @returns {string} Ruta con el ID codificado.
 */
const rutaChat = (idCompra) =>
	`/api/compras/${encodeURIComponent(idCompra)}/mensajes`;

/**
 * Envía un mensaje al chat de una compra (el remitente sale de la sesión).
 * @param {string} idCompra ID de la compra.
 * @param {string} mensaje Texto de 1 a 1000 caracteres.
 * @returns {Promise<object>} Mensaje creado.
 * @throws {import('./api').ApiError} 400 (ID o texto inválido), 401, 403 (no participa de la compra), 404 (la compra no existe), 0.
 */
export async function enviarMensaje(idCompra, mensaje) {
	const { data } = await cliente.post(rutaChat(idCompra), { mensaje });
	return data;
}

/**
 * Lista el chat de una compra, del mensaje más antiguo al más reciente.
 * @param {string} idCompra ID de la compra.
 * @returns {Promise<object[]>} Mensajes.
 * @throws {import('./api').ApiError} 400 (ID inválido), 401, 403 (no participa de la compra), 404 (la compra no existe), 0.
 */
export async function listarMensajes(idCompra) {
	const { data } = await cliente.get(rutaChat(idCompra));
	return data;
}
