/**
 * Representa a un usuario con rol y permisos asignados.
 * Extiende el modelo base con campos de autenticación y autorización.
 */
export default class Usuario {
	/** @param {string|null} [id=null] */
	/** @param {string} nombre */
	/** @param {string} apellido */
	/** @param {string} rol */
	/** @param {string[]} [permissions=[]] */
	/** @param {Array<{id: string}>} [favoritos=[]] - Referencias a eventos favoritos, en orden de agregado */
	/** @param {string} nombreUsuario */
	/** @param {string} contraseniaHash */
	/** @param {string|null} [refreshTokenHash=null] */
	constructor(
		id = null,
		nombre,
		apellido,
		rol,
		permissions = [],
		favoritos = [],
		nombreUsuario,
		contraseniaHash,
		refreshTokenHash = null
	) {
		/** @type {string|null} */
		this.id = id;

		/** @type {string} */
		this.nombre = nombre;

		/** @type {string} */
		this.apellido = apellido;

		/**
		 * @type {string} - Roles asignados: ORGANIZADOR, COMPRADOR Permisos definidos en roles.js
		 */
		this.rol = rol;

		/** @type {string[]} - Permisos en nomenclatura verbo:recurso */
		this.permissions = permissions;

		/** @type {Array<{id: string}>} - Referencias mínimas a eventos favoritos (sin duplicados, en orden de agregado) */
		this.favoritos = favoritos;

		/** @type {string} */
		this.nombreUsuario = nombreUsuario;

		/** @type {string} */
		this.contraseniaHash = contraseniaHash;

		/** @type {string|null} */
		this.refreshTokenHash = refreshTokenHash;
	}
}
