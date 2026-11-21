/**
 * @file Lógica de presentación del detalle de un evento, pura (sin React ni
 *   servicios): tipos de entrada, precio desde, fecha larga y modo del botón
 *   de compra (specs/005-detalle-evento-compra/data-model.md §5–§7).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { formatDate, formatPrice } from '../theme/format';
import { aTarjeta, esPasado } from './presentacion';

/**
 * Tipo de entrada listo para mostrar (data-model.md › TipoEntradaVista).
 * @typedef {Object} TipoEntradaVista
 * @property {string} id ID del tipo de entrada.
 * @property {string} nombre Nombre del tipo.
 * @property {string} descripcion Descripción (`''` si no tiene).
 * @property {number} precio Precio unitario.
 * @property {string} precioTexto "$ 25.000" o "Gratis".
 * @property {number} cupo Cupo total.
 * @property {number} disponibles Entradas que quedan según el servidor (`cupo` si no lo informa).
 * @property {boolean} agotado Si `disponibles <= 0`.
 * @property {string} textoCupo "Quedan 5 entradas", "Queda 1 entrada" o "Agotado".
 */

/**
 * Vista del detalle (data-model.md › DetalleEvento): extiende la tarjeta de 004.
 * @typedef {import('./presentacion').TarjetaEvento & {
 *   fechaLarga: string,
 *   descripcion: string,
 *   tipos: TipoEntradaVista[],
 *   precioDesdeTexto: string,
 *   organizadorId: string|null
 * }} DetalleEvento
 */

/**
 * Qué muestra la barra de compra del detalle (data-model.md › ModoCta).
 * @typedef {'oculto'|'finalizado'|'sinEntradas'|'pedirSesion'|'comprar'} ModoCta
 */

/**
 * Deriva la vista de un tipo de entrada. No lanza.
 * @param {object} tipo Tipo de entrada de la API.
 * @returns {TipoEntradaVista} Tipo listo para mostrar.
 */
export function aTipoEntradaVista(tipo) {
	const precio = typeof tipo?.precio === 'number' ? tipo.precio : 0;
	const cupo = typeof tipo?.cupo === 'number' ? tipo.cupo : 0;
	const disponibles = Math.max(
		0,
		typeof tipo?.disponibles === 'number' ? tipo.disponibles : cupo
	);
	let textoCupo = 'Agotado';
	if (disponibles === 1) textoCupo = 'Queda 1 entrada';
	else if (disponibles > 1) textoCupo = `Quedan ${disponibles} entradas`;
	return {
		id: tipo?.id,
		nombre: tipo?.nombre ?? '',
		descripcion: tipo?.descripcion ?? '',
		precio,
		precioTexto: formatPrice(precio),
		cupo,
		disponibles,
		agotado: disponibles <= 0,
		textoCupo
	};
}

/**
 * Texto del precio desde para el botón de compra.
 * @param {object[]} [tipos] Tipos de entrada.
 * @returns {string} "desde $ 25.000", "Gratis" (todos 0), "desde $ 0" (mínimo 0 con otros pagos) o `''` sin tipos.
 */
export function textoPrecioDesde(tipos) {
	const precios = (Array.isArray(tipos) ? tipos : [])
		.map((t) => t?.precio)
		.filter((p) => typeof p === 'number' && Number.isFinite(p));
	if (!precios.length) return '';
	const min = Math.min(...precios);
	const max = Math.max(...precios);
	if (max === 0) return 'Gratis';
	return `desde ${formatPrice(min, { free: null })}`;
}

/**
 * Deriva la vista del detalle de un evento. No lanza con datos incompletos.
 * @param {object} evento Evento de la API (data-model.md §1).
 * @param {{ahora?: Date}} [opciones] Momento de referencia para `finalizado`.
 * @returns {DetalleEvento} Datos listos para mostrar.
 */
export function aDetalle(evento, { ahora = new Date() } = {}) {
	const fecha = new Date(evento?.fecha);
	const tiposApi = Array.isArray(evento?.tiposEntrada)
		? evento.tiposEntrada
		: [];
	return {
		...aTarjeta(evento, { ahora }),
		fechaLarga: Number.isFinite(fecha.getTime())
			? formatDate(fecha, 'long')
			: '',
		descripcion: evento?.descripcion ?? '',
		tipos: tiposApi.map(aTipoEntradaVista),
		precioDesdeTexto: textoPrecioDesde(tiposApi),
		organizadorId: evento?.organizador?.id ?? null
	};
}

/**
 * Modo de la barra de compra según sesión y evento (data-model.md §7), en
 * orden de prioridad: organizador, finalizado, sin entradas, visitante, comprador.
 * @param {object} evento Evento de la API.
 * @param {{rol?: string}|null|undefined} usuario Usuario de la sesión, o `null` (visitante).
 * @param {Date} [ahora] Momento de referencia.
 * @returns {ModoCta} Modo de la barra.
 */
export function modoCta(evento, usuario, ahora = new Date()) {
	if (usuario?.rol === 'ORGANIZADOR') return 'oculto';
	if (esPasado(evento, ahora)) return 'finalizado';
	const tipos = Array.isArray(evento?.tiposEntrada) ? evento.tiposEntrada : [];
	if (!tipos.some((t) => !aTipoEntradaVista(t).agotado)) return 'sinEntradas';
	if (!usuario) return 'pedirSesion';
	return 'comprar';
}

/**
 * Texto del botón de compra del detalle.
 * @param {ModoCta} modo Modo de la barra.
 * @param {string} precioDesdeTexto Texto de {@link textoPrecioDesde}.
 * @returns {string} Texto del botón (`''` si el modo es `oculto`).
 */
export function textoCta(modo, precioDesdeTexto) {
	switch (modo) {
		case 'finalizado':
			return 'Evento finalizado';
		case 'sinEntradas':
			return 'Sin entradas a la venta';
		case 'pedirSesion':
		case 'comprar':
			return precioDesdeTexto
				? `Comprar entradas · ${precioDesdeTexto}`
				: 'Comprar entradas';
		default:
			return '';
	}
}
