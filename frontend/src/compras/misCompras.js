/**
 * @file Lógica de Mis compras, pura (sin React ni servicios): pestañas por
 *   estado, agrupación (más reciente primero) y mensajes del listado
 *   (specs/006-mis-compras-comprador/data-model.md §2–§4; research R3, R5, R6, R9).
 *   Las reglas de `EstadoCompra` las aplica el backend: acá solo se decide qué mostrar.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { formatPrice } from '../theme/format';

/**
 * Estado de una compra.
 * @typedef {'PENDIENTE'|'CONFIRMADA'|'UTILIZADA'|'CANCELADA'|'REEMBOLSADA'} EstadoCompra
 */

/**
 * Pestaña de Mis compras (data-model.md › PestanaCompras).
 * @typedef {Object} PestanaCompras
 * @property {'activas'|'pasadas'|'canceladas'} clave Identificador.
 * @property {string} etiqueta Texto de la pestaña.
 * @property {EstadoCompra[]} estados Estados que incluye.
 * @property {string} vacio Título del estado vacío de la pestaña.
 */

/**
 * Compras agrupadas por pestaña, cada lista en orden de creación descendente.
 * @typedef {Object} ComprasAgrupadas
 * @property {object[]} activas PENDIENTE y CONFIRMADA.
 * @property {object[]} pasadas UTILIZADA.
 * @property {object[]} canceladas CANCELADA y REEMBOLSADA.
 */

/**
 * Pestañas de Mis compras, en orden de presentación.
 * @type {ReadonlyArray<PestanaCompras>}
 */
export const PESTANAS_COMPRAS = Object.freeze([
	{
		clave: 'activas',
		etiqueta: 'Activas',
		estados: ['PENDIENTE', 'CONFIRMADA'],
		vacio: 'No tenés compras activas'
	},
	{
		clave: 'pasadas',
		etiqueta: 'Pasadas',
		estados: ['UTILIZADA'],
		vacio: 'No tenés compras pasadas'
	},
	{
		clave: 'canceladas',
		etiqueta: 'Canceladas',
		estados: ['CANCELADA', 'REEMBOLSADA'],
		vacio: 'No tenés compras canceladas'
	}
]);

/**
 * Pestaña a la que pertenece un estado.
 * @param {string} estado Estado de la compra.
 * @returns {'activas'|'pasadas'|'canceladas'|null} Clave, o `null` si el estado es desconocido.
 */
export function pestanaDeEstado(estado) {
	const p = PESTANAS_COMPRAS.find((x) => x.estados.includes(estado));
	return p ? p.clave : null;
}

/**
 * Agrupa las compras por pestaña; el servidor las da en orden de creación
 * ascendente y acá se invierten (FR-001). No modifica la entrada.
 * @param {object[]|null|undefined} compras Compras del listado.
 * @returns {ComprasAgrupadas} Compras por pestaña.
 */
export function agruparPorPestana(compras) {
	const grupos = { activas: [], pasadas: [], canceladas: [] };
	const lista = Array.isArray(compras) ? compras : [];
	for (let i = lista.length - 1; i >= 0; i -= 1) {
		const clave = pestanaDeEstado(lista[i]?.estado);
		if (clave) grupos[clave].push(lista[i]);
	}
	return grupos;
}

/**
 * Textos del estado de error del listado de compras.
 * @param {{status?: number}|null} error `ApiError` recibido.
 * @returns {{titulo: string, cuerpo: string}} Título y cuerpo para `EmptyState`.
 */
export function mensajeErrorListado(error) {
	return error?.status === 0
		? {
				titulo: 'Sin conexión',
				cuerpo: 'Revisá tu conexión e intentá de nuevo.'
			}
		: {
				titulo: 'No pudimos cargar tus compras',
				cuerpo: 'Intentá de nuevo en unos segundos.'
			};
}

const CANCELABLES = new Set(['PENDIENTE', 'CONFIRMADA']);

/**
 * Indica si se ofrece cancelar una compra (CU-08; research R5): PENDIENTE o
 * CONFIRMADA de un evento que todavía no ocurrió. El backend tiene la última palabra (400).
 * @param {object|null} compra Compra del listado.
 * @param {Date} [ahora] Momento de referencia.
 * @returns {boolean} `true` si la acción debe mostrarse.
 */
export function esCancelable(compra, ahora = new Date()) {
	if (!compra || !CANCELABLES.has(compra.estado)) return false;
	const fecha = new Date(compra.evento?.fecha).getTime();
	return Number.isFinite(fecha) && fecha > ahora.getTime();
}

/**
 * Cuerpo del diálogo de cancelación con el impacto concreto (design-system › Modal).
 * @param {object} compra Compra a cancelar.
 * @returns {string} Texto con cantidad × tipo, evento, total y reembolso.
 */
export function cuerpoCancelacion(compra) {
	return `Vas a cancelar ${compra.cantidad} × ${compra.tipoEntrada.nombre} de «${compra.evento.nombre}» por ${formatPrice(compra.total)}. El organizador gestiona el reembolso.`;
}

/**
 * Traduce el error de `cancelarCompra` a un aviso (research R6). El 401 lo
 * maneja la capa de servicios.
 * @param {{status?: number, message?: string}|null} error `ApiError` recibido.
 * @returns {{titulo: string, cuerpo: string}} Aviso para el toast.
 */
export function mensajeErrorCancelacion(error) {
	const servidor = typeof error?.message === 'string' ? error.message : '';
	switch (error?.status) {
		case 400:
			return { titulo: 'No se puede cancelar esta compra', cuerpo: servidor };
		case 403:
			return { titulo: 'No podés cancelar esta compra', cuerpo: '' };
		case 404:
			return { titulo: 'Esta compra ya no existe', cuerpo: '' };
		case 0:
			return {
				titulo: 'Sin conexión',
				cuerpo: 'Revisá tu conexión e intentá de nuevo.'
			};
		default:
			return {
				titulo: 'No pudimos cancelar la compra',
				cuerpo: 'Intentá de nuevo en unos segundos.'
			};
	}
}

/**
 * Paso de la línea de estado (data-model.md › PasoLinea).
 * @typedef {Object} PasoLinea
 * @property {EstadoCompra} estado Estado del paso.
 * @property {'hecho'|'actual'|'pendiente'} situacion Exactamente un paso es `actual`.
 */

/** Recorrido de cada estado: pasos que ya ocurrieron + el actual + los que faltan. */
const RECORRIDOS = Object.freeze({
	PENDIENTE: { hechos: [], futuros: ['CONFIRMADA', 'UTILIZADA'] },
	CONFIRMADA: { hechos: ['PENDIENTE'], futuros: ['UTILIZADA'] },
	UTILIZADA: { hechos: ['PENDIENTE', 'CONFIRMADA'], futuros: [] },
	// Sin historial no se sabe si llegó a confirmarse: no se lo afirma (research R9).
	CANCELADA: { hechos: ['PENDIENTE'], futuros: [] },
	// Solo se reembolsa desde CONFIRMADA.
	REEMBOLSADA: { hechos: ['PENDIENTE', 'CONFIRMADA'], futuros: [] }
});

/**
 * Pasos de la línea de estado a partir del estado actual (sin fechas: el
 * backend no expone el historial).
 * @param {string} estado Estado actual de la compra.
 * @returns {PasoLinea[]} Pasos en orden, o `[]` si el estado es desconocido.
 */
export function pasosLinea(estado) {
	const r = RECORRIDOS[estado];
	if (!r) return [];
	return [
		...r.hechos.map((e) => ({ estado: e, situacion: 'hecho' })),
		{ estado, situacion: 'actual' },
		...r.futuros.map((e) => ({ estado: e, situacion: 'pendiente' }))
	];
}
