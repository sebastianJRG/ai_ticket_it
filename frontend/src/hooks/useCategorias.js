/**
 * @file Hook que carga las categorías (`GET /api/categorias`) al montar. Sin
 *   categorías o ante un error devuelve `[]` y la UI muestra solo "Todo"
 *   (specs/004-explorar-busqueda-favoritos/research.md R10). La feature 007
 *   suma, de forma aditiva, `agregar` (alta rápida) y `recargar`
 *   (specs/007-organizador-eventos/research.md R8).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { listarCategorias } from '../services/categoriaService';

/**
 * Estado del hook.
 * @typedef {Object} EstadoCategorias
 * @property {object[]} categorias Categorías en orden de creación (`[]` mientras carga o si falla).
 * @property {boolean} cargando Si hay una petición en curso.
 * @property {function(object): void} agregar Suma una categoría al final (sin duplicar por `id`).
 * @property {function(): Promise<void>} recargar Vuelve a pedir la lista.
 */

/**
 * Carga las categorías al montar. Nunca lanza.
 * @returns {EstadoCategorias} Categorías y acciones.
 */
export function useCategorias() {
	const [categorias, setCategorias] = useState([]);
	const [cargando, setCargando] = useState(true);
	const secuencia = useRef(0);
	const montado = useRef(true);

	useEffect(() => {
		montado.current = true;
		return () => {
			montado.current = false;
		};
	}, []);

	const recargar = useCallback(async () => {
		secuencia.current += 1;
		const numero = secuencia.current;
		const vigente = () => montado.current && numero === secuencia.current;
		setCargando(true);
		try {
			const lista = await listarCategorias();
			if (vigente()) setCategorias(Array.isArray(lista) ? lista : []);
		} catch {
			if (vigente()) setCategorias([]);
		}
		if (vigente()) setCargando(false);
	}, []);

	useEffect(() => {
		recargar();
	}, [recargar]);

	const agregar = useCallback((categoria) => {
		setCategorias((lista) =>
			lista.some((c) => c.id === categoria.id) ? lista : [...lista, categoria]
		);
	}, []);

	return { categorias, cargando, agregar, recargar };
}
