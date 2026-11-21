/**
 * @file Resumen de disponibilidad por tipo de entrada con barras vendidas/cupo
 *   (design-system/docs/componentes/AvailabilitySummary.md;
 *   specs/007-organizador-eventos/research.md R10). Presentacional: recibe el
 *   resumen ya calculado con los números del servidor.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatPrice } from '../theme/format';

/**
 * Props de {@link AvailabilitySummary}.
 * @typedef {Object} AvailabilitySummaryProps
 * @property {import('../compras/gestionCompras').ResumenDisponibilidad} resumen Resumen de `resumenDisponibilidad`.
 */

/**
 * Tarjeta con totales y una barra por tipo de entrada.
 * @param {AvailabilitySummaryProps} props Ver {@link AvailabilitySummaryProps}.
 * @returns {JSX.Element} Resumen.
 */
export function AvailabilitySummary({ resumen }) {
	const t = useTheme();
	const c = t.colors;
	const colorBarra = {
		normal: c.primary,
		casi: c.secondary,
		agotado: c.statusUsed
	};
	const colorTexto = {
		normal: c.textMuted,
		casi: c.secondaryText,
		agotado: c.statusUsed
	};
	return (
		<View
			testID="availability-summary"
			style={{
				gap: t.spacing[4],
				padding: t.spacing[4],
				borderRadius: t.radius.lg,
				backgroundColor: c.surface,
				borderWidth: 1,
				borderColor: c.border
			}}
		>
			<Text style={[t.typography.titleSm, { color: c.text }]}>
				{`Vendidas ${resumen.totalVendidas} de ${resumen.totalCupo} (${resumen.porcentaje}%)`}
			</Text>
			{resumen.tipos.map((tipo) => (
				<View key={tipo.tipoEntradaId} style={{ gap: t.spacing[2] }}>
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							gap: t.spacing[2]
						}}
					>
						<View style={{ flex: 1 }}>
							<Text style={[t.typography.label, { color: c.text }]}>
								{tipo.nombre}
							</Text>
							<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
								{formatPrice(tipo.precio)}
							</Text>
						</View>
						<Text style={[t.typography.bodyStrong, { color: c.text }]}>
							{`${tipo.vendidas} / ${tipo.cupo}`}
						</Text>
					</View>
					<View
						accessible
						accessibilityRole="progressbar"
						accessibilityLabel={`${tipo.nombre}: ${tipo.vendidas} de ${tipo.cupo} vendidas, ${
							tipo.nivel === 'agotado'
								? 'agotado'
								: `quedan ${tipo.disponibles}`
						}`}
						accessibilityValue={{ min: 0, max: tipo.cupo, now: tipo.vendidas }}
						style={{
							height: 8,
							borderRadius: t.radius.full,
							backgroundColor: c.surfaceRaised,
							overflow: 'hidden'
						}}
					>
						<View
							style={{
								width: `${tipo.porcentaje}%`,
								height: '100%',
								borderRadius: t.radius.full,
								backgroundColor: colorBarra[tipo.nivel]
							}}
						/>
					</View>
					<Text
						style={[t.typography.caption, { color: colorTexto[tipo.nivel] }]}
					>
						{tipo.textoRestantes}
					</Text>
				</View>
			))}
		</View>
	);
}
