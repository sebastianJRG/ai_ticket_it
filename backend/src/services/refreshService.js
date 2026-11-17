/**
 * Servicio de renovación de tokens (rotación del refresh token).
 *
 * Ownership: equipo backend de Al Ticket It.
 *
 * @license ISC
 */
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { refreshUsuarioSchema } from '../dto/usuario.js';
import { hashContrasenia } from '../utils/hashing.js';
import { buscarPorRefreshToken } from '../utils/buscarPorRefreshToken.js';
import { JWT_SECRET, JWT_ACCESS_EXPIRATION } from '../utils/configJwt.js';

/**
 * Servicio que gestiona la renovación de tokens.
 *
 * @private
 */
export default class RefreshService {
	/**
	 * Crea una instancia de RefreshService.
	 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository Repositorio de usuarios
	 */
	constructor(usuarioRepository) {
		/** @private {import('../repositories/usuarioRepository.js').default} */
		this.usuarioRepository = usuarioRepository;
	}

	/**
	 * Renueva el access token y rota el refresh token.
	 *
	 * @param {object} datos - Cuerpo de la petición con refreshToken.
	 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object}>}
	 * @throws {Error} Si el refresh token es inválido, expirado o la validación falla.
	 */
	async renovar(datos) {
		const resultado = refreshUsuarioSchema.safeParse(datos);
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
			const error = new Error(message);
			error.status = 400;
			throw error;
		}

		const { refreshToken } = resultado.data;

		const usuario = await buscarPorRefreshToken(
			this.usuarioRepository,
			refreshToken
		);

		if (!usuario) {
			const error = new Error('Refresh token inválido o expirado.');
			error.status = 401;
			throw error;
		}

		const accessToken = jwt.sign(
			{ id: usuario.id, rol: usuario.rol, permisos: usuario.permissions },
			JWT_SECRET,
			{ expiresIn: JWT_ACCESS_EXPIRATION }
		);

		const nuevoRefreshToken = crypto.randomBytes(48).toString('hex');
		const refreshTokenHash = await hashContrasenia(nuevoRefreshToken);

		usuario.refreshTokenHash = refreshTokenHash;
		await this.usuarioRepository.actualizar(usuario);

		const {
			contraseniaHash,
			refreshTokenHash: __refreshHash,
			...usuarioSinPassword
		} = usuario;

		return {
			accessToken,
			refreshToken: nuevoRefreshToken,
			usuario: usuarioSinPassword
		};
	}
}
