/**
 * @file Detalle de evento (público, sin sesión; FR-003). Provisoria: la
 *   completa la feature 005.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { useCanGoBack, useLocalSearchParams, useRouter } from 'expo-router';
import { PantallaProvisoria } from '../../pantallas/PantallaProvisoria';

/**
 * Pantalla provisoria del detalle; lee `idEvento` de la ruta.
 * @returns {JSX.Element} Pantalla provisoria.
 */
export default function DetalleEvento() {
	const { idEvento } = useLocalSearchParams();
	const router = useRouter();
	const puedeVolver = useCanGoBack();
	return (
		<PantallaProvisoria
			titulo="Detalle del evento"
			alVolver={puedeVolver ? router.back : undefined}
			cuerpo={`Pronto vas a ver acá el evento ${idEvento ?? ''}.`.trim()}
		/>
	);
}
