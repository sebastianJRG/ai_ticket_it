/**
 * @file Tarjeta de evento con la imagen como protagonista, en variantes
 *   `feature` (carrusel) y `compact` (listas); corazón como target separado
 *   (design-system/docs/componentes/EventCard.md;
 *   specs/004-explorar-busqueda-favoritos/contracts/componentes.md › EventCard).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { aTarjeta } from '../eventos/presentacion';
import { ArteCategoria } from './ArteCategoria';
import { Icon } from './Icon';
import { Rating } from './Rating';

/** Ancho de la variante `feature`, en px. */
export const ANCHO_FEATURE = 300;
/** Lado del thumbnail de la variante `compact`, en px. */
const LADO_COMPACT = 104;

/**
 * Estado y acción del corazón.
 * @typedef {Object} FavoritoTarjeta
 * @property {'alternar'|'pedirSesion'|'oculto'} modo Qué hace el corazón (data-model.md › ModoFavorito).
 * @property {boolean} activo Si el evento es favorito (corazón lleno).
 * @property {boolean} [ocupado] Hay una petición en curso para este evento.
 * @property {function(): void} alPresionar Toque en el corazón.
 */

/**
 * Props de {@link EventCard}.
 * @typedef {Object} EventCardProps
 * @property {object} evento Evento de la API (data-model.md › Evento).
 * @property {'feature'|'compact'} [variante] Variante visual (`compact` por defecto).
 * @property {function(): void} alPresionar Abre el detalle.
 * @property {FavoritoTarjeta} [favorito] Corazón; sin él (o `modo: 'oculto'`) no se muestra.
 * @property {Date} [ahora] Momento de referencia para "Finalizado" (pruebas).
 */

/**
 * Corazón de 44 × 44 sobre la imagen.
 * @param {{favorito: FavoritoTarjeta}} props Estado del corazón.
 * @returns {JSX.Element|null} Botón, o `null` en modo oculto.
 */
function Corazon({ favorito }) {
	const t = useTheme();
	if (!favorito || favorito.modo === 'oculto') return null;
	const activo = !!favorito.activo;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={
				activo ? 'Quitar de favoritos' : 'Agregar a favoritos'
			}
			accessibilityState={{ selected: activo, busy: !!favorito.ocupado }}
			onPress={favorito.alPresionar}
			style={({ pressed }) => ({
				position: 'absolute',
				top: t.spacing[1],
				right: t.spacing[1],
				width: t.sizes.touchMin,
				height: t.sizes.touchMin,
				borderRadius: t.radius.full,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: t.colors.scrimImage,
				opacity: pressed ? t.opacity.pressed : 1
			})}
		>
			<Icon
				name="Heart"
				size={t.sizes.iconMd}
				color={activo ? t.colors.secondary : t.colors.textOnImage}
				fill={activo ? t.colors.secondary : 'none'}
			/>
		</Pressable>
	);
}

/**
 * Imagen del evento, o arte por categoría si no hay o falla al cargar.
 * @param {{tarjeta: import('../eventos/presentacion').TarjetaEvento, categoria: object, estilo: object}} props Datos.
 * @returns {JSX.Element} Imagen o arte.
 */
function Portada({ tarjeta, categoria, estilo }) {
	const t = useTheme();
	const [fallo, setFallo] = useState(false);
	const atenuar = tarjeta.finalizado ? { opacity: t.opacity.mutedImage } : null;
	if (!tarjeta.imagen || fallo) {
		return <ArteCategoria categoria={categoria} estilo={[estilo, atenuar]} />;
	}
	return (
		<Image
			testID="imagen-evento"
			source={{ uri: tarjeta.imagen }}
			contentFit="cover"
			transition={t.motion.duration.base}
			onError={() => setFallo(true)}
			accessible={false}
			style={[estilo, atenuar]}
		/>
	);
}

/**
 * Tag "Finalizado".
 * @returns {JSX.Element} Etiqueta.
 */
function TagFinalizado() {
	const t = useTheme();
	return (
		<View
			style={{
				alignSelf: 'flex-start',
				paddingHorizontal: t.spacing[2],
				paddingVertical: 2,
				borderRadius: t.radius.xs,
				backgroundColor: t.colors.statusUsedBg
			}}
		>
			<Text style={[t.typography.caption, { color: t.colors.statusUsed }]}>
				Finalizado
			</Text>
		</View>
	);
}

/**
 * Tarjeta de evento tocable.
 * @param {EventCardProps} props Ver {@link EventCardProps}.
 * @returns {JSX.Element} Tarjeta.
 */
export function EventCard({
	evento,
	variante = 'compact',
	alPresionar,
	favorito,
	ahora
}) {
	const t = useTheme();
	const c = t.colors;
	const tarjeta = aTarjeta(evento, ahora ? { ahora } : undefined);
	const feature = variante === 'feature';

	const textos = (
		<View style={{ gap: t.spacing[1], flex: feature ? undefined : 1 }}>
			{tarjeta.finalizado ? <TagFinalizado /> : null}
			<Text
				numberOfLines={2}
				maxFontSizeMultiplier={1.4}
				style={[
					feature ? t.typography.titleMd : t.typography.titleSm,
					{ color: c.text }
				]}
			>
				{tarjeta.nombre}
			</Text>
			<Text
				numberOfLines={1}
				maxFontSizeMultiplier={1.4}
				style={[t.typography.bodySm, { color: c.textMuted }]}
			>
				{tarjeta.fechaCorta}
			</Text>
			{!feature ? (
				<Text
					numberOfLines={1}
					style={[t.typography.caption, { color: c.primaryText }]}
				>
					{tarjeta.categoria}
				</Text>
			) : null}
			<Text
				maxFontSizeMultiplier={1.4}
				style={[t.typography.price, { color: c.text }]}
			>
				{tarjeta.precioTexto}
			</Text>
			<Rating
				valor={tarjeta.puntaje}
				nombre={tarjeta.organizadorNombre || undefined}
			/>
		</View>
	);

	if (feature) {
		const alto = Math.round(ANCHO_FEATURE / t.sizes.eventImageRatio);
		return (
			<View style={{ width: ANCHO_FEATURE }}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={tarjeta.etiquetaAccesible}
					onPress={alPresionar}
					style={({ pressed }) => ({
						gap: t.spacing[3],
						opacity: pressed ? t.opacity.pressed : 1
					})}
				>
					<View style={{ borderRadius: t.radius.lg, overflow: 'hidden' }}>
						<Portada
							tarjeta={tarjeta}
							categoria={evento?.categoria}
							estilo={{ width: ANCHO_FEATURE, height: alto }}
						/>
						<LinearGradient
							colors={['transparent', c.scrimImage]}
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								bottom: 0,
								height: alto / 2
							}}
						/>
						<View
							style={{
								position: 'absolute',
								top: t.spacing[3],
								left: t.spacing[3],
								alignItems: 'center',
								paddingHorizontal: t.spacing[2],
								paddingVertical: t.spacing[1],
								borderRadius: t.radius.sm,
								backgroundColor: c.scrimImage
							}}
						>
							<Text style={[t.typography.titleLg, { color: c.textOnImage }]}>
								{tarjeta.dia}
							</Text>
							<Text style={[t.typography.overline, { color: c.primary }]}>
								{tarjeta.mes}
							</Text>
						</View>
						<Text
							numberOfLines={1}
							style={[
								t.typography.overline,
								{
									position: 'absolute',
									left: t.spacing[3],
									bottom: t.spacing[3],
									color: c.textOnImage
								}
							]}
						>
							{tarjeta.categoria}
						</Text>
					</View>
					{textos}
				</Pressable>
				<Corazon favorito={favorito} />
			</View>
		);
	}

	return (
		<View>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={tarjeta.etiquetaAccesible}
				onPress={alPresionar}
				style={({ pressed }) => ({
					flexDirection: 'row',
					gap: t.spacing[3],
					padding: t.spacing[3],
					borderRadius: t.radius.lg,
					backgroundColor: c.surface,
					opacity: pressed ? t.opacity.pressed : 1
				})}
			>
				<View style={{ borderRadius: t.radius.md, overflow: 'hidden' }}>
					<Portada
						tarjeta={tarjeta}
						categoria={evento?.categoria}
						estilo={{ width: LADO_COMPACT, height: LADO_COMPACT }}
					/>
				</View>
				{textos}
				<View style={{ width: t.sizes.touchMin }} />
			</Pressable>
			<Corazon favorito={favorito} />
		</View>
	);
}
