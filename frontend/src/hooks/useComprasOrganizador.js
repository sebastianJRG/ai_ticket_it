/**
 * @file Hook de la pestaña Mensajes del ORGANIZADOR: toma sus eventos
 *   (`useMisEventos`) y pide en paralelo las compras de cada uno
 *   (`Promise.allSettled`), agrupadas por evento. N + 1 peticiones,
 *   aceptable con pocos eventos (specs/007-organizador-eventos/data-model.md
 *   §5; research R12).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerComprasEvento } from '../services/eventoService';
import { agruparComprasPorEvento } from '../compras/gestionCompras';
import { useMisEventos } from './useMisEventos';

/**
 * Estado del hook.
 * @typedef {Object} EstadoComprasOrganizador
 * @property {import('../compras/gestionCompras').SeccionMensajes[]} secciones Secciones con compras.
 * @property {number} fallidos Eventos cuyas compras no se pudieron cargar.
 * @property {boolean} cargando Primera carga en curso.
 * @property {boolean} actualizando Recarga en curso con datos visibles.
 * @property {Error|null} error Error si falló el listado de eventos o fallaron todas las compras.
 * @property {function(): Promise<void>} recargar Vuelve a pedir eventos y compras.
 */

/**
 * Compras de todos los eventos propios. Nunca lanza.
 * @returns {EstadoComprasOrganizador} Estado y acción.
 */
export function useComprasOrganizador() {
	const misEventos = useMisEventos();
	const { eventos } = misEventos;
	const [estado, setEstado] = useState({
		secciones: [],
		fallidos: 0,
		error: null,
		pidiendo: false,
		listo: false
	});
	const [version, setVersion] = useState(0);
	const secuencia = useRef(0);
	const montado = useRef(true);
	const eventosRef = useRef(eventos);
	eventosRef.current = eventos;
	const clave = eventos ? eventos.map((e) => e.id).join('|') : null;

	useEffect(() => {
		montado.current = true;
		return () => {
			montado.current = false;
		};
	}, []);

	useEffect(() => {
		const lista = eventosRef.current;
		if (!lista) return;
		secuencia.current += 1;
		const numero = secuencia.current;
		const vigente = () => montado.current && numero === secuencia.current;
		if (lista.length === 0) {
			setEstado({
				secciones: [],
				fallidos: 0,
				error: null,
				pidiendo: false,
				listo: true
			});
			return;
		}
		setEstado((e) => ({ ...e, pidiendo: true }));
		Promise.allSettled(lista.map((e) => obtenerComprasEvento(e.id))).then(
			(resultados) => {
				if (!vigente()) return;
				const { secciones, fallidos } = agruparComprasPorEvento(
					lista,
					resultados
				);
				const todos = fallidos === lista.length;
				setEstado({
					secciones,
					fallidos,
					error: todos ? resultados[0].reason : null,
					pidiendo: false,
					listo: true
				});
			}
		);
	}, [clave, version]);

	const recargarEventos = misEventos.recargar;
	const recargar = useCallback(async () => {
		await recargarEventos();
		if (montado.current) setVersion((v) => v + 1);
	}, [recargarEventos]);

	const errorEventos = !eventos && misEventos.error ? misEventos.error : null;
	const cargando = !errorEventos && (!estado.listo || misEventos.cargando);
	return {
		secciones: estado.secciones,
		fallidos: estado.fallidos,
		cargando,
		actualizando: !cargando && (estado.pidiendo || misEventos.actualizando),
		error: errorEventos ?? estado.error,
		recargar
	};
}
