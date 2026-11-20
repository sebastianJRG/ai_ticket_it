/**
 * @file Diálogo centrado para confirmar decisiones importantes o irreversibles
 *   (design-system/docs/componentes/Modal.md), sobre el `Modal` de React Native.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Modal as RNModal, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';
import { Button } from './Button';

/**
 * Props de {@link Modal}.
 * @typedef {Object} ModalProps
 * @property {boolean} visible Si el diálogo está abierto.
 * @property {string} titulo Pregunta que se confirma.
 * @property {string} [cuerpo] Impacto concreto (cantidad, monto, plazo).
 * @property {string} [icono] Nombre del ícono Lucide.
 * @property {string} [etiquetaConfirmar] Verbo exacto (`Confirmar` por defecto).
 * @property {string} [etiquetaCancelar] Acción que conserva (`Volver` por defecto).
 * @property {boolean} [destructivo] Confirmación irreversible (botón destructive).
 * @property {boolean} [cargando] Confirmación en curso: spinner y cancelar deshabilitado.
 * @property {function(): void} alConfirmar Se llama al confirmar.
 * @property {function(): void} alCancelar Se llama al cancelar o con el back de Android.
 */

/**
 * Diálogo de confirmación accesible.
 * @param props Ver {@link ModalProps}.
 * @returns {JSX.Element} Modal nativo.
 */
export function Modal({
	visible,
	titulo,
	cuerpo,
	icono,
	etiquetaConfirmar = 'Confirmar',
	etiquetaCancelar = 'Volver',
	destructivo = false,
	cargando = false,
	alConfirmar,
	alCancelar
}) {
	const t = useTheme();
	const c = t.colors;
	const cancelar = () => {
		if (!cargando) alCancelar();
	};
	return (
		<RNModal
			testID="modal"
			visible={visible}
			transparent
			animationType="fade"
			statusBarTranslucent
			onRequestClose={cancelar}
		>
			<View
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					padding: t.spacing[6],
					backgroundColor: c.scrimModal
				}}
			>
				<View
					testID="modal-dialogo"
					accessibilityViewIsModal
					style={[
						{
							width: '100%',
							maxWidth: 400,
							padding: t.spacing[6],
							gap: t.spacing[3],
							borderRadius: t.radius.xl,
							backgroundColor: c.surfaceOverlay
						},
						t.shadows.shadowLg
					]}
				>
					{icono ? (
						<View
							style={{
								width: 48,
								height: 48,
								borderRadius: t.radius.full,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: destructivo ? c.errorSoft : c.infoSoft
							}}
						>
							<Icon
								name={icono}
								size={t.sizes.iconLg}
								color={destructivo ? c.error : c.info}
							/>
						</View>
					) : null}
					<Text
						accessibilityRole="header"
						style={[t.typography.titleLg, { color: c.text }]}
					>
						{titulo}
					</Text>
					{cuerpo ? (
						<Text style={[t.typography.body, { color: c.textMuted }]}>
							{cuerpo}
						</Text>
					) : null}
					<View style={{ gap: t.spacing[2], marginTop: t.spacing[2] }}>
						<Button
							variant={destructivo ? 'destructive' : 'primary'}
							loading={cargando}
							accessibilityLabel={etiquetaConfirmar}
							onPress={alConfirmar}
						>
							{etiquetaConfirmar}
						</Button>
						<Button variant="secondary" disabled={cargando} onPress={cancelar}>
							{etiquetaCancelar}
						</Button>
					</View>
				</View>
			</View>
		</RNModal>
	);
}
