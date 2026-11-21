/**
 * @file Hook que ejecuta las acciones del ORGANIZADOR sobre una compra
 *   (confirmar, reembolsar, cancelar) con una sola petición en curso en toda
 *   la pantalla; no transiciona el estado en el cliente
 *   (specs/007-organizador-eventos/data-model.md §5; research R11).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	cancelarCompra,
	confirmarCompra,
	reembolsarCompra
} from '../services/compraService';

/** Servicio de cada acción. */
const SERVICIOS = {
	confirmar: confirmarCompra,
	reembolsar: reembolsarCompra,
	cancelar: cancelarCompra
};

/**
 * Resultado de una acción.
 * @typedef {{ok: true, accion: import('../compras/gestionCompras').AccionCompra, compra: object} | {ok: false, accion: import('../compras/gestionCompras').AccionCompra, error: Error}} ResultadoAccionCompra
 */

/**
 * Estado y acción del hook.
 * @typedef {Object} EstadoAccionCompra
 * @property {function(import('../compras/gestionCompras').AccionCompra, object): Promise<void>} ejecutar Pide la transición; ignora llamadas con otra en curso.
 * @property {{accion: import('../compras/gestionCompras').AccionCompra, idCompra: string}|null} enCurso Acción en curso, o `null`.
 */

/**
 * Acciones de a una. Nunca lanza.
 * @param {{alTerminar?: function(ResultadoAccionCompra): void}} [opciones] Callback al responder el servidor.
 * @returns {EstadoAccionCompra} Acción y estado.
 */
export function useAccionCompra({ alTerminar } = {}) {
	const [enCurso, setEnCurso] = useState(null);
	const ocupado = useRef(false);
	const montado = useRef(true);
	const callback = useRef(alTerminar);
	callback.current = alTerminar;

	useEffect(() => {
		montado.current = true;
		return () => {
			montado.current = false;
		};
	}, []);

	const ejecutar = useCallback(async (accion, compra) => {
		const servicio = SERVICIOS[accion];
		if (ocupado.current || !servicio || !compra) return;
		ocupado.current = true;
		setEnCurso({ accion, idCompra: compra.id });
		let resultado;
		try {
			resultado = { ok: true, accion, compra: await servicio(compra.id) };
		} catch (error) {
			resultado = { ok: false, accion, error };
		} finally {
			ocupado.current = false;
		}
		if (!montado.current) return;
		setEnCurso(null);
		callback.current?.(resultado);
	}, []);

	return { ejecutar, enCurso };
}
