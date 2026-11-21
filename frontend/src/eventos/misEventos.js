/**
 * @file Lógica pura de Mis eventos: filtra el listado público por
 *   organizador y separa próximos de finalizados
 *   (specs/007-organizador-eventos/data-model.md §3; research R2). Sin React.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/**
 * Eventos propios separados por fecha.
 * @typedef {Object} MisEventosSeparados
 * @property {object[]} proximos Eventos con fecha posterior a `ahora`, del más cercano al más lejano.
 * @property {object[]} finalizados Eventos ya ocurridos (o con fecha inválida), del más reciente al más viejo.
 */

/**
 * Milisegundos de la fecha del evento, o `NaN` si es inválida.
 * @param {object} evento Evento de la API.
 * @returns {number} Marca de tiempo.
 */
const ms = (evento) => new Date(evento.fecha).getTime();

/**
 * Deja los eventos de un organizador y los separa en próximos y finalizados. No lanza.
 * @param {object[]|null|undefined} eventos Eventos de `GET /api/eventos`.
 * @param {string} organizadorId ID del organizador de la sesión.
 * @param {Date} [ahora] Momento de referencia.
 * @returns {MisEventosSeparados} Secciones ordenadas.
 */
export function separarMisEventos(eventos, organizadorId, ahora = new Date()) {
	const propios = (Array.isArray(eventos) ? eventos : []).filter(
		(e) => e && e.organizador?.id === organizadorId
	);
	const limite = ahora.getTime();
	const proximos = propios
		.filter((e) => ms(e) > limite)
		.sort((a, b) => ms(a) - ms(b));
	const finalizados = propios
		.filter((e) => !(ms(e) > limite))
		.sort((a, b) => (ms(b) || 0) - (ms(a) || 0));
	return { proximos, finalizados };
}
