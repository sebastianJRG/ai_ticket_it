/**
 * @file Servicio de categorías: listado y alta
 *   (contracts/servicios.md › categoriaService).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { cliente } from './api';

/**
 * Lista todas las categorías. Pública.
 * @returns {Promise<object[]>} Categorías en orden de creación (`[]` si no hay).
 * @throws {import('./api').ApiError} 0 (sin conexión) o 5xx.
 */
export async function listarCategorias() {
	const { data } = await cliente.get('/api/categorias');
	return data;
}

/**
 * Crea una categoría (ORGANIZADOR).
 * @param {{nombre: string, descripcion: string}} datos Nombre y descripción.
 * @returns {Promise<object>} Categoría creada.
 * @throws {import('./api').ApiError} 400 (datos inválidos), 401, 403 (no es ORGANIZADOR), 0 (sin conexión).
 */
export async function crearCategoria({ nombre, descripcion }) {
	const { data } = await cliente.post('/api/categorias', {
		nombre,
		descripcion
	});
	return data;
}
