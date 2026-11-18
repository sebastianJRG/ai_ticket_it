/**
 * @file Ícono de trazo basado en lucide-react-native.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import * as Lucide from 'lucide-react-native';

/**
 * Props de {@link Icon}.
 * @typedef {Object} IconProps
 * @property {string} name Nombre del ícono en Lucide (p. ej. "Heart", "CircleCheck").
 * @property {number} [size] Tamaño en px (16 badges, 20 botones, 24 navegación).
 * @property {string} [color] Color del trazo.
 * @property {number} [strokeWidth] Grosor del trazo.
 */

/**
 * Renderiza un ícono Lucide decorativo (no accesible por sí solo).
 * @param props Ver {@link IconProps}.
 * @returns El ícono, o null si el nombre no existe.
 */
export function Icon({ name, size = 20, color, strokeWidth = 2 }) {
	const Cmp = Lucide[name];
	if (!Cmp) return null;
	return (
		<Cmp
			size={size}
			color={color}
			strokeWidth={strokeWidth}
			accessible={false}
			importantForAccessibility="no"
		/>
	);
}
