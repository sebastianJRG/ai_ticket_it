/**
 * @file Helper de pruebas: promesa controlable desde afuera, para simular
 *   respuestas que llegan en el orden que la prueba decide.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/**
 * Crea una promesa con sus funciones de resolución expuestas.
 * @returns {{promesa: Promise<any>, resolver: function(any): void, rechazar: function(any): void}} Promesa y controles.
 */
export function diferido() {
	let resolver;
	let rechazar;
	const promesa = new Promise((res, rej) => {
		resolver = res;
		rechazar = rej;
	});
	return { promesa, resolver, rechazar };
}
