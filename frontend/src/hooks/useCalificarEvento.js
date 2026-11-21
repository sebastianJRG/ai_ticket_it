/**
 * @file Hook para calificar un evento: verifica en las reseñas públicas si el
 *   usuario ya lo calificó y crea la reseña con una sola petición en curso
 *   (specs/006-mis-compras-comprador/research.md R11, data-model.md §6). Si la
 *   verificación falla se ofrece igual: el 409 del servidor es el respaldo.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { crearResenia, listarReseniasEvento } from '../services/reseniaService';
import {
	mensajeErrorResenia,
	validarResenia,
	yaCalifico
} from '../resenias/calificacion';

/**
 * Estado y acción del hook.
 * @typedef {Object} EstadoCalificarEvento
 * @property {boolean} yaCalificado Si el usuario ya reseñó el evento.
 * @property {boolean} verificando Si se están pidiendo las reseñas del evento.
 * @property {function(import('../resenias/calificacion').BorradorResenia): Promise<boolean>} enviar Envía la reseña; `true` solo con 201.
 * @property {boolean} enviando Si hay un envío en curso.
 * @property {import('../resenias/calificacion').MensajeErrorResenia|null} error Último error del envío.
 */

/**
 * Califica un evento. Nunca lanza.
 * @param {string|null|undefined} eventoId Evento a calificar (sin ID no hace nada).
 * @param {string|null|undefined} usuarioId Usuario de la sesión.
 * @returns {EstadoCalificarEvento} Estado y acción.
 */
export function useCalificarEvento(eventoId, usuarioId) {
	const [estado, setEstado] = useState({
		yaCalificado: false,
		verificando: !!eventoId,
		enviando: false,
		error: null
	});
	const enCurso = useRef(false);
	const montado = useRef(true);

	useEffect(() => {
		montado.current = true;
		return () => {
			montado.current = false;
		};
	}, []);

	useEffect(() => {
		if (!eventoId) {
			setEstado((e) => ({ ...e, verificando: false }));
			return undefined;
		}
		let vigente = true;
		setEstado((e) => ({ ...e, verificando: true }));
		listarReseniasEvento(eventoId)
			.then((resenias) => {
				if (vigente && montado.current) {
					setEstado((e) => ({
						...e,
						verificando: false,
						yaCalificado: e.yaCalificado || yaCalifico(resenias, usuarioId)
					}));
				}
			})
			.catch(() => {
				if (vigente && montado.current) {
					setEstado((e) => ({ ...e, verificando: false }));
				}
			});
		return () => {
			vigente = false;
		};
	}, [eventoId, usuarioId]);

	const enviar = useCallback(
		async (borrador) => {
			if (enCurso.current || !eventoId) return false;
			if (!validarResenia(borrador).valido) return false;
			enCurso.current = true;
			setEstado((e) => ({ ...e, enviando: true, error: null }));
			try {
				await crearResenia({
					eventoId,
					detalle: borrador.detalle.trim(),
					puntuacion: borrador.puntuacion
				});
				if (montado.current) {
					setEstado((e) => ({ ...e, enviando: false, yaCalificado: true }));
				}
				return true;
			} catch (err) {
				const m = mensajeErrorResenia(err);
				if (montado.current) {
					setEstado((e) => ({
						...e,
						enviando: false,
						error: m,
						yaCalificado: e.yaCalificado || m.yaCalificado
					}));
				}
				return false;
			} finally {
				enCurso.current = false;
			}
		},
		[eventoId]
	);

	return { ...estado, enviar };
}
