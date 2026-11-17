/**
 * Búsqueda del usuario dueño de un refresh token opaco.
 *
 * Propósito: comparar el token con el hash de cada usuario esperando (`await`)
 * el resultado de bcrypt. Ownership: equipo backend de Al Ticket It.
 *
 * @license ISC
 */
import { verifyContrasenia } from './hashing.js';

/**
 * Devuelve el usuario cuyo `refreshTokenHash` corresponde al token recibido.
 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository Repositorio de usuarios.
 * @param {string} refreshToken Token en texto plano.
 * @returns {Promise<object|null>} El usuario dueño del token, o `null` si ninguno coincide.
 */
export async function buscarPorRefreshToken(usuarioRepository, refreshToken) {
	const usuarios = await usuarioRepository.buscarVarios({});
	for (const usuario of usuarios) {
		if (!usuario.refreshTokenHash) continue;
		if (await verifyContrasenia(refreshToken, usuario.refreshTokenHash)) {
			return usuario;
		}
	}
	return null;
}
