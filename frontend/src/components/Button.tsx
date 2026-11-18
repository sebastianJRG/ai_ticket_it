/**
 * @file Botón de acción (primary, secondary, ghost, destructive).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/** Props de {@link Button}. */
export interface ButtonProps {
	/** Variante visual. `destructive` solo dentro de un Modal de confirmación. */
	variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
	/** Tamaño: sm 36, md 44, lg 52. */
	size?: 'sm' | 'md' | 'lg';
	/** Deshabilitado: sin handler y atenuado. */
	disabled?: boolean;
	/** Cargando: spinner, ocupado para lectores y sin handler. */
	loading?: boolean;
	/** Handler de presión. */
	onPress?: () => void;
	/** Etiqueta de accesibilidad si difiere del texto. */
	accessibilityLabel?: string;
	/** Contenido (texto). */
	children: React.ReactNode;
}

/**
 * Botón con estados default/pressed/disabled/loading.
 * @param props Ver {@link ButtonProps}.
 * @returns Elemento Pressable con rol button.
 */
export function Button({
	variant = 'primary',
	size = 'md',
	disabled,
	loading,
	onPress,
	accessibilityLabel,
	children
}: ButtonProps) {
	const t = useTheme();
	const h = {
		sm: t.sizes.buttonSm,
		md: t.sizes.buttonMd,
		lg: t.sizes.buttonLg
	}[size];
	const c = t.colors;
	const fill = {
		primary: c.primary,
		destructive: c.error,
		secondary: 'transparent',
		ghost: 'transparent'
	}[variant];
	const pressedFill = {
		primary: c.primaryPressed,
		destructive: c.error,
		secondary: c.surfaceRaised,
		ghost: c.primarySoft
	}[variant];
	const ink = {
		primary: c.onPrimary,
		destructive: c.onError,
		secondary: c.text,
		ghost: c.primaryText
	}[variant];
	const inactive = disabled || loading;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled: !!disabled, busy: !!loading }}
			disabled={inactive}
			onPress={inactive ? undefined : onPress}
			hitSlop={size === 'sm' ? 4 : 0}
			style={({ pressed }) => ({
				height: h,
				paddingHorizontal: t.spacing[size === 'lg' ? 6 : 4],
				borderRadius: t.radius.md,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: pressed ? pressedFill : fill,
				borderWidth: variant === 'secondary' ? 1.5 : 0,
				borderColor: c.borderStrong,
				opacity: disabled ? t.opacity.disabled : 1,
				transform: [{ scale: pressed ? t.motion.pressedScale : 1 }]
			})}
		>
			{loading ? (
				<ActivityIndicator color={ink} />
			) : (
				<Text
					style={[
						size === 'sm' ? t.typography.labelSm : t.typography.label,
						{ color: ink }
					]}
				>
					{children}
				</Text>
			)}
		</Pressable>
	);
}
