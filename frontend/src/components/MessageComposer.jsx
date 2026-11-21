/**
 * @file Campo para escribir en el chat de una compra (design-system/docs/
 *   componentes/MessageComposer.md; specs/008-chat-compra/contracts/
 *   componentes.md › MessageComposer): pill multilínea, botón enviar de 44,
 *   ayuda visible, contador desde 800 caracteres y error. Presentacional: la
 *   validación la hace el padre con `validarMensaje`.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/** Desde este largo se muestra el contador. */
const UMBRAL_CONTADOR = 800;

/** Largo máximo (igual a `LIMITE_MENSAJE`). */
const LIMITE = 1000;

/** Ayuda y hint cuando no hay texto. */
const AYUDA = 'Escribí un mensaje para enviar';

/**
 * Props de {@link MessageComposer}.
 * @typedef {Object} MessageComposerProps
 * @property {string} valor Texto controlado.
 * @property {function(string): void} alCambiar Recibe el texto.
 * @property {function(): void} alEnviar Se llama solo con `valido`.
 * @property {boolean} valido Habilita "Enviar".
 * @property {number} largo Largo del texto recortado (contador).
 * @property {string|null} [error] Error a mostrar (en `error`, región polite).
 * @property {string} [placeholder] Placeholder ("Escribí un mensaje" por defecto).
 * @property {boolean} [deshabilitado] Deshabilita todo (p. ej. mientras carga).
 */

/**
 * Composer del chat.
 * @param {MessageComposerProps} props Ver {@link MessageComposerProps}.
 * @returns {JSX.Element} Composer.
 */
export function MessageComposer({
	valor,
	alCambiar,
	alEnviar,
	valido,
	largo,
	error,
	placeholder = 'Escribí un mensaje',
	deshabilitado = false
}) {
	const t = useTheme();
	const c = t.colors;
	const puedeEnviar = valido && !deshabilitado;
	const vacio = String(valor ?? '').trim() === '';
	const alturaLinea = t.typography.body.lineHeight;
	return (
		<View style={{ gap: t.spacing[1] }}>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'flex-end',
					gap: t.spacing[2],
					backgroundColor: c.surfaceRaised,
					borderRadius: t.radius.xl,
					borderWidth: 1,
					borderColor: error ? c.error : c.border,
					paddingLeft: t.spacing[4],
					paddingRight: t.spacing[1],
					paddingVertical: t.spacing[1]
				}}
			>
				<TextInput
					value={valor}
					onChangeText={alCambiar}
					placeholder={placeholder}
					placeholderTextColor={c.textSubtle}
					multiline
					editable={!deshabilitado}
					accessibilityLabel="Mensaje"
					style={[
						t.typography.body,
						{
							flex: 1,
							color: c.text,
							minHeight: t.sizes.touchMin,
							maxHeight: alturaLinea * 4 + t.spacing[4],
							paddingVertical: t.spacing[3]
						}
					]}
				/>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Enviar mensaje"
					accessibilityHint={puedeEnviar ? undefined : (error ?? AYUDA)}
					accessibilityState={{ disabled: !puedeEnviar }}
					disabled={!puedeEnviar}
					onPress={puedeEnviar ? alEnviar : undefined}
					style={({ pressed }) => ({
						width: t.sizes.touchMin,
						height: t.sizes.touchMin,
						borderRadius: t.radius.full,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: puedeEnviar ? c.primary : 'transparent',
						opacity: pressed ? t.opacity.pressed : 1
					})}
				>
					<Icon
						name="SendHorizontal"
						size={t.sizes.iconLg}
						color={puedeEnviar ? c.onPrimary : c.textSubtle}
					/>
				</Pressable>
			</View>
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					gap: t.spacing[2],
					paddingHorizontal: t.spacing[4]
				}}
			>
				{error ? (
					<Text
						accessibilityLiveRegion="polite"
						style={[t.typography.caption, { color: c.error, flex: 1 }]}
					>
						{error}
					</Text>
				) : vacio ? (
					<Text style={[t.typography.caption, { color: c.textMuted, flex: 1 }]}>
						{AYUDA}
					</Text>
				) : (
					<View style={{ flex: 1 }} />
				)}
				{largo >= UMBRAL_CONTADOR ? (
					<Text
						style={[
							t.typography.caption,
							{ color: largo > LIMITE ? c.error : c.textMuted }
						]}
					>
						{`${largo}/${LIMITE}`}
					</Text>
				) : null}
			</View>
		</View>
	);
}
