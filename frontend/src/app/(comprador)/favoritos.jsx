/**
 * @file Favoritos del comprador (requiere sesión): lista en orden de agregado,
 *   con el corazón para quitar y estados de carga, error y vacío
 *   (specs/004-explorar-busqueda-favoritos/contracts/pantallas.md › /favoritos).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { EsqueletosEventos } from '../../components/EventCardSkeleton';
import { EventoConFavorito } from '../../eventos/EventoConFavorito';
import { mensajeError } from '../../eventos/presentacion';
import { useFavoritos } from '../../favoritos/FavoritosContext';

/**
 * Pantalla Favoritos.
 * @returns {JSX.Element} Pantalla.
 */
export default function Favoritos() {
	const t = useTheme();
	const router = useRouter();
	const { eventos, cargando, error, recargar } = useFavoritos();

	useFocusEffect(
		useCallback(() => {
			recargar();
		}, [recargar])
	);

	let vacio = null;
	if (eventos.length === 0) {
		if (cargando) {
			vacio = <EsqueletosEventos compact={3} />;
		} else if (error) {
			const m = mensajeError(error);
			vacio = (
				<EmptyState
					icono="heart"
					titulo={m.titulo}
					cuerpo={m.cuerpo}
					accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
				/>
			);
		} else {
			vacio = (
				<EmptyState
					icono="heart"
					titulo="Todavía no tenés favoritos"
					cuerpo="Tocá el corazón de un evento para guardarlo acá."
					accion={{
						etiqueta: 'Explorar eventos',
						alPresionar: () => router.navigate('/explorar')
					}}
				/>
			);
		}
	}

	return (
		<View style={{ flex: 1, backgroundColor: t.colors.bg }}>
			<AppHeader variante="large" titulo="Favoritos" />
			<FlatList
				data={eventos}
				keyExtractor={(e) => e.id}
				ListEmptyComponent={
					<View style={{ paddingHorizontal: t.spacing[4] }}>{vacio}</View>
				}
				ItemSeparatorComponent={() => <View style={{ height: t.spacing[3] }} />}
				contentContainerStyle={{
					paddingTop: t.spacing[2],
					paddingBottom: t.spacing[8]
				}}
				renderItem={({ item }) => (
					<View style={{ paddingHorizontal: t.spacing[4] }}>
						<EventoConFavorito evento={item} variante="compact" />
					</View>
				)}
			/>
		</View>
	);
}
