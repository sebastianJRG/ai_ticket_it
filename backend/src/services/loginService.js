import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { loginUsuarioSchema } from '../dto/usuario.js';
import { hashContrasenia, verifyContrasenia } from '../utils/hashing.js';

/**
 * Servicio que gestiona el flujo de inicio de sesión.
 * Emite un access token con duración corta y un refresh token con duración larga.
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
 * @private
 * @type {string}
 *
 * Duración política del refresh token (opaco, no JWT). En este entorno
 * en memoria no se almacena fecha de expiración; el token se invalida
 * en `/api/logout` o se reemplaza en `/api/refresh`.
 */
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '30d';

/**
 * Servicio que gestiona el flujo de inicio de sesión.
 *
 * Emite un access token (payload: id, rol, permisos) y un refresh token.
 * El refresh token se guarda hasheado en el usuario.
 */
export default class LoginService {
	/**
	 * Crea una instancia de LoginService.
	 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository Repositorio de usuarios
	 */
	constructor(usuarioRepository) {
		/** @private {import('../repositories/usuarioRepository.js').default} */
		this.usuarioRepository = usuarioRepository;
	}

	/**
	 * Inicia sesión con nombre de usuario y contraseña, emitiendo access y refresh token.
	 *
	 * @param {object} datos - Cuerpo de la petición con nombreUsuario y contrasenia.
	 * @returns {Promise<{accessToken: string, refreshToken: string, usuario: object}>}
	 * @throws {Error} Si las credenciales son inválidas o la validación falla.
	 */
	async iniciarSesion(datos) {
		const resultado = loginUsuarioSchema.safeParse(datos);
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

		const { nombreUsuario, contrasenia } = resultado.data;

		const usuario = await this.usuarioRepository.buscarUno({ nombreUsuario });
		if (!usuario) {
			const error = new Error('Credenciales inválidas.');
			error.status = 401;
			throw error;
		}

		const contraseniaValida = await verifyContrasenia(
			contrasenia,
			usuario.contraseniaHash
		);
		if (!contraseniaValida) {
			const error = new Error('Credenciales inválidas.');
			error.status = 401;
			throw error;
		}

		const accessToken = jwt.sign(
			{ id: usuario.id, rol: usuario.rol, permisos: usuario.permissions },
			JWT_SECRET,
			{ expiresIn: JWT_ACCESS_EXPIRATION }
		);

		const refreshToken = crypto.randomBytes(48).toString('hex');
		const refreshTokenHash = await hashContrasenia(refreshToken);

		usuario.refreshTokenHash = refreshTokenHash;
		await this.usuarioRepository.actualizar(usuario);

		const {
			contraseniaHash,
			refreshTokenHash: __refreshHash,
			...usuarioSinPassword
		} = usuario;

		return {
			accessToken,
			refreshToken,
			usuario: usuarioSinPassword
		};
	}
}
