/**
 * @file Detalle de un evento (público; feature 005 US1–US2): hero, datos,
 *   organizador con puntaje, tipos de entrada informativos, reseñas del
 *   organizador y barra de compra según rol y fecha
 *   (specs/005-detalle-evento-compra/contracts/pantallas.md › /evento/[idEvento]).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useCanGoBack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../auth/AuthContext';
import { useFavoritos } from '../../../favoritos/FavoritosContext';
import { useEvento } from '../../../hooks/useEvento';
import { AppHeader } from '../../../components/AppHeader';
import { ArteCategoria } from '../../../components/ArteCategoria';
import { BarraAccion } from '../../../components/BarraAccion';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Rating } from '../../../components/Rating';
import { Skeleton } from '../../../components/Skeleton';
import { TicketTypeRow } from '../../../components/TicketTypeRow';
import { aDetalle, modoCta, textoCta } from '../../../eventos/detalle';
import { mensajeError, modoFavorito } from '../../../eventos/presentacion';
import {
	hrefCheckout,
	hrefEvento,
	hrefLogin,
	rutaInicial
} from '../../../navegacion/reglas';
import { SeccionResenias } from '../../../resenias/SeccionResenias';

/**
 * Esqueleto del detalle mientras carga.
 * @returns {JSX.Element} Formas de carga.
 */
function EsqueletoDetalle() {
	const t = useTheme();
	return (
		<View
			accessible
			accessibilityLabel="Cargando evento"
			style={{ gap: t.spacing[3] }}
		>
			<Skeleton alto={290} radio="sm" estilo={{ borderRadius: 0 }} />
			<View style={{ paddingHorizontal: t.spacing[4], gap: t.spacing[3] }}>
				<Skeleton ancho="40%" alto={20} />
				<Skeleton ancho="85%" alto={36} />
				<Skeleton ancho="60%" />
				<Skeleton alto={72} radio="lg" />
				<Skeleton alto={72} radio="lg" />
			</View>
		</View>
	);
}

/**
 * Título de sección.
 * @param {{children: string}} props Texto del título.
 * @returns {JSX.Element} Encabezado de sección.
 */
function TituloSeccion({ children }) {
	const t = useTheme();
	return (
		<Text
			accessibilityRole="header"
			style={[t.typography.titleMd, { color: t.colors.text }]}
		>
			{children}
		</Text>
	);
}

/**
 * Pantalla de detalle; lee `idEvento` de la ruta.
 * @returns {JSX.Element} Pantalla.
 */
export default function DetalleEvento() {
	const t = useTheme();
	const c = t.colors;
	const router = useRouter();
	const puedeVolver = useCanGoBack();
	const { idEvento } = useLocalSearchParams();
	const id = Array.isArray(idEvento) ? idEvento[0] : idEvento;
	const { usuario } = useAuth();
	const { esFavorito, estaPendiente, alternar } = useFavoritos();
	const { evento, cargando, error, noEncontrado, recargar } = useEvento(id);

	const volver = puedeVolver ? router.back : undefined;
	const irAlInicio = useCallback(
		() => router.replace(rutaInicial(usuario)),
		[router, usuario]
	);

	if (!evento) {
		let contenido = <EsqueletoDetalle />;
		if (!cargando && noEncontrado) {
			contenido = (
				<EmptyState
					icono="search"
					titulo="Evento no encontrado"
					cuerpo="Puede que lo hayan quitado o que el enlace esté mal."
					accion={{
						etiqueta:
							usuario?.rol === 'ORGANIZADOR'
								? 'Volver a Mis eventos'
								: 'Volver a Explorar',
						alPresionar: irAlInicio
					}}
				/>
			);
		} else if (!cargando && error) {
			const m = mensajeError(error);
			contenido = (
				<EmptyState
					icono="ticket"
					titulo={m.titulo}
					cuerpo={m.cuerpo}
					accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
				/>
			);
		}
		const esqueleto = contenido.type === EsqueletoDetalle;
		return (
			<View style={{ flex: 1, backgroundColor: c.bg }}>
				<AppHeader titulo="Evento" alVolver={volver} />
				<View
					style={{
						flex: 1,
						paddingHorizontal: esqueleto ? 0 : t.spacing[4],
						justifyContent: esqueleto ? 'flex-start' : 'center'
					}}
				>
					{contenido}
				</View>
			</View>
		);
	}

	const d = aDetalle(evento);
	const modo = modoCta(evento, usuario);
	const corazon = modoFavorito(usuario);
	const acciones = [];
	if (corazon !== 'oculto') {
		const activo = corazon === 'alternar' && esFavorito(evento.id);
		acciones.push({
			icono: 'Heart',
			label: activo ? 'Quitar de favoritos' : 'Agregar a favoritos',
			activo,
			ocupado: corazon === 'alternar' && estaPendiente(evento.id),
			alPresionar: () => {
				if (corazon === 'alternar') {
					if (!estaPendiente(evento.id)) alternar(evento);
				} else {
					router.push(hrefLogin(hrefEvento(evento.id)));
				}
			}
		});
	}

	const comprar = () =>
		router.push(
			modo === 'comprar'
				? hrefCheckout(evento.id)
				: hrefLogin(hrefCheckout(evento.id))
		);
	const puedeComprar = modo === 'comprar' || modo === 'pedirSesion';

	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			<ScrollView contentContainerStyle={{ paddingBottom: t.spacing[8] }}>
				<View style={{ aspectRatio: 4 / 3, backgroundColor: c.surface }}>
					{d.imagen ? (
						<Image
							testID="hero-imagen"
							source={{ uri: d.imagen }}
							contentFit="cover"
							accessibilityLabel={`Imagen de ${d.nombre}`}
							style={{ width: '100%', height: '100%' }}
						/>
					) : (
						<ArteCategoria
							categoria={evento.categoria}
							tamanoIcono={72}
							estilo={{ width: '100%', height: '100%' }}
						/>
					)}
				</View>
				<View
					style={{
						marginTop: -t.radius.xl,
						borderTopLeftRadius: t.radius.xl,
						borderTopRightRadius: t.radius.xl,
						backgroundColor: c.bg,
						paddingHorizontal: t.spacing[4],
						paddingTop: t.spacing[6],
						gap: t.spacing[6]
					}}
				>
					<View style={{ gap: t.spacing[2] }}>
						<View
							style={{
								flexDirection: 'row',
								gap: t.spacing[2],
								flexWrap: 'wrap'
							}}
						>
							{d.categoria ? <Etiqueta texto={d.categoria} /> : null}
							{d.finalizado ? (
								<Etiqueta texto="Finalizado" tono="muted" />
							) : null}
						</View>
						<Text
							accessibilityRole="header"
							maxFontSizeMultiplier={1.3}
							style={[t.typography.displayXl, { color: c.text }]}
						>
							{d.nombre}
						</Text>
						{d.fechaLarga ? (
							<Text style={[t.typography.bodyStrong, { color: c.textMuted }]}>
								{d.fechaLarga}
							</Text>
						) : null}
					</View>

					{d.descripcion ? (
						<Text style={[t.typography.bodyLg, { color: c.text }]}>
							{d.descripcion}
						</Text>
					) : null}

					<View style={{ gap: t.spacing[2] }}>
						<TituloSeccion>Organiza</TituloSeccion>
						<Rating valor={d.puntaje} nombre={d.organizadorNombre} />
					</View>

					<View style={{ gap: t.spacing[3] }}>
						<TituloSeccion>Entradas</TituloSeccion>
						{d.tipos.length ? (
							d.tipos.map((tipo) => (
								<TicketTypeRow
									key={tipo.id}
									nombre={tipo.nombre}
									descripcion={tipo.descripcion}
									cupoTexto={tipo.textoCupo}
									quedanPocas={
										!tipo.agotado &&
										(tipo.disponibles <= 5 ||
											tipo.disponibles <= tipo.cupo * 0.1)
									}
									precioTexto={tipo.precioTexto}
									agotado={tipo.agotado}
									interactive={false}
								/>
							))
						) : (
							<Text style={[t.typography.body, { color: c.textMuted }]}>
								Este evento no tiene entradas a la venta.
							</Text>
						)}
					</View>

					<SeccionResenias
						idOrganizador={d.organizadorId}
						puntaje={d.puntaje}
					/>
				</View>
			</ScrollView>

			<View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
				<AppHeader
					titulo={d.nombre}
					variante="transparent"
					alVolver={volver}
					acciones={acciones}
				/>
			</View>

			{modo === 'oculto' ? null : (
				<BarraAccion>
					<Button
						size="lg"
						disabled={!puedeComprar}
						onPress={puedeComprar ? comprar : undefined}
					>
						{textoCta(modo, d.precioDesdeTexto)}
					</Button>
				</BarraAccion>
			)}
		</View>
	);
}

/**
 * Etiqueta chica (categoría o "Finalizado").
 * @param {{texto: string, tono?: 'primary'|'muted'}} props Texto y tono.
 * @returns {JSX.Element} Etiqueta.
 */
function Etiqueta({ texto, tono = 'primary' }) {
	const t = useTheme();
	const c = t.colors;
	return (
		<View
			style={{
				paddingHorizontal: t.spacing[2],
				paddingVertical: 2,
				borderRadius: t.radius.xs,
				backgroundColor: tono === 'primary' ? c.primarySoft : c.surfaceRaised
			}}
		>
			<Text
				style={[
					t.typography.labelSm,
					{ color: tono === 'primary' ? c.primaryText : c.textMuted }
				]}
			>
				{texto}
			</Text>
		</View>
	);
}
