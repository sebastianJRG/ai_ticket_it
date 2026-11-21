/**
 * @file Puntaje del organizador de solo lectura, variante compacta: una
 *   estrella + valor con coma, o "Sin reseñas"
 *   (design-system/docs/componentes/Rating.md; research R11).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatRating } from '../theme/format';
import { Icon } from './Icon';

/**
 * Props de {@link Rating}.
 * @typedef {Object} RatingProps
 * @property {number|null} valor Puntaje 1–5, o `null` si el organizador no tiene reseñas.
 * @property {'compact'} [variante] Única variante de esta feature.
 * @property {string} [nombre] Nombre del organizador, mostrado al lado.
 */

/**
 * Puntaje compacto accesible como un único elemento.
 * @param {RatingProps} props Ver {@link RatingProps}.
 * @returns {JSX.Element} Fila con estrella, valor y nombre.
 */
export function Rating({ valor, nombre }) {
	const t = useTheme();
	const c = t.colors;
	const tiene = typeof valor === 'number';
	const texto = tiene ? formatRating(valor) : 'Sin reseñas';
	const label = tiene
		? `Puntaje del organizador ${texto} de 5${nombre ? `, ${nombre}` : ''}`
		: `Organizador sin reseñas${nombre ? `, ${nombre}` : ''}`;
	return (
		<View
			accessible
			accessibilityLabel={label}
			style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[1] }}
		>
			<Icon
				name="Star"
				size={t.sizes.iconSm}
				color={tiene ? c.rating : c.ratingEmpty}
				fill={tiene ? c.rating : 'none'}
			/>
			<Text
				maxFontSizeMultiplier={1.4}
				style={[t.typography.labelSm, { color: tiene ? c.text : c.textSubtle }]}
			>
				{texto}
			</Text>
			{nombre ? (
				<Text
					numberOfLines={1}
					maxFontSizeMultiplier={1.4}
					style={[t.typography.bodySm, { color: c.textMuted, flexShrink: 1 }]}
				>
					{`· ${nombre}`}
				</Text>
			) : null}
		</View>
	);
}
