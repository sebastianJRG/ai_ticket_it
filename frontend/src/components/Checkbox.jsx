/**
 * @file Casilla de verificación con label (términos y preferencias).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link Checkbox}.
 * @typedef {Object} CheckboxProps
 * @property {boolean} [checked] Marcada.
 * @property {string} label Texto de la casilla.
 * @property {string} [error] Mensaje de error mostrado debajo.
 * @property {boolean} [disabled] Deshabilitada.
 * @property {function(boolean): void} [onChange] Handler con el nuevo valor.
 */

/**
 * Casilla con área táctil de 44 de alto en toda la fila.
 * @param props Ver {@link CheckboxProps}.
 * @returns Fila Pressable con rol checkbox y mensaje de error opcional.
 */
export function Checkbox({
	checked = false,
	label,
	error,
	disabled,
	onChange
}) {
	const t = useTheme();
	const c = t.colors;
	return (
		<View style={{ gap: t.spacing[1] }}>
			<Pressable
				accessibilityRole="checkbox"
				accessibilityLabel={label}
				accessibilityState={{ checked, disabled: !!disabled }}
				disabled={disabled}
				onPress={() => onChange?.(!checked)}
				style={{
					flexDirection: 'row',
					alignItems: 'flex-start',
					gap: t.spacing[3],
					minHeight: t.sizes.touchMin,
					paddingVertical: 10,
					opacity: disabled ? t.opacity.disabled : 1
				}}
			>
				<View
					style={{
						width: 24,
						height: 24,
						borderRadius: t.radius.xs,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: checked ? c.primary : 'transparent',
						borderWidth: checked ? 0 : 2,
						borderColor: error ? c.error : c.borderStrong
					}}
				>
					{checked ? (
						<Icon name="Check" size={16} strokeWidth={3} color={c.onPrimary} />
					) : null}
				</View>
				<Text style={[t.typography.body, { flex: 1, color: c.textMuted }]}>
					{label}
				</Text>
			</Pressable>
			{error ? (
				<View style={{ flexDirection: 'row', gap: t.spacing[1] }}>
					<Icon name="CircleAlert" size={16} color={c.error} />
					<Text style={[t.typography.bodySm, { color: c.error }]}>{error}</Text>
				</View>
			) : null}
		</View>
	);
}
