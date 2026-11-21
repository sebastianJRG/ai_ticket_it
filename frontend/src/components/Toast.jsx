/**
 * @file Aviso breve y no bloqueante con ícono por tono y acción opcional
 *   (design-system/docs/componentes/Toast.md). Presentacional: la cola y los
 *   tiempos los maneja `ToastProvider`.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { Button } from './Button';

/** Ícono Lucide por tono. */
const ICONO = {
	success: 'CircleCheck',
	error: 'CircleAlert',
	warning: 'TriangleAlert',
	info: 'Info'
};

/**
 * Aviso a mostrar (data-model.md › Aviso).
 * @typedef {Object} Aviso
 * @property {'success'|'error'|'info'|'warning'} tono Define ícono y color.
 * @property {string} titulo Una línea.
 * @property {string} [mensaje] Una línea, opcional.
 * @property {{etiqueta: string, alPresionar: function(): void}} [accion] Acción de una palabra.
 */

/**
 * Props de {@link Toast}: un {@link Aviso} más `alCerrar`.
 * @typedef {Aviso & {alCerrar?: function(): void}} ToastProps
 */

/**
 * Tarjeta del aviso. `error` se anuncia como alerta; el resto como región viva.
 * @param {ToastProps} props Ver {@link ToastProps}.
 * @returns {JSX.Element} Aviso.
 */
export function Toast({ tono = 'info', titulo, mensaje, accion, alCerrar }) {
	const t = useTheme();
	const c = t.colors;
	const color = c[tono] ?? c.info;
	const a11y =
		tono === 'error'
			? { accessibilityRole: 'alert' }
			: { accessibilityLiveRegion: 'polite' };
	return (
		<View
			testID="toast"
			{...a11y}
			style={[
				{
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[3],
					paddingVertical: t.spacing[3],
					paddingLeft: t.spacing[4],
					paddingRight: accion ? t.spacing[2] : t.spacing[4],
					borderRadius: t.radius.lg,
					backgroundColor: c.surfaceOverlay,
					borderLeftWidth: 4,
					borderLeftColor: color
				},
				t.shadows.shadowMd
			]}
		>
			<Icon
				name={ICONO[tono] ?? ICONO.info}
				size={t.sizes.iconMd}
				color={color}
			/>
			<View style={{ flex: 1 }}>
				<Text
					numberOfLines={1}
					style={[t.typography.bodyStrong, { color: c.text }]}
				>
					{titulo}
				</Text>
				{mensaje ? (
					<Text
						numberOfLines={1}
						style={[t.typography.bodySm, { color: c.textMuted }]}
					>
						{mensaje}
					</Text>
				) : null}
			</View>
			{accion ? (
				<Button
					variant="ghost"
					size="sm"
					onPress={() => {
						accion.alPresionar();
						alCerrar?.();
					}}
				>
					{accion.etiqueta}
				</Button>
			) : null}
		</View>
	);
}
