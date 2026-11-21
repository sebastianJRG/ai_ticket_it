/**
 * @file Chip de categoría (selección única) o de filtro (removible)
 *   (design-system/docs/componentes/Chip.md).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link Chip}.
 * @typedef {Object} ChipProps
 * @property {string} etiqueta Texto visible (1–3 palabras).
 * @property {'category'|'filter'} [variante] Estilo (`category` por defecto).
 * @property {string} [icono] Ícono Lucide a la izquierda.
 * @property {boolean} [seleccionado] Si está elegido.
 * @property {boolean} [removible] Muestra ✕ y se anuncia como "Quitar filtro …".
 * @property {'button'|'tab'} [rol] Rol accesible (`button` por defecto).
 * @property {function(): void} alPresionar Toque (o quitar, si es removible).
 */

/**
 * Chip tocable con área táctil mínima de 44.
 * @param {ChipProps} props Ver {@link ChipProps}.
 * @returns {JSX.Element} Chip.
 */
export function Chip({
	etiqueta,
	variante = 'category',
	icono,
	seleccionado = false,
	removible = false,
	rol = 'button',
	alPresionar
}) {
	const t = useTheme();
	const c = t.colors;
	const esCategoria = variante === 'category';
	const alto = esCategoria ? 40 : 36;
	const relleno = esCategoria
		? seleccionado
			? c.primary
			: c.surfaceRaised
		: seleccionado || removible
			? c.primarySoft
			: 'transparent';
	const tinta = esCategoria
		? seleccionado
			? c.onPrimary
			: c.text
		: seleccionado || removible
			? c.primaryText
			: c.text;
	const borde = esCategoria
		? 'transparent'
		: seleccionado || removible
			? c.primaryText
			: c.borderStrong;
	const margen = Math.ceil((t.sizes.touchMin - alto) / 2);

	return (
		<Pressable
			accessibilityRole={rol}
			accessibilityLabel={removible ? `Quitar filtro ${etiqueta}` : etiqueta}
			accessibilityState={{ selected: !!seleccionado }}
			hitSlop={{ top: margen, bottom: margen }}
			onPress={alPresionar}
			style={({ pressed }) => ({
				height: alto,
				flexDirection: 'row',
				alignItems: 'center',
				gap: t.spacing[2],
				paddingHorizontal: t.spacing[4],
				borderRadius: t.radius.full,
				borderWidth: 1,
				borderColor: borde,
				backgroundColor: relleno,
				opacity: pressed ? t.opacity.pressed : 1
			})}
		>
			{icono ? <Icon name={icono} size={t.sizes.iconSm} color={tinta} /> : null}
			{!esCategoria && seleccionado && !removible ? (
				<Icon name="Check" size={t.sizes.iconSm} color={tinta} />
			) : null}
			<Text
				numberOfLines={1}
				maxFontSizeMultiplier={1.4}
				style={[t.typography.labelSm, { color: tinta }]}
			>
				{etiqueta}
			</Text>
			{removible ? <Icon name="X" size={t.sizes.iconSm} color={tinta} /> : null}
		</Pressable>
	);
}
