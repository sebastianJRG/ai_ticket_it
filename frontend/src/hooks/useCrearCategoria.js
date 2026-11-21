/**
 * @file Hook que crea una categoría (`POST /api/categorias`) con una sola petición en curso: una ref
 *   síncrona ignora un segundo envío antes del re-render
 *   (specs/007-organizador-eventos/data-model.md §5; research R8, R13).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { crearCategoria } from '../services/categoriaService';

/**
 * Resultado del alta: el objeto creado o el error. `null` si se ignoró
 * porque ya había una petición en curso.
 * @typedef {{ok: true, categoria: object} | {ok: false, error: Error} | null} ResultadoCrearCategoria
 */

/**
 * Estado y acción del hook.
 * @typedef {Object} EstadoCrearCategoria
 * @property {function({nombre: string, descripcion: string}): Promise<ResultadoCrearCategoria>} crear Envía el alta; nunca lanza.
 * @property {boolean} enviando Si hay una petición en curso.
 */

/**
 * Altas de a una. Nunca lanza.
 * @returns {EstadoCrearCategoria} Acción y estado.
 */
export function useCrearCategoria() {
	const [enviando, setEnviando] = useState(false);
	const enCurso = useRef(false);
	const montado = useRef(true);

	useEffect(() => {
		montado.current = true;
		return () => {
			montado.current = false;
		};
	}, []);

	const crear = useCallback(async (datos) => {
		if (enCurso.current) return null;
		enCurso.current = true;
		setEnviando(true);
		let resultado;
		try {
			resultado = { ok: true, categoria: await crearCategoria(datos) };
		} catch (error) {
			resultado = { ok: false, error };
		} finally {
			enCurso.current = false;
		}
		if (montado.current) setEnviando(false);
		return resultado;
	}, []);

	return { crear, enviando };
}
