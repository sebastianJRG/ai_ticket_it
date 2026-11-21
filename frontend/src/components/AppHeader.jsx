/**
 * @file Header de pantalla: default (volver + título + acciones), large (raíz
 *   de pestaña) y transparent (sobre imagen)
 *   (design-system/docs/componentes/AppHeader.md).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { IconButton } from './IconButton';

/** Máximo de acciones a la derecha (el resto iría a un menú "más", fuera de alcance). */
const MAX_ACCIONES = 2;

/**
 * Acción del header.
 * @typedef {Object} AccionHeader
 * @property {string} icono Nombre del ícono Lucide.
 * @property {string} label Texto accesible.
 * @property {function(): void} alPresionar Handler.
 */

/**
 * Props de {@link AppHeader}.
 * @typedef {Object} AppHeaderProps
 * @property {string} titulo Título (no se muestra en `transparent`).
 * @property {string} [subtitulo] Contexto (p. ej. nombre del evento).
 * @property {'default'|'large'|'transparent'} [variante] Variante visual.
 * @property {(function(): void)|false} [alVolver] Si es función, muestra "Volver" (no en `large`).
 * @property {AccionHeader[]} [acciones] Acciones a la derecha (máximo 2).
 */

/**
 * Header con safe area superior.
 * @param {AppHeaderProps} props Ver {@link AppHeaderProps}.
 * @returns {JSX.Element} Header de la pantalla.
 */
export function AppHeader({
	titulo,
	subtitulo,
	variante = 'default',
	alVolver = false,
	acciones = []
}) {
	const t = useTheme();
	const insets = useSafeAreaInsets();
	const c = t.colors;
	const visibles = acciones.slice(0, MAX_ACCIONES);

	if (variante === 'large') {
		return (
			<View
				testID="app-header"
				style={{
					paddingTop: insets.top + t.spacing[4],
					paddingHorizontal: t.spacing[4],
					paddingBottom: t.spacing[2],
					backgroundColor: c.bg
				}}
			>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: t.spacing[2]
					}}
				>
					<Text
						accessibilityRole="header"
						maxFontSizeMultiplier={1.4}
						style={[t.typography.displayLg, { color: c.text, flexShrink: 1 }]}
					>
						{titulo}
					</Text>
					<View style={{ flexDirection: 'row', gap: t.spacing[2] }}>
						{visibles.map((a) => (
							<IconButton
								key={a.label}
								icon={a.icono}
								label={a.label}
								variant="filled"
								onPress={a.alPresionar}
							/>
						))}
					</View>
				</View>
				{subtitulo ? (
					<Text
						style={[t.typography.body, { color: c.textMuted, marginTop: 4 }]}
					>
						{subtitulo}
					</Text>
				) : null}
			</View>
		);
	}

	const transparente = variante === 'transparent';
	const varianteBoton = transparente ? 'onImage' : 'plain';
	return (
		<View
			testID="app-header"
			style={{
				height: t.sizes.headerHeight + insets.top,
				paddingTop: insets.top,
				paddingHorizontal: t.spacing[1],
				flexDirection: 'row',
				alignItems: 'center',
				gap: t.spacing[1],
				backgroundColor: transparente ? 'transparent' : c.bg
			}}
		>
			{typeof alVolver === 'function' ? (
				<IconButton
					icon="ChevronLeft"
					label="Volver"
					variant={varianteBoton}
					onPress={alVolver}
				/>
			) : (
				<View style={{ width: t.spacing[2] }} />
			)}
			<View style={{ flex: 1 }}>
				{transparente ? null : (
					<>
						<Text
							accessibilityRole="header"
							numberOfLines={1}
							style={[t.typography.titleMd, { color: c.text }]}
						>
							{titulo}
						</Text>
						{subtitulo ? (
							<Text
								numberOfLines={1}
								style={[t.typography.bodySm, { color: c.textMuted }]}
							>
								{subtitulo}
							</Text>
						) : null}
					</>
				)}
			</View>
			{visibles.map((a) => (
				<IconButton
					key={a.label}
					icon={a.icono}
					label={a.label}
					variant={varianteBoton}
					onPress={a.alPresionar}
				/>
			))}
		</View>
	);
}
