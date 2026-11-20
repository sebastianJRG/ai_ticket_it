/**
 * @file Mensajes del organizador: el backend no tiene bandeja, así que muestra un estado vacío provisorio (su comportamiento final lo define la feature 007).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { PantallaProvisoria } from '../../pantallas/PantallaProvisoria';

/**
 * Pantalla provisoria (la reemplaza la feature indicada en el docstring).
 * @returns {JSX.Element} Pantalla provisoria.
 */
export default function Mensajes() {
	return (
		<PantallaProvisoria
			titulo="Mensajes"
			icono="message"
			tituloVacio="Los mensajes viven en cada compra"
			cuerpo="Abrí un evento en Mis eventos y entrá a una compra para chatear con quien la hizo."
		/>
	);
}
