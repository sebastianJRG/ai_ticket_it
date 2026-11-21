/**
 * @file Barra de búsqueda tipo pill: editable (Búsqueda) o disparador (Explorar)
 *   (design-system/docs/componentes/SearchBar.md; sin botón de filtros, research R4).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/** Placeholder que enseña qué se puede buscar. */
const PLACEHOLDER = 'Buscá artistas, obras, eventos…';

/**
 * Props de {@link SearchBar}.
 * @typedef {Object} SearchBarProps
 * @property {string} [valor] Texto (controlado).
 * @property {function(string): void} [alCambiar] Cambio de texto.
 * @property {function(): void} [alPresionar] Si se pasa, la barra es un disparador no editable.
 * @property {boolean} [autoFoco] Abre el teclado al montar.
 * @property {string} [placeholder] Texto de ayuda.
 */

/**
 * Barra de búsqueda.
 * @param {SearchBarProps} props Ver {@link SearchBarProps}.
 * @returns {JSX.Element} Barra.
 */
export function SearchBar({
	valor = '',
	alCambiar,
	alPresionar,
	autoFoco = false,
	placeholder = PLACEHOLDER
}) {
	const t = useTheme();
	const c = t.colors;
	const pill = {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		gap: t.spacing[2],
		paddingLeft: t.spacing[4],
		paddingRight: t.spacing[1],
		borderRadius: t.radius.full,
		backgroundColor: c.surfaceRaised,
		borderWidth: 1,
		borderColor: c.border
	};

	if (alPresionar) {
		return (
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Buscar eventos"
				onPress={alPresionar}
				style={({ pressed }) => [
					pill,
					{ opacity: pressed ? t.opacity.pressed : 1 }
				]}
			>
				<Icon name="Search" size={t.sizes.iconMd} color={c.textMuted} />
				<Text
					numberOfLines={1}
					style={[t.typography.body, { color: c.textSubtle, flex: 1 }]}
				>
					{placeholder}
				</Text>
			</Pressable>
		);
	}

	return (
		<View style={pill}>
			<Icon name="Search" size={t.sizes.iconMd} color={c.textMuted} />
			<TextInput
				value={valor}
				onChangeText={alCambiar}
				placeholder={placeholder}
				placeholderTextColor={c.textSubtle}
				accessibilityLabel="Buscar eventos"
				autoFocus={autoFoco}
				returnKeyType="search"
				autoCorrect={false}
				autoCapitalize="none"
				style={[
					t.typography.body,
					{ color: c.text, flex: 1, minHeight: t.sizes.touchMin }
				]}
			/>
			{valor !== '' ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Borrar búsqueda"
					onPress={() => alCambiar?.('')}
					style={{
						width: t.sizes.touchMin,
						height: t.sizes.touchMin,
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					<Icon name="X" size={t.sizes.iconMd} color={c.textMuted} />
				</Pressable>
			) : (
				<View style={{ width: t.spacing[3] }} />
			)}
		</View>
	);
}
