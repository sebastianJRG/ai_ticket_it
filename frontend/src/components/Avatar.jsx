/**
 * @file Avatar circular con iniciales y color determinístico por nombre
 *   (design-system/docs/componentes/Avatar.md). Decorativo: el nombre siempre
 *   está escrito al lado.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Props de {@link Avatar}.
 * @typedef {Object} AvatarProps
 * @property {string} nombre Nombre usado para elegir el color.
 * @property {string} iniciales Texto del avatar (1–2 letras).
 * @property {32|40|64} [tamano] Diámetro en px (32 por defecto).
 */

/** Claves de color del theme para el fondo (con su color de texto). */
const TONOS = Object.freeze([
	['primarySoft', 'primaryText'],
	['secondarySoft', 'secondaryText'],
	['successSoft', 'success'],
	['infoSoft', 'info'],
	['warningSoft', 'warning'],
	['statusRefundedBg', 'statusRefunded']
]);

/**
 * Hash estable (djb2) de un texto.
 * @param {string} texto Texto.
 * @returns {number} Entero no negativo.
 */
function hash(texto) {
	let h = 5381;
	for (let i = 0; i < texto.length; i += 1) {
		h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
	}
	return h;
}

/**
 * Avatar con iniciales.
 * @param {AvatarProps} props Ver {@link AvatarProps}.
 * @returns {JSX.Element} Círculo con iniciales.
 */
export function Avatar({ nombre, iniciales, tamano = 32 }) {
	const t = useTheme();
	const [fondo, tinta] = TONOS[hash(String(nombre ?? '')) % TONOS.length];
	const estiloTexto =
		tamano >= 64 ? t.typography.titleMd : t.typography.labelSm;
	return (
		<View
			testID="avatar"
			accessible={false}
			importantForAccessibility="no-hide-descendants"
			style={{
				width: tamano,
				height: tamano,
				borderRadius: t.radius.full,
				backgroundColor: t.colors[fondo],
				alignItems: 'center',
				justifyContent: 'center'
			}}
		>
			<Text
				maxFontSizeMultiplier={1.2}
				style={[estiloTexto, { color: t.colors[tinta] }]}
			>
				{iniciales}
			</Text>
		</View>
	);
}
