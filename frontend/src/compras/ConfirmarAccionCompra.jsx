/**
 * @file Diálogo destructivo para reembolsar o cancelar una compra desde las
 *   compras del evento, con el impacto concreto y las etiquetas exactas
 *   (specs/007-organizador-eventos/contracts/componentes.md ›
 *   ConfirmarAccionCompra; data-model.md §4). La petición la ejecuta el padre
 *   con `useAccionCompra`.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React from 'react';
import { Modal } from '../components/Modal';
import { cuerpoAccion } from './gestionCompras';

/** Textos del diálogo por acción. */
const TEXTOS = {
	reembolsar: {
		titulo: '¿Reembolsar esta compra?',
		confirmar: 'Sí, reembolsar'
	},
	cancelar: {
		titulo: '¿Cancelar esta compra?',
		confirmar: 'Sí, cancelar compra'
	}
};

/**
 * Props de {@link ConfirmarAccionCompra}.
 * @typedef {Object} ConfirmarAccionCompraProps
 * @property {{accion: 'reembolsar'|'cancelar', compra: object}|null} pedido Acción a confirmar; `null` cierra el diálogo.
 * @property {boolean} [cargando] Petición en curso: spinner y "Volver" deshabilitado.
 * @property {function(): void} alConfirmar Confirma la acción.
 * @property {function(): void} alCerrar Cierra sin ejecutar.
 */

/**
 * Diálogo de confirmación de reembolso o cancelación.
 * @param {ConfirmarAccionCompraProps} props Ver {@link ConfirmarAccionCompraProps}.
 * @returns {JSX.Element} Diálogo.
 */
export function ConfirmarAccionCompra({
	pedido,
	cargando,
	alConfirmar,
	alCerrar
}) {
	const textos = TEXTOS[pedido?.accion] ?? TEXTOS.cancelar;
	return (
		<Modal
			visible={!!pedido}
			titulo={textos.titulo}
			cuerpo={pedido ? cuerpoAccion(pedido.accion, pedido.compra) : undefined}
			icono="TriangleAlert"
			destructivo
			etiquetaConfirmar={textos.confirmar}
			etiquetaCancelar="Volver"
			cargando={cargando}
			alConfirmar={alConfirmar}
			alCancelar={alCerrar}
		/>
	);
}
