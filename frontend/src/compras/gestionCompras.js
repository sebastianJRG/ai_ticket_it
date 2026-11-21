/**
 * @file Lógica pura de la gestión de compras del ORGANIZADOR: pestañas por
 *   estado, agrupación, resumen de disponibilidad con los números del
 *   servidor, nombre del comprador y acciones de estado permitidas
 *   (specs/007-organizador-eventos/data-model.md §4; research R10, R11). Sin React.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

import { formatPrice } from '../theme/format';

/**
 * Acción del organizador sobre una compra (data-model.md › AccionCompra).
 * @typedef {'confirmar'|'reembolsar'|'cancelar'} AccionCompra
 */

/**
 * Pestaña de las compras del evento (data-model.md › PestanaOrganizador).
 * @typedef {Object} PestanaOrganizador
 * @property {'pendientes'|'confirmadas'|'utilizadas'|'canceladas'} clave Identificador.
 * @property {string} etiqueta Texto visible.
 * @property {string[]} estados Estados de compra que agrupa.
 * @property {string} vacio Texto cuando la pestaña no tiene compras.
 */

/**
 * Compras agrupadas por pestaña, la más reciente primero.
 * @typedef {Record<'pendientes'|'confirmadas'|'utilizadas'|'canceladas', object[]>} ComprasPorEstado
 */

/**
 * Disponibilidad de un tipo de entrada lista para mostrar.
 * @typedef {Object} TipoDisponibilidad
 * @property {string} tipoEntradaId ID del tipo.
 * @property {string} nombre Nombre del tipo.
 * @property {number} precio Precio del tipo.
 * @property {number} cupo Cupo total (servidor).
 * @property {number} vendidas Vendidas (servidor).
 * @property {number} disponibles Disponibles (servidor).
 * @property {number} porcentaje Entero 0–100, redondeado hacia abajo.
 * @property {'normal'|'casi'|'agotado'} nivel `agotado` si no quedan; `casi` desde 90 %.
 * @property {string} textoRestantes "Quedan N" o "Agotado".
 */

/**
 * Resumen de disponibilidad (data-model.md › ResumenDisponibilidad).
 * @typedef {Object} ResumenDisponibilidad
 * @property {number} totalVendidas Suma de vendidas.
 * @property {number} totalCupo Suma de cupos.
 * @property {number} porcentaje Entero 0–100, redondeado hacia abajo.
 * @property {TipoDisponibilidad[]} tipos Detalle por tipo, en el orden del servidor.
 */

/** Pestañas de las compras del evento, en orden (research R10). */
export const PESTANAS_ORGANIZADOR = Object.freeze([
	{
		clave: 'pendientes',
		etiqueta: 'Pendientes',
		estados: ['PENDIENTE'],
		vacio: 'No hay compras pendientes de confirmar'
	},
	{
		clave: 'confirmadas',
		etiqueta: 'Confirmadas',
		estados: ['CONFIRMADA'],
		vacio: 'No hay compras confirmadas'
	},
	{
		clave: 'utilizadas',
		etiqueta: 'Utilizadas',
		estados: ['UTILIZADA'],
		vacio: 'Todavía no se usaron entradas'
	},
	{
		clave: 'canceladas',
		etiqueta: 'Canceladas',
		estados: ['CANCELADA', 'REEMBOLSADA'],
		vacio: 'No hay compras canceladas ni reembolsadas'
	}
]);

/**
 * Agrupa las compras por pestaña; cada lista va de la más reciente a la más
 * vieja (el servidor responde en orden de creación). Ignora estados desconocidos.
 * @param {object[]|null|undefined} compras Compras del evento.
 * @returns {ComprasPorEstado} Compras por pestaña.
 */
export function agruparPorEstado(compras) {
	const grupos = Object.fromEntries(
		PESTANAS_ORGANIZADOR.map((p) => [p.clave, []])
	);
	const lista = Array.isArray(compras) ? compras : [];
	for (let i = lista.length - 1; i >= 0; i -= 1) {
		const compra = lista[i];
		const pestana = PESTANAS_ORGANIZADOR.find((p) =>
			p.estados.includes(compra?.estado)
		);
		if (pestana) grupos[pestana.clave].push(compra);
	}
	return grupos;
}

/**
 * Porcentaje entero de vendidas sobre cupo (0 si el cupo es 0).
 * @param {number} vendidas Vendidas.
 * @param {number} cupo Cupo.
 * @returns {number} Entero 0–100.
 */
const porcentajeDe = (vendidas, cupo) =>
	cupo > 0 ? Math.min(100, Math.floor((vendidas / cupo) * 100)) : 0;

/**
 * Resume la disponibilidad que informa el servidor; nunca recalcula vendidas (SC-003).
 * @param {object[]|null|undefined} disponibilidad `disponibilidad` de `GET /api/eventos/:id/compras`.
 * @returns {ResumenDisponibilidad} Totales y detalle por tipo.
 */
export function resumenDisponibilidad(disponibilidad) {
	const lista = Array.isArray(disponibilidad) ? disponibilidad : [];
	const tipos = lista.map((d) => {
		const porcentaje = porcentajeDe(d.vendidas, d.cupo);
		let nivel = 'normal';
		if (d.disponibles === 0) nivel = 'agotado';
		else if (d.cupo > 0 && d.vendidas / d.cupo >= 0.9) nivel = 'casi';
		return {
			tipoEntradaId: d.tipoEntradaId,
			nombre: d.nombre,
			precio: d.precio,
			cupo: d.cupo,
			vendidas: d.vendidas,
			disponibles: d.disponibles,
			porcentaje,
			nivel,
			textoRestantes:
				nivel === 'agotado' ? 'Agotado' : `Quedan ${d.disponibles}`
		};
	});
	const totalVendidas = tipos.reduce((s, x) => s + x.vendidas, 0);
	const totalCupo = tipos.reduce((s, x) => s + x.cupo, 0);
	return {
		totalVendidas,
		totalCupo,
		porcentaje: porcentajeDe(totalVendidas, totalCupo),
		tipos
	};
}

/**
 * Nombre completo del comprador.
 * @param {{comprador?: {nombre?: string, apellido?: string}|null}} compra Compra.
 * @returns {string} "Ana García", o "Comprador" si falta.
 */
export function nombreComprador(compra) {
	const c = compra?.comprador;
	const nombre = c
		? [c.nombre, c.apellido].filter(Boolean).join(' ').trim()
		: '';
	return nombre || 'Comprador';
}

/**
 * Iniciales del comprador para el avatar.
 * @param {{comprador?: {nombre?: string, apellido?: string}|null}} compra Compra.
 * @returns {string} Una o dos letras en mayúscula.
 */
export function inicialesComprador(compra) {
	return nombreComprador(compra)
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p[0].toUpperCase())
		.join('');
}

/** Acciones por estado con el evento futuro (principio 4 de la constitución). */
const ACCIONES_POR_ESTADO = Object.freeze({
	PENDIENTE: ['confirmar', 'cancelar'],
	CONFIRMADA: ['reembolsar', 'cancelar']
});

/**
 * Acciones que se ofrecen sobre una compra (research R11; SC-004). Replica
 * las transiciones permitidas y los 400 por evento ocurrido; solo decide qué
 * mostrar, la regla real la aplica el backend.
 * @param {{estado?: string}|null} compra Compra del evento.
 * @param {string|Date|null|undefined} fechaEvento Fecha del evento.
 * @param {Date} [ahora] Momento de referencia.
 * @returns {AccionCompra[]} Acciones en orden de presentación (`[]` si ninguna).
 */
export function accionesDisponibles(compra, fechaEvento, ahora = new Date()) {
	const acciones = ACCIONES_POR_ESTADO[compra?.estado];
	if (!acciones || fechaEvento == null) return [];
	const fecha = new Date(fechaEvento).getTime();
	if (!Number.isFinite(fecha) || fecha <= ahora.getTime()) return [];
	return [...acciones];
}

/**
 * Cuerpo del diálogo destructivo con el impacto concreto (data-model.md §4).
 * @param {'reembolsar'|'cancelar'} accion Acción a confirmar.
 * @param {object} compra Compra afectada.
 * @returns {string} Texto del Modal.
 */
export function cuerpoAccion(accion, compra) {
	const entradas = `${compra.cantidad} × ${compra.tipoEntrada?.nombre ?? ''}`;
	const total = formatPrice(compra.total);
	const quien = nombreComprador(compra);
	return accion === 'reembolsar'
		? `Vas a reembolsar ${entradas} a ${quien} por ${total}. No se puede deshacer.`
		: `Vas a cancelar ${entradas} de ${quien} por ${total}. Se libera el cupo y no se puede deshacer.`;
}

/**
 * Traduce el error de una acción a un aviso (research R11). El 401 lo maneja
 * la capa de servicios.
 * @param {AccionCompra} accion Acción que falló.
 * @param {{status?: number, message?: string}|null} error `ApiError` recibido.
 * @returns {{titulo: string, cuerpo: string}} Aviso para el toast.
 */
export function mensajeErrorAccion(accion, error) {
	switch (error?.status) {
		case 400:
			return {
				titulo: `No se pudo ${accion} la compra`,
				cuerpo: typeof error.message === 'string' ? error.message : ''
			};
		case 403:
			return { titulo: 'No podés gestionar esta compra', cuerpo: '' };
		case 404:
			return { titulo: 'Esta compra ya no existe', cuerpo: '' };
		case 0:
			return {
				titulo: 'Sin conexión',
				cuerpo: 'Revisá tu conexión e intentá de nuevo.'
			};
		default:
			return {
				titulo: 'Algo salió mal',
				cuerpo: 'Intentá de nuevo en unos segundos.'
			};
	}
}

/**
 * Sección de la pestaña Mensajes: un evento y sus compras.
 * @typedef {Object} SeccionMensajes
 * @property {{id: string, nombre: string, fecha: string}} evento Evento de la sección.
 * @property {object[]} compras Compras del evento, de la más reciente a la más vieja.
 */

/**
 * Agrupa por evento las compras de la pestaña Mensajes (research R12).
 * @param {object[]|null|undefined} eventos Eventos propios, en el orden de Mis eventos.
 * @param {PromiseSettledResult<{compras: object[]}>[]|null|undefined} resultados Respuestas de `obtenerComprasEvento`, alineadas por índice.
 * @returns {{secciones: SeccionMensajes[], fallidos: number}} Secciones con compras y cantidad de eventos que fallaron.
 */
export function agruparComprasPorEvento(eventos, resultados) {
	const lista = Array.isArray(eventos) ? eventos : [];
	const resp = Array.isArray(resultados) ? resultados : [];
	const secciones = [];
	let fallidos = 0;
	lista.forEach((evento, i) => {
		const r = resp[i];
		if (!r) return;
		if (r.status === 'rejected') {
			fallidos += 1;
			return;
		}
		const compras = Array.isArray(r.value?.compras)
			? [...r.value.compras].reverse()
			: [];
		if (compras.length === 0) return;
		secciones.push({
			evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha },
			compras
		});
	});
	return { secciones, fallidos };
}
