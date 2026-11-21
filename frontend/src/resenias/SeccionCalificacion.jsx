/**
 * @file Sección "Calificar evento" del detalle de una compra UTILIZADA:
 *   botón que abre el formulario inline (estrellas + comentario), validación
 *   previa, aviso de errores y toast de agradecimiento; una sola reseña por
 *   evento (specs/006-mis-compras-comprador/contracts/pantallas.md ›
 *   SeccionCalificacion; research R11; CU-09).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../feedback/ToastContext';
import { useCalificarEvento } from '../hooks/useCalificarEvento';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { RatingInput } from '../components/RatingInput';
import { Skeleton } from '../components/Skeleton';
import { TextField } from '../components/TextField';
import { validarResenia } from './calificacion';

/**
 * Props de {@link SeccionCalificacion}.
 * @typedef {Object} SeccionCalificacionProps
 * @property {string} eventoId Evento a calificar.
 */

/**
 * Sección de calificación del evento.
 * @param {SeccionCalificacionProps} props Ver {@link SeccionCalificacionProps}.
 * @returns {JSX.Element} Sección.
 */
export function SeccionCalificacion({ eventoId }) {
	const t = useTheme();
	const c = t.colors;
	const { usuario } = useAuth();
	const { mostrar } = useToast();
	const { yaCalificado, verificando, enviar, enviando, error } =
		useCalificarEvento(eventoId, usuario?.id);
	const [abierto, setAbierto] = useState(false);
	const [borrador, setBorrador] = useState({ puntuacion: null, detalle: '' });
	const [errores, setErrores] = useState({});

	const titulo = (
		<Text
			accessibilityRole="header"
			style={[t.typography.titleSm, { color: c.text }]}
		>
			Calificá el evento
		</Text>
	);

	if (verificando) {
		return (
			<View
				accessible
				accessibilityLabel="Verificando tu reseña"
				accessibilityState={{ busy: true }}
				style={{ gap: t.spacing[2] }}
			>
				<Skeleton ancho="50%" alto={18} />
			</View>
		);
	}

	if (yaCalificado) {
		return (
			<View
				accessibilityLiveRegion="polite"
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: t.spacing[2]
				}}
			>
				<Icon name="CircleCheck" size={t.sizes.iconMd} color={c.primaryText} />
				<Text style={[t.typography.bodyStrong, { color: c.text }]}>
					Ya calificaste este evento
				</Text>
			</View>
		);
	}

	if (!abierto) {
		return (
			<View style={{ gap: t.spacing[3] }}>
				{titulo}
				<Text style={[t.typography.body, { color: c.textMuted }]}>
					Contá cómo te fue: tu reseña ayuda a otros compradores.
				</Text>
				<Button onPress={() => setAbierto(true)}>Calificar evento</Button>
			</View>
		);
	}

	const alEnviar = async () => {
		const v = validarResenia(borrador);
		setErrores(v.errores);
		if (!v.valido) return;
		const ok = await enviar(borrador);
		if (ok) mostrar({ tono: 'success', titulo: '¡Gracias por tu reseña!' });
	};

	return (
		<View style={{ gap: t.spacing[4] }}>
			{titulo}
			<RatingInput
				valor={borrador.puntuacion}
				alCambiar={(puntuacion) => {
					setBorrador((b) => ({ ...b, puntuacion }));
					setErrores((e) => ({ ...e, puntuacion: undefined }));
				}}
				error={errores.puntuacion}
				deshabilitado={enviando}
			/>
			<TextField
				label="Comentario"
				required
				multiline
				maxLength={1000}
				placeholder="¿Qué te pareció?"
				value={borrador.detalle}
				error={errores.detalle}
				disabled={enviando}
				onChangeText={(detalle) => {
					setBorrador((b) => ({ ...b, detalle }));
					setErrores((e) => ({ ...e, detalle: undefined }));
				}}
			/>
			{error ? (
				<View
					accessibilityRole="alert"
					accessibilityLiveRegion="polite"
					style={{
						padding: t.spacing[4],
						gap: t.spacing[1],
						borderRadius: t.radius.md,
						backgroundColor: c.errorSoft
					}}
				>
					<Text style={[t.typography.label, { color: c.text }]}>
						{error.titulo}
					</Text>
					{error.cuerpo ? (
						<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
							{error.cuerpo}
						</Text>
					) : null}
				</View>
			) : null}
			<Button loading={enviando} onPress={alEnviar}>
				Enviar reseña
			</Button>
		</View>
	);
}
