/**
 * @file Ruta raíz: redirige a la pantalla inicial según la sesión y el rol
 *   (reemplaza la pantalla provisoria; FR-008).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { rutaInicial } from '../navegacion/reglas';

/**
 * Redirige a Explorar (visitante y comprador) o a Mis eventos (organizador).
 * @returns {JSX.Element} Redirección.
 */
export default function Index() {
	const { usuario } = useAuth();
	return <Redirect href={rutaInicial(usuario)} />;
}
