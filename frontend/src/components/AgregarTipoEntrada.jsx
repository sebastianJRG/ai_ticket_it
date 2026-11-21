/**
 * @file Botón "Agregar tipo de entrada" con borde punteado, debajo del último
 *   TicketTypeForm (design-system/docs/componentes/TicketTypeForm.md;
 *   specs/007-organizador-eventos/research.md R6).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link AgregarTipoEntrada}.
 * @typedef {Object} AgregarTipoEntradaProps
 * @property {function(): void} alPresionar Agrega un tipo de entrada.
 * @property {boolean} [disabled] Deshabilitado.
 */

/**
 * Botón de ancho completo para sumar un tipo de entrada.
 * @param {AgregarTipoEntradaProps} props Ver {@link AgregarTipoEntradaProps}.
 * @returns {JSX.Element} Botón.
 */
export function AgregarTipoEntrada({ alPresionar, disabled }) {
	const t = useTheme();
	const c = t.colors;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Agregar tipo de entrada"
			accessibilityState={{ disabled: !!disabled }}
			disabled={disabled}
			onPress={disabled ? undefined : alPresionar}
			style={({ pressed }) => ({
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'center',
				gap: t.spacing[2],
				minHeight: t.sizes.buttonLg,
				borderRadius: t.radius.lg,
				borderWidth: 1.5,
				borderStyle: 'dashed',
				borderColor: c.borderStrong,
				opacity: disabled ? t.opacity.disabled : pressed ? t.opacity.pressed : 1
			})}
		>
			<Icon name="Plus" size={t.sizes.iconMd} color={c.primaryText} />
			<Text style={[t.typography.label, { color: c.primaryText }]}>
				Agregar tipo de entrada
			</Text>
		</Pressable>
	);
}
