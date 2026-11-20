/**
 * @file Servicio de eventos: búsqueda, detalle, alta y compras de un evento
 *   (contracts/servicios.md › eventoService).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { cliente } from './api';

/**
 * Filtros de búsqueda de eventos; los vacíos se omiten.
 * @typedef {Object} FiltrosEventos
 * @property {string} [q] Texto a buscar.
 * @property {string} [categoriaId] ID de categoría.
 * @property {'precio'|'fecha'|'puntaje'} [sortBy] Criterio de orden.
 * @property {'asc'|'desc'} [order] Sentido del orden.
 */

/**
 * Indica si un filtro no aporta valor (`undefined`, `null` o texto en blanco).
 * @param {any} valor Valor del filtro.
 * @returns {boolean} `true` si debe omitirse.
 */
const esVacio = (valor) =>
	valor == null || (typeof valor === 'string' && valor.trim() === '');

/**
 * Lista o busca eventos. Pública.
 * @param {FiltrosEventos} [filtros] Filtros; los vacíos no se envían.
 * @returns {Promise<object[]>} Eventos con organizador público y `puntajeOrganizador`.
 * @throws {import('./api').ApiError} 400 (parámetros inválidos), 0 (sin conexión).
 */
export async function listarEventos(filtros = {}) {
	const params = Object.fromEntries(
		Object.entries(filtros).filter(([, valor]) => !esVacio(valor))
	);
	const { data } = await cliente.get('/api/eventos', { params });
	return data;
}

/**
 * Devuelve el detalle de un evento. Pública.
 * @param {string} idEvento ID del evento.
 * @returns {Promise<object>} Evento con el mismo formato que el listado.
 * @throws {import('./api').ApiError} 400 (ID inválido), 404 (no existe), 0 (sin conexión).
 */
export async function obtenerEvento(idEvento) {
	const { data } = await cliente.get(
		`/api/eventos/${encodeURIComponent(idEvento)}`
	);
	return data;
}

/**
 * Crea un evento del ORGANIZADOR de la sesión (el backend toma el organizador del token).
 * @param {{nombre: string, descripcion: string, categoriaId: string, fecha: string, tiposEntrada: {nombre: string, descripcion: string, precio: number, cupo: number}[], multimedia?: string[]}} datos Datos del evento.
 * @returns {Promise<object>} Evento creado.
 * @throws {import('./api').ApiError} 400 (datos inválidos), 401, 403 (no es ORGANIZADOR), 404 (categoría inexistente), 0.
 */
export async function crearEvento(datos) {
	const { data } = await cliente.post('/api/eventos', datos);
	return data;
}

/**
 * Devuelve las compras y la disponibilidad por tipo de entrada de un evento propio.
 * @param {string} idEvento ID del evento.
 * @returns {Promise<{compras: object[], disponibilidad: {tipoEntradaId: string, nombre: string, precio: number, cupo: number, vendidas: number, disponibles: number}[]}>} Compras y disponibilidad.
 * @throws {import('./api').ApiError} 400 (ID inválido), 401, 403 (no es el organizador dueño), 404 (no existe), 0.
 */
export async function obtenerComprasEvento(idEvento) {
	const { data } = await cliente.get(
		`/api/eventos/${encodeURIComponent(idEvento)}/compras`
	);
	return data;
}
