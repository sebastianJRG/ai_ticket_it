/**
 * @file Estado compartido de favoritos del COMPRADOR: carga al iniciar sesión,
 *   alterna con actualización optimista y revierte con aviso si el servidor falla
 *   (specs/004-explorar-busqueda-favoritos/research.md R7, data-model.md §8).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../feedback/ToastContext';
import {
	agregarFavorito,
	listarFavoritos,
	quitarFavorito
} from '../services/usuarioService';

const FavoritosContext = createContext(null);

/**
 * API del contexto (data-model.md › EstadoFavoritos).
 * @typedef {Object} ApiFavoritos
 * @property {object[]} eventos Favoritos en orden de agregado.
 * @property {boolean} cargando Carga inicial o `recargar` en curso.
 * @property {Error|null} error Error de la última carga.
 * @property {function(string): boolean} esFavorito Si el evento está en favoritos.
 * @property {function(string): boolean} estaPendiente Si hay un PUT/DELETE en curso para el evento.
 * @property {function(object): Promise<void>} alternar Agrega o quita el evento (optimista).
 * @property {function(): Promise<void>} recargar Vuelve a pedir la lista.
 */

/**
 * Provee {@link useFavoritos}. Solo pide datos con sesión de COMPRADOR.
 * @param {Object} props Propiedades.
 * @param {import('react').ReactNode} props.children Árbol de la aplicación.
 * @returns {JSX.Element} Proveedor de favoritos.
 */
export function FavoritosProvider({ children }) {
	const { usuario } = useAuth();
	const { mostrar } = useToast();
	const esComprador = usuario?.rol === 'COMPRADOR';
	const claveSesion = esComprador ? (usuario.id ?? 'comprador') : null;

	const [eventos, setEventos] = useState([]);
	const [cargando, setCargando] = useState(esComprador);
	const [error, setError] = useState(null);
	const eventosRef = useRef(eventos);
	eventosRef.current = eventos;
	const pendientes = useRef(new Set());
	/** Versión de `pendientes`: cambia para que los consumidores vean `estaPendiente` al día. */
	const [version, refrescar] = useReducer((n) => n + 1, 0);
	/** Generación de sesión: las respuestas de una sesión anterior se ignoran. */
	const generacion = useRef(0);
	const mostrarRef = useRef(mostrar);
	mostrarRef.current = mostrar;

	const fijarEventos = useCallback((lista) => {
		eventosRef.current = lista;
		setEventos(lista);
	}, []);

	const recargar = useCallback(async () => {
		if (!claveSesion) return;
		const gen = generacion.current;
		setCargando(true);
		try {
			const lista = await listarFavoritos();
			if (gen !== generacion.current) return;
			fijarEventos(Array.isArray(lista) ? lista : []);
			setError(null);
		} catch (err) {
			if (gen !== generacion.current) return;
			setError(err);
		} finally {
			if (gen === generacion.current) setCargando(false);
		}
	}, [claveSesion, fijarEventos]);

	useEffect(() => {
		generacion.current += 1;
		pendientes.current = new Set();
		fijarEventos([]);
		setError(null);
		setCargando(!!claveSesion);
		recargar();
	}, [claveSesion, recargar, fijarEventos]);

	const alternar = useCallback(
		async (evento) => {
			const id = evento?.id;
			if (!claveSesion || id == null || pendientes.current.has(id)) return;
			const gen = generacion.current;
			const previos = eventosRef.current;
			const indice = previos.findIndex((e) => e.id === id);
			const eraFavorito = indice !== -1;

			fijarEventos(
				eraFavorito ? previos.filter((e) => e.id !== id) : [...previos, evento]
			);
			pendientes.current.add(id);
			refrescar();

			try {
				const lista = eraFavorito
					? await quitarFavorito(id)
					: await agregarFavorito(id);
				if (gen !== generacion.current) return;
				pendientes.current.delete(id);
				if (pendientes.current.size === 0 && Array.isArray(lista)) {
					fijarEventos(lista);
				}
			} catch {
				if (gen !== generacion.current) return;
				pendientes.current.delete(id);
				const actuales = eventosRef.current;
				if (eraFavorito) {
					if (!actuales.some((e) => e.id === id)) {
						const copia = [...actuales];
						copia.splice(Math.min(indice, copia.length), 0, previos[indice]);
						fijarEventos(copia);
					}
				} else {
					fijarEventos(actuales.filter((e) => e.id !== id));
				}
				mostrarRef.current({
					tono: 'error',
					titulo: 'No pudimos actualizar tus favoritos',
					mensaje: 'Intentá de nuevo en unos segundos.'
				});
			} finally {
				refrescar();
			}
		},
		[claveSesion, fijarEventos]
	);

	const ids = useMemo(() => new Set(eventos.map((e) => e.id)), [eventos]);
	const esFavorito = useCallback((id) => ids.has(id), [ids]);
	const estaPendiente = useCallback(
		(id) => version >= 0 && pendientes.current.has(id),
		[version]
	);

	const valor = useMemo(
		() => ({
			eventos,
			cargando,
			error,
			esFavorito,
			estaPendiente,
			alternar,
			recargar
		}),
		[eventos, cargando, error, esFavorito, estaPendiente, alternar, recargar]
	);

	return (
		<FavoritosContext.Provider value={valor}>
			{children}
		</FavoritosContext.Provider>
	);
}

/**
 * Devuelve el estado y las acciones de favoritos.
 * @returns {ApiFavoritos} API de favoritos.
 * @throws {Error} Si se usa fuera de {@link FavoritosProvider}.
 */
export function useFavoritos() {
	const ctx = useContext(FavoritosContext);
	if (!ctx) {
		throw new Error('useFavoritos debe usarse dentro de FavoritosProvider.');
	}
	return ctx;
}
