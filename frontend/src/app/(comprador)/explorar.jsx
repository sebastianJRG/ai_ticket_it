/**
 * @file Explorar (pública): saludo, buscador disparador, chips de categoría,
 *   carrusel de destacados y lista "Muy pronto" con los próximos eventos
 *   (specs/004-explorar-busqueda-favoritos/contracts/pantallas.md › /explorar; CU-03).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { AppHeader } from '../../components/AppHeader';
import { CategoryChips } from '../../components/CategoryChips';
import { EmptyState } from '../../components/EmptyState';
import { EsqueletosEventos } from '../../components/EventCardSkeleton';
import { SearchBar } from '../../components/SearchBar';
import { EventoConFavorito } from '../../eventos/EventoConFavorito';
import { mensajeError, separarExplorar } from '../../eventos/presentacion';
import { useCategorias } from '../../hooks/useCategorias';
import { useEventos } from '../../hooks/useEventos';

/**
 * Título de sección.
 * @param {{children: string}} props Texto.
 * @returns {JSX.Element} Encabezado.
 */
function TituloSeccion({ children }) {
	const t = useTheme();
	return (
		<Text
			accessibilityRole="header"
			style={[
				t.typography.titleMd,
				{ color: t.colors.text, paddingHorizontal: t.spacing[4] }
			]}
		>
			{children}
		</Text>
	);
}

/**
 * Pantalla Explorar.
 * @returns {JSX.Element} Pantalla.
 */
export default function Explorar() {
	const t = useTheme();
	const router = useRouter();
	const { usuario } = useAuth();
	const { categorias } = useCategorias();
	const [categoriaId, setCategoriaId] = useState(null);
	const { eventos, cargando, error, recargar } = useEventos({
		categoriaId: categoriaId ?? undefined,
		sortBy: 'fecha',
		order: 'asc'
	});

	const irABuscar = useCallback(
		() =>
			router.push(
				categoriaId
					? { pathname: '/buscar', params: { categoriaId } }
					: '/buscar'
			),
		[router, categoriaId]
	);

	const saludo = usuario?.nombre
		? `Hola, ${usuario.nombre}`
		: 'Descubrí eventos';
	const { destacados, muyPronto } = separarExplorar(eventos ?? []);

	let contenido;
	if (cargando) {
		contenido = (
			<View style={{ paddingHorizontal: t.spacing[4] }}>
				<EsqueletosEventos feature={2} compact={3} />
			</View>
		);
	} else if (error) {
		const m = mensajeError(error);
		contenido = (
			<EmptyState
				icono="search"
				titulo={m.titulo}
				cuerpo={m.cuerpo}
				accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
			/>
		);
	} else if (muyPronto.length === 0) {
		contenido = (
			<EmptyState
				icono="search"
				titulo="No hay eventos próximos"
				cuerpo="Cuando se publiquen nuevos eventos van a aparecer acá."
				accion={
					categoriaId
						? {
								etiqueta: 'Ver todas las categorías',
								alPresionar: () => setCategoriaId(null)
							}
						: undefined
				}
			/>
		);
	} else {
		contenido = (
			<View style={{ gap: t.spacing[6] }}>
				<View style={{ gap: t.spacing[3] }}>
					<TituloSeccion>Destacados</TituloSeccion>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							paddingHorizontal: t.spacing[4],
							gap: t.spacing[3]
						}}
					>
						{destacados.map((e) => (
							<EventoConFavorito key={e.id} evento={e} variante="feature" />
						))}
					</ScrollView>
				</View>
				<View style={{ gap: t.spacing[3] }}>
					<TituloSeccion>Muy pronto</TituloSeccion>
					<View style={{ paddingHorizontal: t.spacing[4], gap: t.spacing[3] }}>
						{muyPronto.map((e) => (
							<EventoConFavorito key={e.id} evento={e} variante="compact" />
						))}
					</View>
				</View>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: t.colors.bg }}>
			<AppHeader variante="large" titulo={saludo} />
			<ScrollView
				contentContainerStyle={{
					paddingBottom: t.spacing[8],
					gap: t.spacing[4]
				}}
			>
				<View style={{ paddingHorizontal: t.spacing[4] }}>
					<SearchBar alPresionar={irABuscar} />
				</View>
				<CategoryChips
					categorias={categorias}
					seleccionada={categoriaId}
					alCambiar={setCategoriaId}
				/>
				{contenido}
			</ScrollView>
		</View>
	);
}
