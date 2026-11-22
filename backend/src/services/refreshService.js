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
import { BadRequestError, UnauthorizedError } from '../errors/index.js';

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
	 * @throws {BadRequestError} Si la validación de los datos falla.
	 * @throws {UnauthorizedError} Si el refresh token es inválido o expiró.
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
