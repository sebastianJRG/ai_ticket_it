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

/** Props de {@link StatusBadge}. */
export interface StatusBadgeProps {
	/** Estado de la compra (PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA). */
	status: string;
	/** Días hasta el evento; solo se muestra en CONFIRMADA. */
	daysLeft?: number | null;
	/** `sm` usa el texto corto (listas del organizador). */
	size?: 'sm' | 'md';
}

/**
 * Muestra el estado de una compra sin depender solo del color.
 * @param props Ver {@link StatusBadgeProps}.
 * @returns Badge, o null si el estado es desconocido.
 */
export function StatusBadge({
	status,
	daysLeft,
	size = 'md'
}: StatusBadgeProps) {
	const t = useTheme();
	const s = (
		t.purchaseStatus as Record<string, (typeof t.purchaseStatus)['PENDIENTE']>
	)[status];
	if (!s) return null;
	const fg = t.colors[s.fg as keyof typeof t.colors];
	const bg = t.colors[s.bg as keyof typeof t.colors];
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
