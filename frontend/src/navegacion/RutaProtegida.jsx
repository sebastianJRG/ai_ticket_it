/**
 * @file Guardia para rutas que no viven en un área con pestañas (p. ej. el
 *   checkout `/evento/[id]/comprar`): aplica `decidirAcceso` con el mismo
 *   patrón que `AreaConPestanas` (`Redirect` al montar, `router.replace` si la
 *   sesión cambia después) (specs/005-detalle-evento-compra/research.md R2).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useEffect, useRef } from 'react';
import { Redirect, usePathname, useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { decidirAcceso } from './reglas';

/**
 * Props de {@link RutaProtegida}.
 * @typedef {Object} RutaProtegidaProps
 * @property {import('react').ReactNode} children Contenido a mostrar si el acceso se permite.
 */

/**
 * Renderiza `children` solo si la sesión puede ver la ruta actual.
 * @param {RutaProtegidaProps} props Ver {@link RutaProtegidaProps}.
 * @returns {JSX.Element|null} Contenido, `Redirect`, o `null` mientras se redirige.
 */
export function RutaProtegida({ children }) {
	const { usuario } = useAuth();
	const ruta = usePathname();
	const router = useRouter();
	const decision = decidirAcceso({ usuario, ruta });
	const destino = decision.tipo === 'redirigir' ? decision.href : null;
	const montada = useRef(false);

	useEffect(() => {
		if (montada.current && destino) router.replace(destino);
	}, [destino, router]);
	useEffect(() => {
		montada.current = true;
	}, []);

	if (destino && !montada.current) return <Redirect href={destino} />;
	if (destino) return null;
	return <>{children}</>;
}
