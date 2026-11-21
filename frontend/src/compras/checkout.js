/**
 * @file Lógica del checkout, pura (sin React ni servicios): selección inicial,
 *   tope de cantidad por cupo, total estimado, texto del botón y mensajes de
 *   error de la compra (specs/005-detalle-evento-compra/data-model.md §8;
 *   research R6, R7). El tope son las entradas disponibles que informa
 *   `GET /api/eventos/:id`; el control real sigue siendo el 409 del servidor.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { formatPrice } from '../theme/format';

/**
 * Selección del checkout (data-model.md › SeleccionCheckout).
 * @typedef {Object} SeleccionCheckout
 * @property {string|null} tipoId Tipo de entrada elegido, o `null`.
 * @property {number} cantidad Entero entre 1 y las entradas disponibles del tipo.
 */

/**
 * Límites del selector de cantidad.
 * @typedef {Object} LimitesCantidad
 * @property {number} min Siempre 1.
 * @property {number} max Cupo total del tipo.
 */

/**
 * Mensaje de error de la compra (research R7).
 * @typedef {Object} MensajeErrorCompra
 * @property {string} titulo Título del aviso.
 * @property {string} cuerpo Detalle (puede ser `''`).
 * @property {boolean} bloquea Si reintentar no tiene sentido sin cambiar de pantalla (403, 404).
 */

/**
 * Selección con la que abre el checkout: preselecciona solo si hay un único tipo disponible.
 * @param {import('../eventos/detalle').TipoEntradaVista[]} tipos Tipos del evento.
 * @returns {SeleccionCheckout} Selección inicial.
 */
export function seleccionInicial(tipos) {
	const disponibles = (Array.isArray(tipos) ? tipos : []).filter(
		(t) => !t.agotado
	);
	return {
		tipoId: disponibles.length === 1 ? disponibles[0].id : null,
		cantidad: 1
	};
}

/**
 * Límites de cantidad para un tipo de entrada.
 * @param {import('../eventos/detalle').TipoEntradaVista} tipo Tipo elegido.
 * @returns {LimitesCantidad} `{ min: 1, max: disponibles }` (o el cupo si no hay `disponibles`).
 */
export function limitesCantidad(tipo) {
	const tope = tipo?.disponibles ?? tipo?.cupo ?? 1;
	return { min: 1, max: Math.max(1, Math.trunc(tope)) };
}

/**
 * Lleva una cantidad a un entero dentro de los límites (nunca supera el cupo).
 * @param {number} cantidad Cantidad pedida.
 * @param {LimitesCantidad} limites Límites del tipo.
 * @returns {number} Cantidad válida.
 */
export function ajustarCantidad(cantidad, { min, max }) {
	const entero = Number.isFinite(cantidad) ? Math.trunc(cantidad) : min;
	return Math.min(max, Math.max(min, entero));
}

/**
 * Total estimado (precio × cantidad); el definitivo lo devuelve el servidor.
 * @param {import('../eventos/detalle').TipoEntradaVista|null} tipo Tipo elegido.
 * @param {number} cantidad Cantidad.
 * @returns {number} Total estimado (0 sin tipo).
 */
export function totalEstimado(tipo, cantidad) {
	return tipo ? tipo.precio * cantidad : 0;
}

/**
 * Texto del botón de confirmar.
 * @param {{tipo: object|null, cantidad: number, finalizado: boolean}} estado Tipo elegido, cantidad y si el evento ya ocurrió.
 * @returns {string} "Evento finalizado", "Elegí un tipo de entrada" o "Confirmar compra · $ X" / "· Gratis".
 */
export function textoConfirmar({ tipo, cantidad, finalizado }) {
	if (finalizado) return 'Evento finalizado';
	if (!tipo) return 'Elegí un tipo de entrada';
	return `Confirmar compra · ${formatPrice(totalEstimado(tipo, cantidad))}`;
}

/**
 * Traduce el error de `crearCompra` a un aviso (research R7).
 * @param {{status?: number, message?: string}|null} error `ApiError` recibido.
 * @returns {MensajeErrorCompra} Aviso para la pantalla.
 */
export function mensajeErrorCompra(error) {
	const servidor = typeof error?.message === 'string' ? error.message : '';
	switch (error?.status) {
		case 409:
			return {
				titulo: 'No quedan suficientes entradas de este tipo',
				cuerpo: servidor,
				bloquea: false
			};
		case 400:
			return {
				titulo: 'No pudimos crear la compra',
				cuerpo: servidor,
				bloquea: false
			};
		case 403:
			return {
				titulo: 'Solo los compradores pueden comprar entradas',
				cuerpo: '',
				bloquea: true
			};
		case 404:
			return {
				titulo: 'Este evento o tipo de entrada ya no existe',
				cuerpo: '',
				bloquea: true
			};
		case 0:
			return {
				titulo: 'Sin conexión',
				cuerpo: 'Revisá tu conexión e intentá de nuevo.',
				bloquea: false
			};
		default:
			return {
				titulo: 'No pudimos crear la compra',
				cuerpo: 'Intentá de nuevo en unos segundos.',
				bloquea: false
			};
	}
}
