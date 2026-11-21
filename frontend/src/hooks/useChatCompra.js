/**
 * @file Hook del chat de una compra (`GET` y `POST /api/compras/:id/mensajes`):
 *   consulta la conversación cada ~5 s solo mientras está activo (`setTimeout`
 *   encadenado, sin encimar consultas), envía de forma optimista con
 *   una cola FIFO de a uno y permite reintentar sin perder el texto
 *   (specs/008-chat-compra/data-model.md §2 y §5; research R2–R4).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { enviarMensaje, listarMensajes } from '../services/mensajeService';
import { fusionarMensajes, validarMensaje } from '../mensajes/chat';

/**
 * Estado y acciones del hook.
 * @typedef {Object} EstadoChatCompra
 * @property {Array<import('../mensajes/chat').Mensaje|import('../mensajes/chat').MensajeLocal>} mensajes Lista visible (`fusionarMensajes`).
 * @property {boolean} cargando `true` solo hasta la primera respuesta de la carga inicial.
 * @property {Error|null} error Error bloqueante (`ApiError` con `status`), o `null`.
 * @property {function(string): void} enviar Agrega un mensaje local y lo encola; ignora textos inválidos.
 * @property {function(string): void} reintentar Reenvía un mensaje local en `error`.
 * @property {function(): Promise<void>} recargar Consulta ya; no hace nada si hay una consulta en curso.
 */

/**
 * Opciones del hook.
 * @typedef {Object} OpcionesChatCompra
 * @property {boolean} activo Si el chat está visible (habilita las consultas).
 * @property {number} [intervaloMs] Intervalo de la consulta periódica (5000 por defecto).
 */

/**
 * Chat de una compra. Nunca lanza: los errores quedan en `error` o en el
 * mensaje local que falló.
 * @param {string|null|undefined} idCompra ID de la compra; vacío: no pide.
 * @param {OpcionesChatCompra} opciones Ver {@link OpcionesChatCompra}.
 * @returns {EstadoChatCompra} Estado y acciones.
 */
export function useChatCompra(idCompra, { activo, intervaloMs = 5000 } = {}) {
	const { usuario } = useAuth();
	const miId = usuario?.id ?? null;
	const tieneId = typeof idCompra === 'string' && idCompra.trim() !== '';
	const [servidor, setServidor] = useState(null);
	const [locales, setLocales] = useState([]);
	const [cargando, setCargando] = useState(tieneId);
	const [error, setError] = useState(null);

	const montado = useRef(true);
	const secuencia = useRef(0);
	const getEnCurso = useRef(false);
	const hayDatos = useRef(false);
	const idRef = useRef(idCompra);
	idRef.current = idCompra;
	const textos = useRef(new Map());
	const cola = useRef([]);
	const postEnCurso = useRef(false);
	const contador = useRef(0);
	const detenido = useRef(false);

	useEffect(() => {
		montado.current = true;
		return () => {
			montado.current = false;
		};
	}, []);

	const recargar = useCallback(async () => {
		if (!tieneId || getEnCurso.current) return;
		getEnCurso.current = true;
		secuencia.current += 1;
		const numero = secuencia.current;
		const vigente = () => montado.current && numero === secuencia.current;
		if (!hayDatos.current) setCargando(true);
		try {
			const lista = await listarMensajes(idCompra);
			if (vigente()) {
				hayDatos.current = true;
				detenido.current = false;
				const ids = new Set(lista.map((m) => m.id));
				setServidor(lista);
				setLocales((ls) =>
					ls.some((l) => l.estado === 'confirmado' && ids.has(l.id))
						? ls.filter((l) => !(l.estado === 'confirmado' && ids.has(l.id)))
						: ls
				);
				setError(null);
				setCargando(false);
			}
		} catch (e) {
			if (vigente()) {
				// 403/404 no se arreglan solos: se detiene la consulta (R6). Otros
				// errores con datos son silenciosos y se reintenta en el próximo ciclo.
				if (e?.status === 403 || e?.status === 404) {
					detenido.current = true;
					setError(e);
				} else if (!hayDatos.current) {
					setError(e);
				}
				setCargando(false);
			}
		} finally {
			if (numero === secuencia.current) getEnCurso.current = false;
		}
	}, [idCompra, tieneId]);

	useEffect(() => {
		if (!activo || !tieneId) return undefined;
		let vivo = true;
		let temporizador = null;
		const ciclo = async () => {
			await recargar();
			if (vivo && !detenido.current) {
				temporizador = setTimeout(ciclo, intervaloMs);
			}
		};
		ciclo();
		return () => {
			vivo = false;
			clearTimeout(temporizador);
			// Invalida la respuesta en vuelo y libera la próxima consulta.
			secuencia.current += 1;
			getEnCurso.current = false;
		};
	}, [activo, tieneId, recargar, intervaloMs]);

	/** Actualiza un mensaje local por su clave. */
	const actualizarLocal = useCallback((claveLocal, cambios) => {
		setLocales((ls) =>
			ls.map((l) => {
				if (l.claveLocal !== claveLocal) return l;
				const siguiente = { ...l, ...cambios };
				if (cambios.estado !== 'error') delete siguiente.error;
				return siguiente;
			})
		);
	}, []);

	const procesarCola = useCallback(async () => {
		if (postEnCurso.current) return;
		const claveLocal = cola.current.shift();
		if (!claveLocal) return;
		postEnCurso.current = true;
		try {
			const creado = await enviarMensaje(
				idRef.current,
				textos.current.get(claveLocal)
			);
			if (montado.current) {
				actualizarLocal(claveLocal, {
					estado: 'confirmado',
					id: creado.id,
					enviado: creado.enviado
				});
			}
		} catch (e) {
			if (montado.current) {
				actualizarLocal(claveLocal, { estado: 'error', error: e });
				// Sin acceso o compra inexistente: no se arregla reintentando (R6).
				if (e?.status === 403 || e?.status === 404) {
					detenido.current = true;
					setError(e);
				}
			}
		} finally {
			postEnCurso.current = false;
		}
		if (montado.current) procesarCola();
	}, [actualizarLocal]);

	const enviar = useCallback(
		(texto) => {
			const recortado = String(texto ?? '').trim();
			if (!tieneId || !validarMensaje(recortado).valido) return;
			contador.current += 1;
			const claveLocal = `local-${contador.current}`;
			textos.current.set(claveLocal, recortado);
			setLocales((ls) => [
				...ls,
				{
					claveLocal,
					mensaje: recortado,
					estado: 'enviando',
					creado: new Date()
				}
			]);
			cola.current.push(claveLocal);
			procesarCola();
		},
		[procesarCola, tieneId]
	);

	const reintentar = useCallback(
		(claveLocal) => {
			if (!textos.current.has(claveLocal)) return;
			actualizarLocal(claveLocal, { estado: 'enviando' });
			cola.current.push(claveLocal);
			procesarCola();
		},
		[actualizarLocal, procesarCola]
	);

	const mensajes = useMemo(
		() => fusionarMensajes(servidor ?? [], locales, miId),
		[servidor, locales, miId]
	);

	return { mensajes, cargando, error, enviar, reintentar, recargar };
}
