/**
 * @file Mis compras del COMPRADOR (requiere sesión; feature 006 US1–US2,
 *   CU-01/CU-07/CU-08): pestañas Activas · Pasadas · Canceladas con contadores,
 *   tarjetas con estado y días restantes, actualización al enfocar y por gesto,
 *   y estados de carga, vacío y error
 *   (specs/006-mis-compras-comprador/contracts/pantallas.md › /compras).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../feedback/ToastContext';
import { useMisCompras } from '../../hooks/useMisCompras';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/EmptyState';
import { PurchaseCard } from '../../components/PurchaseCard';
import { PurchaseCardSkeleton } from '../../components/PurchaseCardSkeleton';
import { Tabs } from '../../components/Tabs';
import {
	PESTANAS_COMPRAS,
	agruparPorPestana,
	esCancelable,
	mensajeErrorListado
} from '../../compras/misCompras';
import { ConfirmarCancelacion } from '../../compras/ConfirmarCancelacion';
import { RUTAS, hrefCompra } from '../../navegacion/reglas';

/**
 * Pantalla Mis compras.
 * @returns {JSX.Element} Pantalla.
 */
export default function Compras() {
	const t = useTheme();
	const router = useRouter();
	const { mostrar } = useToast();
	const { compras, cargando, actualizando, error, recargar } = useMisCompras();
	const [pestana, setPestana] = useState('activas');
	const [aCancelar, setACancelar] = useState(null);
	const cerrarDialogo = useCallback(() => setACancelar(null), []);
	const primerFoco = useRef(true);

	// El hook ya pide al montar: solo se recarga en los enfoques siguientes.
	useFocusEffect(
		useCallback(() => {
			if (primerFoco.current) {
				primerFoco.current = false;
				return;
			}
			recargar();
		}, [recargar])
	);

	useEffect(() => {
		if (error && compras) {
			mostrar({
				tono: 'error',
				titulo: 'No pudimos actualizar tus compras',
				mensaje: mensajeErrorListado(error).cuerpo
			});
		}
		// Solo se avisa cuando llega un error nuevo (no al cambiar `compras`).
	}, [error]);

	const grupos = useMemo(() => agruparPorPestana(compras), [compras]);
	const actual = PESTANAS_COMPRAS.find((p) => p.clave === pestana);
	const pestanas = PESTANAS_COMPRAS.map((p) => ({
		clave: p.clave,
		etiqueta: p.etiqueta,
		contador: grupos[p.clave].length
	}));

	let vacio;
	if (cargando) {
		vacio = (
			<View
				accessible
				accessibilityLabel="Cargando compras"
				accessibilityState={{ busy: true }}
				style={{ gap: t.spacing[3] }}
			>
				{[0, 1, 2].map((i) => (
					<PurchaseCardSkeleton key={i} />
				))}
			</View>
		);
	} else if (!compras && error) {
		const m = mensajeErrorListado(error);
		vacio = (
			<EmptyState
				titulo={m.titulo}
				cuerpo={m.cuerpo}
				accion={{ etiqueta: 'Reintentar', alPresionar: recargar }}
			/>
		);
	} else if (!compras || compras.length === 0) {
		vacio = (
			<EmptyState
				titulo="Todavía no compraste entradas"
				cuerpo="Cuando compres, tus entradas van a aparecer acá."
				accion={{
					etiqueta: 'Explorar eventos',
					alPresionar: () => router.navigate(RUTAS.explorar)
				}}
			/>
		);
	} else {
		vacio = <EmptyState titulo={actual.vacio} />;
	}

	return (
		<View style={{ flex: 1, backgroundColor: t.colors.bg }}>
			<AppHeader variante="large" titulo="Mis compras" />
			<View style={{ paddingHorizontal: t.spacing[4] }}>
				<Tabs
					pestanas={pestanas}
					seleccionada={pestana}
					alCambiar={setPestana}
				/>
			</View>
			<FlatList
				testID="lista-compras"
				data={grupos[pestana]}
				keyExtractor={(c) => c.id}
				refreshControl={
					<RefreshControl
						refreshing={actualizando}
						onRefresh={recargar}
						tintColor={t.colors.primary}
						colors={[t.colors.primary]}
					/>
				}
				ListEmptyComponent={
					<View style={{ paddingHorizontal: t.spacing[4] }}>{vacio}</View>
				}
				ItemSeparatorComponent={() => <View style={{ height: t.spacing[3] }} />}
				contentContainerStyle={{
					paddingTop: t.spacing[4],
					paddingBottom: t.spacing[8]
				}}
				renderItem={({ item }) => (
					<View style={{ paddingHorizontal: t.spacing[4] }}>
						<PurchaseCard
							compra={item}
							cancelable={esCancelable(item)}
							alPresionar={() => router.push(hrefCompra(item.id))}
							alCancelar={() => setACancelar(item)}
						/>
					</View>
				)}
			/>
			<ConfirmarCancelacion
				compra={aCancelar}
				alCerrar={cerrarDialogo}
				alTerminar={recargar}
			/>
		</View>
	);
}
