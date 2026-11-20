/**
 * @file Pantalla provisoria de una pestaña o ruta: header y estado vacío. Las
 *   features 004–008 reemplazan cada uso por la pantalla real.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';

/**
 * Props de {@link PantallaProvisoria}.
 * @typedef {Object} PantallaProvisoriaProps
 * @property {string} titulo Título de la pantalla.
 * @property {'ticket'|'search'|'heart'|'message'} [icono] Ícono del estado vacío.
 * @property {string} [tituloVacio] Título del estado vacío ("Próximamente" por defecto).
 * @property {string} [cuerpo] Texto del estado vacío.
 * @property {function(): void} [alVolver] Si se pasa, usa el header `default` con "Volver"
 *   (pantallas internas); si no, el header `large` (raíz de pestaña).
 */

/**
 * Pantalla con {@link AppHeader} y un {@link EmptyState}.
 * @param props Ver {@link PantallaProvisoriaProps}.
 * @returns {JSX.Element} Pantalla provisoria.
 */
export function PantallaProvisoria({
	titulo,
	icono = 'ticket',
	tituloVacio = 'Próximamente',
	cuerpo = 'Estamos preparando esta sección.',
	alVolver
}) {
	const t = useTheme();
	return (
		<View style={{ flex: 1, backgroundColor: t.colors.bg }}>
			<AppHeader
				variante={alVolver ? 'default' : 'large'}
				titulo={titulo}
				alVolver={alVolver ?? false}
			/>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
			>
				<EmptyState icono={icono} titulo={tituloVacio} cuerpo={cuerpo} />
			</ScrollView>
		</View>
	);
}
