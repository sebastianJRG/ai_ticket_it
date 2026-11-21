/**
 * @file Fila horizontal de chips de categoría con "Todo" primero
 *   (design-system/docs/componentes/Chip.md › CategoryChips).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { iconoCategoria } from '../eventos/presentacion';
import { Chip } from './Chip';

/**
 * Props de {@link CategoryChips}.
 * @typedef {Object} CategoryChipsProps
 * @property {{id: string, nombre: string}[]} categorias Categorías del servidor, en su orden.
 * @property {string|null} seleccionada ID elegido, o `null` para "Todo".
 * @property {function((string|null)): void} alCambiar Recibe el ID elegido, o `null` para "Todo".
 */

/**
 * Chips de categoría de selección única.
 * @param {CategoryChipsProps} props Ver {@link CategoryChipsProps}.
 * @returns {JSX.Element} Fila con scroll horizontal.
 */
export function CategoryChips({
	categorias = [],
	seleccionada = null,
	alCambiar
}) {
	const t = useTheme();
	return (
		<View testID="category-chips" accessibilityRole="tablist">
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: t.spacing[4],
					paddingVertical: t.spacing[1],
					gap: t.spacing[2]
				}}
			>
				<Chip
					etiqueta="Todo"
					icono="LayoutGrid"
					rol="tab"
					seleccionado={seleccionada == null}
					alPresionar={() => alCambiar(null)}
				/>
				{categorias.map((cat) => (
					<Chip
						key={cat.id}
						etiqueta={cat.nombre}
						icono={iconoCategoria(cat.nombre)}
						rol="tab"
						seleccionado={seleccionada === cat.id}
						alPresionar={() => alCambiar(cat.id)}
					/>
				))}
			</ScrollView>
		</View>
	);
}
