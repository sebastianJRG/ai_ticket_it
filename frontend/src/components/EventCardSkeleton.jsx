/**
 * @file Silueta de carga de {@link EventCard} en sus dos variantes, compuesta
 *   con `Skeleton` (design-system/docs/componentes/Skeleton.md).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Skeleton } from './Skeleton';
import { ANCHO_FEATURE } from './EventCard';

/**
 * Props de {@link EventCardSkeleton}.
 * @typedef {Object} EventCardSkeletonProps
 * @property {'feature'|'compact'} [variante] Variante a imitar (`compact` por defecto).
 */

/**
 * Esqueleto decorativo; el label "Cargando eventos" va en el contenedor de la lista.
 * @param {EventCardSkeletonProps} props Ver {@link EventCardSkeletonProps}.
 * @returns {JSX.Element} Silueta.
 */
export function EventCardSkeleton({ variante = 'compact' }) {
	const t = useTheme();
	if (variante === 'feature') {
		return (
			<View
				testID="event-card-skeleton-feature"
				style={{ width: ANCHO_FEATURE, gap: t.spacing[3] }}
			>
				<Skeleton
					ancho={ANCHO_FEATURE}
					alto={Math.round(ANCHO_FEATURE / t.sizes.eventImageRatio)}
					radio="lg"
				/>
				<Skeleton ancho="80%" alto={20} />
				<Skeleton ancho="50%" alto={14} />
				<Skeleton ancho="40%" alto={18} />
			</View>
		);
	}
	return (
		<View
			testID="event-card-skeleton-compact"
			style={{
				flexDirection: 'row',
				gap: t.spacing[3],
				padding: t.spacing[3],
				borderRadius: t.radius.lg,
				backgroundColor: t.colors.surface
			}}
		>
			<Skeleton ancho={104} alto={104} radio="md" />
			<View style={{ flex: 1, gap: t.spacing[2], justifyContent: 'center' }}>
				<Skeleton ancho="85%" alto={18} />
				<Skeleton ancho="55%" alto={14} />
				<Skeleton ancho="40%" alto={16} />
			</View>
		</View>
	);
}

/**
 * Props de {@link EsqueletosEventos}.
 * @typedef {Object} EsqueletosEventosProps
 * @property {number} [feature] Cantidad de esqueletos `feature` en una fila horizontal (0 por defecto).
 * @property {number} [compact] Cantidad de esqueletos `compact` (3 por defecto).
 */

/**
 * Bloque de carga de una lista de eventos, anunciado como "Cargando eventos".
 * @param {EsqueletosEventosProps} props Ver {@link EsqueletosEventosProps}.
 * @returns {JSX.Element} Esqueletos agrupados.
 */
export function EsqueletosEventos({ feature = 0, compact = 3 }) {
	const t = useTheme();
	return (
		<View
			accessible
			accessibilityLabel="Cargando eventos"
			accessibilityState={{ busy: true }}
			style={{ gap: t.spacing[4] }}
		>
			{feature > 0 ? (
				<View
					style={{
						flexDirection: 'row',
						gap: t.spacing[3],
						overflow: 'hidden'
					}}
				>
					{Array.from({ length: feature }, (_, i) => (
						<EventCardSkeleton key={`f${i}`} variante="feature" />
					))}
				</View>
			) : null}
			{Array.from({ length: compact }, (_, i) => (
				<EventCardSkeleton key={`c${i}`} variante="compact" />
			))}
		</View>
	);
}
