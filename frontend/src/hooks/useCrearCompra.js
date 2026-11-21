/**
 * @file Hook que crea una compra (`POST /api/compras`) garantizando una sola
 *   petición en curso: una ref síncrona ignora un segundo `confirmar` antes
 *   del re-render (specs/005-detalle-evento-compra/research.md R7, SC-003).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { crearCompra } from '../services/compraService';

/**
 * Estado de la creación de una compra (data-model.md §10).
 * @typedef {Object} EstadoCrearCompra
 * @property {function({eventoId: string, tipoEntradaId: string, cantidad: number}): Promise<object|null>} confirmar Crea la compra; devuelve la compra, o `null` si falló o ya había una en curso.
 * @property {boolean} enviando Si hay una petición en curso.
 * @property {Error|null} error Último error (`ApiError`), o `null`.
 * @property {object|null} compra Compra creada (data-model.md §4), o `null`.
 * @property {function(): void} limpiarError Borra el error.
 */

/**
 * Crea compras de a una. Nunca lanza.
 * @returns {EstadoCrearCompra} Acciones y estado.
 */
export function useCrearCompra() {
	const [estado, setEstado] = useState({
		enviando: false,
		error: null,
		compra: null
	});
	const enCurso = useRef(false);
	const montado = useRef(true);

	useEffect(() => {
		montado.current = true;
		return () => {
			montado.current = false;
		};
	}, []);

	const confirmar = useCallback(
		async ({ eventoId, tipoEntradaId, cantidad }) => {
			if (enCurso.current) return null;
			enCurso.current = true;
			setEstado((e) => ({ ...e, enviando: true, error: null }));
			try {
				const compra = await crearCompra({ eventoId, tipoEntradaId, cantidad });
				if (montado.current)
					setEstado({ enviando: false, error: null, compra });
				return compra;
			} catch (error) {
				if (montado.current) {
					setEstado((e) => ({ ...e, enviando: false, error }));
				}
				return null;
			} finally {
				enCurso.current = false;
			}
		},
		[]
	);

	const limpiarError = useCallback(
		() => setEstado((e) => (e.error ? { ...e, error: null } : e)),
		[]
	);

	return { ...estado, confirmar, limpiarError };
}
