/**
 * @file Hook de las compras y la disponibilidad de un evento propio
 *   (`GET /api/eventos/:id/compras`): descarta respuestas viejas y, con un ID
 *   vacío, no pide nada (specs/007-organizador-eventos/data-model.md §5;
 *   research R9, R10).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerComprasEvento } from '../services/eventoService';

/**
 * Estado del hook.
 * @typedef {Object} EstadoComprasEvento
 * @property {{compras: object[], disponibilidad: object[]}|null} datos Última respuesta, o `null`.
 * @property {boolean} cargando Si hay una petición en curso.
 * @property {Error|null} error Error de la última petición (`ApiError` con `status`), o `null`.
 * @property {function(): Promise<void>} recargar Vuelve a pedir (no hace nada con ID vacío).
 */

/**
 * Compras de un evento. Nunca lanza.
 * @param {string|null|undefined} idEvento ID del evento; vacío: no pide.
 * @returns {EstadoComprasEvento} Estado y acción.
 */
export function useComprasEvento(idEvento) {
	const tieneId = typeof idEvento === 'string' && idEvento.trim() !== '';
	const [estado, setEstado] = useState({
		datos: null,
		cargando: tieneId,
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
		if (!tieneId) return;
		secuencia.current += 1;
		const numero = secuencia.current;
		const vigente = () => montado.current && numero === secuencia.current;
		setEstado((e) => ({ ...e, cargando: true }));
		try {
			const datos = await obtenerComprasEvento(idEvento);
			if (vigente()) setEstado({ datos, cargando: false, error: null });
		} catch (error) {
			if (vigente()) setEstado((e) => ({ ...e, cargando: false, error }));
		}
	}, [idEvento, tieneId]);

	useEffect(() => {
		recargar();
	}, [recargar]);

	return { ...estado, recargar };
}
