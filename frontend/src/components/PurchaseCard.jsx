/**
 * @file Tarjeta de compra del comprador con forma de ticket troquelado:
 *   evento y fecha arriba; talón con cantidad × tipo, total, estado y detalle
 *   según estado (design-system/docs/componentes/PurchaseCard.md;
 *   specs/006-mis-compras-comprador/research.md R4, R8). Sin thumbnail (el
 *   listado no trae imagen) ni "Pagar ahora" (sin pago).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatDate, formatDaysLeft, formatPrice } from '../theme/format';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';

/**
 * Props de {@link PurchaseCard}.
 * @typedef {Object} PurchaseCardProps
 * @property {object} compra Compra con el formato de `GET /api/compras`.
 * @property {boolean} [cancelable] Muestra la acción "Cancelar".
 * @property {function(): void} alPresionar Abre el detalle de la compra.
 * @property {function(): void} [alCancelar] Pide cancelar (no abre el detalle).
 */

const ATENUADAS = new Set(['CANCELADA', 'REEMBOLSADA']);

/**
 * Tarjeta de una compra.
 * @param {PurchaseCardProps} props Ver {@link PurchaseCardProps}.
 * @returns {JSX.Element} Tarjeta tocable.
 */
export function PurchaseCard({
	compra,
	cancelable = false,
	alPresionar,
	alCancelar
}) {
	const t = useTheme();
	const c = t.colors;
	const estado = t.purchaseStatus[compra.estado];
	const fecha = formatDate(compra.evento.fecha);
	const confirmada =
		compra.estado === 'CONFIRMADA' && compra.diasRestantes != null;
	const muesca = {
		position: 'absolute',
		top: -t.radius.notch,
		width: t.radius.notch * 2,
		height: t.radius.notch * 2,
		borderRadius: t.radius.full,
		backgroundColor: c.bg
	};

	return (
		<Pressable
			testID="purchase-card"
			accessibilityRole="button"
			accessibilityLabel={`${compra.evento.nombre}, ${fecha}, ${estado?.short ?? compra.estado}`}
			onPress={alPresionar}
			style={({ pressed }) => ({
				borderRadius: t.radius.lg,
				backgroundColor: c.surface,
				borderWidth: 1,
				borderColor: c.border,
				overflow: 'hidden',
				opacity: ATENUADAS.has(compra.estado)
					? t.opacity.mutedImage
					: pressed
						? t.opacity.pressed
						: 1
			})}
		>
			<View style={{ padding: t.spacing[4], gap: t.spacing[1] }}>
				<Text
					testID="purchase-card-evento"
					numberOfLines={2}
					style={[t.typography.titleSm, { color: c.text }]}
				>
					{compra.evento.nombre}
				</Text>
				<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
					{fecha}
				</Text>
			</View>
			<View>
				<View style={[muesca, { left: -t.radius.notch }]} />
				<View style={[muesca, { right: -t.radius.notch }]} />
				<View
					style={{
						marginHorizontal: t.spacing[4],
						borderTopWidth: 1,
						borderStyle: 'dashed',
						borderColor: c.border
					}}
				/>
			</View>
			<View style={{ padding: t.spacing[4], gap: t.spacing[3] }}>
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: t.spacing[3]
					}}
				>
					<Text style={[t.typography.body, { color: c.text, flexShrink: 1 }]}>
						{`${compra.cantidad} × ${compra.tipoEntrada.nombre}`}
					</Text>
					<Text style={[t.typography.price, { color: c.text }]}>
						{formatPrice(compra.total)}
					</Text>
				</View>
				<StatusBadge
					status={compra.estado}
					daysLeft={compra.diasRestantes}
					size="sm"
				/>
				{confirmada ? (
					<Text style={[t.typography.titleMd, { color: c.primaryText }]}>
						{formatDaysLeft(compra.diasRestantes)}
					</Text>
				) : null}
				{compra.estado === 'PENDIENTE' ? (
					<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
						Esperando la confirmación del organizador
					</Text>
				) : null}
				{cancelable ? (
					<View style={{ alignSelf: 'flex-start' }}>
						<Button variant="secondary" size="sm" onPress={alCancelar}>
							Cancelar
						</Button>
					</View>
				) : null}
			</View>
		</Pressable>
	);
}
