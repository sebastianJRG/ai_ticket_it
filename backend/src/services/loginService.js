/**
 * Servicio de inicio de sesión (emite access y refresh token).
 *
 * Ownership: equipo backend de Al Ticket It.
 *
 * @license ISC
 */
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { loginUsuarioSchema } from '../dto/usuario.js';
import { hashContrasenia, verifyContrasenia } from '../utils/hashing.js';
import { JWT_SECRET, JWT_ACCESS_EXPIRATION } from '../utils/configJwt.js';
import { BadRequestError, UnauthorizedError } from '../errors/index.js';

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
	 * @throws {BadRequestError} Si la validación de los datos falla.
	 * @throws {UnauthorizedError} Si las credenciales son inválidas.
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
			throw new BadRequestError(message);
		}

		const { nombreUsuario, contrasenia } = resultado.data;

		const usuario = await this.usuarioRepository.buscarUno({ nombreUsuario });
		if (!usuario) {
			throw new UnauthorizedError('Credenciales inválidas.');
		}

		const contraseniaValida = await verifyContrasenia(
			contrasenia,
			usuario.contraseniaHash
		);
		if (!contraseniaValida) {
			throw new UnauthorizedError('Credenciales inválidas.');
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
