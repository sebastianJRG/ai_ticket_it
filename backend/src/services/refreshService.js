import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { refreshUsuarioSchema } from '../dto/usuario.js';
import { hashContrasenia, verifyContrasenia } from '../utils/hashing.js';

/**
 * Servicio que gestiona la renovación de tokens (rotación de refresh token).
 * Emite un nuevo access token y un nuevo refresh token en cada petición.
 *
 * @private
 * @type {string}
 */
const JWT_SECRET =
	process.env.JWT_SECRET || 'clave-generica-cambiar-en-produccion';

/**
 * @private
 * @type {string}
 */
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';

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

		const usuarios = await this.usuarioRepository.buscarVarios({});
		const usuario = usuarios.find((u) => {
			if (!u.refreshTokenHash) return false;
			return verifyContrasenia(refreshToken, u.refreshTokenHash);
		});

		if (!usuario) {
			console.error('[debug] token inválido, ningún usuario encontrado');
			const error = new Error('Refresh token inválido o expirado.');
			error.status = 401;
			throw error;
		}

		console.error('[debug] token válido, user id=' + usuario.id);

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
