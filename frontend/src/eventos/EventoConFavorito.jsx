/**
 * @file Tarjeta de evento conectada a la sesión, a los favoritos y a la
 *   navegación: abre el detalle y maneja el corazón según el rol
 *   (specs/004-explorar-busqueda-favoritos/contracts/componentes.md › EventoConFavorito,
 *   research.md R8).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback } from 'react';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { EventCard } from '../components/EventCard';
import { useFavoritos } from '../favoritos/FavoritosContext';
import { hrefLogin } from '../navegacion/reglas';
import { modoFavorito } from './presentacion';

/**
 * Props de {@link EventoConFavorito}.
 * @typedef {Object} EventoConFavoritoProps
 * @property {object} evento Evento de la API.
 * @property {'feature'|'compact'} [variante] Variante de la tarjeta.
 */

/**
 * Ruta actual con su query, para volver tras iniciar sesión.
 * @param {string} ruta Pathname.
 * @param {Record<string, string|string[]>} params Parámetros de la URL.
 * @returns {string} Ruta interna con query.
 */
function rutaConQuery(ruta, params) {
	const query = Object.entries(params ?? {})
		.filter(([, v]) => v != null && v !== '')
		.map(
			([k, v]) =>
				`${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v[0] : v)}`
		)
		.join('&');
	return query ? `${ruta}?${query}` : ruta;
}

/**
 * `EventCard` con navegación al detalle y corazón de favoritos.
 * @param {EventoConFavoritoProps} props Ver {@link EventoConFavoritoProps}.
 * @returns {JSX.Element} Tarjeta conectada.
 */
export function EventoConFavorito({ evento, variante = 'compact' }) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useGlobalSearchParams();
	const { usuario } = useAuth();
	const { esFavorito, estaPendiente, alternar } = useFavoritos();
	const modo = modoFavorito(usuario);

	const abrir = useCallback(
		() => router.push(`/evento/${encodeURIComponent(evento.id)}`),
		[router, evento.id]
	);
	const alCorazon = useCallback(() => {
		if (modo === 'alternar') {
			alternar(evento);
		} else if (modo === 'pedirSesion') {
			router.push(hrefLogin(rutaConQuery(pathname, params)));
		}
	}, [modo, alternar, evento, router, pathname, params]);

	return (
		<EventCard
			evento={evento}
			variante={variante}
			alPresionar={abrir}
			favorito={{
				modo,
				activo: modo === 'alternar' && esFavorito(evento.id),
				ocupado: modo === 'alternar' && estaPendiente(evento.id),
				alPresionar: alCorazon
			}}
		/>
	);
}
