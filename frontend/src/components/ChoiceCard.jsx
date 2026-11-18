/**
 * @file Opción grande de selección única (ícono, título, descripción).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link ChoiceCard}.
 * @typedef {Object} ChoiceCardProps
 * @property {string} icon Nombre del ícono Lucide.
 * @property {string} title Título (primera persona, con verbo).
 * @property {string} [description] Descripción de una línea.
 * @property {boolean} [selected] Seleccionada.
 * @property {function(): void} [onPress] Handler de presión.
 */

/**
 * Card seleccionable; toda la card es el target con rol radio.
 * @param props Ver {@link ChoiceCardProps}.
 * @returns Elemento Pressable con rol radio.
 */
export function ChoiceCard({
	icon,
	title,
	description,
	selected,
	onPress
}) {
	const t = useTheme();
	const c = t.colors;
	return (
		<Pressable
			accessibilityRole="radio"
			accessibilityLabel={description ? `${title}. ${description}` : title}
			accessibilityState={{ checked: !!selected }}
			onPress={onPress}
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: t.spacing[3],
				padding: t.spacing[4],
				borderRadius: t.radius.lg,
				backgroundColor: selected ? c.primarySoft : c.surface,
				borderWidth: selected ? 2 : 1.5,
				borderColor: selected ? c.primaryText : c.borderStrong
			}}
		>
			<View
				style={{
					width: 44,
					height: 44,
					borderRadius: t.radius.md,
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: selected ? c.primary : c.surfaceRaised
				}}
			>
				<Icon name={icon} size={22} color={selected ? c.onPrimary : c.text} />
			</View>
			<View style={{ flex: 1, gap: 2 }}>
				<Text style={[t.typography.titleSm, { color: c.text }]}>{title}</Text>
				{description ? (
					<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
						{description}
					</Text>
				) : null}
			</View>
			<View
				style={{
					width: 22,
					height: 22,
					borderRadius: t.radius.full,
					borderWidth: selected ? 7 : 2,
					borderColor: selected ? c.primaryText : c.borderStrong
				}}
			/>
		</Pressable>
	);
}
