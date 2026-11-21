/**
 * @file Mensajes del ORGANIZADOR (feature 007 US5, CU-06): las compras de sus
 *   eventos agrupadas por evento, como acceso al chat de cada compra (lo
 *   completa la feature 008). Sin bandeja ni no leídos en el backend: se arma
 *   con las compras de cada evento propio
 *   (specs/007-organizador-eventos/contracts/pantallas.md › /organizador/mensajes;
 *   research R12).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback, useRef } from 'react';
import { RefreshControl, SectionList, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate } from '../../theme/format';
import { useComprasOrganizador } from '../../hooks/useComprasOrganizador';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { OrganizerPurchaseRow } from '../../components/OrganizerPurchaseRow';
import { Skeleton } from '../../components/Skeleton';
import { mensajeError } from '../../eventos/presentacion';
import { hrefCompra } from '../../navegacion/reglas';

/**
 * Pantalla Mensajes.
 * @returns {JSX.Element} Pantalla.
 */
export default function Mensajes() {
	const t = useTheme();
	const c = t.colors;
	const router = useRouter();
	const { secciones, fallidos, cargando, actualizando, error, recargar } =
		useComprasOrganizador();
	const primerFoco = useRef(true);

	useFocusEffect(
		useCallback(() => {
			if (primerFoco.current) {
				primerFoco.current = false;
				return;
			}
			recargar();
		}, [recargar])
	);

	let vacio = null;
	if (cargando) {
		vacio = (
			<View
				accessible
				accessibilityLabel="Cargando compras"
				accessibilityState={{ busy: true }}
				style={{ gap: t.spacing[3] }}
			>
				{[0, 1, 2].map((i) => (
					<Skeleton key={i} alto={72} radio="md" />
				))}
			</View>
		);
	} else if (error) {
		const m = mensajeError(error);
		vacio = (
			<EmptyState
				titulo={m.titulo}
				cuerpo={m.cuerpo}
				accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
			/>
		);
	} else if (fallidos === 0) {
		vacio = (
			<EmptyState
				icono="message"
				titulo="Todavía no hay compras para conversar"
				cuerpo="Cuando alguien compre entradas de tus eventos, vas a poder escribirle desde acá."
			/>
		);
	}

	const aviso =
		!cargando && !error && fallidos > 0 ? (
			<View
				accessibilityRole="alert"
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[3],
					margin: t.spacing[4],
					marginBottom: 0,
					padding: t.spacing[3],
					borderRadius: t.radius.md,
					backgroundColor: c.warningSoft
				}}
			>
				<Icon name="TriangleAlert" size={t.sizes.iconMd} color={c.warning} />
				<Text style={[t.typography.bodySm, { flex: 1, color: c.text }]}>
					{`No pudimos cargar las compras de ${fallidos} ${fallidos === 1 ? 'evento' : 'eventos'}`}
				</Text>
				<Button variant="secondary" size="sm" onPress={recargar}>
					Reintentar
				</Button>
			</View>
		) : null;

	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			<AppHeader variante="large" titulo="Mensajes" />
			<SectionList
				testID="lista-mensajes"
				sections={
					cargando || error
						? []
						: secciones.map((s) => ({ ...s, data: s.compras }))
				}
				keyExtractor={(compra) => compra.id}
				stickySectionHeadersEnabled={false}
				refreshControl={
					<RefreshControl
						refreshing={actualizando}
						onRefresh={recargar}
						tintColor={c.primary}
						colors={[c.primary]}
					/>
				}
				ListHeaderComponent={aviso}
				ListEmptyComponent={
					vacio ? (
						<View style={{ paddingHorizontal: t.spacing[4] }}>{vacio}</View>
					) : null
				}
				renderSectionHeader={({ section }) => (
					<View
						style={{
							paddingHorizontal: t.spacing[4],
							paddingTop: t.spacing[5],
							paddingBottom: t.spacing[1]
						}}
					>
						<Text
							accessibilityRole="header"
							style={[t.typography.titleSm, { color: c.text }]}
						>
							{section.evento.nombre}
						</Text>
						<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
							{formatDate(section.evento.fecha, 'short')}
						</Text>
					</View>
				)}
				contentContainerStyle={{ paddingBottom: t.spacing[8] }}
				renderItem={({ item, section }) => (
					<View style={{ paddingHorizontal: t.spacing[4] }}>
						<OrganizerPurchaseRow
							compra={item}
							alPresionar={() =>
								router.push(
									hrefCompra(item.id, { eventoId: section.evento.id })
								)
							}
						/>
					</View>
				)}
			/>
		</View>
	);
}
