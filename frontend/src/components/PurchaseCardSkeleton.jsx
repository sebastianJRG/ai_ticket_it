/**
 * @file Esqueleto de carga con la forma de `PurchaseCard`
 *   (specs/006-mis-compras-comprador/research.md R12).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Skeleton } from './Skeleton';

/**
 * Props de {@link PurchaseCardSkeleton}.
 * @typedef {Object} PurchaseCardSkeletonProps
 * @property {string} [testID] Identificador de pruebas (`purchase-card-skeleton` por defecto).
 */

/**
 * Esqueleto de una tarjeta de compra.
 * @param {PurchaseCardSkeletonProps} props Ver {@link PurchaseCardSkeletonProps}.
 * @returns {JSX.Element} Esqueleto.
 */
export function PurchaseCardSkeleton({ testID = 'purchase-card-skeleton' }) {
	const t = useTheme();
	return (
		<View
			testID={testID}
			style={{
				borderRadius: t.radius.lg,
				backgroundColor: t.colors.surface,
				borderWidth: 1,
				borderColor: t.colors.border,
				padding: t.spacing[4],
				gap: t.spacing[3]
			}}
		>
			<Skeleton ancho="70%" alto={20} testID="skeleton-titulo" />
			<Skeleton ancho="45%" alto={14} testID="skeleton-fecha" />
			<View style={{ height: t.spacing[2] }} />
			<Skeleton ancho="55%" alto={16} testID="skeleton-tipo" />
			<Skeleton ancho={110} alto={28} testID="skeleton-estado" />
		</View>
	);
}
