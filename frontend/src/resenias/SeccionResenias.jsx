/**
 * @file Sección "Reseñas del organizador" del detalle de evento (CU-10):
 *   carga las reseñas del organizador y muestra promedio, cantidad, las 2 más
 *   recientes y "Ver todas" que expande en el lugar; error aislado con
 *   reintento (specs/005-detalle-evento-compra/contracts/pantallas.md punto 6;
 *   research R3, R4).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useReseniasOrganizador } from '../hooks/useReseniasOrganizador';
import { Button } from '../components/Button';
import { Rating } from '../components/Rating';
import { ReviewCard } from '../components/ReviewCard';
import { Skeleton } from '../components/Skeleton';
import { aResenia, ordenRecientes, promedio, recientes } from './presentacion';

/**
 * Props de {@link SeccionResenias}.
 * @typedef {Object} SeccionReseniasProps
 * @property {string|null} idOrganizador ID del organizador del evento.
 * @property {number|null} puntaje `puntajeOrganizador` del servidor.
 */

/**
 * Sección de reseñas del organizador.
 * @param {SeccionReseniasProps} props Ver {@link SeccionReseniasProps}.
 * @returns {JSX.Element} Sección con título y contenido según el estado.
 */
export function SeccionResenias({ idOrganizador, puntaje }) {
	const t = useTheme();
	const c = t.colors;
	const { resenias, cargando, error, recargar } =
		useReseniasOrganizador(idOrganizador);
	const [todas, setTodas] = useState(false);

	let contenido;
	if (cargando && resenias.length === 0) {
		contenido = (
			<View
				accessible
				accessibilityLabel="Cargando reseñas"
				style={{ gap: t.spacing[3] }}
			>
				<Skeleton alto={96} radio="lg" />
				<Skeleton alto={96} radio="lg" />
			</View>
		);
	} else if (error) {
		contenido = (
			<View style={{ gap: t.spacing[2], alignItems: 'flex-start' }}>
				<Text style={[t.typography.body, { color: c.textMuted }]}>
					No pudimos cargar las reseñas
				</Text>
				<Button variant="secondary" size="sm" onPress={recargar}>
					Reintentar
				</Button>
			</View>
		);
	} else if (resenias.length === 0) {
		contenido = (
			<Text style={[t.typography.body, { color: c.textMuted }]}>
				Este organizador todavía no tiene reseñas
			</Text>
		);
	} else {
		const visibles = todas ? ordenRecientes(resenias) : recientes(resenias);
		contenido = (
			<View style={{ gap: t.spacing[3] }}>
				<Rating
					variante="estrellas"
					valor={promedio(resenias, puntaje)}
					cantidad={resenias.length}
				/>
				{visibles.map((r) => {
					const v = aResenia(r);
					return (
						<ReviewCard
							key={v.id}
							autor={v.autor}
							iniciales={v.iniciales}
							puntuacion={v.puntuacion}
							detalle={v.detalle}
						/>
					);
				})}
				{resenias.length > 2 ? (
					<View style={{ alignItems: 'flex-start' }}>
						<Button
							variant="ghost"
							size="sm"
							onPress={() => setTodas((x) => !x)}
						>
							{todas ? 'Ver menos' : `Ver todas las ${resenias.length} reseñas`}
						</Button>
					</View>
				) : null}
			</View>
		);
	}

	return (
		<View style={{ gap: t.spacing[3] }}>
			<Text
				accessibilityRole="header"
				style={[t.typography.titleMd, { color: c.text }]}
			>
				Reseñas del organizador
			</Text>
			{contenido}
		</View>
	);
}
