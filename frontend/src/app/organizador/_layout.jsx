/**
 * @file Layout del área del organizador: pestañas Mis eventos · Crear ·
 *   Mensajes · Perfil. Toda el área requiere sesión de ORGANIZADOR.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { AreaConPestanas } from '../../navegacion/AreaConPestanas';
import { TABS_ORGANIZADOR } from '../../navegacion/reglas';

/**
 * Navegador de pestañas del organizador.
 * @returns {JSX.Element} Área con pestañas.
 */
export default function OrganizadorLayout() {
	return <AreaConPestanas tabs={TABS_ORGANIZADOR} prefijo="/organizador" />;
}
