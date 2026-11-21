/**
 * @file Tarjeta de reseña: avatar, autor, estrellas y comentario de hasta 6
 *   líneas con "Leer más" (design-system/docs/componentes/ReviewCard.md). El
 *   backend no expone fecha ni tipo de entrada, así que no se muestran
 *   (specs/005-detalle-evento-compra/research.md R4).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Avatar } from './Avatar';
import { Rating } from './Rating';

/** Líneas visibles del comentario antes de "Leer más". */
const MAX_LINEAS = 6;

/**
 * Props de {@link ReviewCard}.
 * @typedef {Object} ReviewCardProps
 * @property {string} autor "Nombre A." o "Comprador".
 * @property {string} iniciales Iniciales del avatar.
 * @property {number} puntuacion Puntaje entero 1–5.
 * @property {string} detalle Comentario.
 */

/**
 * Tarjeta de reseña.
 * @param {ReviewCardProps} props Ver {@link ReviewCardProps}.
 * @returns {JSX.Element} Tarjeta.
 */
export function ReviewCard({ autor, iniciales, puntuacion, detalle }) {
	const t = useTheme();
	const c = t.colors;
	const [largo, setLargo] = useState(false);
	const [expandido, setExpandido] = useState(false);

	const medir = (e) => {
		if (!largo && e?.nativeEvent?.lines?.length > MAX_LINEAS) setLargo(true);
	};

	return (
		<View
			style={{
				padding: t.spacing[4],
				borderRadius: t.radius.lg,
				backgroundColor: c.surface,
				borderWidth: 1,
				borderColor: c.border,
				gap: t.spacing[2]
			}}
		>
			<View
				accessible
				accessibilityLabel={`${autor}, ${puntuacion} de 5 estrellas: ${detalle}`}
				style={{ gap: t.spacing[2] }}
			>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: t.spacing[3]
					}}
				>
					<Avatar nombre={autor} iniciales={iniciales} tamano={32} />
					<View style={{ flex: 1, gap: 2 }}>
						<Text style={[t.typography.label, { color: c.text }]}>{autor}</Text>
						<Rating variante="estrellas" valor={puntuacion} ocultarValor />
					</View>
				</View>
				<Text
					onTextLayout={medir}
					numberOfLines={expandido ? undefined : MAX_LINEAS}
					style={[t.typography.body, { color: c.text }]}
				>
					{detalle}
				</Text>
			</View>
			{largo ? (
				<Pressable
					accessibilityRole="button"
					onPress={() => setExpandido((v) => !v)}
					hitSlop={8}
					style={{ alignSelf: 'flex-start', minHeight: 24 }}
				>
					<Text style={[t.typography.labelSm, { color: c.primaryText }]}>
						{expandido ? 'Leer menos' : 'Leer más'}
					</Text>
				</Pressable>
			) : null}
		</View>
	);
}
