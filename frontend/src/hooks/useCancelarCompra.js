/**
 * @file Hook para cancelar una compra (`PATCH /api/compras/:id/cancelacion`)
 *   con una sola petición en curso; no transiciona el estado en el cliente
 *   (specs/006-mis-compras-comprador/research.md R6, data-model.md §6).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelarCompra } from '../services/compraService';

/**
 * Resultado de una cancelación.
 * @typedef {{ok: true, compra: object} | {ok: false, error: Error}} ResultadoCancelacion
 */

/**
 * Estado y acción del hook.
 * @typedef {Object} EstadoCancelarCompra
 * @property {function(object): Promise<void>} cancelar Pide cancelar la compra; ignora llamadas mientras hay una en curso.
 * @property {boolean} enviando Si hay una petición en curso.
 */

/**
 * Cancela compras de a una. Nunca lanza.
 * @param {{alTerminar?: function(ResultadoCancelacion): void}} [opciones] Callback al responder el servidor.
 * @returns {EstadoCancelarCompra} Acción y estado.
 */
export function useCancelarCompra({ alTerminar } = {}) {
	const [enviando, setEnviando] = useState(false);
	const enCurso = useRef(false);
	const montado = useRef(true);
	const callback = useRef(alTerminar);
	callback.current = alTerminar;

	useEffect(() => {
		montado.current = true;
		return () => {
			montado.current = false;
		};
	}, []);

	const cancelar = useCallback(async (compra) => {
		if (enCurso.current) return;
		enCurso.current = true;
		setEnviando(true);
		let resultado;
		try {
			resultado = { ok: true, compra: await cancelarCompra(compra.id) };
		} catch (error) {
			resultado = { ok: false, error };
		} finally {
			enCurso.current = false;
		}
		if (!montado.current) return;
		setEnviando(false);
		callback.current?.(resultado);
	}, []);

	return { cancelar, enviando };
}
