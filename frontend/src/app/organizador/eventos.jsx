/**
 * @file Mis eventos del ORGANIZADOR (feature 007 US2): solo sus eventos,
 *   próximos primero y luego finalizados, filtrados en el dispositivo desde el
 *   listado público. Cada tarjeta abre las compras del evento. Recarga al
 *   enfocar y con el gesto (specs/007-organizador-eventos/contracts/pantallas.md
 *   › /organizador/eventos; research R2, R3).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { RefreshControl, SectionList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../feedback/ToastContext';
import { useMisEventos } from '../../hooks/useMisEventos';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { EventCard } from '../../components/EventCard';
import { EsqueletosEventos } from '../../components/EventCardSkeleton';
import { mensajeError } from '../../eventos/presentacion';
import { RUTAS, hrefComprasEvento } from '../../navegacion/reglas';

/**
 * Pantalla Mis eventos.
 * @returns {JSX.Element} Pantalla.
 */
export default function MisEventos() {
	const t = useTheme();
	const c = t.colors;
	const router = useRouter();
	const { mostrar } = useToast();
	const {
		eventos,
		proximos,
		finalizados,
		cargando,
		actualizando,
		error,
		recargar
	} = useMisEventos();
	const primerFoco = useRef(true);

	// El hook ya pide al montar: solo se recarga en los enfoques siguientes.
	useFocusEffect(
		useCallback(() => {
			if (primerFoco.current) {
				primerFoco.current = false;
				return;
			}
			recargar();
		}, [recargar])
	);

	useEffect(() => {
		if (error && eventos) {
			mostrar({
				tono: 'error',
				titulo: 'No pudimos actualizar tus eventos',
				mensaje: mensajeError(error).cuerpo
			});
		}
		// Solo se avisa cuando llega un error nuevo.
	}, [error]);

	const irACrear = () => router.navigate(RUTAS.organizador.crear);
	const secciones = [
		{ titulo: 'Próximos', data: proximos },
		{ titulo: 'Finalizados', data: finalizados }
	].filter((s) => s.data.length > 0);

	let vacio = null;
	if (cargando) {
		vacio = <EsqueletosEventos compact={3} />;
	} else if (!eventos && error) {
		const m = mensajeError(error);
		vacio = (
			<EmptyState
				titulo={m.titulo}
				cuerpo={m.cuerpo}
				accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
			/>
		);
	} else if (!eventos || eventos.length === 0) {
		vacio = (
			<EmptyState
				titulo="Todavía no creaste eventos"
				cuerpo="Creá tu primer evento para empezar a vender entradas."
				accion={{ etiqueta: 'Crear evento', alPresionar: irACrear }}
			/>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			<AppHeader
				variante="large"
				titulo="Mis eventos"
				acciones={[
					{ icono: 'Plus', label: 'Crear evento', alPresionar: irACrear }
				]}
			/>
			<SectionList
				testID="lista-mis-eventos"
				sections={secciones}
				keyExtractor={(e) => e.id}
				stickySectionHeadersEnabled={false}
				refreshControl={
					<RefreshControl
						refreshing={actualizando}
						onRefresh={recargar}
						tintColor={c.primary}
						colors={[c.primary]}
					/>
				}
				ListEmptyComponent={
					<View style={{ paddingHorizontal: t.spacing[4] }}>{vacio}</View>
				}
				renderSectionHeader={({ section }) => (
					<Text
						accessibilityRole="header"
						style={[
							t.typography.titleMd,
							{
								color: c.text,
								paddingHorizontal: t.spacing[4],
								paddingTop: t.spacing[4],
								paddingBottom: t.spacing[2]
							}
						]}
					>
						{section.titulo}
					</Text>
				)}
				ItemSeparatorComponent={() => <View style={{ height: t.spacing[3] }} />}
				contentContainerStyle={{ paddingBottom: t.spacing[8] }}
				renderItem={({ item }) => (
					<View style={{ paddingHorizontal: t.spacing[4] }}>
						<EventCard
							evento={item}
							variante="compact"
							alPresionar={() => router.push(hrefComprasEvento(item.id))}
						/>
					</View>
				)}
			/>
		</View>
	);
}
