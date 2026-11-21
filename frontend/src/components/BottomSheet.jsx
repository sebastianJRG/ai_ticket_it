/**
 * @file Panel que sube desde abajo para elegir opciones, sobre el `Modal` de
 *   React Native (sin dependencias nuevas; design-system/docs/componentes/BottomSheet.md,
 *   specs/004-explorar-busqueda-favoritos/research.md R6).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Modal as RNModal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { IconButton } from './IconButton';

/**
 * Props de {@link BottomSheet}.
 * @typedef {Object} BottomSheetProps
 * @property {boolean} visible Si está abierto.
 * @property {string} titulo Título del panel.
 * @property {function(): void} alCerrar Cierre por "Cerrar", toque en el fondo o back de Android.
 * @property {import('react').ReactNode} children Contenido.
 */

/**
 * Panel inferior modal.
 * @param {BottomSheetProps} props Ver {@link BottomSheetProps}.
 * @returns {JSX.Element} Modal con el panel.
 */
export function BottomSheet({ visible, titulo, alCerrar, children }) {
	const t = useTheme();
	const c = t.colors;
	const insets = useSafeAreaInsets();
	return (
		<RNModal
			testID="bottom-sheet"
			visible={visible}
			transparent
			animationType="slide"
			statusBarTranslucent
			onRequestClose={alCerrar}
		>
			<View style={{ flex: 1, justifyContent: 'flex-end' }}>
				<Pressable
					testID="bottom-sheet-fondo"
					accessible={false}
					onPress={alCerrar}
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: c.scrimModal
					}}
				/>
				<View
					accessibilityViewIsModal
					style={{
						backgroundColor: c.surfaceOverlay,
						borderTopLeftRadius: t.radius.xl,
						borderTopRightRadius: t.radius.xl,
						padding: t.spacing[5],
						paddingTop: t.spacing[2],
						paddingBottom: insets.bottom + t.spacing[5],
						gap: t.spacing[3]
					}}
				>
					<View
						accessible={false}
						style={{
							alignSelf: 'center',
							width: 40,
							height: 4,
							borderRadius: t.radius.full,
							backgroundColor: c.borderStrong
						}}
					/>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between'
						}}
					>
						<Text
							accessibilityRole="header"
							style={[t.typography.titleMd, { color: c.text, flex: 1 }]}
						>
							{titulo}
						</Text>
						<IconButton icon="X" label="Cerrar" onPress={alCerrar} />
					</View>
					{children}
				</View>
			</View>
		</RNModal>
	);
}
