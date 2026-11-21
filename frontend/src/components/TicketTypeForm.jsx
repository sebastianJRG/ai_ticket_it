/**
 * @file Bloque de alta de un tipo de entrada (nombre, descripción, precio,
 *   cupo), repetible dentro de Crear evento (design-system/docs/componentes/
 *   TicketTypeForm.md; specs/007-organizador-eventos/research.md R6).
 *   Presentacional: la confirmación al quitar la decide el padre.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { IconButton } from './IconButton';
import { TextField } from './TextField';

const SUGERENCIAS = ['General', 'Platea', 'VIP'];

/**
 * Props de {@link TicketTypeForm}.
 * @typedef {Object} TicketTypeFormProps
 * @property {number} numero Posición (1, 2, …) para "Tipo de entrada N".
 * @property {import('../eventos/formularioEvento').TipoEntradaBorrador} tipo Tipo en edición.
 * @property {{nombre?: string, descripcion?: string, precio?: string, cupo?: string}} [errores] Errores visibles por campo.
 * @property {boolean} [quitable] Muestra la papelera.
 * @property {function(string, string): void} alCambiar Recibe campo y texto.
 * @property {function(string): void} alPerderFoco Recibe el campo que perdió el foco.
 * @property {function(): void} [alQuitar] Toque en la papelera.
 */

/**
 * Formulario de un tipo de entrada.
 * @param {TicketTypeFormProps} props Ver {@link TicketTypeFormProps}.
 * @returns {JSX.Element} Bloque.
 */
export function TicketTypeForm({
	numero,
	tipo,
	errores = {},
	quitable,
	alCambiar,
	alPerderFoco,
	alQuitar
}) {
	const t = useTheme();
	const c = t.colors;
	const campo = (nombre) => ({
		value: tipo[nombre],
		error: errores[nombre],
		required: true,
		onChangeText: (texto) => alCambiar(nombre, texto),
		onBlur: () => alPerderFoco(nombre)
	});
	return (
		<View
			testID="ticket-type-form"
			style={{
				gap: t.spacing[3],
				padding: t.spacing[4],
				borderRadius: t.radius.lg,
				borderWidth: 1,
				borderColor: c.border,
				backgroundColor: c.surface
			}}
		>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					minHeight: t.sizes.touchMin
				}}
			>
				<Text
					accessibilityRole="header"
					style={[t.typography.titleSm, { color: c.text }]}
				>
					{`Tipo de entrada ${numero}`}
				</Text>
				{quitable ? (
					<IconButton
						icon="Trash2"
						label={`Quitar tipo de entrada ${numero}`}
						color={c.error}
						onPress={alQuitar}
					/>
				) : null}
			</View>
			<TextField
				label="Nombre"
				placeholder={SUGERENCIAS[(numero - 1) % SUGERENCIAS.length]}
				{...campo('nombre')}
			/>
			<TextField
				label="Descripción"
				placeholder="Qué incluye esta entrada"
				{...campo('descripcion')}
			/>
			<View style={{ flexDirection: 'row', gap: t.spacing[3] }}>
				<View style={{ flex: 1 }}>
					<TextField
						label="Precio"
						prefix="$"
						helper="0 = gratis"
						keyboardType="decimal-pad"
						{...campo('precio')}
					/>
				</View>
				<View style={{ flex: 1 }}>
					<TextField
						label="Cupo"
						suffix="entradas"
						keyboardType="number-pad"
						{...campo('cupo')}
					/>
				</View>
			</View>
		</View>
	);
}
