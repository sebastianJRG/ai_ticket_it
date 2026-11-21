/**
 * @file Barra de navegación inferior por rol, con pill en el ítem activo y
 *   punto de novedad (design-system/docs/componentes/BottomNav.md).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

/**
 * Props de {@link BottomNav}.
 * @typedef {Object} BottomNavProps
 * @property {ReadonlyArray<import('../navegacion/reglas').TabDef>} items Pestañas de un solo rol.
 * @property {string} activo `clave` de la pestaña activa.
 * @property {string[]} [dots] Claves con novedad.
 * @property {function(string): void} alSeleccionar Se llama con la `clave` tocada.
 */

/**
 * Barra inferior con etiquetas siempre visibles; alto 64 + safe area inferior.
 * @param {BottomNavProps} props Ver {@link BottomNavProps}.
 * @returns {JSX.Element} Contenedor con rol tablist.
 */
export function BottomNav({ items, activo, dots = [], alSeleccionar }) {
	const t = useTheme();
	const insets = useSafeAreaInsets();
	const c = t.colors;
	return (
		<View
			testID="bottom-nav"
			accessibilityRole="tablist"
			style={{
				height: t.sizes.bottomNavHeight + insets.bottom,
				paddingBottom: insets.bottom,
				flexDirection: 'row',
				backgroundColor: c.surface,
				borderTopWidth: 1,
				borderTopColor: c.border
			}}
		>
			{items.map((it) => {
				const sel = it.clave === activo;
				const dot = dots.includes(it.clave);
				const ink = sel ? c.text : c.textMuted;
				return (
					<Pressable
						key={it.clave}
						accessibilityRole="tab"
						accessibilityLabel={dot ? `${it.etiqueta}, novedades` : it.etiqueta}
						accessibilityState={{ selected: sel }}
						onPress={() => alSeleccionar(it.clave)}
						style={{
							flex: 1,
							minHeight: t.sizes.touchMin,
							alignItems: 'center',
							justifyContent: 'center',
							gap: 2
						}}
					>
						<View
							style={{
								width: 56,
								height: 30,
								borderRadius: t.radius.full,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: sel ? c.primarySoft : 'transparent'
							}}
						>
							<Icon
								name={it.icono}
								size={t.sizes.iconMd}
								color={sel ? c.primaryText : ink}
								fill={sel && it.icono === 'Heart' ? c.primaryText : 'none'}
							/>
							{dot ? (
								<View
									style={{
										position: 'absolute',
										top: 3,
										right: 14,
										width: 8,
										height: 8,
										borderRadius: 4,
										backgroundColor: c.secondary
									}}
								/>
							) : null}
						</View>
						<Text
							numberOfLines={1}
							maxFontSizeMultiplier={1.3}
							style={[t.typography.labelSm, { color: ink }]}
						>
							{it.etiqueta}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
