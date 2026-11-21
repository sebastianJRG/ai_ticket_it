/**
 * @file Pestañas para alternar vistas del mismo contenido, con contador
 *   opcional: `underline` para filtrar listas y `segmented` para 2–3 vistas de
 *   una entidad (design-system/docs/componentes/Tabs.md;
 *   specs/006-mis-compras-comprador/research.md R7). Con `desplazable`, las
 *   pestañas se separan y se deslizan en horizontal si no entran.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
 * @property {boolean} [desplazable] Pestañas con su ancho natural, separadas y en un scroll horizontal (`false` por defecto).
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
	testID = 'tabs',
	desplazable = false
}) {
	const t = useTheme();
	const c = t.colors;
	const segmentada = variante === 'segmented';
	const scroll = useRef(null);
	const posiciones = useRef({});

	// Lleva a la vista la pestaña elegida si quedó fuera del área visible.
	useEffect(() => {
		const x = posiciones.current[seleccionada];
		if (desplazable && typeof x === 'number') {
			scroll.current?.scrollTo?.({
				x: Math.max(0, x - t.spacing[4]),
				animated: true
			});
		}
	}, [desplazable, seleccionada, t]);

	const lista = (
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
							borderBottomColor: c.border,
							...(desplazable ? { gap: t.spacing[2], minWidth: '100%' } : {})
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
						onLayout={(e) => {
							posiciones.current[p.clave] = e.nativeEvent.layout.x;
						}}
						style={({ pressed }) => ({
							...(desplazable ? {} : { flex: 1 }),
							minHeight: t.sizes.touchMin,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: t.spacing[2],
							paddingHorizontal: desplazable ? t.spacing[4] : t.spacing[2],
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

	if (!desplazable) return lista;
	return (
		<ScrollView
			ref={scroll}
			testID={`${testID}-scroll`}
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ flexGrow: 1 }}
		>
			{lista}
		</ScrollView>
	);
}
