/**
 * @file Arte de reemplazo cuando el evento no tiene imagen: degradé con la
 *   paleta de su categoría y su ícono (specs/004-explorar-busqueda-favoritos/research.md R9).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { iconoCategoria, paletaCategoria } from '../eventos/presentacion';
import { Icon } from './Icon';

/**
 * Props de {@link ArteCategoria}.
 * @typedef {Object} ArteCategoriaProps
 * @property {{id?: string, nombre?: string}} [categoria] Categoría del evento.
 * @property {import('react-native').ViewStyle} [estilo] Estilo del contenedor (tamaño, radio).
 * @property {number} [tamanoIcono] Tamaño del ícono (40 por defecto).
 */

/**
 * Degradé decorativo (no accesible).
 * @param {ArteCategoriaProps} props Ver {@link ArteCategoriaProps}.
 * @returns {JSX.Element} Arte por categoría.
 */
export function ArteCategoria({ categoria, estilo, tamanoIcono = 40 }) {
	const p = paletaCategoria(categoria);
	return (
		<View
			testID="arte-categoria"
			accessible={false}
			importantForAccessibility="no-hide-descendants"
			style={[{ overflow: 'hidden', backgroundColor: p.fondo }, estilo]}
		>
			<LinearGradient
				colors={[p.a, p.fondo, p.b]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
			>
				<Icon
					name={iconoCategoria(categoria?.nombre)}
					size={tamanoIcono}
					color="#ffffff"
					strokeWidth={1.75}
				/>
			</LinearGradient>
		</View>
	);
}
