/**
 * Utilidades de los tests de refresh y logout: siembra usuarios con sesión activa.
 *
 * @license ISC
 */
import { hashContrasenia } from '../../../src/utils/hashing.js';
import { construirUsuario } from '../../helpers/eventosFixtures.js';

/**
 * Crea un usuario con un refresh token conocido y lo persiste.
 * @param {import('../../../src/repositories/usuarioRepository.js').default} repositorio
 * @param {string} nombreUsuario
 * @param {string} refreshToken Token en texto plano (se guarda su hash).
 * @returns {Promise<object>} Usuario persistido.
 */
export async function sembrarUsuarioConSesion(
	repositorio,
	nombreUsuario,
	refreshToken
) {
	const usuario = construirUsuario({ nombreUsuario });
	usuario.refreshTokenHash = await hashContrasenia(refreshToken);
	return await repositorio.crear(usuario);
}
