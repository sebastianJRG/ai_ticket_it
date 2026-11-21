/**
 * @file Fila de tipo de entrada: informativa en el detalle o seleccionable
 *   (radio) en el checkout, con el selector de cantidad debajo cuando está
 *   elegida (design-system/docs/componentes/TicketTypeRow.md;
 *   specs/005-detalle-evento-compra/research.md R6, R9).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

/**
 * Props de {@link TicketTypeRow}.
 * @typedef {Object} TicketTypeRowProps
 * @property {string} nombre Nombre del tipo de entrada.
 * @property {string} [descripcion] Descripción (se omite si está vacía).
 * @property {string} precioTexto "$ 25.000" o "Gratis".
 * @property {boolean} [agotado] Muestra "Agotado" y "Sin cupo"; no se puede elegir.
 * @property {string} [cupoTexto] Entradas que quedan ("Quedan 5 entradas"); no se muestra si está agotado.
 * @property {boolean} [quedanPocas] Destaca `cupoTexto` con `secondary-text`.
 * @property {boolean} [interactive] `true` en el checkout (radio); `false` en el detalle.
 * @property {boolean} [seleccionado] Solo interactivo: fila elegida.
 * @property {function(): void} [alSeleccionar] Solo interactivo: al tocar la fila.
 * @property {boolean} [deshabilitado] Bloquea la selección (p. ej. durante el envío).
 * @property {import('react').ReactNode} [children] Contenido bajo la fila elegida (el selector de cantidad).
 */

/**
 * Fila de tipo de entrada.
 * @param {TicketTypeRowProps} props Ver {@link TicketTypeRowProps}.
 * @returns {JSX.Element} Fila informativa o radio.
 */
export function TicketTypeRow({
	nombre,
	descripcion,
	precioTexto,
	agotado = false,
	cupoTexto,
	quedanPocas = false,
	interactive = false,
	seleccionado = false,
	alSeleccionar,
	deshabilitado = false,
	children
}) {
	const t = useTheme();
	const c = t.colors;
	const marcado = interactive && seleccionado && !agotado;

	const contenido = (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'flex-start',
				gap: t.spacing[3]
			}}
		>
			<View style={{ flex: 1, gap: 2 }}>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: t.spacing[2],
						flexWrap: 'wrap'
					}}
				>
					<Text
						style={[
							t.typography.titleSm,
							{ color: agotado ? c.textMuted : c.text }
						]}
					>
						{nombre}
					</Text>
					{agotado ? (
						<View
							style={{
								paddingHorizontal: t.spacing[2],
								paddingVertical: 2,
								borderRadius: t.radius.xs,
								backgroundColor: c.errorSoft
							}}
						>
							<Text style={[t.typography.labelSm, { color: c.error }]}>
								Agotado
							</Text>
						</View>
					) : null}
				</View>
				{descripcion ? (
					<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
						{descripcion}
					</Text>
				) : null}
				{agotado ? (
					<Text style={[t.typography.caption, { color: c.textSubtle }]}>
						Sin cupo
					</Text>
				) : cupoTexto ? (
					<Text
						style={[
							t.typography.caption,
							{ color: quedanPocas ? c.secondaryText : c.textMuted }
						]}
					>
						{cupoTexto}
					</Text>
				) : null}
			</View>
			<Text
				style={[
					t.typography.price,
					{
						color: agotado ? c.textSubtle : c.text,
						textDecorationLine: agotado ? 'line-through' : 'none'
					}
				]}
			>
				{precioTexto}
			</Text>
			{interactive ? (
				<View
					style={{
						width: 22,
						height: 22,
						marginTop: 2,
						borderRadius: t.radius.full,
						borderWidth: marcado ? 7 : 2,
						borderColor: marcado ? c.primaryText : c.borderStrong,
						opacity: agotado ? 0.4 : 1
					}}
				/>
			) : null}
		</View>
	);

	const estiloFila = {
		padding: t.spacing[4],
		borderRadius: t.radius.lg,
		backgroundColor: agotado ? 'transparent' : c.surface,
		borderWidth: marcado ? 2 : 1,
		borderColor: marcado ? c.primaryText : c.border,
		gap: t.spacing[3]
	};

	if (!interactive) {
		return <View style={estiloFila}>{contenido}</View>;
	}

	const bloqueada = agotado || deshabilitado;
	return (
		<View style={estiloFila}>
			<Pressable
				accessibilityRole="radio"
				accessibilityLabel={`${nombre}, ${precioTexto}${
					agotado
						? ', agotado'
						: cupoTexto
							? `, ${cupoTexto.toLowerCase()}`
							: ''
				}`}
				accessibilityState={{ checked: marcado, disabled: bloqueada }}
				disabled={bloqueada}
				onPress={bloqueada ? undefined : alSeleccionar}
				style={{ minHeight: t.sizes.touchMin, justifyContent: 'center' }}
			>
				{contenido}
			</Pressable>
			{marcado && children ? children : null}
		</View>
	);
}
