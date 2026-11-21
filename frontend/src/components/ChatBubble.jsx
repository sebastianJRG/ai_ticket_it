/**
 * @file Burbuja del chat de una compra (design-system/docs/componentes/
 *   ChatBubble.md; specs/008-chat-compra/contracts/componentes.md › ChatBubble):
 *   propia a la derecha en `bubbleOwn`, ajena a la izquierda en
 *   `surfaceRaised`, con hora y estado del envío. Presentacional.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link ChatBubble}.
 * @typedef {Object} ChatBubbleProps
 * @property {string} texto Texto del mensaje.
 * @property {string} hora Hora ya formateada.
 * @property {boolean} [propio] Si es del usuario de la sesión (lado y colores).
 * @property {string} autor Autor; siempre en el `accessibilityLabel`.
 * @property {boolean} [mostrarAutor] Muestra el autor (solo en ajenas).
 * @property {'enviado'|'enviando'|'error'} [estado] Estado del envío (`enviado` por defecto).
 * @property {string} [error] Texto bajo la burbuja en `error`.
 * @property {function(): void} [alReintentar] Muestra "Reintentar" en `error`.
 */

/** Sufijo accesible según el estado. */
const SUFIJO = { enviando: '. Enviando', error: '. No se envió' };

/**
 * Burbuja de un mensaje.
 * @param {ChatBubbleProps} props Ver {@link ChatBubbleProps}.
 * @returns {JSX.Element} Burbuja.
 */
export function ChatBubble({
	texto,
	hora,
	propio = false,
	autor,
	mostrarAutor = false,
	estado = 'enviado',
	error,
	alReintentar
}) {
	const t = useTheme();
	const c = t.colors;
	const tinta = propio ? c.onBubbleOwn : c.text;
	const tintaSuave = propio ? c.onBubbleOwn : c.textMuted;
	return (
		<View
			testID="chat-bubble"
			accessible
			accessibilityLabel={`${autor}, ${hora}: ${texto}${SUFIJO[estado] ?? ''}`}
			style={{
				alignItems: propio ? 'flex-end' : 'flex-start',
				gap: t.spacing[1],
				paddingVertical: t.spacing[1] / 2
			}}
		>
			{mostrarAutor && !propio ? (
				<Text style={[t.typography.caption, { color: c.textMuted }]}>
					{autor}
				</Text>
			) : null}
			<View
				testID="chat-bubble-cuerpo"
				style={{
					maxWidth: '80%',
					backgroundColor: propio ? c.bubbleOwn : c.surfaceRaised,
					borderRadius: t.radius.lg,
					borderBottomRightRadius: propio ? t.radius.xs : t.radius.lg,
					borderBottomLeftRadius: propio ? t.radius.lg : t.radius.xs,
					paddingHorizontal: t.spacing[3],
					paddingVertical: t.spacing[2],
					gap: t.spacing[1],
					opacity: estado === 'enviando' ? 0.8 : 1
				}}
			>
				<Text style={[t.typography.body, { color: tinta }]}>{texto}</Text>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						alignSelf: 'flex-end',
						gap: t.spacing[1]
					}}
				>
					{estado === 'enviando' ? (
						<>
							<Icon name="Clock" size={t.sizes.iconSm} color={tintaSuave} />
							<Text style={[t.typography.caption, { color: tintaSuave }]}>
								Enviando…
							</Text>
						</>
					) : (
						<Text style={[t.typography.caption, { color: tintaSuave }]}>
							{hora}
						</Text>
					)}
				</View>
			</View>
			{estado === 'error' ? (
				<View style={{ alignItems: 'flex-end', gap: t.spacing[1] }}>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: t.spacing[1]
						}}
					>
						<Icon name="CircleAlert" size={t.sizes.iconSm} color={c.error} />
						<Text style={[t.typography.labelSm, { color: c.error }]}>
							No se envió
						</Text>
					</View>
					{error ? (
						<Text style={[t.typography.caption, { color: c.error }]}>
							{error}
						</Text>
					) : null}
					{alReintentar ? (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Reintentar"
							onPress={alReintentar}
							style={({ pressed }) => ({
								minHeight: t.sizes.touchMin,
								minWidth: t.sizes.touchMin,
								paddingHorizontal: t.spacing[3],
								justifyContent: 'center',
								opacity: pressed ? t.opacity.pressed : 1
							})}
						>
							<Text style={[t.typography.label, { color: c.primaryText }]}>
								Reintentar
							</Text>
						</Pressable>
					) : null}
				</View>
			) : null}
		</View>
	);
}
