/**
 * @file Campo de texto con label, helper/error, prefijo/sufijo y contraseña.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

/**
 * Props de {@link TextField}.
 * @typedef {Object} TextFieldProps
 * @property {string} label Label siempre visible.
 * @property {string} [value] Valor controlado.
 * @property {string} [placeholder] Placeholder.
 * @property {string} [helper] Texto de ayuda.
 * @property {string} [error] Error: borde y mensaje que explica cómo resolverlo.
 * @property {string} [prefix] Prefijo (p. ej. "$").
 * @property {string} [suffix] Sufijo (p. ej. "u.").
 * @property {boolean} [multiline] Campo multilínea.
 * @property {boolean} [disabled] Deshabilitado.
 * @property {boolean} [required] Sin required el label muestra "(opcional)".
 * @property {number} [maxLength] Largo máximo; con multilínea muestra contador.
 * @property {boolean} [secureTextEntry] Contraseña con botón mostrar/ocultar.
 * @property {string} [keyboardType] Teclado.
 * @property {string} [autoCapitalize] Capitalización automática.
 * @property {string} [autoComplete] Sugerencia de autocompletado (username, new-password...).
 * @property {function(string): void} [onChangeText] Handler con el texto.
 * @property {function(): void} [onBlur] Handler al perder foco (validación).
 */

/**
 * Campo de texto (alto 52, texto 16).
 * @param props Ver {@link TextFieldProps}.
 * @returns Label, input y helper/error.
 */
export function TextField({
	label,
	value = '',
	placeholder,
	helper,
	error,
	prefix,
	suffix,
	multiline,
	disabled,
	required,
	maxLength,
	secureTextEntry,
	keyboardType,
	autoCapitalize,
	autoComplete,
	onChangeText,
	onBlur
}) {
	const t = useTheme();
	const c = t.colors;
	const [focused, setFocused] = useState(false);
	const [show, setShow] = useState(false);
	const border = error ? c.error : focused ? c.primaryText : c.borderStrong;
	const hidden = !!secureTextEntry && !show;
	return (
		<View style={{ gap: 6 }}>
			<Text style={[t.typography.labelSm, { color: c.text }]}>
				{label}
				{required ? null : (
					<Text style={{ color: c.textSubtle }}> (opcional)</Text>
				)}
			</Text>
			<View
				style={{
					flexDirection: 'row',
					alignItems: multiline ? 'flex-start' : 'center',
					gap: t.spacing[2],
					minHeight: multiline ? 112 : t.sizes.buttonLg,
					paddingHorizontal: t.spacing[4],
					paddingVertical: multiline ? 14 : 0,
					borderRadius: t.radius.md,
					backgroundColor: c.surface,
					borderWidth: focused || error ? 2 : 1.5,
					borderColor: border,
					opacity: disabled ? t.opacity.disabled : 1
				}}
			>
				{prefix ? (
					<Text style={[t.typography.bodyStrong, { color: c.textMuted }]}>
						{prefix}
					</Text>
				) : null}
				<TextInput
					accessibilityLabel={label}
					value={value}
					placeholder={placeholder}
					placeholderTextColor={c.textSubtle}
					editable={!disabled}
					maxLength={maxLength}
					multiline={multiline}
					secureTextEntry={hidden}
					keyboardType={keyboardType}
					autoCapitalize={autoCapitalize}
					autoComplete={autoComplete}
					autoCorrect={secureTextEntry ? false : undefined}
					onChangeText={onChangeText}
					onFocus={() => setFocused(true)}
					onBlur={() => {
						setFocused(false);
						onBlur?.();
					}}
					style={{
						flex: 1,
						minWidth: 0,
						fontFamily: 'Manrope_500Medium',
						fontSize: 16,
						lineHeight: 22,
						color: c.text,
						textAlignVertical: multiline ? 'top' : 'center'
					}}
				/>
				{suffix ? (
					<Text style={[t.typography.bodyStrong, { color: c.textMuted }]}>
						{suffix}
					</Text>
				) : null}
				{secureTextEntry ? (
					<View style={{ marginRight: -12 }}>
						<IconButton
							icon={show ? 'EyeOff' : 'Eye'}
							label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							onPress={() => setShow(!show)}
						/>
					</View>
				) : null}
			</View>
			{error || helper || (multiline && maxLength) ? (
				<View style={{ flexDirection: 'row', gap: t.spacing[1] }}>
					{error ? <Icon name="CircleAlert" size={16} color={c.error} /> : null}
					<Text
						style={[
							t.typography.bodySm,
							{ flex: 1, color: error ? c.error : c.textMuted }
						]}
					>
						{error ?? helper}
					</Text>
					{multiline && maxLength ? (
						<Text style={[t.typography.bodySm, { color: c.textSubtle }]}>
							{`${value.length}/${maxLength}`}
						</Text>
					) : null}
				</View>
			) : null}
		</View>
	);
}
