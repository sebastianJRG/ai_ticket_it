/**
 * @file Badge de estado de compra: color + ícono + texto.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatDaysLeft } from '../theme/format';
import { Icon } from './Icon';

/**
 * Props de {@link StatusBadge}.
 * @typedef {Object} StatusBadgeProps
 * @property {string} status Estado de la compra (PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA).
 * @property {number | null} [daysLeft] Días hasta el evento; solo se muestra en CONFIRMADA.
 * @property {'sm' | 'md'} [size] `sm` usa el texto corto (listas del organizador).
 */

/**
 * Muestra el estado de una compra sin depender solo del color.
 * @param props Ver {@link StatusBadgeProps}.
 * @returns Badge, o null si el estado es desconocido.
 */
export function StatusBadge({ status, daysLeft, size = 'md' }) {
	const t = useTheme();
	const s = t.purchaseStatus[status];
	if (!s) return null;
	const fg = t.colors[s.fg];
	const bg = t.colors[s.bg];
	const name = size === 'sm' ? s.short : s.label;
	const withDays = status === 'CONFIRMADA' && daysLeft != null;
	const days = withDays ? formatDaysLeft(daysLeft).toLowerCase() : '';
	return (
		<View
			accessible
			accessibilityRole="text"
			accessibilityLabel={withDays ? `${name}, ${days}` : name}
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: 5,
				height: 28,
				paddingHorizontal: 10,
				borderRadius: t.radius.sm,
				backgroundColor: bg,
				alignSelf: 'flex-start'
			}}
		>
			<Icon name={s.icon} size={16} color={fg} strokeWidth={2.4} />
			<Text style={[t.typography.labelSm, { color: fg }]}>
				{withDays ? `${name} · ${days}` : name}
			</Text>
		</View>
	);
}
