/**
 * @file Hook que carga las reseñas de los eventos de un organizador
 *   (`GET /api/usuarios/:idOrganizador/resenias`); no pide nada sin ID y
 *   descarta respuestas viejas (specs/005-detalle-evento-compra/research.md R3).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { listarReseniasOrganizador } from '../services/usuarioService';

/**
 * Estado de las reseñas (data-model.md §10).
 * @typedef {Object} EstadoResenias
 * @property {object[]} resenias Reseñas en orden de creación (`[]` si no hay o falló).
 * @property {boolean} cargando Si hay una petición en curso.
 * @property {Error|null} error Último error (`ApiError`), o `null`.
 * @property {function(): Promise<void>} recargar Vuelve a pedirlas.
 */

/**
 * Carga las reseñas de un organizador. Nunca lanza.
 * @param {string|null|undefined} idOrganizador ID del organizador; vacío → inactivo.
 * @returns {EstadoResenias} Estado de la carga.
 */
export function useReseniasOrganizador(idOrganizador) {
	const activo = typeof idOrganizador === 'string' && idOrganizador !== '';
	const [estado, setEstado] = useState({
		resenias: [],
		cargando: activo,
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
		if (!activo) {
			setEstado({ resenias: [], cargando: false, error: null });
			return;
		}
		const numero = secuencia.current;
		const vigente = () => montado.current && numero === secuencia.current;
		setEstado((e) => ({ ...e, cargando: true }));
		try {
			const resenias = await listarReseniasOrganizador(idOrganizador);
			if (!vigente()) return;
			setEstado({
				resenias: Array.isArray(resenias) ? resenias : [],
				cargando: false,
				error: null
			});
		} catch (error) {
			if (!vigente()) return;
			setEstado({ resenias: [], cargando: false, error });
		}
	}, [activo, idOrganizador]);

	useEffect(() => {
		recargar();
	}, [recargar]);

	return { ...estado, recargar };
}
