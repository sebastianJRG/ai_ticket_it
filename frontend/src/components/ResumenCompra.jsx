/**
 * @file Resumen "troquelado" de una compra: líneas (tipo × cantidad, precio
 *   unitario) y total `price-lg`. Sin cargo por servicio: el backend no cobra
 *   (specs/005-detalle-evento-compra/spec.md › Assumptions).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Línea del resumen.
 * @typedef {Object} LineaResumen
 * @property {string} etiqueta Texto de la izquierda.
 * @property {string} valor Texto de la derecha.
 */

/**
 * Props de {@link ResumenCompra}.
 * @typedef {Object} ResumenCompraProps
 * @property {LineaResumen[]} lineas Líneas del resumen.
 * @property {string} total Total formateado.
 * @property {string} [titulo] Título opcional.
 */

/**
 * Resumen de compra.
 * @param {ResumenCompraProps} props Ver {@link ResumenCompraProps}.
 * @returns {JSX.Element} Tarjeta de resumen.
 */
export function ResumenCompra({ lineas, total, titulo }) {
	const t = useTheme();
	const c = t.colors;
	const muesca = {
		position: 'absolute',
		width: t.radius.notch * 2,
		height: t.radius.notch * 2,
		borderRadius: t.radius.full,
		backgroundColor: c.bg,
		bottom: t.spacing[12] - t.radius.notch
	};
	return (
		<View
			style={{
				borderRadius: t.radius.lg,
				backgroundColor: c.surface,
				borderWidth: 1,
				borderColor: c.border,
				padding: t.spacing[4],
				gap: t.spacing[2],
				overflow: 'hidden'
			}}
		>
			{titulo ? (
				<Text style={[t.typography.titleSm, { color: c.text }]}>{titulo}</Text>
			) : null}
			{lineas.map((l) => (
				<View
					key={l.etiqueta}
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						gap: t.spacing[3]
					}}
				>
					<Text
						style={[t.typography.body, { color: c.textMuted, flexShrink: 1 }]}
					>
						{l.etiqueta}
					</Text>
					<Text style={[t.typography.bodyStrong, { color: c.text }]}>
						{l.valor}
					</Text>
				</View>
			))}
			<View
				style={{
					borderTopWidth: 1,
					borderStyle: 'dashed',
					borderTopColor: c.borderStrong,
					marginTop: t.spacing[2],
					paddingTop: t.spacing[3],
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'baseline'
				}}
			>
				<Text style={[t.typography.label, { color: c.text }]}>Total</Text>
				<Text style={[t.typography.priceLg, { color: c.text }]}>{total}</Text>
			</View>
			<View style={[muesca, { left: -t.radius.notch }]} />
			<View style={[muesca, { right: -t.radius.notch }]} />
		</View>
	);
}
