/**
 * @file Roles del sistema definidos como objetos inmutables.
 * Define los roles disponibles: ORGANIZADOR y COMPRADOR.
 * Usa Object.freeze para garantizar que los roles no puedan ser modificados.
 */

/**
 * Rol de organizador del evento.
 * Permisos incluyen: crear:evento, cancelar:compra, confirmar:compra, responder:mensaje.
 * @constant
 * @type {Object}
 * @property {string} nombre - El nombre del rol
 * @property {string[]} permisos - Permisos asociados al rol
 */
export const ORGANIZADOR = Object.freeze({
	nombre: 'ORGANIZADOR',
	permisos: [
		'crear:evento',
		'cancelar:compra',
		'confirmar:compra',
		'responder:mensaje'
	]
});

/**
 * Rol de comprador del sistema.
 * Permisos incluyen: cancelar:compra (sujeto a reglas), escribir:mensaje (proprias compras), crear:resenia.
 * @constant
 * @type {Object}
 * @property {string} nombre - El nombre del rol
 * @property {string[]} permisos - Permisos asociados al rol
 */
export const COMPRADOR = Object.freeze({
	nombre: 'COMPRADOR',
	permisos: ['cancelar:compra', 'escribir:mensaje', 'crear:resenia']
});
