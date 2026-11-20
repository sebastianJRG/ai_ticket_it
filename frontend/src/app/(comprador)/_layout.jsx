/**
 * @file Layout del área del comprador: pestañas Explorar · Buscar · Favoritos ·
 *   Compras · Perfil. Explorar y Buscar son públicas; al tocar una pestaña que
 *   requiere sesión sin tenerla, se abre login con `volverA` (research R4).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthContext';
import { AreaConPestanas } from '../../navegacion/AreaConPestanas';
import { TABS_COMPRADOR, hrefLogin } from '../../navegacion/reglas';

/**
 * Navegador de pestañas del comprador.
 * @returns {JSX.Element} Área con pestañas.
 */
export default function CompradorLayout() {
	const router = useRouter();
	const { usuario } = useAuth();
	const listeners = useCallback(
		(tab) =>
			tab.requiereSesion
				? {
						tabPress: (e) => {
							if (usuario) return;
							e.preventDefault();
							// push: "atrás" desde login vuelve a la pestaña de origen.
							router.push(hrefLogin(`/${tab.clave}`));
						}
					}
				: undefined,
		[usuario, router]
	);
	return (
		<AreaConPestanas tabs={TABS_COMPRADOR} prefijo="" listeners={listeners} />
	);
}
