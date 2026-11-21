/**
 * @file Selector de cantidad −/+ con tope (design-system/docs/componentes/QuantityStepper.md):
 *   nunca permite tipear la cantidad, deshabilita "+" en el máximo y avisa
 *   "Máximo N" (specs/005-detalle-evento-compra/research.md R6).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link QuantityStepper}.
 * @typedef {Object} QuantityStepperProps
 * @property {number} valor Cantidad actual.
 * @property {number} min Mínimo ("−" deshabilitado al llegar).
 * @property {number} max Máximo ("+" deshabilitado al llegar).
 * @property {function(number): void} alCambiar Recibe la nueva cantidad, siempre dentro de `[min, max]`.
 * @property {string} etiqueta Label accesible del grupo ("Cantidad de Platea").
 * @property {boolean} [deshabilitado] Bloquea ambos botones.
 */

/**
 * Botón cuadrado de 44 × 44.
 * @param {{icono: string, label: string, relleno: boolean, inactivo: boolean, alPresionar: function(): void}} props Ícono, label, si va relleno, si está inactivo y handler.
 * @returns {JSX.Element} Botón.
 */
function BotonPaso({ icono, label, relleno, inactivo, alPresionar }) {
	const t = useTheme();
	const c = t.colors;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ disabled: inactivo }}
			disabled={inactivo}
			onPress={inactivo ? undefined : alPresionar}
			style={{
				width: t.sizes.touchMin,
				height: t.sizes.touchMin,
				borderRadius: t.radius.md,
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: relleno ? c.primary : c.surfaceRaised,
				borderWidth: relleno ? 0 : 1.5,
				borderColor: c.borderStrong,
				opacity: inactivo ? t.opacity.disabled : 1
			}}
		>
			<Icon
				name={icono}
				size={t.sizes.iconMd}
				color={relleno ? c.onPrimary : c.text}
			/>
		</Pressable>
	);
}

/**
 * Selector de cantidad.
 * @param {QuantityStepperProps} props Ver {@link QuantityStepperProps}.
 * @returns {JSX.Element} Grupo −/valor/+ con hint.
 */
export function QuantityStepper({
	valor,
	min,
	max,
	alCambiar,
	etiqueta,
	deshabilitado = false
}) {
	const t = useTheme();
	const c = t.colors;
	const enMax = valor >= max;
	return (
		<View style={{ gap: t.spacing[1] }}>
			<View
				accessibilityLabel={etiqueta}
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[3]
				}}
			>
				<BotonPaso
					icono="Minus"
					label="Restar una"
					relleno={false}
					inactivo={deshabilitado || valor <= min}
					alPresionar={() => alCambiar(Math.max(min, valor - 1))}
				/>
				<Text
					accessibilityLiveRegion="polite"
					style={[
						t.typography.titleMd,
						{ color: c.text, minWidth: 32, textAlign: 'center' }
					]}
				>
					{String(valor)}
				</Text>
				<BotonPaso
					icono="Plus"
					label="Sumar una"
					relleno
					inactivo={deshabilitado || enMax}
					alPresionar={() => alCambiar(Math.min(max, valor + 1))}
				/>
			</View>
			{enMax ? (
				<Text style={[t.typography.caption, { color: c.warning }]}>
					{`Máximo ${max}`}
				</Text>
			) : null}
		</View>
	);
}
