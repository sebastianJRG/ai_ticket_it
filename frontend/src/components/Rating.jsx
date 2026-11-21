/**
 * @file Puntaje de solo lectura: variante compacta (una estrella + valor, o
 *   "Sin reseñas"; feature 004) y variante `estrellas` (5 estrellas + valor +
 *   cantidad; feature 005) (design-system/docs/componentes/Rating.md).
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
 * @property {'compact'|'estrellas'} [variante] `compact` (por defecto) o `estrellas`.
 * @property {string} [nombre] Solo `compact`: nombre del organizador, mostrado al lado.
 * @property {number} [cantidad] Solo `estrellas`: cantidad de reseñas, mostrada como "(N)".
 * @property {boolean} [ocultarValor] Solo `estrellas`: muestra solo las estrellas (p. ej. en una reseña).
 */

/**
 * Cinco estrellas con media estrella por redondeo a 0,5.
 * @param {{valor: number, tamano: number}} props Puntaje y tamaño del ícono.
 * @returns {JSX.Element} Fila de estrellas.
 */
function Estrellas({ valor, tamano }) {
	const t = useTheme();
	const c = t.colors;
	const redondeado = Math.round(valor * 2) / 2;
	return (
		<View style={{ flexDirection: 'row', gap: 2 }}>
			{[1, 2, 3, 4, 5].map((n) => {
				const llena = redondeado >= n;
				const media = !llena && redondeado >= n - 0.5;
				return (
					<View
						key={n}
						testID={`estrella-${n}`}
						style={{ width: tamano, height: tamano }}
					>
						<Icon
							name="Star"
							size={tamano}
							color={llena ? c.rating : c.ratingEmpty}
							fill={llena ? c.rating : 'none'}
						/>
						{media ? (
							<View style={{ position: 'absolute', top: 0, left: 0 }}>
								<Icon
									name="StarHalf"
									size={tamano}
									color={c.rating}
									fill={c.rating}
								/>
							</View>
						) : null}
					</View>
				);
			})}
		</View>
	);
}

/**
 * Puntaje accesible como un único elemento.
 * @param {RatingProps} props Ver {@link RatingProps}.
 * @returns {JSX.Element} Fila con estrella(s), valor y nombre o cantidad.
 */
export function Rating({
	valor,
	variante = 'compact',
	nombre,
	cantidad,
	ocultarValor = false
}) {
	const t = useTheme();
	const c = t.colors;
	const tiene = typeof valor === 'number';

	if (variante === 'estrellas') {
		const v = tiene ? valor : 0;
		const texto = formatRating(v);
		const hayCantidad = typeof cantidad === 'number';
		const label = `Puntaje ${texto} de 5${
			hayCantidad
				? `, ${cantidad} ${cantidad === 1 ? 'reseña' : 'reseñas'}`
				: ''
		}`;
		return (
			<View
				accessible
				accessibilityLabel={label}
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[2]
				}}
			>
				<Estrellas
					valor={v}
					tamano={ocultarValor ? t.sizes.iconSm : t.sizes.iconMd}
				/>
				{ocultarValor ? null : (
					<Text
						maxFontSizeMultiplier={1.4}
						style={[t.typography.label, { color: c.text }]}
					>
						{texto}
					</Text>
				)}
				{hayCantidad && !ocultarValor ? (
					<Text
						maxFontSizeMultiplier={1.4}
						style={[t.typography.bodySm, { color: c.textMuted }]}
					>
						{`(${cantidad})`}
					</Text>
				) : null}
			</View>
		);
	}

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
