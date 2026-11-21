/**
 * @file Carga de puntaje con 5 estrellas de 52 × 52 (cada una un radio) y
 *   caption "4/5 · Muy bueno" (design-system/docs/componentes/Rating.md ›
 *   RatingInput; specs/006-mis-compras-comprador/research.md R11).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ESCALA_PUNTAJE, textoPuntaje } from '../resenias/calificacion';
import { Icon } from './Icon';

/**
 * Props de {@link RatingInput}.
 * @typedef {Object} RatingInputProps
 * @property {number|null} valor Puntuación elegida (1–5), o `null`.
 * @property {function(number): void} alCambiar Recibe la estrella tocada.
 * @property {string} [error] Mensaje bajo las estrellas.
 * @property {boolean} [deshabilitado] Ignora los toques.
 */

const TAMANO = 52;

/**
 * Selector de puntaje accesible (`radio` por estrella).
 * @param {RatingInputProps} props Ver {@link RatingInputProps}.
 * @returns {JSX.Element} Estrellas, caption y error.
 */
export function RatingInput({
	valor,
	alCambiar,
	error,
	deshabilitado = false
}) {
	const t = useTheme();
	const c = t.colors;
	const caption = textoPuntaje(valor);
	return (
		<View style={{ gap: t.spacing[2] }}>
			<View accessibilityRole="radiogroup" style={{ flexDirection: 'row' }}>
				{[1, 2, 3, 4, 5].map((n) => {
					const llena = valor != null && n <= valor;
					return (
						<Pressable
							key={n}
							accessibilityRole="radio"
							accessibilityLabel={`${n} ${n === 1 ? 'estrella' : 'estrellas'}, ${ESCALA_PUNTAJE[n]}`}
							accessibilityState={{
								checked: n === valor,
								disabled: deshabilitado
							}}
							disabled={deshabilitado}
							onPress={() => alCambiar(n)}
							style={{
								width: TAMANO,
								height: TAMANO,
								alignItems: 'center',
								justifyContent: 'center',
								opacity: deshabilitado ? t.opacity.disabled : 1
							}}
						>
							<Icon
								name="Star"
								size={36}
								color={llena ? c.rating : c.ratingEmpty}
								fill={llena ? c.rating : 'none'}
							/>
						</Pressable>
					);
				})}
			</View>
			{caption ? (
				<Text style={[t.typography.label, { color: c.text }]}>{caption}</Text>
			) : null}
			{error ? (
				<Text
					accessibilityLiveRegion="polite"
					style={[t.typography.bodySm, { color: c.error }]}
				>
					{error}
				</Text>
			) : null}
		</View>
	);
}
