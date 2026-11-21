/**
 * @file Estado vacío con ticket troquelado, título, explicación y acción
 *   (design-system/docs/componentes/EmptyState.md).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { Button } from './Button';

/** Ícono Lucide dentro del ticket según el contexto. */
const ICONOS = {
	ticket: 'Ticket',
	search: 'Search',
	heart: 'Heart',
	message: 'MessageCircle'
};

/**
 * Props de {@link EmptyState}.
 * @typedef {Object} EmptyStateProps
 * @property {'ticket'|'search'|'heart'|'message'} [icono] Ícono del ticket (ticket por defecto).
 * @property {string} titulo Describe la situación.
 * @property {string} [cuerpo] Explica qué va a aparecer.
 * @property {{etiqueta: string, alPresionar: function(): void}} [accion] Acción primaria que lo resuelve.
 */

/**
 * Estado vacío centrado.
 * @param {EmptyStateProps} props Ver {@link EmptyStateProps}.
 * @returns {JSX.Element} Vista del estado vacío.
 */
export function EmptyState({ icono = 'ticket', titulo, cuerpo, accion }) {
	const t = useTheme();
	const c = t.colors;
	const muesca = {
		position: 'absolute',
		top: 28,
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: c.bg
	};
	return (
		<View
			style={{
				alignItems: 'center',
				justifyContent: 'center',
				padding: t.spacing[6],
				gap: t.spacing[3]
			}}
		>
			<View
				accessible={false}
				importantForAccessibility="no-hide-descendants"
				style={{
					width: 112,
					height: 76,
					borderRadius: t.radius.md,
					backgroundColor: c.surfaceRaised,
					alignItems: 'center',
					justifyContent: 'center',
					overflow: 'hidden'
				}}
			>
				<View style={[muesca, { left: -10 }]} />
				<View style={[muesca, { right: -10 }]} />
				<Icon
					name={ICONOS[icono] ?? ICONOS.ticket}
					size={32}
					color={c.primaryText}
				/>
			</View>
			<Text
				accessibilityRole="header"
				style={[t.typography.titleMd, { color: c.text, textAlign: 'center' }]}
			>
				{titulo}
			</Text>
			{cuerpo ? (
				<Text
					style={[
						t.typography.body,
						{ color: c.textMuted, textAlign: 'center' }
					]}
				>
					{cuerpo}
				</Text>
			) : null}
			{accion ? (
				<Button onPress={accion.alPresionar}>{accion.etiqueta}</Button>
			) : null}
		</View>
	);
}
