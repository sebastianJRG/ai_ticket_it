/**
 * @file Servicio de usuarios: perfil propio, reseñas de un organizador y
 *   favoritos del comprador (contracts/servicios.md › usuarioService).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { cliente } from './api';

/**
 * Devuelve el perfil del usuario de la sesión.
 * @returns {Promise<{id: string, nombre: string, apellido: string, nombreUsuario: string, rol: string, permissions: string[]}>} Perfil.
 * @throws {import('./api').ApiError} 401 (sin sesión), 403 (rol no permitido), 404 (el usuario ya no existe), 0 (sin conexión).
 */
export async function obtenerPerfil() {
	const { data } = await cliente.get('/api/usuarios');
	return data;
}

/**
 * Lista las reseñas de todos los eventos de un organizador. Pública.
 * @param {string} idOrganizador ID del organizador.
 * @returns {Promise<object[]>} Reseñas en orden de creación (`[]` si no hay).
 * @throws {import('./api').ApiError} 400 (ID inválido), 404 (no existe o no es ORGANIZADOR), 0 (sin conexión).
 */
export async function listarReseniasOrganizador(idOrganizador) {
	const { data } = await cliente.get(
		`/api/usuarios/${encodeURIComponent(idOrganizador)}/resenias`
	);
	return data;
}

/**
 * Lista los eventos favoritos del comprador (requiere la feature 002).
 * @returns {Promise<object[]>} Eventos favoritos.
 * @throws {import('./api').ApiError} 401, 403 (no es COMPRADOR), 404 (ruta aún no desplegada), 0 (sin conexión).
 */
export async function listarFavoritos() {
	const { data } = await cliente.get('/api/usuarios/favoritos');
	return data;
}

/**
 * Marca un evento como favorito (idempotente; requiere la feature 002).
 * @param {string} idEvento ID del evento.
 * @returns {Promise<any>} Favoritos actualizados según el backend.
 * @throws {import('./api').ApiError} 400 (ID inválido), 401, 403, 404 (evento inexistente o ruta no desplegada), 0.
 */
export async function agregarFavorito(idEvento) {
	const { data } = await cliente.put(
		`/api/usuarios/favoritos/${encodeURIComponent(idEvento)}`
	);
	return data;
}

/**
 * Quita un evento de favoritos (idempotente; requiere la feature 002).
 * @param {string} idEvento ID del evento.
 * @returns {Promise<any>} Favoritos actualizados según el backend.
 * @throws {import('./api').ApiError} 400 (ID inválido), 401, 403, 404 (ruta no desplegada), 0 (sin conexión).
 */
export async function quitarFavorito(idEvento) {
	const { data } = await cliente.delete(
		`/api/usuarios/favoritos/${encodeURIComponent(idEvento)}`
	);
	return data;
}
