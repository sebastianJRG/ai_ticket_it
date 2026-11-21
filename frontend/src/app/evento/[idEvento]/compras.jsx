/**
 * @file Compras de un evento del ORGANIZADOR (feature 007 US3–US4, CU-02 y
 *   CU-08): disponibilidad por tipo con los números del servidor, pestañas
 *   por estado con contadores, filas con las acciones permitidas y recarga
 *   tras cada acción (specs/007-organizador-eventos/contracts/pantallas.md ›
 *   /evento/[idEvento]/compras; research R1, R10, R11).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import {
	useCanGoBack,
	useFocusEffect,
	useLocalSearchParams,
	useRouter
} from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { formatDate } from '../../../theme/format';
import { useToast } from '../../../feedback/ToastContext';
import { useAccionCompra } from '../../../hooks/useAccionCompra';
import { useComprasEvento } from '../../../hooks/useComprasEvento';
import { useEvento } from '../../../hooks/useEvento';
import { AppHeader } from '../../../components/AppHeader';
import { AvailabilitySummary } from '../../../components/AvailabilitySummary';
import { EmptyState } from '../../../components/EmptyState';
import { OrganizerPurchaseRow } from '../../../components/OrganizerPurchaseRow';
import { Skeleton } from '../../../components/Skeleton';
import { Tabs } from '../../../components/Tabs';
import { ConfirmarAccionCompra } from '../../../compras/ConfirmarAccionCompra';
import {
	PESTANAS_ORGANIZADOR,
	accionesDisponibles,
	agruparPorEstado,
	mensajeErrorAccion,
	resumenDisponibilidad
} from '../../../compras/gestionCompras';
import { esPasado, mensajeError } from '../../../eventos/presentacion';
import { RutaProtegida } from '../../../navegacion/RutaProtegida';
import { RUTAS, hrefCompra } from '../../../navegacion/reglas';

/**
 * Contenido de la pantalla (ya pasó la guardia de acceso).
 * @returns {JSX.Element} Pantalla.
 */
function ComprasEvento() {
	const t = useTheme();
	const c = t.colors;
	const router = useRouter();
	const puedeVolver = useCanGoBack();
	const { idEvento } = useLocalSearchParams();
	const id = Array.isArray(idEvento) ? idEvento[0] : idEvento;
	const { datos, cargando, error, recargar } = useComprasEvento(id);
	const { evento } = useEvento(id);
	const { mostrar } = useToast();
	const [pestana, setPestana] = useState('pendientes');
	const [pedido, setPedido] = useState(null);
	const primerFoco = useRef(true);

	// Sin actualización optimista: tras cada respuesta se recarga desde el servidor.
	const terminar = useCallback(
		(resultado) => {
			setPedido(null);
			if (resultado.ok) {
				const exito = {
					confirmar: 'Compra confirmada',
					reembolsar: 'Compra reembolsada',
					cancelar: 'Compra cancelada'
				}[resultado.accion];
				mostrar({ tono: 'success', titulo: exito });
			} else {
				const m = mensajeErrorAccion(resultado.accion, resultado.error);
				mostrar({
					tono: 'error',
					titulo: m.titulo,
					mensaje: m.cuerpo || undefined
				});
			}
			recargar();
		},
		[mostrar, recargar]
	);
	const { ejecutar, enCurso } = useAccionCompra({ alTerminar: terminar });

	useFocusEffect(
		useCallback(() => {
			if (primerFoco.current) {
				primerFoco.current = false;
				return;
			}
			recargar();
		}, [recargar])
	);

	const grupos = useMemo(() => agruparPorEstado(datos?.compras), [datos]);
	const resumen = useMemo(
		() => resumenDisponibilidad(datos?.disponibilidad),
		[datos]
	);
	const respaldo = datos?.compras?.[0]?.evento ?? null;
	const nombre = evento?.nombre ?? respaldo?.nombre ?? 'Compras del evento';
	const fecha = evento?.fecha ?? respaldo?.fecha ?? null;
	const finalizado = fecha ? esPasado({ fecha }) : false;
	const volver = () =>
		puedeVolver ? router.back() : router.replace(RUTAS.organizador.eventos);
	const verMisEventos = () => router.replace(RUTAS.organizador.eventos);

	const header = (
		<AppHeader
			titulo={nombre}
			subtitulo={fecha ? formatDate(fecha, 'long') : undefined}
			alVolver={volver}
		/>
	);

	if (!datos) {
		let contenido = (
			<View
				accessible
				accessibilityLabel="Cargando compras del evento"
				accessibilityState={{ busy: true }}
				style={{ gap: t.spacing[3] }}
			>
				<Skeleton alto={160} radio="lg" />
				<Skeleton alto={72} radio="md" />
				<Skeleton alto={72} radio="md" />
				<Skeleton alto={72} radio="md" />
			</View>
		);
		if (!cargando && error?.status === 403) {
			contenido = (
				<EmptyState
					titulo="No tenés acceso a este evento"
					cuerpo="Solo el organizador del evento puede ver sus compras."
					accion={{ etiqueta: 'Ver mis eventos', alPresionar: verMisEventos }}
				/>
			);
		} else if (!cargando && (error?.status === 404 || error?.status === 400)) {
			contenido = (
				<EmptyState
					icono="search"
					titulo="Este evento no existe"
					cuerpo="Puede que lo hayan quitado o que el enlace esté mal."
					accion={{ etiqueta: 'Ver mis eventos', alPresionar: verMisEventos }}
				/>
			);
		} else if (!cargando && error) {
			const m = mensajeError(error);
			contenido = (
				<EmptyState
					titulo={m.titulo}
					cuerpo={m.cuerpo}
					accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
				/>
			);
		}
		return (
			<View style={{ flex: 1, backgroundColor: c.bg }}>
				{header}
				<View style={{ flex: 1, padding: t.spacing[4] }}>{contenido}</View>
			</View>
		);
	}

	const actual = PESTANAS_ORGANIZADOR.find((p) => p.clave === pestana);
	const pestanas = PESTANAS_ORGANIZADOR.map((p) => ({
		clave: p.clave,
		etiqueta: p.etiqueta,
		contador: grupos[p.clave].length
	}));
	const lista = grupos[pestana];
	const alAccion = (accion, compra) => {
		if (accion === 'confirmar') ejecutar(accion, compra);
		else setPedido({ accion, compra });
	};
	const sinCompras = datos.compras.length === 0;

	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			{header}
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={cargando}
						onRefresh={recargar}
						tintColor={c.primary}
						colors={[c.primary]}
					/>
				}
				contentContainerStyle={{
					padding: t.spacing[4],
					gap: t.spacing[4],
					paddingBottom: t.spacing[8]
				}}
			>
				{finalizado ? (
					<View
						style={{
							alignSelf: 'flex-start',
							paddingHorizontal: t.spacing[2],
							paddingVertical: 2,
							borderRadius: t.radius.sm,
							backgroundColor: c.statusUsedBg
						}}
					>
						<Text style={[t.typography.labelSm, { color: c.statusUsed }]}>
							Finalizado
						</Text>
					</View>
				) : null}
				<AvailabilitySummary resumen={resumen} />
				<Tabs
					pestanas={pestanas}
					seleccionada={pestana}
					alCambiar={setPestana}
					desplazable
				/>
				{sinCompras ? (
					<EmptyState
						titulo="Todavía no hay compras"
						cuerpo="Cuando alguien compre entradas, las vas a ver acá."
					/>
				) : lista.length === 0 ? (
					<EmptyState titulo={actual.vacio} />
				) : (
					<View>
						{lista.map((compra) => (
							<OrganizerPurchaseRow
								key={compra.id}
								compra={compra}
								acciones={accionesDisponibles(compra, fecha)}
								enCurso={
									enCurso?.idCompra === compra.id ? enCurso.accion : null
								}
								deshabilitada={!!enCurso && enCurso.idCompra !== compra.id}
								alAccion={(accion) => alAccion(accion, compra)}
								alPresionar={() =>
									router.push(hrefCompra(compra.id, { eventoId: id }))
								}
							/>
						))}
					</View>
				)}
			</ScrollView>
			<ConfirmarAccionCompra
				pedido={pedido}
				cargando={!!enCurso}
				alConfirmar={() => pedido && ejecutar(pedido.accion, pedido.compra)}
				alCerrar={() => setPedido(null)}
			/>
		</View>
	);
}

/**
 * Ruta protegida: solo ORGANIZADOR (reglas.js › COMPRAS_EVENTO).
 * @returns {JSX.Element} Pantalla o redirección.
 */
export default function ComprasEventoRuta() {
	return (
		<RutaProtegida>
			<ComprasEvento />
		</RutaProtegida>
	);
}
