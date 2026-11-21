/**
 * @file Opciones de orden de la búsqueda: 3 criterios × 2 sentidos que aplica
 *   el servidor (`sortBy`/`order` de `GET /api/eventos`). Puro
 *   (specs/004-explorar-busqueda-favoritos/data-model.md §6; research R5; CU-11).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/**
 * Opción de orden (data-model.md › OpcionOrden).
 * @typedef {Object} OpcionOrden
 * @property {string} clave Identificador estable (`'<criterio>-<sentido>'`).
 * @property {string} etiqueta Texto de la lista de opciones.
 * @property {string} corta Texto del disparador ("Precio ↑").
 * @property {'precio'|'fecha'|'puntaje'} sortBy Criterio que recibe el servidor.
 * @property {'asc'|'desc'} order Sentido que recibe el servidor.
 */

/**
 * Crea una opción congelada.
 * @param {string} clave Clave.
 * @param {string} etiqueta Etiqueta larga.
 * @param {string} corta Etiqueta corta.
 * @param {'precio'|'fecha'|'puntaje'} sortBy Criterio.
 * @param {'asc'|'desc'} order Sentido.
 * @returns {Readonly<OpcionOrden>} Opción.
 */
const opcion = (clave, etiqueta, corta, sortBy, order) =>
	Object.freeze({ clave, etiqueta, corta, sortBy, order });

/**
 * Las seis opciones, en el orden en que se listan.
 * @type {ReadonlyArray<Readonly<OpcionOrden>>}
 */
export const OPCIONES_ORDEN = Object.freeze([
	opcion('fecha-asc', 'Fecha más próxima', 'Fecha ↑', 'fecha', 'asc'),
	opcion('fecha-desc', 'Fecha más lejana', 'Fecha ↓', 'fecha', 'desc'),
	opcion('precio-asc', 'Precio menor a mayor', 'Precio ↑', 'precio', 'asc'),
	opcion('precio-desc', 'Precio mayor a menor', 'Precio ↓', 'precio', 'desc'),
	opcion(
		'puntaje-desc',
		'Mejor puntaje del organizador',
		'Puntaje ↓',
		'puntaje',
		'desc'
	),
	opcion(
		'puntaje-asc',
		'Menor puntaje del organizador',
		'Puntaje ↑',
		'puntaje',
		'asc'
	)
]);

/** Clave del orden por defecto (fecha más próxima). */
export const ORDEN_POR_DEFECTO = 'fecha-asc';

/**
 * Opción para una clave; desconocida → la de defecto.
 * @param {string} [clave] Clave de orden.
 * @returns {Readonly<OpcionOrden>} Opción encontrada.
 */
export function opcionOrden(clave) {
	return (
		OPCIONES_ORDEN.find((o) => o.clave === clave) ??
		OPCIONES_ORDEN.find((o) => o.clave === ORDEN_POR_DEFECTO)
	);
}

/**
 * Parámetros de orden para el servidor.
 * @param {string} [clave] Clave de orden.
 * @returns {{sortBy: 'precio'|'fecha'|'puntaje', order: 'asc'|'desc'}} Criterio y sentido.
 */
export function paramsOrden(clave) {
	const { sortBy, order } = opcionOrden(clave);
	return { sortBy, order };
}
