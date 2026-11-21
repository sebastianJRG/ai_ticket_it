/**
 * @file Hook que carga las categorías (`GET /api/categorias`) una vez. Sin
 *   categorías o ante un error devuelve `[]` y la UI muestra solo "Todo"
 *   (specs/004-explorar-busqueda-favoritos/research.md R10).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useEffect, useState } from 'react';
import { listarCategorias } from '../services/categoriaService';

/**
 * Carga las categorías al montar. Nunca lanza.
 * @returns {{categorias: object[]}} Categorías en orden de creación (`[]` mientras carga o si falla).
 */
export function useCategorias() {
	const [categorias, setCategorias] = useState([]);
	useEffect(() => {
		let vivo = true;
		listarCategorias()
			.then((lista) => {
				if (vivo) setCategorias(Array.isArray(lista) ? lista : []);
			})
			.catch(() => {
				if (vivo) setCategorias([]);
			});
		return () => {
			vivo = false;
		};
	}, []);
	return { categorias };
}
