/**
 * @file Campo de selección única con opciones en un BottomSheet (mismo alto y
 *   estilo que `TextField`; design-system/docs/componentes/Select.md,
 *   specs/007-organizador-eventos/research.md R8). Presentacional: el padre
 *   controla si está abierto.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';

/**
 * Opción del Select.
 * @typedef {Object} OpcionSelect
 * @property {string} clave Identificador único.
 * @property {string} etiqueta Texto visible.
 */

/**
 * Props de {@link Select}.
 * @typedef {Object} SelectProps
 * @property {string} label Label siempre visible (y título del sheet).
 * @property {string|null} valor Clave elegida, o `null`.
 * @property {OpcionSelect[]} opciones Opciones disponibles.
 * @property {string} [placeholder] Texto con `valor` nulo.
 * @property {string} [error] Mensaje que explica cómo resolverlo.
 * @property {boolean} [required] Sin él el label muestra "(opcional)".
 * @property {boolean} abierto Si el sheet está abierto.
 * @property {function(): void} alAbrir Toque en el campo.
 * @property {function(): void} alCerrar Cierre del sheet.
 * @property {function(string): void} alElegir Recibe la clave tocada.
 * @property {import('react').ReactNode} [pie] Contenido fijo al final de la lista.
 * @property {import('react').ReactNode} [children] Reemplaza la lista dentro del sheet.
 */

/**
 * Campo Select.
 * @param {SelectProps} props Ver {@link SelectProps}.
 * @returns {JSX.Element} Campo y sheet.
 */
export function Select({
	label,
	valor,
	opciones,
	placeholder,
	error,
	required,
	abierto,
	alAbrir,
	alCerrar,
	alElegir,
	pie,
	children
}) {
	const t = useTheme();
	const c = t.colors;
	const elegida = opciones.find((o) => o.clave === valor) ?? null;
	return (
		<View style={{ gap: 6 }}>
			<Text style={[t.typography.labelSm, { color: c.text }]}>
				{label}
				{required ? null : (
					<Text style={{ color: c.textSubtle }}> (opcional)</Text>
				)}
			</Text>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${label}, ${elegida ? elegida.etiqueta : 'sin elegir'}`}
				accessibilityHint={error}
				onPress={alAbrir}
				style={({ pressed }) => ({
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[2],
					minHeight: t.sizes.buttonLg,
					paddingHorizontal: t.spacing[4],
					borderRadius: t.radius.md,
					backgroundColor: c.surface,
					borderWidth: error ? 2 : 1.5,
					borderColor: error ? c.error : c.borderStrong,
					opacity: pressed ? t.opacity.pressed : 1
				})}
			>
				<Text
					style={[
						t.typography.bodyLg,
						{ flex: 1, color: elegida ? c.text : c.textSubtle }
					]}
				>
					{elegida ? elegida.etiqueta : (placeholder ?? '')}
				</Text>
				<Icon name="ChevronDown" size={t.sizes.iconMd} color={c.textMuted} />
			</Pressable>
			{error ? (
				<View style={{ flexDirection: 'row', gap: t.spacing[1] }}>
					<Icon name="CircleAlert" size={16} color={c.error} />
					<Text style={[t.typography.bodySm, { flex: 1, color: c.error }]}>
						{error}
					</Text>
				</View>
			) : null}
			<BottomSheet visible={abierto} titulo={label} alCerrar={alCerrar}>
				{children ?? (
					<ScrollView style={{ maxHeight: 360 }}>
						<View accessibilityRole="radiogroup" style={{ gap: t.spacing[1] }}>
							{opciones.map((o) => {
								const activa = o.clave === valor;
								return (
									<Pressable
										key={o.clave}
										accessibilityRole="radio"
										accessibilityLabel={o.etiqueta}
										accessibilityState={{ checked: activa }}
										onPress={() => alElegir(o.clave)}
										style={({ pressed }) => ({
											flexDirection: 'row',
											alignItems: 'center',
											minHeight: t.sizes.touchMin,
											paddingHorizontal: t.spacing[3],
											borderRadius: t.radius.sm,
											backgroundColor: activa ? c.primarySoft : 'transparent',
											opacity: pressed ? t.opacity.pressed : 1
										})}
									>
										<Text
											style={[
												t.typography.body,
												{ flex: 1, color: activa ? c.primaryText : c.text }
											]}
										>
											{o.etiqueta}
										</Text>
										{activa ? (
											<Icon
												name="Check"
												size={t.sizes.iconMd}
												color={c.primaryText}
											/>
										) : null}
									</Pressable>
								);
							})}
						</View>
						{pie}
					</ScrollView>
				)}
			</BottomSheet>
		</View>
	);
}
