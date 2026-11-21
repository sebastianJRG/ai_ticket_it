/**
 * @file Línea de estado vertical de una compra: un nodo por paso con el ícono
 *   y los colores del estado; el actual con anillo y los pendientes atenuados.
 *   Sin fechas (el backend no expone el historial)
 *   (design-system/docs/componentes/StatusTimeline.md;
 *   specs/006-mis-compras-comprador/research.md R9).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link StatusTimeline}.
 * @typedef {Object} StatusTimelineProps
 * @property {import('../compras/misCompras').PasoLinea[]} pasos Pasos de `pasosLinea(estado)`.
 */

const SUFIJO = Object.freeze({
	hecho: 'completado',
	actual: 'estado actual',
	pendiente: 'pendiente'
});

/**
 * Línea de estado de una compra.
 * @param {StatusTimelineProps} props Ver {@link StatusTimelineProps}.
 * @returns {JSX.Element} Lista vertical de pasos.
 */
export function StatusTimeline({ pasos }) {
	const t = useTheme();
	const c = t.colors;
	return (
		<View style={{ gap: 0 }}>
			{pasos.map((p, i) => {
				const s = t.purchaseStatus[p.estado];
				if (!s) return null;
				const actual = p.situacion === 'actual';
				const pendiente = p.situacion === 'pendiente';
				const fg = pendiente ? c.textMuted : c[s.fg];
				const bg = pendiente ? c.surfaceRaised : c[s.bg];
				const ultimo = i === pasos.length - 1;
				return (
					<View
						key={p.estado}
						testID={`paso-${p.estado}`}
						accessible
						accessibilityLabel={`${s.short}, ${SUFIJO[p.situacion]}`}
						style={{
							flexDirection: 'row',
							gap: t.spacing[3],
							opacity: pendiente ? t.opacity.disabled : 1
						}}
					>
						<View style={{ alignItems: 'center', width: 36 }}>
							<View
								style={{
									width: 36,
									height: 36,
									borderRadius: t.radius.full,
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: bg,
									borderWidth: actual ? 2 : 0,
									borderColor: fg
								}}
							>
								<Icon
									name={s.icon}
									size={t.sizes.iconSm}
									color={fg}
									strokeWidth={2.4}
								/>
							</View>
							{ultimo ? null : (
								<View
									style={{
										width: 2,
										flex: 1,
										minHeight: t.spacing[4],
										backgroundColor: c.border
									}}
								/>
							)}
						</View>
						<View
							style={{ paddingTop: t.spacing[2], paddingBottom: t.spacing[4] }}
						>
							<Text
								style={[
									actual ? t.typography.bodyStrong : t.typography.body,
									{ color: actual ? c.text : c.textMuted }
								]}
							>
								{s.short}
							</Text>
							{actual ? (
								<Text style={[t.typography.caption, { color: c.textMuted }]}>
									Estado actual
								</Text>
							) : null}
						</View>
					</View>
				);
			})}
		</View>
	);
}
