/**
 * Servicio de cierre de sesión (invalida el refresh token).
 *
 * Ownership: equipo backend de Al Ticket It.
 *
 * @license ISC
 */
import { logoutUsuarioSchema } from '../dto/usuario.js';
import { buscarPorRefreshToken } from '../utils/buscarPorRefreshToken.js';
import { BadRequestError, UnauthorizedError } from '../errors/index.js';

/**
 * Servicio que gestiona el cierre de sesión, invalidando el refresh token actual.
 *
 * @private
 */
export default class LogoutService {
	/**
	 * Crea una instancia de LogoutService.
	 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository Repositorio de usuarios
	 */
	constructor(usuarioRepository) {
		/** @private {import('../repositories/usuarioRepository.js').default} */
		this.usuarioRepository = usuarioRepository;
	}

	/**
	 * Cierra la sesión eliminando el refresh token almacenado del usuario.
	 *
	 * @param {object} datos - Cuerpo de la petición con refreshToken.
	 * @returns {Promise<{ok: boolean, mensaje: string}>}
	 * @throws {BadRequestError} Si la validación de los datos falla.
	 * @throws {UnauthorizedError} Si el refresh token es inválido o expiró.
	 */
	async cerrarSesion(datos) {
		const resultado = logoutUsuarioSchema.safeParse(datos);
		if (!resultado.success) {
			let message;
			if (
				resultado.error.issues &&
				resultado.error.issues.length > 0 &&
				resultado.error.issues[0] &&
				resultado.error.issues[0].message
			) {
				message = resultado.error.issues[0].message;
			} else {
				message = 'Error de validación';
			}
			throw new BadRequestError(message);
		}

		const { refreshToken } = resultado.data;

		const usuario = await buscarPorRefreshToken(
			this.usuarioRepository,
			refreshToken
		);

		if (!usuario) {
			throw new UnauthorizedError('Refresh token inválido o expirado.');
		}

		usuario.refreshTokenHash = null;
		await this.usuarioRepository.actualizar(usuario);

		return {
			ok: true,
			mensaje: 'Sesión cerrada correctamente.'
		};
	}
}
