/**
 * @file Hook de consulta de eventos (`GET /api/eventos`): re-consulta cuando
 *   cambian los filtros y solo deja que la última petición actualice el estado
 *   (specs/004-explorar-busqueda-favoritos/research.md R3, data-model.md §7).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { listarEventos } from '../services/eventoService';

/**
 * Estado de la consulta (data-model.md › EstadoConsulta).
 * @typedef {Object} EstadoConsulta
 * @property {object[]|null} eventos Último resultado, o `null` si nunca respondió.
 * @property {boolean} cargando Si hay una petición en curso.
 * @property {Error|null} error Error de la última petición (`ApiError` con `status`), o `null`.
 * @property {function(): Promise<void>} recargar Vuelve a consultar con los mismos filtros.
 */

/**
 * Indica si un filtro no aporta valor.
 * @param {unknown} v Valor del filtro.
 * @returns {boolean} `true` si es `undefined`, `null` o texto en blanco.
 */
const vacio = (v) => v == null || (typeof v === 'string' && v.trim() === '');

/**
 * Consulta eventos con los filtros dados. Nunca lanza: los errores quedan en `error`.
 * @param {import('../services/eventoService').FiltrosEventos} [filtros] Filtros (se comparan por valor).
 * @returns {EstadoConsulta} Estado de la consulta.
 */
export function useEventos(filtros = {}) {
	const { q, categoriaId, sortBy, order } = filtros;
	const [estado, setEstado] = useState({
		eventos: null,
		cargando: true,
		error: null
	});
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
		const params = Object.fromEntries(
			Object.entries({ q, categoriaId, sortBy, order })
				.filter(([, v]) => !vacio(v))
				.map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
		);
		setEstado((e) => ({ ...e, cargando: true }));
		try {
			const eventos = await listarEventos(params);
			if (!vigente()) return;
			setEstado({ eventos, cargando: false, error: null });
		} catch (error) {
			if (!vigente()) return;
			setEstado((e) => ({ ...e, cargando: false, error }));
		}
	}, [q, categoriaId, sortBy, order]);

	useEffect(() => {
		recargar();
	}, [recargar]);

	return { ...estado, recargar };
}
