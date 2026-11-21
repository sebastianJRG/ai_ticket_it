/**
 * @file Fila de compra para el ORGANIZADOR: comprador, tipo × cantidad, total
 *   y estado, con las acciones permitidas (design-system/docs/componentes/
 *   OrganizerPurchaseRow.md; specs/007-organizador-eventos/research.md R11).
 *   Sin antigüedad ni no leídos (el backend no los informa). Presentacional:
 *   las acciones las decide `accionesDisponibles`.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatPrice } from '../theme/format';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { inicialesComprador, nombreComprador } from '../compras/gestionCompras';

const ETIQUETAS = {
	confirmar: 'Confirmar',
	reembolsar: 'Reembolsar',
	cancelar: 'Cancelar'
};

/**
 * Props de {@link OrganizerPurchaseRow}.
 * @typedef {Object} OrganizerPurchaseRowProps
 * @property {object} compra Compra de `GET /api/eventos/:id/compras`.
 * @property {import('../compras/gestionCompras').AccionCompra[]} [acciones] Acciones a mostrar (`[]` o ausente: ninguna).
 * @property {import('../compras/gestionCompras').AccionCompra|null} [enCurso] Acción de esta fila en curso (spinner).
 * @property {boolean} [deshabilitada] Hay otra acción en curso en la pantalla.
 * @property {function(): void} [alPresionar] Abre el detalle de la compra.
 * @property {function(import('../compras/gestionCompras').AccionCompra): void} [alAccion] Toque en una acción.
 */

/**
 * Fila de compra del organizador.
 * @param {OrganizerPurchaseRowProps} props Ver {@link OrganizerPurchaseRowProps}.
 * @returns {JSX.Element} Fila.
 */
export function OrganizerPurchaseRow({
	compra,
	acciones = [],
	enCurso = null,
	deshabilitada = false,
	alPresionar,
	alAccion
}) {
	const t = useTheme();
	const c = t.colors;
	const nombre = nombreComprador(compra);
	const detalle = `${compra.cantidad} × ${compra.tipoEntrada?.nombre ?? ''} · ${formatPrice(compra.total)}`;
	return (
		<View
			testID="organizer-purchase-row"
			style={{
				minHeight: 72,
				paddingVertical: t.spacing[3],
				borderBottomWidth: 1,
				borderBottomColor: c.border,
				gap: t.spacing[2]
			}}
		>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${nombre}, ${detalle}, ${compra.estado.toLowerCase()}`}
				accessibilityHint="Abre el detalle de la compra"
				onPress={alPresionar}
				style={({ pressed }) => ({
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[3],
					opacity: pressed ? t.opacity.pressed : 1
				})}
			>
				<Avatar
					nombre={nombre}
					iniciales={inicialesComprador(compra)}
					tamano={40}
				/>
				<View style={{ flex: 1, gap: 2 }}>
					<Text
						style={[t.typography.label, { color: c.text }]}
						numberOfLines={1}
					>
						{nombre}
					</Text>
					<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
						{detalle}
					</Text>
				</View>
				<StatusBadge status={compra.estado} size="sm" />
			</Pressable>
			{acciones.length > 0 ? (
				<View
					style={{
						flexDirection: 'row',
						gap: t.spacing[2],
						paddingLeft: 40 + t.spacing[3]
					}}
				>
					{acciones.map((accion) => (
						<Button
							key={accion}
							size="sm"
							variant={accion === 'confirmar' ? 'primary' : 'secondary'}
							accessibilityLabel={ETIQUETAS[accion]}
							loading={enCurso === accion}
							disabled={
								deshabilitada || (enCurso !== null && enCurso !== accion)
							}
							onPress={() => alAccion?.(accion)}
						>
							{ETIQUETAS[accion]}
						</Button>
					))}
				</View>
			) : null}
		</View>
	);
}
