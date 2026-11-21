/**
 * @file Chat de una compra, el mismo para comprador y organizador (feature
 *   008, FR-006; specs/008-chat-compra/contracts/componentes.md › ChatCompra):
 *   lista virtualizada con el encabezado de la pantalla, separadores de día,
 *   burbujas y el composer fijo abajo, pegado al teclado (research R1, R7, R9).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Text,
	View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { useChatCompra } from '../hooks/useChatCompra';
import { ChatBubble } from '../components/ChatBubble';
import { EmptyState } from '../components/EmptyState';
import { MessageComposer } from '../components/MessageComposer';
import { Skeleton } from '../components/Skeleton';
import { agruparMensajes, mensajeErrorChat, validarMensaje } from './chat';

/** Texto del estado vacío según quién es el otro participante (research R9). */
const CUERPO_VACIO = {
	organizador: 'Escribile al organizador si tenés dudas sobre tu compra.',
	comprador: 'Escribile al comprador sobre esta compra.'
};

/**
 * Props de {@link ChatCompra}.
 * @typedef {Object} ChatCompraProps
 * @property {string} idCompra ID de la compra.
 * @property {boolean} activo Si el chat está visible (habilita las consultas).
 * @property {React.ReactNode} encabezado Resumen y pestañas de la pantalla.
 * @property {'organizador'|'comprador'} rolOtro Rol del otro participante (texto del vacío).
 */

/**
 * Chat de una compra.
 * @param {ChatCompraProps} props Ver {@link ChatCompraProps}.
 * @returns {JSX.Element} Chat.
 */
export function ChatCompra({ idCompra, activo, encabezado, rolOtro }) {
	const t = useTheme();
	const insets = useSafeAreaInsets();
	const { usuario } = useAuth();
	const { mensajes, cargando, error, enviar, reintentar, recargar } =
		useChatCompra(idCompra, { activo });
	const [texto, setTexto] = useState('');
	const lista = useRef(null);
	const bajar = useRef({ pendiente: true, animado: false });

	const items = useMemo(
		() => agruparMensajes(mensajes, usuario?.id),
		[mensajes, usuario?.id]
	);
	const validacion = validarMensaje(texto);

	const alEnviar = useCallback(() => {
		if (!validarMensaje(texto).valido) return;
		enviar(texto);
		setTexto('');
		bajar.current = { pendiente: true, animado: true };
	}, [enviar, texto]);

	const alCambiarTamano = useCallback(() => {
		if (!bajar.current.pendiente || cargando) return;
		lista.current?.scrollToEnd?.({ animated: bajar.current.animado });
		bajar.current = { pendiente: false, animado: true };
	}, [cargando]);

	const renderItem = useCallback(
		({ item }) =>
			item.tipo === 'dia' ? (
				<Text
					style={[
						t.typography.overline,
						{
							color: t.colors.textSubtle,
							textAlign: 'center',
							paddingVertical: t.spacing[2]
						}
					]}
				>
					{item.etiqueta}
				</Text>
			) : (
				<ChatBubble
					texto={item.texto}
					hora={item.hora}
					propio={item.propio}
					autor={item.autor}
					mostrarAutor={item.mostrarAutor}
					estado={item.estado}
					error={item.error}
					alReintentar={
						item.estado === 'error' ? () => reintentar(item.clave) : undefined
					}
				/>
			),
		[reintentar, t]
	);

	let vacio = null;
	if (cargando) {
		vacio = (
			<View
				accessible
				accessibilityLabel="Cargando mensajes"
				accessibilityState={{ busy: true }}
				style={{ gap: t.spacing[3] }}
			>
				<Skeleton ancho="60%" alto={44} radio="lg" />
				<Skeleton
					ancho="55%"
					alto={44}
					radio="lg"
					estilo={{ alignSelf: 'flex-end' }}
				/>
				<Skeleton ancho="70%" alto={64} radio="lg" />
			</View>
		);
	} else if (error) {
		const m = mensajeErrorChat(error);
		vacio = (
			<EmptyState
				icono="message"
				titulo={m.titulo}
				cuerpo={m.cuerpo}
				accion={
					m.reintentable
						? { etiqueta: 'Reintentar', alPresionar: recargar }
						: undefined
				}
			/>
		);
	} else {
		vacio = (
			<EmptyState
				icono="message"
				titulo="Todavía no hay mensajes"
				cuerpo={CUERPO_VACIO[rolOtro] ?? CUERPO_VACIO.organizador}
			/>
		);
	}

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<FlatList
				ref={lista}
				data={error ? [] : items}
				keyExtractor={(item) => item.clave}
				renderItem={renderItem}
				ListHeaderComponent={
					<View style={{ gap: t.spacing[6], paddingBottom: t.spacing[4] }}>
						{encabezado}
					</View>
				}
				ListEmptyComponent={vacio}
				onContentSizeChange={alCambiarTamano}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					padding: t.spacing[4],
					paddingBottom: t.spacing[4],
					gap: t.spacing[1]
				}}
			/>
			{error ? null : (
				<View
					style={{
						paddingHorizontal: t.spacing[4],
						paddingTop: t.spacing[2],
						paddingBottom: Math.max(insets.bottom, t.spacing[2]),
						backgroundColor: t.colors.bg,
						borderTopWidth: 1,
						borderTopColor: t.colors.border
					}}
				>
					<MessageComposer
						valor={texto}
						alCambiar={setTexto}
						alEnviar={alEnviar}
						valido={validacion.valido}
						largo={validacion.largo}
						error={validacion.error}
						deshabilitado={cargando}
					/>
				</View>
			)}
		</KeyboardAvoidingView>
	);
}
