/**
 * @file Servicio de compras: alta, listado propio y transiciones de estado
 *   (contracts/servicios.md › compraService). Las reglas de EstadoCompra las
 *   valida el backend; las transiciones se envían sin cuerpo.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { cliente } from './api';

/**
 * Ruta de una transición de estado de compra.
 * @param {string} idCompra ID de la compra.
 * @param {'cancelacion'|'confirmacion'|'reembolso'} accion Transición.
 * @returns {string} Ruta con el ID codificado.
 */
const rutaTransicion = (idCompra, accion) =>
	`/api/compras/${encodeURIComponent(idCompra)}/${accion}`;

/**
 * Crea una compra en PENDIENTE para el COMPRADOR de la sesión (el total lo calcula el backend).
 * @param {{eventoId: string, tipoEntradaId: string, cantidad: number}} datos Evento, tipo de entrada y cantidad.
 * @returns {Promise<object>} Compra creada.
 * @throws {import('./api').ApiError} 400 (datos inválidos o evento ya ocurrido), 401, 403, 404, 409 (cupo insuficiente), 0.
 */
export async function crearCompra({ eventoId, tipoEntradaId, cantidad }) {
	const { data } = await cliente.post('/api/compras', {
		eventoId,
		tipoEntradaId,
		cantidad
	});
	return data;
}

/**
 * Lista las compras del COMPRADOR de la sesión, con `diasRestantes` si están CONFIRMADA.
 * @returns {Promise<object[]>} Compras en orden de creación (`[]` si no hay).
 * @throws {import('./api').ApiError} 401, 403 (otro rol), 0 (sin conexión).
 */
export async function listarMisCompras() {
	const { data } = await cliente.get('/api/compras');
	return data;
}

/**
 * Cancela una compra (COMPRADOR dueño u ORGANIZADOR del evento).
 * @param {string} idCompra ID de la compra.
 * @returns {Promise<object>} Compra actualizada.
 * @throws {import('./api').ApiError} 400 (transición inválida o evento ya ocurrido), 401, 403, 404, 0.
 */
export async function cancelarCompra(idCompra) {
	const { data } = await cliente.patch(rutaTransicion(idCompra, 'cancelacion'));
	return data;
}

/**
 * Confirma una compra PENDIENTE (ORGANIZADOR del evento).
 * @param {string} idCompra ID de la compra.
 * @returns {Promise<object>} Compra actualizada.
 * @throws {import('./api').ApiError} 400 (transición inválida o evento ya ocurrido), 401, 403, 404, 0.
 */
export async function confirmarCompra(idCompra) {
	const { data } = await cliente.patch(
		rutaTransicion(idCompra, 'confirmacion')
	);
	return data;
}

/**
 * Reembolsa una compra CONFIRMADA (ORGANIZADOR del evento).
 * @param {string} idCompra ID de la compra.
 * @returns {Promise<object>} Compra actualizada.
 * @throws {import('./api').ApiError} 400 (transición inválida o evento ya ocurrido), 401, 403, 404, 0.
 */
export async function reembolsarCompra(idCompra) {
	const { data } = await cliente.patch(rutaTransicion(idCompra, 'reembolso'));
	return data;
}
