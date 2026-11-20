/**
 * @file Helper de pruebas: valor simulado de `useAuth()` y usuarios de ejemplo.
 *   Uso: `let mockAuth; jest.mock('…/AuthContext', () => ({ useAuth: () => mockAuth,
 *   AuthProvider: ({ children }) => children }))` y `mockAuth = crearAuthFalso({ … })`.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/** Usuario COMPRADOR de ejemplo. */
export const COMPRADOR = {
	id: 'u-comprador',
	nombre: 'Ana',
	apellido: 'García',
	nombreUsuario: 'ana',
	rol: 'COMPRADOR'
};

/** Usuario ORGANIZADOR de ejemplo. */
export const ORGANIZADOR = {
	id: 'u-organizador',
	nombre: 'Bruno',
	apellido: 'Pérez',
	nombreUsuario: 'bruno',
	rol: 'ORGANIZADOR'
};

/**
 * Crea el objeto que devuelve `useAuth()` en las pruebas.
 * @param {Object} [opciones] Estado simulado.
 * @param {object|null} [opciones.usuario] Usuario de la sesión, o `null` (visitante).
 * @param {boolean} [opciones.cargando] Si la sesión se está restaurando.
 * @returns {{usuario: object|null, accessToken: string|null, cargando: boolean, iniciarSesion: jest.Mock, cerrarSesion: jest.Mock}} Valor de sesión con acciones simuladas.
 */
export function crearAuthFalso({ usuario = null, cargando = false } = {}) {
	return {
		usuario,
		accessToken: usuario ? 'token' : null,
		cargando,
		iniciarSesion: jest.fn().mockResolvedValue(usuario),
		cerrarSesion: jest.fn().mockResolvedValue(undefined)
	};
}
