/**
 * @file Detalle de una compra del COMPRADOR (feature 006 US2–US4, CU-01/CU-07/
 *   CU-08/CU-09): resumen, estado con días restantes, pestañas Detalle y Chat,
 *   línea de estado, cancelación y calificación del evento. No hay ruta de una
 *   sola compra: se busca en el listado (specs/006-mis-compras-comprador/
 *   contracts/pantallas.md › /compra/[idCompra]; research R1, R2, R10). La
 *   pestaña Chat monta `ChatCompra` (feature 008, CU-05/CU-06), con el resumen
 *   y las pestañas como encabezado de la lista (specs/008-chat-compra/
 *   research.md R1). Con sesión de ORGANIZADOR
 *   muestra la variante del organizador (feature 007 US5, research R9): lee
 *   `?evento=`, busca la compra en las compras de ese evento y no ofrece
 *   acciones de estado (viven en las compras del evento); su pestaña Chat
 *   monta el mismo `ChatCompra` (feature 008 US2).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback, useRef, useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View
} from 'react-native';
import {
	useCanGoBack,
	useFocusEffect,
	useLocalSearchParams,
	useRouter
} from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate, formatPrice } from '../../theme/format';
import { useAuth } from '../../auth/AuthContext';
import { useComprasEvento } from '../../hooks/useComprasEvento';
import { useMisCompras } from '../../hooks/useMisCompras';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ResumenCompra } from '../../components/ResumenCompra';
import { Skeleton } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import { StatusTimeline } from '../../components/StatusTimeline';
import { Tabs } from '../../components/Tabs';
import { ConfirmarCancelacion } from '../../compras/ConfirmarCancelacion';
import {
	esCancelable,
	mensajeErrorListado,
	pasosLinea
} from '../../compras/misCompras';
import { nombreComprador } from '../../compras/gestionCompras';
import { mensajeError } from '../../eventos/presentacion';
import { SeccionCalificacion } from '../../resenias/SeccionCalificacion';
import { ChatCompra } from '../../mensajes/ChatCompra';
import { RutaProtegida } from '../../navegacion/RutaProtegida';
import { RUTAS } from '../../navegacion/reglas';

const PESTANAS = [
	{ clave: 'detalle', etiqueta: 'Detalle' },
	{ clave: 'chat', etiqueta: 'Chat' }
];

/**
 * Primer valor de un parámetro de ruta.
 * @param {string|string[]|undefined} valor Parámetro de `useLocalSearchParams`.
 * @returns {string|undefined} Valor.
 */
const primero = (valor) => (Array.isArray(valor) ? valor[0] : valor);

/**
 * Encabezado del detalle del COMPRADOR: fecha, resumen, estado con días y
 * pestañas. Se usa arriba de la pestaña Detalle y como encabezado del chat.
 * @param {object} t Theme activo.
 * @param {object} compra Compra del listado.
 * @param {string} pestana Pestaña seleccionada.
 * @param {function(string): void} setPestana Cambia de pestaña.
 * @returns {JSX.Element} Encabezado.
 */
function encabezadoComprador(t, compra, pestana, setPestana) {
	return (
		<>
			<View style={{ gap: t.spacing[3] }}>
				<Text style={[t.typography.body, { color: t.colors.textMuted }]}>
					{formatDate(compra.evento.fecha, 'long')}
				</Text>
				<ResumenCompra
					titulo={compra.evento.nombre}
					lineas={[
						{
							etiqueta: `${compra.cantidad} × ${compra.tipoEntrada.nombre}`,
							valor: `${formatPrice(compra.tipoEntrada.precio)} c/u`
						}
					]}
					total={formatPrice(compra.total)}
				/>
				<StatusBadge status={compra.estado} daysLeft={compra.diasRestantes} />
			</View>
			<Tabs
				variante="segmented"
				pestanas={PESTANAS}
				seleccionada={pestana}
				alCambiar={setPestana}
			/>
		</>
	);
}

/**
 * Encabezado del detalle del ORGANIZADOR: fecha, resumen, comprador, estado y
 * pestañas. Se usa arriba de la pestaña Detalle y como encabezado del chat.
 * @param {object} t Theme activo.
 * @param {object} compra Compra de las compras del evento.
 * @param {string} pestana Pestaña seleccionada.
 * @param {function(string): void} setPestana Cambia de pestaña.
 * @returns {JSX.Element} Encabezado.
 */
function encabezadoOrganizador(t, compra, pestana, setPestana) {
	return (
		<>
			<View style={{ gap: t.spacing[3] }}>
				<Text style={[t.typography.body, { color: t.colors.textMuted }]}>
					{formatDate(compra.evento.fecha, 'long')}
				</Text>
				<ResumenCompra
					titulo={compra.evento.nombre}
					lineas={[
						{
							etiqueta: `${compra.cantidad} × ${compra.tipoEntrada.nombre}`,
							valor: `${formatPrice(compra.tipoEntrada.precio)} c/u`
						}
					]}
					total={formatPrice(compra.total)}
				/>
				<Text style={[t.typography.bodyStrong, { color: t.colors.text }]}>
					{`Comprador: ${nombreComprador(compra)}`}
				</Text>
				<StatusBadge status={compra.estado} size="sm" />
			</View>
			<Tabs
				variante="segmented"
				pestanas={PESTANAS}
				seleccionada={pestana}
				alCambiar={setPestana}
			/>
		</>
	);
}

/**
 * Variante del ORGANIZADOR (feature 007, research R9): busca la compra en las
 * compras del evento de `?evento=`; sin acciones de estado.
 * @returns {JSX.Element} Pantalla.
 */
function DetalleCompraOrganizador() {
	const t = useTheme();
	const c = t.colors;
	const router = useRouter();
	const puedeVolver = useCanGoBack();
	const params = useLocalSearchParams();
	const id = primero(params.idCompra);
	const eventoId = primero(params.evento);
	const { datos, cargando, error, recargar } = useComprasEvento(eventoId);
	const [pestana, setPestana] = useState('detalle');
	const compra = datos?.compras?.find((x) => x.id === id) ?? null;
	const volver = () =>
		puedeVolver ? router.back() : router.replace(RUTAS.organizador.mensajes);
	const verMisEventos = () => router.replace(RUTAS.organizador.eventos);

	let contenido;
	if (cargando) {
		contenido = (
			<View
				accessible
				accessibilityLabel="Cargando compra"
				accessibilityState={{ busy: true }}
				style={{ gap: t.spacing[3] }}
			>
				<Skeleton ancho="60%" alto={24} />
				<Skeleton alto={140} radio="lg" />
			</View>
		);
	} else if (error?.status === 403) {
		contenido = (
			<EmptyState
				titulo="No tenés acceso a esta compra"
				cuerpo="Solo el organizador del evento puede verla."
				accion={{ etiqueta: 'Ver mis eventos', alPresionar: verMisEventos }}
			/>
		);
	} else if (error && error.status !== 404 && error.status !== 400) {
		const m = mensajeError(error);
		contenido = (
			<EmptyState
				titulo={m.titulo}
				cuerpo={m.cuerpo}
				accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
			/>
		);
	} else if (!compra) {
		contenido = (
			<EmptyState
				titulo="No encontramos esta compra"
				cuerpo="Puede que el enlace esté incompleto o que la compra ya no exista."
				accion={{ etiqueta: 'Ver mis eventos', alPresionar: verMisEventos }}
			/>
		);
	} else {
		contenido = (
			<>
				{encabezadoOrganizador(t, compra, pestana, setPestana)}
				{pestana === 'detalle' ? (
					<View style={{ gap: t.spacing[3] }}>
						<Text style={[t.typography.titleSm, { color: c.text }]}>
							Estado de la compra
						</Text>
						<StatusTimeline pasos={pasosLinea(compra.estado)} />
					</View>
				) : null}
			</>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			<AppHeader
				titulo="Detalle de compra"
				subtitulo={compra?.evento.nombre}
				alVolver={volver}
			/>
			{compra && pestana === 'chat' ? (
				<ChatCompra
					idCompra={compra.id}
					activo={pestana === 'chat'}
					rolOtro="comprador"
					encabezado={encabezadoOrganizador(t, compra, pestana, setPestana)}
				/>
			) : (
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				>
					<ScrollView
						keyboardShouldPersistTaps="handled"
						contentContainerStyle={{
							padding: t.spacing[4],
							paddingBottom: t.spacing[10],
							gap: t.spacing[6]
						}}
					>
						{contenido}
					</ScrollView>
				</KeyboardAvoidingView>
			)}
		</View>
	);
}

/**
 * Elige la variante según el rol de la sesión (ya pasó la guardia de acceso).
 * @returns {JSX.Element} Variante del detalle.
 */
function DetalleCompra() {
	const { usuario } = useAuth();
	return usuario?.rol === 'ORGANIZADOR' ? (
		<DetalleCompraOrganizador />
	) : (
		<DetalleCompraComprador />
	);
}

/**
 * Variante del COMPRADOR (feature 006).
 * @returns {JSX.Element} Pantalla.
 */
function DetalleCompraComprador() {
	const t = useTheme();
	const c = t.colors;
	const router = useRouter();
	const puedeVolver = useCanGoBack();
	const { idCompra } = useLocalSearchParams();
	const id = Array.isArray(idCompra) ? idCompra[0] : idCompra;
	const { compras, cargando, error, recargar } = useMisCompras();
	const [pestana, setPestana] = useState('detalle');
	const [aCancelar, setACancelar] = useState(null);
	const cerrarDialogo = useCallback(() => setACancelar(null), []);
	const primerFoco = useRef(true);

	useFocusEffect(
		useCallback(() => {
			if (primerFoco.current) {
				primerFoco.current = false;
				return;
			}
			recargar();
		}, [recargar])
	);

	const volver = () =>
		puedeVolver ? router.back() : router.replace(RUTAS.compras);
	const compra = compras?.find((x) => x.id === id) ?? null;

	let contenido;
	if (cargando) {
		contenido = (
			<View
				accessible
				accessibilityLabel="Cargando compra"
				accessibilityState={{ busy: true }}
				style={{ gap: t.spacing[3] }}
			>
				<Skeleton ancho="60%" alto={24} />
				<Skeleton alto={140} radio="lg" />
				<Skeleton ancho={120} alto={28} />
			</View>
		);
	} else if (!compras && error) {
		const m = mensajeErrorListado(error);
		contenido = (
			<EmptyState
				titulo={m.titulo}
				cuerpo={m.cuerpo}
				accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
			/>
		);
	} else if (!compra) {
		contenido = (
			<EmptyState
				titulo="No encontramos esta compra"
				cuerpo="Puede que ya no esté en tu cuenta."
				accion={{
					etiqueta: 'Ver mis compras',
					alPresionar: () => router.replace(RUTAS.compras)
				}}
			/>
		);
	} else {
		contenido = (
			<>
				{encabezadoComprador(t, compra, pestana, setPestana)}
				{pestana === 'detalle' ? (
					<View style={{ gap: t.spacing[6] }}>
						<View style={{ gap: t.spacing[3] }}>
							<Text style={[t.typography.titleSm, { color: c.text }]}>
								Estado de la compra
							</Text>
							<StatusTimeline pasos={pasosLinea(compra.estado)} />
						</View>
						{esCancelable(compra) ? (
							<Button variant="secondary" onPress={() => setACancelar(compra)}>
								Cancelar compra
							</Button>
						) : null}
						{compra.estado === 'UTILIZADA' ? (
							<SeccionCalificacion eventoId={compra.evento.id} />
						) : null}
					</View>
				) : null}
			</>
		);
	}

	const enChat = Boolean(compra) && pestana === 'chat';

	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			<AppHeader
				titulo="Detalle de compra"
				subtitulo={compra?.evento.nombre}
				alVolver={volver}
			/>
			{enChat ? (
				<ChatCompra
					idCompra={compra.id}
					activo={pestana === 'chat'}
					rolOtro="organizador"
					encabezado={encabezadoComprador(t, compra, pestana, setPestana)}
				/>
			) : (
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				>
					<ScrollView
						keyboardShouldPersistTaps="handled"
						contentContainerStyle={{
							padding: t.spacing[4],
							paddingBottom: t.spacing[10],
							gap: t.spacing[6]
						}}
					>
						{contenido}
					</ScrollView>
				</KeyboardAvoidingView>
			)}
			<ConfirmarCancelacion
				compra={aCancelar}
				alCerrar={cerrarDialogo}
				alTerminar={recargar}
			/>
		</View>
	);
}

/**
 * Ruta `/compra/[idCompra]`: COMPRADOR (sus compras) u ORGANIZADOR (con
 * `?evento=`); el visitante va a login con `volverA`.
 * @returns {JSX.Element} Detalle protegido.
 */
export default function PantallaDetalleCompra() {
	return (
		<RutaProtegida>
			<DetalleCompra />
		</RutaProtegida>
	);
}
