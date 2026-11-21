/**
 * @file Botón circular de 44x44 con solo ícono.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link IconButton}.
 * @typedef {Object} IconButtonProps
 * @property {string} icon Nombre del ícono Lucide.
 * @property {string} label Texto accesible (obligatorio).
 * @property {'plain' | 'filled' | 'onImage'} [variant] Estilo: plain (header), filled (flota sobre bg), onImage (sobre foto).
 * @property {string} [color] Color del ícono (por defecto según variante).
 * @property {boolean} [disabled] Deshabilitado.
 * @property {string} [fill] Relleno del ícono (p. ej. corazón activo); `none` por defecto.
 * @property {boolean} [seleccionado] Estado activo (se anuncia como seleccionado).
 * @property {function(): void} [onPress] Handler de presión.
 */

/**
 * Botón de ícono con área táctil mínima de 44x44.
 * @param {IconButtonProps} props Ver {@link IconButtonProps}.
 * @returns Elemento Pressable con rol button.
 */
export function IconButton({
	icon,
	label,
	variant = 'plain',
	color,
	disabled,
	fill = 'none',
	seleccionado = false,
	onPress
}) {
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
			accessibilityState={{ disabled: !!disabled, selected: !!seleccionado }}
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
			<Icon name={icon} size={t.sizes.iconLg} color={ink} fill={fill} />
		</Pressable>
	);
}
