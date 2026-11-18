/**
 * @file Enlace de texto (primary-text, subrayado) con rol link.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Enlace con área táctil mínima de 44 de alto.
 * @param {Object} props Propiedades.
 * @param {string} props.children Texto del enlace.
 * @param {function(): void} [props.onPress] Handler de presión.
 * @returns {JSX.Element} Pressable con rol link.
 */
export function TextLink({ children, onPress }) {
	const t = useTheme();
	return (
		<Pressable
			accessibilityRole="link"
			accessibilityLabel={children}
			onPress={onPress}
			style={{ minHeight: t.sizes.touchMin, justifyContent: 'center' }}
		>
			<Text
				style={[
					t.typography.bodyStrong,
					{ color: t.colors.primaryText, textDecorationLine: 'underline' }
				]}
			>
				{children}
			</Text>
		</Pressable>
	);
}
