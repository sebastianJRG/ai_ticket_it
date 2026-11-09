import Evento from '../models/evento.js';
import RepositorioEnMemoria from './repositorioEnMemoria.js';

export default class UsuarioRepository extends RepositorioEnMemoria {
	/**
	 * Agrega o remueve un evento de los favoritos del usuario.
	 * @param {string} usuarioId
	 * @param {Evento} evento
	 */
	async alternarFavorito(usuarioId, evento) {
		const usuario = await this.buscarPorId(usuarioId);
		if (!usuario) return null;

		const idx = usuario.favoritos.findIndex((f) => f.id === evento.id);
		if (idx >= 0) {
			usuario.favoritos.splice(idx, 1);
		} else {
			usuario.favoritos.push(evento);
		}

		return await this.actualizar(usuario);
	}

	/**
	 * Asigna rol y permisos a un usuario.
	 * @param {string} usuarioId
	 * @param {string} rol
	 * @param {string[]} permissions
	 */
	async asignarRolYPermisos(usuarioId, rol, permissions) {
		const usuario = await this.buscarPorId(usuarioId);
		if (!usuario) return null;

		usuario.rol = rol;
		usuario.permissions = permissions;

		return await this.actualizar(usuario);
	}
}
