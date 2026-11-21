/**
 * @file Pestañas para alternar vistas del mismo contenido, con contador
 *   opcional: `underline` para filtrar listas y `segmented` para 2–3 vistas de
 *   una entidad (design-system/docs/componentes/Tabs.md;
 *   specs/006-mis-compras-comprador/research.md R7).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Pestaña.
 * @typedef {Object} PestanaTab
 * @property {string} clave Identificador único.
 * @property {string} etiqueta Texto visible.
 * @property {number} [contador] Cantidad mostrada en una pill.
 */

/**
 * Props de {@link Tabs}.
 * @typedef {Object} TabsProps
 * @property {PestanaTab[]} pestanas Pestañas (máximo 4 visibles).
 * @property {string} seleccionada Clave de la pestaña activa.
 * @property {function(string): void} alCambiar Recibe la clave tocada.
 * @property {'underline'|'segmented'} [variante] `underline` por defecto.
 * @property {string} [testID] Identificador de pruebas (`tabs` por defecto).
 */

/**
 * Barra de pestañas accesible (`tablist` + `tab`).
 * @param {TabsProps} props Ver {@link TabsProps}.
 * @returns {JSX.Element} Pestañas.
 */
export function Tabs({
	pestanas,
	seleccionada,
	alCambiar,
	variante = 'underline',
	testID = 'tabs'
}) {
	const t = useTheme();
	const c = t.colors;
	const segmentada = variante === 'segmented';
	return (
		<View
			accessibilityRole="tablist"
			testID={testID}
			style={
				segmentada
					? {
							flexDirection: 'row',
							padding: t.spacing[1],
							gap: t.spacing[1],
							borderRadius: t.radius.md,
							backgroundColor: c.surfaceRaised
						}
					: {
							flexDirection: 'row',
							borderBottomWidth: 1,
							borderBottomColor: c.border
						}
			}
		>
			{pestanas.map((p) => {
				const activa = p.clave === seleccionada;
				const conContador = typeof p.contador === 'number';
				const tinta = segmentada
					? activa
						? c.onPrimary
						: c.text
					: activa
						? c.text
						: c.textMuted;
				return (
					<Pressable
						key={p.clave}
						accessibilityRole="tab"
						accessibilityLabel={
							conContador ? `${p.etiqueta}, ${p.contador}` : p.etiqueta
						}
						accessibilityState={{ selected: activa }}
						onPress={() => alCambiar(p.clave)}
						style={({ pressed }) => ({
							flex: 1,
							minHeight: t.sizes.touchMin,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: t.spacing[2],
							paddingHorizontal: t.spacing[2],
							opacity: pressed ? t.opacity.pressed : 1,
							...(segmentada
								? {
										borderRadius: t.radius.sm,
										backgroundColor: activa ? c.primary : 'transparent'
									}
								: {
										borderBottomWidth: 3,
										borderBottomColor: activa ? c.primary : 'transparent',
										marginBottom: -1
									})
						})}
					>
						<Text
							numberOfLines={1}
							maxFontSizeMultiplier={1.4}
							style={[t.typography.label, { color: tinta }]}
						>
							{p.etiqueta}
						</Text>
						{conContador ? (
							<View
								style={{
									minWidth: 22,
									paddingHorizontal: t.spacing[1] + 2,
									borderRadius: t.radius.full,
									alignItems: 'center',
									backgroundColor: activa ? c.primarySoft : c.surfaceRaised
								}}
							>
								<Text
									maxFontSizeMultiplier={1.4}
									style={[
										t.typography.labelSm,
										{ color: activa ? c.primaryText : c.textMuted }
									]}
								>
									{p.contador}
								</Text>
							</View>
						) : null}
					</Pressable>
				);
			})}
		</View>
	);
}
