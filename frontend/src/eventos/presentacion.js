/**
 * @file Lógica de presentación de eventos, pura (sin React ni servicios):
 *   tarjeta derivada, precios, "Muy pronto", íconos y arte por categoría y modo
 *   del corazón (specs/004-explorar-busqueda-favoritos/data-model.md §3, §4, §9).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import {
	MONTHS_SHORT,
	formatDate,
	formatPrice,
	formatPriceFrom
} from '../theme/format';

/**
 * Vista de un evento lista para una tarjeta (data-model.md › TarjetaEvento).
 * @typedef {Object} TarjetaEvento
 * @property {string} id ID del evento.
 * @property {string} nombre Nombre del evento.
 * @property {string} categoria Nombre de la categoría (`''` si no tiene).
 * @property {string} fechaCorta "sáb 12 dic · 21:00".
 * @property {string} dia Día del mes ("12").
 * @property {string} mes Mes abreviado en mayúsculas ("DIC").
 * @property {number|null} precioMin Precio mínimo, o `null` sin tipos de entrada.
 * @property {number|null} precioMax Precio máximo, o `null` sin tipos de entrada.
 * @property {string} precioTexto "Desde $ 32.000", "$ 25.000", "Gratis" o `''`.
 * @property {string|null} imagen URL de la primera imagen, o `null`.
 * @property {Paleta} paleta Colores del arte por categoría.
 * @property {boolean} finalizado Si el evento ya ocurrió.
 * @property {number|null} puntaje Puntaje del organizador, o `null` sin reseñas.
 * @property {string} organizadorNombre "Nombre Apellido", o `''`.
 * @property {string} etiquetaAccesible Label de la tarjeta para lectores de pantalla.
 */

/**
 * Colores del arte por categoría.
 * @typedef {Object} Paleta
 * @property {string} fondo Color de fondo.
 * @property {string} a Primer color del degradé.
 * @property {string} b Segundo color del degradé.
 */

/** Paletas de `PosterArt` (design-system/referencia-web/index.jsx). */
const PALETAS = Object.freeze({
	recitales: Object.freeze({ fondo: '#24070f', a: '#ff4d6d', b: '#ffb703' }),
	teatro: Object.freeze({ fondo: '#1f1206', a: '#d9480f', b: '#f2b134' }),
	festivales: Object.freeze({ fondo: '#04261f', a: '#3ddbb4', b: '#ffd23f' }),
	conferencias: Object.freeze({ fondo: '#0a1626', a: '#6fb1ff', b: '#c8ff3d' }),
	deportes: Object.freeze({ fondo: '#0a1f0e', a: '#c8ff3d', b: '#2fbf71' })
});

/** Ícono Lucide por tipo de categoría. */
const ICONOS = Object.freeze({
	recitales: 'Music',
	teatro: 'Drama',
	festivales: 'PartyPopper',
	conferencias: 'Mic',
	deportes: 'Trophy'
});

/** Sinónimos de nombre normalizado → clave de paleta/ícono. */
const SINONIMOS = Object.freeze({
	recital: 'recitales',
	recitales: 'recitales',
	musica: 'recitales',
	conciertos: 'recitales',
	concierto: 'recitales',
	teatro: 'teatro',
	obras: 'teatro',
	festival: 'festivales',
	festivales: 'festivales',
	conferencia: 'conferencias',
	conferencias: 'conferencias',
	charlas: 'conferencias',
	deporte: 'deportes',
	deportes: 'deportes'
});

/**
 * Pasa un nombre a minúsculas sin acentos ni espacios sobrantes.
 * @param {unknown} nombre Nombre de categoría.
 * @returns {string} Nombre normalizado (`''` si no es texto).
 */
function normalizar(nombre) {
	if (typeof nombre !== 'string') return '';
	return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/**
 * Clave conocida para un nombre de categoría.
 * @param {unknown} nombre Nombre de categoría.
 * @returns {string|undefined} Clave de {@link PALETAS}, o `undefined`.
 */
const claveDe = (nombre) => SINONIMOS[normalizar(nombre)];

/**
 * Hash estable (djb2) de un texto.
 * @param {string} texto Texto de entrada.
 * @returns {number} Entero no negativo.
 */
function hash(texto) {
	let h = 5381;
	for (let i = 0; i < texto.length; i += 1) {
		h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
	}
	return h;
}

/**
 * Ícono Lucide para una categoría.
 * @param {string} [nombre] Nombre de la categoría.
 * @returns {string} Nombre del ícono (`Tag` si no se reconoce).
 */
export function iconoCategoria(nombre) {
	return ICONOS[claveDe(nombre)] ?? 'Tag';
}

/**
 * Paleta del arte por categoría: por nombre, o por hash estable del ID si el
 * nombre no se reconoce (research R9).
 * @param {{id?: string, nombre?: string}} [categoria] Categoría del evento.
 * @returns {Paleta} Una de las cinco paletas.
 */
export function paletaCategoria(categoria) {
	const clave = claveDe(categoria?.nombre);
	if (clave) return PALETAS[clave];
	const lista = Object.values(PALETAS);
	const semilla = String(categoria?.id ?? categoria?.nombre ?? '');
	return lista[hash(semilla) % lista.length];
}

/**
 * Precios de los tipos de entrada de un evento.
 * @param {object} evento Evento de la API.
 * @returns {number[]} Precios numéricos (puede ser vacío).
 */
const preciosDe = (evento) =>
	(Array.isArray(evento?.tiposEntrada) ? evento.tiposEntrada : [])
		.map((t) => t?.precio)
		.filter((p) => typeof p === 'number' && Number.isFinite(p));

/**
 * Precio mínimo de los tipos de entrada.
 * @param {object} evento Evento de la API.
 * @returns {number|null} Mínimo, o `null` sin tipos de entrada.
 */
export function precioDesde(evento) {
	const precios = preciosDe(evento);
	return precios.length ? Math.min(...precios) : null;
}

/**
 * Indica si el evento ya ocurrió (`fecha <= ahora`).
 * @param {object} evento Evento de la API.
 * @param {Date} [ahora] Momento de referencia.
 * @returns {boolean} `true` si ya ocurrió.
 */
export function esPasado(evento, ahora = new Date()) {
	const fecha = new Date(evento?.fecha).getTime();
	return Number.isFinite(fecha) && fecha <= ahora.getTime();
}

/**
 * Texto de precio para la tarjeta. Evita "Desde Gratis" en rangos que empiezan en 0.
 * @param {number|null} min Precio mínimo.
 * @param {number|null} max Precio máximo.
 * @returns {string} Texto del precio, o `''` sin precios.
 */
function textoPrecio(min, max) {
	if (min == null) return '';
	if (min === 0 && max > 0) return `Desde ${formatPrice(0, { free: null })}`;
	return formatPriceFrom(min, max);
}

/**
 * Deriva la vista de tarjeta de un evento (data-model.md › TarjetaEvento). No lanza.
 * @param {object} evento Evento de la API (data-model.md › Evento).
 * @param {{ahora?: Date}} [opciones] Momento de referencia para `finalizado`.
 * @returns {TarjetaEvento} Datos listos para mostrar.
 */
export function aTarjeta(evento, { ahora = new Date() } = {}) {
	const fecha = new Date(evento?.fecha);
	const fechaValida = Number.isFinite(fecha.getTime());
	const precios = preciosDe(evento);
	const precioMin = precios.length ? Math.min(...precios) : null;
	const precioMax = precios.length ? Math.max(...precios) : null;
	const precioTexto = textoPrecio(precioMin, precioMax);
	const fechaCorta = fechaValida ? formatDate(fecha, 'short') : '';
	const finalizado = esPasado(evento, ahora);
	const nombre = evento?.nombre ?? '';
	const primera = Array.isArray(evento?.multimedia)
		? evento.multimedia[0]
		: null;
	const org = evento?.organizador;
	const organizadorNombre = org
		? [org.nombre, org.apellido].filter(Boolean).join(' ').trim()
		: '';
	const partes = [nombre, fechaCorta, precioTexto].filter(Boolean);
	if (finalizado) partes.push('finalizado');

	return {
		id: evento?.id,
		nombre,
		categoria: evento?.categoria?.nombre ?? '',
		fechaCorta,
		dia: fechaValida ? String(fecha.getDate()) : '',
		mes: fechaValida ? MONTHS_SHORT[fecha.getMonth()].toUpperCase() : '',
		precioMin,
		precioMax,
		precioTexto,
		imagen:
			typeof primera === 'string' && primera.trim() !== '' ? primera : null,
		paleta: paletaCategoria(evento?.categoria),
		finalizado,
		puntaje:
			typeof evento?.puntajeOrganizador === 'number'
				? evento.puntajeOrganizador
				: null,
		organizadorNombre,
		etiquetaAccesible: partes.join(', ')
	};
}

/**
 * Secciones de Explorar (data-model.md › SeccionesExplorar).
 * @typedef {Object} SeccionesExplorar
 * @property {object[]} destacados Primeros `maxDestacados` eventos futuros.
 * @property {object[]} muyPronto Todos los eventos futuros, en el orden recibido.
 */

/**
 * Separa los eventos (ya ordenados por fecha ascendente en el servidor) en
 * destacados y "Muy pronto", descartando los que ya ocurrieron (research R2).
 * @param {object[]} eventos Eventos de la API.
 * @param {{ahora?: Date, maxDestacados?: number}} [opciones] Referencia temporal y tope de destacados (5).
 * @returns {SeccionesExplorar} Secciones de la pantalla.
 */
export function separarExplorar(
	eventos,
	{ ahora = new Date(), maxDestacados = 5 } = {}
) {
	const muyPronto = (Array.isArray(eventos) ? eventos : []).filter(
		(e) => !esPasado(e, ahora)
	);
	return { destacados: muyPronto.slice(0, maxDestacados), muyPronto };
}

/**
 * Textos del estado de error de una lista según el `ApiError`.
 * @param {{status?: number}|null} error Error de la consulta.
 * @returns {{titulo: string, cuerpo: string}} Título y cuerpo para `EmptyState`.
 */
export function mensajeError(error) {
	return error?.status === 0
		? {
				titulo: 'Sin conexión',
				cuerpo: 'Revisá tu conexión e intentá de nuevo.'
			}
		: {
				titulo: 'No pudimos cargar los eventos',
				cuerpo: 'Intentá de nuevo en unos segundos.'
			};
}

/**
 * Qué hace el corazón según la sesión (data-model.md › ModoFavorito; research R8).
 * @param {{rol?: string}|null|undefined} usuario Usuario de la sesión, o `null` (visitante).
 * @returns {'alternar'|'pedirSesion'|'oculto'} Modo del corazón.
 */
export function modoFavorito(usuario) {
	if (!usuario) return 'pedirSesion';
	return usuario.rol === 'COMPRADOR' ? 'alternar' : 'oculto';
}
