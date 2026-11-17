/**
 * Serializador de usuarios para respuestas HTTP.
 * Expone solo datos públicos; nunca hashes, permisos ni favoritos.
 *
 * @module dto/usuarioPublico
 * @license ISC
 */

/**
 * Convierte un usuario de dominio en su representación pública.
 * @param {import('../models/usuario.js').default|null|undefined} usuario
 * @returns {{id: string, nombre: string, apellido: string, rol: string}|null} Datos públicos, o null si no hay usuario
 */
export function aUsuarioPublico(usuario) {
	if (!usuario) return null;
	return {
		id: usuario.id,
		nombre: usuario.nombre,
		apellido: usuario.apellido,
		rol: usuario.rol
	};
}
