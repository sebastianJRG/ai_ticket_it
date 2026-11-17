/**
 * Serializador del perfil del usuario autenticado para respuestas HTTP.
 * Expone los datos propios del usuario; nunca hashes ni favoritos.
 *
 * @module dto/usuarioPerfil
 * @license ISC
 */

/**
 * Convierte un usuario de dominio en su perfil propio.
 * @param {import('../models/usuario.js').default|null|undefined} usuario - Usuario de dominio
 * @returns {{id: string, nombre: string, apellido: string, nombreUsuario: string, rol: string, permissions: string[]}|null} Perfil, o null si no hay usuario
 */
export function aUsuarioPerfil(usuario) {
	if (!usuario) return null;
	return {
		id: usuario.id,
		nombre: usuario.nombre,
		apellido: usuario.apellido,
		nombreUsuario: usuario.nombreUsuario,
		rol: usuario.rol,
		permissions: [...usuario.permissions]
	};
}
