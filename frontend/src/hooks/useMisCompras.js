/**
 * @file Hook del listado de compras del comprador (`GET /api/compras`): lo usan
 *   Mis compras y el detalle de compra; solo la última petición actualiza el
 *   estado (specs/006-mis-compras-comprador/research.md R2, data-model.md §6).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { listarMisCompras } from '../services/compraService';

/**
 * Estado del listado (data-model.md › EstadoMisCompras).
 * @typedef {Object} EstadoMisCompras
 * @property {object[]|null} compras Compras del servidor, o `null` hasta la primera respuesta.
 * @property {boolean} cargando Petición en curso sin datos todavía.
 * @property {boolean} actualizando Petición en curso con datos ya cargados.
 * @property {Error|null} error Error de la última petición (`ApiError` con `status`), o `null`.
 * @property {function(): Promise<void>} recargar Vuelve a pedir el listado.
 */

/**
 * Carga las compras del COMPRADOR de la sesión. Nunca lanza: los errores quedan en `error`.
 * @returns {EstadoMisCompras} Estado del listado.
 */
export function useMisCompras() {
	const [estado, setEstado] = useState({
		compras: null,
		enCurso: true,
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
		setEstado((e) => ({ ...e, enCurso: true }));
		try {
			const compras = await listarMisCompras();
			if (!vigente()) return;
			setEstado({ compras, enCurso: false, error: null });
		} catch (error) {
			if (!vigente()) return;
			setEstado((e) => ({ ...e, enCurso: false, error }));
		}
	}, []);

	useEffect(() => {
		recargar();
	}, [recargar]);

	const { compras, enCurso, error } = estado;
	return {
		compras,
		cargando: enCurso && compras === null,
		actualizando: enCurso && compras !== null,
		error,
		recargar
	};
}
