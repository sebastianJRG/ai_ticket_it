/**
 * @file Búsqueda (pública, pestaña "Buscar"): texto con debounce de 300 ms,
 *   chips de categoría, filtros activos removibles, contador, orden (CU-11) y
 *   resultados del servidor; solo se muestra la respuesta del último filtro
 *   (specs/004-explorar-busqueda-favoritos/contracts/pantallas.md › /buscar; CU-03).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { AppHeader } from '../../components/AppHeader';
import { CategoryChips } from '../../components/CategoryChips';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { EsqueletosEventos } from '../../components/EventCardSkeleton';
import { SearchBar } from '../../components/SearchBar';
import { SortSelector } from '../../components/SortSelector';
import { EventoConFavorito } from '../../eventos/EventoConFavorito';
import { ORDEN_POR_DEFECTO, paramsOrden } from '../../eventos/orden';
import { mensajeError } from '../../eventos/presentacion';
import { useCategorias } from '../../hooks/useCategorias';
import { useDebounce } from '../../hooks/useDebounce';
import { useEventos } from '../../hooks/useEventos';

/**
 * Primer valor de un parámetro de URL.
 * @param {string|string[]|undefined} v Valor recibido.
 * @returns {string|undefined} Texto o `undefined`.
 */
const primero = (v) => (Array.isArray(v) ? v[0] : v);

/**
 * "1 evento" / "N eventos".
 * @param {number} n Cantidad.
 * @returns {string} Contador.
 */
const contador = (n) => `${n} ${n === 1 ? 'evento' : 'eventos'}`;

/**
 * Pantalla de búsqueda (data-model.md › FiltrosBusqueda).
 * @returns {JSX.Element} Pantalla.
 */
export default function Buscar() {
	const t = useTheme();
	const params = useLocalSearchParams();
	const { categorias } = useCategorias();
	const [texto, setTexto] = useState(primero(params.q) ?? '');
	const [consulta, setConsulta] = useState(primero(params.q) ?? '');
	const [categoriaId, setCategoriaId] = useState(
		primero(params.categoriaId) || null
	);
	const [orden, setOrden] = useState(ORDEN_POR_DEFECTO);
	const textoEstable = useDebounce(texto, 300);

	useEffect(() => {
		setConsulta(textoEstable);
	}, [textoEstable]);

	const { eventos, cargando, error, recargar } = useEventos({
		q: consulta,
		categoriaId: categoriaId ?? undefined,
		...paramsOrden(orden)
	});

	const quitarTexto = useCallback(() => {
		setTexto('');
		setConsulta('');
	}, []);
	const quitarFiltros = useCallback(() => {
		quitarTexto();
		setCategoriaId(null);
	}, [quitarTexto]);

	const textoActivo = consulta.trim();
	const categoria = categorias.find((c) => c.id === categoriaId);
	const hayFiltros = textoActivo !== '' || categoriaId != null;

	let vacio = null;
	if (cargando) {
		vacio = <EsqueletosEventos compact={4} />;
	} else if (error) {
		const m = mensajeError(error);
		vacio = (
			<EmptyState
				icono="search"
				titulo={m.titulo}
				cuerpo={m.cuerpo}
				accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
			/>
		);
	} else if ((eventos ?? []).length === 0) {
		vacio = (
			<EmptyState
				icono="search"
				titulo="No encontramos eventos"
				cuerpo="Probá con otras palabras o quitá filtros."
				accion={
					hayFiltros
						? { etiqueta: 'Quitar filtros', alPresionar: quitarFiltros }
						: undefined
				}
			/>
		);
	}

	const cabecera = (
		<View style={{ gap: t.spacing[3], paddingBottom: t.spacing[3] }}>
			{textoActivo || categoria ? (
				<View
					style={{
						flexDirection: 'row',
						flexWrap: 'wrap',
						gap: t.spacing[2],
						paddingHorizontal: t.spacing[4]
					}}
				>
					{textoActivo ? (
						<Chip
							variante="filter"
							removible
							etiqueta={textoActivo}
							alPresionar={quitarTexto}
						/>
					) : null}
					{categoria ? (
						<Chip
							variante="filter"
							removible
							etiqueta={categoria.nombre}
							alPresionar={() => setCategoriaId(null)}
						/>
					) : null}
				</View>
			) : null}
			{!vacio ? (
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						minHeight: t.sizes.touchMin,
						paddingHorizontal: t.spacing[4]
					}}
				>
					<Text style={[t.typography.label, { color: t.colors.textMuted }]}>
						{contador(eventos.length)}
					</Text>
					<SortSelector valor={orden} alCambiar={setOrden} />
				</View>
			) : null}
		</View>
	);

	return (
		<View style={{ flex: 1, backgroundColor: t.colors.bg }}>
			<AppHeader variante="large" titulo="Buscar" />
			<View style={{ gap: t.spacing[3], paddingBottom: t.spacing[3] }}>
				<View style={{ paddingHorizontal: t.spacing[4] }}>
					<SearchBar valor={texto} alCambiar={setTexto} autoFoco />
				</View>
				<CategoryChips
					categorias={categorias}
					seleccionada={categoriaId}
					alCambiar={setCategoriaId}
				/>
			</View>
			<FlatList
				data={vacio ? [] : eventos}
				keyExtractor={(e) => e.id}
				keyboardShouldPersistTaps="handled"
				ListHeaderComponent={cabecera}
				ListEmptyComponent={
					<View style={{ paddingHorizontal: t.spacing[4] }}>{vacio}</View>
				}
				ItemSeparatorComponent={() => <View style={{ height: t.spacing[3] }} />}
				contentContainerStyle={{ paddingBottom: t.spacing[8] }}
				renderItem={({ item }) => (
					<View style={{ paddingHorizontal: t.spacing[4] }}>
						<EventoConFavorito evento={item} variante="compact" />
					</View>
				)}
			/>
		</View>
	);
}
