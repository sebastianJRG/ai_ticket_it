/**
 * @file Lógica pura del chat de una compra (feature 008): validación del texto
 *   igual a `crearMensajeSchema` del backend, fusión de los mensajes del
 *   servidor con los locales en vuelo sin duplicados ni pérdidas, agrupación
 *   en ítems para la lista y textos de error (specs/008-chat-compra/
 *   data-model.md §2–§4; research R3–R8).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { formatDate } from '../theme/format';
import { mensajeError } from '../eventos/presentacion';

/** Largo máximo de un mensaje, después de recortar espacios. */
export const LIMITE_MENSAJE = 1000;

/** Texto bajo una burbuja que no se envió por un error que no es un 400. */
const ERROR_ENVIO_GENERICO = 'Revisá tu conexión e intentá de nuevo.';

/**
 * Mensaje tal como lo devuelve la API.
 * @typedef {Object} Mensaje
 * @property {string} id ID del servidor (clave para deduplicar).
 * @property {string} compraId ID de la compra.
 * @property {{id: string, nombre: string, apellido: string, rol: string}} usuario Remitente público.
 * @property {string} mensaje Texto recortado, de 1 a 1000 caracteres.
 * @property {string} enviado Fecha ISO del servidor; define el orden.
 */

/**
 * Mensaje propio en vuelo o recién confirmado (data-model.md §2).
 * @typedef {Object} MensajeLocal
 * @property {string} claveLocal Clave única en la sesión del chat.
 * @property {string} mensaje Texto recortado que se envía y se reintenta.
 * @property {'enviando'|'error'|'confirmado'} estado Ciclo del envío.
 * @property {Date} creado Momento del envío local.
 * @property {string} [id] ID del servidor (solo en `confirmado`).
 * @property {string} [enviado] Fecha ISO del servidor (solo en `confirmado`).
 * @property {Error} [error] Error del envío (solo en `error`).
 */

/**
 * Ítem de la lista del chat (data-model.md §3).
 * @typedef {Object} ItemChat
 * @property {'dia'|'mensaje'} tipo Separador de día o burbuja.
 * @property {string} clave Clave estable del ítem.
 * @property {string} [etiqueta] Texto del separador ("Hoy", "Ayer", "10 nov").
 * @property {boolean} [propio] Si el mensaje es del usuario de la sesión.
 * @property {string} [autor] "nombre apellido", o "Vos" si es propio.
 * @property {boolean} [mostrarAutor] Si se ve el autor (primer ajeno del grupo).
 * @property {string} [hora] Hora formateada.
 * @property {string} [texto] Texto del mensaje.
 * @property {'enviado'|'enviando'|'error'} [estado] Estado visible.
 * @property {string} [error] Texto bajo la burbuja en `error`.
 */

/**
 * Resultado de validar el texto del composer.
 * @typedef {Object} ResultadoValidacion
 * @property {boolean} valido Si se puede enviar.
 * @property {number} largo Largo del texto recortado.
 * @property {string|null} error Error a mostrar, o `null`.
 */

/**
 * Valida el texto como `crearMensajeSchema`: recorta y exige de 1 a 1000.
 * @param {string|undefined|null} texto Texto del composer.
 * @returns {ResultadoValidacion} Resultado.
 */
export function validarMensaje(texto) {
	const largo = String(texto ?? '').trim().length;
	if (largo > LIMITE_MENSAJE) {
		return {
			valido: false,
			largo,
			error: `El mensaje no puede superar los ${LIMITE_MENSAJE} caracteres.`
		};
	}
	return { valido: largo > 0, largo, error: null };
}

/**
 * Milisegundos de una fecha ISO o `Date`.
 * @param {string|Date} fecha Fecha.
 * @returns {number} Milisegundos.
 */
const ms = (fecha) => new Date(fecha).getTime();

/**
 * Compara mensajes del servidor por `enviado` y luego por `id`.
 * @param {Mensaje} a Mensaje.
 * @param {Mensaje} b Mensaje.
 * @returns {number} Orden.
 */
function porEnvio(a, b) {
	const diferencia = ms(a.enviado) - ms(b.enviado);
	if (diferencia !== 0) return diferencia;
	return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Une la última lista del servidor con los mensajes locales (research R4):
 * el servidor es la verdad; un confirmado ya presente se descarta; el resto
 * va al final en orden de creación. No muta las entradas.
 * @param {Mensaje[]} servidor Última lista del servidor.
 * @param {MensajeLocal[]} locales Mensajes locales.
 * @param {string} miId ID del usuario de la sesión.
 * @returns {Array<Mensaje|MensajeLocal>} Lista visible.
 */
// eslint-disable-next-line no-unused-vars
export function fusionarMensajes(servidor, locales, miId) {
	const ordenados = [...servidor].sort(porEnvio);
	const ids = new Set(ordenados.map((m) => m.id));
	const pendientes = [...locales]
		.sort((a, b) => ms(a.creado) - ms(b.creado))
		.filter((l) => l.estado !== 'confirmado' || !ids.has(l.id));
	return [...ordenados, ...pendientes];
}

/**
 * Clave `AAAA-MM-DD` local de una fecha.
 * @param {Date} d Fecha.
 * @returns {string} Clave del día.
 */
const claveDia = (d) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Etiqueta de un separador de día.
 * @param {Date} fecha Fecha del mensaje.
 * @param {Date} ahora Fecha actual.
 * @returns {string} "Hoy", "Ayer" o `formatDate(..., 'day')`.
 */
function etiquetaDia(fecha, ahora) {
	const ayer = new Date(ahora);
	ayer.setDate(ayer.getDate() - 1);
	if (claveDia(fecha) === claveDia(ahora)) return 'Hoy';
	if (claveDia(fecha) === claveDia(ayer)) return 'Ayer';
	return formatDate(fecha, 'day');
}

/**
 * Texto bajo una burbuja que no se envió (research R3).
 * @param {Error & {status?: number}} error Error del envío.
 * @returns {string} Mensaje del servidor si es un 400, o un texto genérico.
 */
export function textoErrorEnvio(error) {
	return error?.status === 400 && error.message
		? error.message
		: ERROR_ENVIO_GENERICO;
}

/**
 * Arma los ítems de la lista: separadores de día y burbujas con lado, autor,
 * hora y estado (research R7). Los locales usan `creado` mientras no tienen
 * `enviado`.
 * @param {Array<Mensaje|MensajeLocal>} mensajes Lista de `fusionarMensajes`.
 * @param {string} miId ID del usuario de la sesión.
 * @param {Date} [ahora] Fecha actual (inyectable en pruebas).
 * @returns {ItemChat[]} Ítems en orden.
 */
export function agruparMensajes(mensajes, miId, ahora = new Date()) {
	const items = [];
	let diaActual = null;
	let autorAnterior = null;
	for (const m of mensajes) {
		const esLocal = Boolean(m.claveLocal);
		const fecha = new Date(m.enviado ?? m.creado);
		const dia = claveDia(fecha);
		if (dia !== diaActual) {
			items.push({
				tipo: 'dia',
				clave: `dia-${dia}`,
				etiqueta: etiquetaDia(fecha, ahora)
			});
			diaActual = dia;
			autorAnterior = null;
		}
		const autorId = esLocal ? miId : m.usuario?.id;
		const propio = autorId === miId;
		const estado = !esLocal || m.estado === 'confirmado' ? 'enviado' : m.estado;
		items.push({
			tipo: 'mensaje',
			clave: m.id ?? m.claveLocal,
			propio,
			autor: propio
				? 'Vos'
				: `${m.usuario?.nombre ?? ''} ${m.usuario?.apellido ?? ''}`.trim(),
			mostrarAutor: !propio && autorAnterior !== autorId,
			hora: formatDate(fecha, 'time'),
			texto: m.mensaje,
			estado,
			...(estado === 'error' ? { error: textoErrorEnvio(m.error) } : {})
		});
		autorAnterior = autorId;
	}
	return items;
}

/**
 * Título, cuerpo y si se puede reintentar para un error bloqueante del chat
 * (research R6).
 * @param {Error & {status?: number}} error Error de la carga o del envío.
 * @returns {{titulo: string, cuerpo: string, reintentable: boolean}} Mensaje.
 */
export function mensajeErrorChat(error) {
	switch (error?.status) {
		case 404:
			return {
				titulo: 'Esta compra ya no existe',
				cuerpo: 'Puede que la hayan eliminado o que el enlace sea incorrecto.',
				reintentable: false
			};
		case 400:
			return {
				titulo: 'No pudimos abrir esta conversación',
				cuerpo: 'Intentá de nuevo en unos segundos.',
				reintentable: true
			};
		case 0:
			return { ...mensajeError(error), reintentable: true };
		default:
			return {
				titulo: 'No pudimos cargar los mensajes',
				cuerpo: 'Intentá de nuevo en unos segundos.',
				reintentable: true
			};
	}
}
