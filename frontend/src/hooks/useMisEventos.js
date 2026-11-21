/**
 * @file Hook de Mis eventos: pide `GET /api/eventos` por fecha ascendente y
 *   se queda con los del organizador de la sesión, separados en próximos y
 *   finalizados; descarta respuestas viejas
 *   (specs/007-organizador-eventos/data-model.md §5; research R2).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { listarEventos } from '../services/eventoService';
import { separarMisEventos } from '../eventos/misEventos';

/**
 * Estado del hook.
 * @typedef {Object} EstadoMisEventos
 * @property {object[]|null} eventos Eventos propios (próximos y luego finalizados), o `null` si nunca respondió.
 * @property {object[]} proximos Próximos, del más cercano al más lejano.
 * @property {object[]} finalizados Finalizados, del más reciente al más viejo.
 * @property {boolean} cargando Primera carga en curso (sin datos).
 * @property {boolean} actualizando Recarga en curso con datos visibles.
 * @property {Error|null} error Error de la última petición (`ApiError`), o `null`.
 * @property {function(): Promise<void>} recargar Vuelve a pedir el listado.
 */

/**
 * Eventos del organizador de la sesión. Nunca lanza.
 * @returns {EstadoMisEventos} Estado y acción.
 */
export function useMisEventos() {
	const { usuario } = useAuth();
	const organizadorId = usuario?.id;
	const [estado, setEstado] = useState({
		todos: null,
		pidiendo: true,
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
		setEstado((e) => ({ ...e, pidiendo: true }));
		try {
			const todos = await listarEventos({ sortBy: 'fecha', order: 'asc' });
			if (vigente()) setEstado({ todos, pidiendo: false, error: null });
		} catch (error) {
			if (vigente()) setEstado((e) => ({ ...e, pidiendo: false, error }));
		}
	}, []);

	useEffect(() => {
		recargar();
	}, [recargar]);

	const separados = useMemo(
		() => separarMisEventos(estado.todos, organizadorId),
		[estado.todos, organizadorId]
	);

	return {
		eventos: estado.todos
			? [...separados.proximos, ...separados.finalizados]
			: null,
		proximos: separados.proximos,
		finalizados: separados.finalizados,
		cargando: estado.pidiendo && !estado.todos,
		actualizando: estado.pidiendo && !!estado.todos,
		error: estado.error,
		recargar
	};
}
