/**
 * @file Disparador compacto "Ordenar: Precio ↑" y lista de opciones en radio
 *   dentro de un `BottomSheet`; elegir aplica y cierra
 *   (design-system/docs/componentes/SortSelector.md; research R5).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { OPCIONES_ORDEN, opcionOrden } from '../eventos/orden';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';

/**
 * Props de {@link SortSelector}.
 * @typedef {Object} SortSelectorProps
 * @property {string} valor Clave del orden actual (data-model.md › OpcionOrden).
 * @property {function(string): void} alCambiar Recibe la clave elegida.
 */

/**
 * Selector de orden.
 * @param {SortSelectorProps} props Ver {@link SortSelectorProps}.
 * @returns {JSX.Element} Disparador y panel.
 */
export function SortSelector({ valor, alCambiar }) {
	const t = useTheme();
	const c = t.colors;
	const [abierto, setAbierto] = useState(false);
	const actual = opcionOrden(valor);

	const elegir = (clave) => {
		setAbierto(false);
		alCambiar(clave);
	};

	return (
		<>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Ordenar resultados, actual: ${actual.etiqueta}`}
				onPress={() => setAbierto(true)}
				style={({ pressed }) => ({
					minHeight: t.sizes.touchMin,
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[1],
					opacity: pressed ? t.opacity.pressed : 1
				})}
			>
				<Icon name="ArrowUpDown" size={t.sizes.iconSm} color={c.primaryText} />
				<Text style={[t.typography.labelSm, { color: c.primaryText }]}>
					{`Ordenar: ${actual.corta}`}
				</Text>
			</Pressable>
			<BottomSheet
				visible={abierto}
				titulo="Ordenar por"
				alCerrar={() => setAbierto(false)}
			>
				<View accessibilityRole="radiogroup">
					{OPCIONES_ORDEN.map((o) => {
						const marcado = o.clave === actual.clave;
						return (
							<Pressable
								key={o.clave}
								accessibilityRole="radio"
								accessibilityLabel={o.etiqueta}
								accessibilityState={{ checked: marcado }}
								onPress={() => elegir(o.clave)}
								style={({ pressed }) => ({
									minHeight: 52,
									flexDirection: 'row',
									alignItems: 'center',
									gap: t.spacing[3],
									opacity: pressed ? t.opacity.pressed : 1
								})}
							>
								<View
									style={{
										width: 22,
										height: 22,
										borderRadius: t.radius.full,
										borderWidth: 2,
										borderColor: marcado ? c.primary : c.borderStrong,
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									{marcado ? (
										<View
											style={{
												width: 10,
												height: 10,
												borderRadius: t.radius.full,
												backgroundColor: c.primary
											}}
										/>
									) : null}
								</View>
								<Text style={[t.typography.body, { color: c.text }]}>
									{o.etiqueta}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</BottomSheet>
		</>
	);
}
