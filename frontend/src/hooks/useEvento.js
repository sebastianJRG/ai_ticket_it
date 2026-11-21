/**
 * @file Hook que carga un evento por ID (`GET /api/eventos/:idEvento`) para el
 *   detalle y el checkout; descarta respuestas de IDs anteriores o tras
 *   desmontar (specs/005-detalle-evento-compra/research.md R3).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerEvento } from '../services/eventoService';

/**
 * Estado de la carga de un evento (data-model.md §10).
 * @typedef {Object} EstadoEvento
 * @property {object|null} evento Evento de la API, o `null`.
 * @property {boolean} cargando Si hay una petición en curso.
 * @property {Error|null} error Último error (`ApiError` con `status`), o `null`.
 * @property {boolean} noEncontrado `true` si el servidor respondió 404 o 400.
 * @property {function(): Promise<void>} recargar Vuelve a pedir el evento.
 */

/**
 * Carga un evento. Nunca lanza: los errores quedan en `error`.
 * @param {string} idEvento ID del evento.
 * @returns {EstadoEvento} Estado de la carga.
 */
export function useEvento(idEvento) {
	const [estado, setEstado] = useState({
		evento: null,
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
		setEstado((e) => ({ ...e, cargando: true }));
		try {
			const evento = await obtenerEvento(idEvento);
			if (!vigente()) return;
			setEstado({ evento, cargando: false, error: null });
		} catch (error) {
			if (!vigente()) return;
			setEstado({ evento: null, cargando: false, error });
		}
	}, [idEvento]);

	useEffect(() => {
		recargar();
	}, [recargar]);

	const status = estado.error?.status;
	return {
		...estado,
		noEncontrado: status === 404 || status === 400,
		recargar
	};
}
