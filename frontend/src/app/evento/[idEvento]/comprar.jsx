/**
 * @file Checkout de un evento (solo COMPRADOR; feature 005 US3, CU-12): elegir
 *   un tipo de entrada (radio) y una cantidad topada en el cupo, ver el total,
 *   confirmar una sola vez, manejar 400/403/404/409/0 y mostrar el éxito con
 *   el total del servidor (specs/005-detalle-evento-compra/contracts/pantallas.md
 *   › /evento/[idEvento]/comprar; research R6–R8).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useCanGoBack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';
import { formatPrice, formatTickets } from '../../../theme/format';
import { useAuth } from '../../../auth/AuthContext';
import { useEvento } from '../../../hooks/useEvento';
import { useCrearCompra } from '../../../hooks/useCrearCompra';
import { AppHeader } from '../../../components/AppHeader';
import { BarraAccion } from '../../../components/BarraAccion';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Icon } from '../../../components/Icon';
import { QuantityStepper } from '../../../components/QuantityStepper';
import { ResumenCompra } from '../../../components/ResumenCompra';
import { Skeleton } from '../../../components/Skeleton';
import { TicketTypeRow } from '../../../components/TicketTypeRow';
import { aDetalle } from '../../../eventos/detalle';
import { esPasado, mensajeError } from '../../../eventos/presentacion';
import {
	ajustarCantidad,
	limitesCantidad,
	mensajeErrorCompra,
	seleccionInicial,
	textoConfirmar,
	totalEstimado
} from '../../../compras/checkout';
import { RutaProtegida } from '../../../navegacion/RutaProtegida';
import { RUTAS, hrefEvento, rutaInicial } from '../../../navegacion/reglas';

/**
 * Aviso en línea (error de la compra o evento finalizado).
 * @param {{titulo: string, cuerpo?: string, tono: 'error'|'warning', accion?: {etiqueta: string, alPresionar: function(): void}}} props Contenido y tono.
 * @returns {JSX.Element} Aviso anunciado a lectores de pantalla.
 */
function Aviso({ titulo, cuerpo, tono, accion }) {
	const t = useTheme();
	const c = t.colors;
	const color = tono === 'error' ? c.error : c.warning;
	return (
		<View
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
			style={{
				flexDirection: 'row',
				gap: t.spacing[3],
				padding: t.spacing[4],
				borderRadius: t.radius.md,
				backgroundColor: tono === 'error' ? c.errorSoft : c.warningSoft
			}}
		>
			<Icon name="CircleAlert" size={t.sizes.iconMd} color={color} />
			<View style={{ flex: 1, gap: t.spacing[1] }}>
				<Text style={[t.typography.label, { color: c.text }]}>{titulo}</Text>
				{cuerpo ? (
					<Text style={[t.typography.bodySm, { color: c.textMuted }]}>
						{cuerpo}
					</Text>
				) : null}
				{accion ? (
					<View style={{ alignItems: 'flex-start', marginTop: t.spacing[1] }}>
						<Button variant="secondary" size="sm" onPress={accion.alPresionar}>
							{accion.etiqueta}
						</Button>
					</View>
				) : null}
			</View>
		</View>
	);
}

/**
 * Indica si quedan pocas entradas de un tipo (≤ 5 o ≤ 10 % del cupo).
 * @param {import('../../../eventos/detalle').TipoEntradaVista} tipo Tipo de entrada.
 * @returns {boolean} `true` si conviene destacar el cupo.
 */
const quedanPocas = (tipo) =>
	!tipo.agotado &&
	(tipo.disponibles <= 5 || tipo.disponibles <= tipo.cupo * 0.1);

/**
 * Aviso bajo el selector cuando la cantidad llega al tope disponible.
 * @param {import('../../../eventos/detalle').TipoEntradaVista} tipo Tipo elegido.
 * @returns {string} "Solo quedan 5 entradas de General." (o en singular).
 */
const textoTope = (tipo) =>
	tipo.disponibles === 1
		? `Solo queda 1 entrada de ${tipo.nombre}.`
		: `Solo quedan ${tipo.disponibles} entradas de ${tipo.nombre}.`;

/**
 * Contenido del checkout (ya pasó la guardia de acceso).
 * @returns {JSX.Element} Pantalla.
 */
function Checkout() {
	const t = useTheme();
	const c = t.colors;
	const router = useRouter();
	const puedeVolver = useCanGoBack();
	const { usuario } = useAuth();
	const { idEvento } = useLocalSearchParams();
	const id = Array.isArray(idEvento) ? idEvento[0] : idEvento;
	const { evento, cargando, error, noEncontrado, recargar } = useEvento(id);
	const {
		confirmar,
		enviando,
		error: errorCompra,
		compra,
		limpiarError
	} = useCrearCompra();
	const [seleccion, setSeleccion] = useState(null);

	const d = evento ? aDetalle(evento) : null;

	// Cupo insuficiente (409): se vuelve a pedir el evento para mostrar lo que queda.
	useEffect(() => {
		if (errorCompra?.status === 409) recargar();
	}, [errorCompra, recargar]);

	// Si el cupo bajó al recargar, la cantidad elegida se ajusta al nuevo tope.
	useEffect(() => {
		if (!evento || !seleccion?.tipoId) return;
		const tipo = aDetalle(evento).tipos.find((x) => x.id === seleccion.tipoId);
		if (!tipo) return;
		const ajustada = ajustarCantidad(seleccion.cantidad, limitesCantidad(tipo));
		if (ajustada !== seleccion.cantidad) {
			setSeleccion((s) => ({ ...s, cantidad: ajustada }));
		}
	}, [evento, seleccion]);

	useEffect(() => {
		if (evento && seleccion === null) {
			setSeleccion(seleccionInicial(aDetalle(evento).tipos));
		}
	}, [evento, seleccion]);

	const volver = puedeVolver ? router.back : undefined;
	const irAlInicio = () => router.replace(rutaInicial(usuario));

	if (compra) {
		const volverAlEvento = () =>
			puedeVolver ? router.back() : router.replace(hrefEvento(id));
		return (
			<View style={{ flex: 1, backgroundColor: c.bg }}>
				<AppHeader titulo="Comprar entradas" subtitulo={d?.nombre} />
				<ScrollView
					contentContainerStyle={{ padding: t.spacing[4], gap: t.spacing[6] }}
				>
					<View accessibilityLiveRegion="polite">
						<EmptyState
							icono="ticket"
							titulo="Compra creada"
							cuerpo="Quedó pendiente de confirmación del organizador."
						/>
					</View>
					<ResumenCompra
						titulo={compra.evento?.nombre ?? d?.nombre}
						lineas={[
							{
								etiqueta: `${compra.tipoEntrada?.nombre ?? ''} × ${compra.cantidad}`,
								valor: formatTickets(compra.cantidad)
							}
						]}
						total={formatPrice(compra.total)}
					/>
					<View style={{ gap: t.spacing[3] }}>
						<Button size="lg" onPress={() => router.replace(RUTAS.compras)}>
							Ver mis compras
						</Button>
						<Button variant="secondary" onPress={volverAlEvento}>
							Volver al evento
						</Button>
					</View>
				</ScrollView>
			</View>
		);
	}

	if (!evento || !seleccion) {
		let contenido = (
			<View
				accessible
				accessibilityLabel="Cargando checkout"
				style={{ gap: t.spacing[3] }}
			>
				<Skeleton alto={72} radio="lg" />
				<Skeleton alto={72} radio="lg" />
				<Skeleton alto={120} radio="lg" />
			</View>
		);
		if (!cargando && noEncontrado) {
			contenido = (
				<EmptyState
					icono="search"
					titulo="Evento no encontrado"
					cuerpo="Puede que lo hayan quitado o que el enlace esté mal."
					accion={{ etiqueta: 'Volver a Explorar', alPresionar: irAlInicio }}
				/>
			);
		} else if (!cargando && error) {
			const m = mensajeError(error);
			contenido = (
				<EmptyState
					icono="ticket"
					titulo={m.titulo}
					cuerpo={m.cuerpo}
					accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
				/>
			);
		}
		return (
			<View style={{ flex: 1, backgroundColor: c.bg }}>
				<AppHeader titulo="Comprar entradas" alVolver={volver} />
				<View style={{ flex: 1, padding: t.spacing[4] }}>{contenido}</View>
			</View>
		);
	}

	const finalizado = esPasado(evento);
	const tipo = d.tipos.find((x) => x.id === seleccion.tipoId) ?? null;
	const aviso = errorCompra ? mensajeErrorCompra(errorCompra) : null;
	const bloqueado = !tipo || finalizado || !!aviso?.bloquea;

	const elegir = (tipoId) => {
		limpiarError();
		setSeleccion((s) => (s.tipoId === tipoId ? s : { tipoId, cantidad: 1 }));
	};
	const cambiarCantidad = (n) => {
		limpiarError();
		setSeleccion((s) => ({
			...s,
			cantidad: ajustarCantidad(n, limitesCantidad(tipo))
		}));
	};
	const enviar = () =>
		confirmar({
			eventoId: evento.id,
			tipoEntradaId: tipo.id,
			cantidad: seleccion.cantidad
		});

	const total = totalEstimado(tipo, seleccion.cantidad);
	const textoBoton = textoConfirmar({
		tipo,
		cantidad: seleccion.cantidad,
		finalizado
	});
	return (
		<View style={{ flex: 1, backgroundColor: c.bg }}>
			<AppHeader
				titulo="Comprar entradas"
				subtitulo={d.nombre}
				alVolver={volver}
			/>
			<ScrollView
				contentContainerStyle={{
					padding: t.spacing[4],
					gap: t.spacing[4],
					paddingBottom: t.spacing[8]
				}}
			>
				{finalizado ? (
					<Aviso
						tono="warning"
						titulo="Este evento ya ocurrió"
						cuerpo="Ya no se pueden comprar entradas."
					/>
				) : null}

				<Text
					accessibilityRole="header"
					style={[t.typography.titleMd, { color: c.text }]}
				>
					Elegí tu entrada
				</Text>
				<View accessibilityRole="radiogroup" style={{ gap: t.spacing[3] }}>
					{d.tipos.map((x) => {
						const elegido = x.id === seleccion.tipoId;
						return (
							<TicketTypeRow
								key={x.id}
								nombre={x.nombre}
								descripcion={x.descripcion}
								precioTexto={x.precioTexto}
								agotado={x.agotado}
								cupoTexto={x.textoCupo}
								quedanPocas={quedanPocas(x)}
								interactive
								seleccionado={elegido}
								deshabilitado={enviando || finalizado}
								alSeleccionar={() => elegir(x.id)}
							>
								{elegido ? (
									<View style={{ gap: t.spacing[2] }}>
										<QuantityStepper
											valor={seleccion.cantidad}
											{...limitesCantidad(x)}
											alCambiar={cambiarCantidad}
											etiqueta={`Cantidad de ${x.nombre}`}
											deshabilitado={enviando || finalizado}
										/>
										{seleccion.cantidad >= limitesCantidad(x).max ? (
											<Text
												accessibilityLiveRegion="polite"
												style={[
													t.typography.bodySm,
													{ color: c.secondaryText }
												]}
											>
												{textoTope(x)}
											</Text>
										) : null}
									</View>
								) : null}
							</TicketTypeRow>
						);
					})}
				</View>

				<ResumenCompra
					titulo="Resumen"
					lineas={
						tipo
							? [
									{
										etiqueta: `${tipo.nombre} × ${seleccion.cantidad}`,
										valor: formatPrice(total)
									},
									{ etiqueta: 'Precio unitario', valor: tipo.precioTexto }
								]
							: [{ etiqueta: 'Elegí un tipo de entrada', valor: '—' }]
					}
					total={formatPrice(total)}
				/>

				{aviso ? (
					<Aviso
						tono="error"
						titulo={aviso.titulo}
						cuerpo={aviso.cuerpo}
						accion={
							errorCompra?.status === 404
								? { etiqueta: 'Volver a Explorar', alPresionar: irAlInicio }
								: undefined
						}
					/>
				) : null}
			</ScrollView>
			<BarraAccion>
				<Button
					size="lg"
					disabled={bloqueado}
					loading={enviando}
					onPress={bloqueado ? undefined : enviar}
					accessibilityLabel={textoBoton}
				>
					{textoBoton}
				</Button>
			</BarraAccion>
		</View>
	);
}

/**
 * Ruta del checkout protegida por rol (research R2).
 * @returns {JSX.Element} Checkout o redirección.
 */
export default function ComprarEntradas() {
	return (
		<RutaProtegida>
			<Checkout />
		</RutaProtegida>
	);
}
