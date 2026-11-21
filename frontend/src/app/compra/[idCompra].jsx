/**
 * @file Detalle de una compra del COMPRADOR (feature 006 US2–US4, CU-01/CU-07/
 *   CU-08/CU-09): resumen, estado con días restantes, pestañas Detalle y Chat,
 *   línea de estado, cancelación y calificación del evento. No hay ruta de una
 *   sola compra: se busca en el listado (specs/006-mis-compras-comprador/
 *   contracts/pantallas.md › /compra/[idCompra]; research R1, R2, R10). La
 *   pestaña Chat la completa la feature 008.
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
import { SeccionCalificacion } from '../../resenias/SeccionCalificacion';
import { RutaProtegida } from '../../navegacion/RutaProtegida';
import { RUTAS } from '../../navegacion/reglas';

const PESTANAS = [
	{ clave: 'detalle', etiqueta: 'Detalle' },
	{ clave: 'chat', etiqueta: 'Chat' }
];

/**
 * Contenido del detalle (ya pasó la guardia de acceso).
 * @returns {JSX.Element} Pantalla.
 */
function DetalleCompra() {
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
				<View style={{ gap: t.spacing[3] }}>
					<Text style={[t.typography.body, { color: c.textMuted }]}>
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
				) : (
					<EmptyState
						icono="message"
						titulo="Chat de la compra"
						cuerpo="Muy pronto vas a poder escribirle al organizador desde acá."
					/>
				)}
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
			<ConfirmarCancelacion
				compra={aCancelar}
				alCerrar={cerrarDialogo}
				alTerminar={recargar}
			/>
		</View>
	);
}

/**
 * Ruta `/compra/[idCompra]`: solo COMPRADOR (visitante → login con `volverA`;
 * ORGANIZADOR → sus eventos).
 * @returns {JSX.Element} Detalle protegido.
 */
export default function PantallaDetalleCompra() {
	return (
		<RutaProtegida>
			<DetalleCompra />
		</RutaProtegida>
	);
}
