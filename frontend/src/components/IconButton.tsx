/**
 * @file Botón circular de 44x44 con solo ícono.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/** Props de {@link IconButton}. */
export interface IconButtonProps {
	/** Nombre del ícono Lucide. */
	icon: string;
	/** Texto accesible (obligatorio). */
	label: string;
	/** Estilo: plain (header), filled (flota sobre bg), onImage (sobre foto). */
	variant?: 'plain' | 'filled' | 'onImage';
	/** Color del ícono (por defecto según variante). */
	color?: string;
	/** Deshabilitado. */
	disabled?: boolean;
	/** Handler de presión. */
	onPress?: () => void;
}

/**
 * Botón de ícono con área táctil mínima de 44x44.
 * @param props Ver {@link IconButtonProps}.
 * @returns Elemento Pressable con rol button.
 */
export function IconButton({
	icon,
	label,
	variant = 'plain',
	color,
	disabled,
	onPress
}: IconButtonProps) {
	const t = useTheme();
	const bg = {
		plain: 'transparent',
		filled: t.colors.surfaceRaised,
		onImage: t.colors.scrimImage
	}[variant];
	const ink =
		color ?? (variant === 'onImage' ? t.colors.textOnImage : t.colors.text);
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: !!disabled }}
			disabled={disabled}
			onPress={disabled ? undefined : onPress}
			style={({ pressed }) => ({
				width: t.sizes.touchMin,
				height: t.sizes.touchMin,
				borderRadius: t.radius.full,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: bg,
				opacity: disabled ? t.opacity.disabled : pressed ? t.opacity.pressed : 1
			})}
		>
			<Icon name={icon} size={t.sizes.iconLg} color={ink} />
		</Pressable>
	);
}
