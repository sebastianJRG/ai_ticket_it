/**
 * @file Datos de ejemplo para el chat de una compra (feature 008): mensajes
 *   con la forma de la API (specs/008-chat-compra/data-model.md §1), una
 *   conversación de dos días y textos en el borde del límite.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { COMPRADOR, ORGANIZADOR } from './authFalso';
import { AHORA } from './eventosEjemplo';

/**
 * Versión pública de un usuario, como la arma `aUsuarioPublico` en el backend.
 * @param {{id: string, nombre: string, apellido: string, rol: string}} usuario Usuario de `authFalso`.
 * @returns {{id: string, nombre: string, apellido: string, rol: string}} Remitente público.
 */
export function remitentePublico(usuario) {
	const { id, nombre, apellido, rol } = usuario;
	return { id, nombre, apellido, rol };
}

let siguienteId = 1;

/**
 * Crea un mensaje con la forma de la API. El `id` es incremental.
 * @param {Object} [parcial] Campos a pisar.
 * @returns {{id: string, compraId: string, usuario: object, mensaje: string, enviado: string}} Mensaje.
 */
export function crearMensaje(parcial = {}) {
	const id = String(siguienteId++);
	return {
		id,
		compraId: 'c-1',
		usuario: remitentePublico(COMPRADOR),
		mensaje: `Mensaje ${id}`,
		enviado: AHORA.toISOString(),
		...parcial
	};
}

/**
 * Fecha ISO relativa a `AHORA` (hora local).
 * @param {number} dias Días a sumar (negativo: antes).
 * @param {number} hora Hora local.
 * @param {number} minuto Minuto.
 * @returns {string} Fecha ISO.
 */
function en(dias, hora, minuto) {
	const d = new Date(AHORA);
	d.setDate(d.getDate() + dias);
	d.setHours(hora, minuto, 0, 0);
	return d.toISOString();
}

/**
 * Conversación de `c-1`: dos mensajes del comprador ayer y dos del
 * organizador hoy (10:00 y 10:01), para separadores de día y grupos de autor.
 */
export const CONVERSACION = [
	{
		id: 'm-1',
		compraId: 'c-1',
		usuario: remitentePublico(COMPRADOR),
		mensaje: 'Hola, ¿a qué hora abren las puertas?',
		enviado: en(-1, 18, 0)
	},
	{
		id: 'm-2',
		compraId: 'c-1',
		usuario: remitentePublico(COMPRADOR),
		mensaje: '¿Y se puede entrar con mochila?',
		enviado: en(-1, 18, 5)
	},
	{
		id: 'm-3',
		compraId: 'c-1',
		usuario: remitentePublico(ORGANIZADOR),
		mensaje: 'Abrimos a las 19.',
		enviado: en(0, 10, 0)
	},
	{
		id: 'm-4',
		compraId: 'c-1',
		usuario: remitentePublico(ORGANIZADOR),
		mensaje: 'Mochilas chicas, sí.',
		enviado: en(0, 10, 1)
	}
];

/** Texto de exactamente 1000 caracteres, sin espacios en los bordes. */
export const TEXTO_1000 = 'a'.repeat(1000);

/** Texto de 1001 caracteres, sin espacios en los bordes. */
export const TEXTO_1001 = 'a'.repeat(1001);
