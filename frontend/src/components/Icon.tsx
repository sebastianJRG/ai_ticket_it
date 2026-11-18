/**
 * @file Ícono de trazo basado en lucide-react-native.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import * as Lucide from 'lucide-react-native';

/** Props de {@link Icon}. */
export interface IconProps {
	/** Nombre del ícono en Lucide (p. ej. "Heart", "CircleCheck"). */
	name: string;
	/** Tamaño en px (16 badges, 20 botones, 24 navegación). */
	size?: number;
	/** Color del trazo. */
	color?: string;
	/** Grosor del trazo. */
	strokeWidth?: number;
}

/**
 * Renderiza un ícono Lucide decorativo (no accesible por sí solo).
 * @param props Ver {@link IconProps}.
 * @returns El ícono, o null si el nombre no existe.
 */
export function Icon({ name, size = 20, color, strokeWidth = 2 }: IconProps) {
	const Cmp = (Lucide as unknown as Record<string, React.ComponentType<any>>)[
		name
	];
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
