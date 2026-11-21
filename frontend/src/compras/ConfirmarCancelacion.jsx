/**
 * @file Diálogo de confirmación para cancelar una compra: `Modal` destructivo
 *   con el impacto concreto, una sola petición en curso y toast con el
 *   resultado (specs/006-mis-compras-comprador/contracts/componentes.md ›
 *   ConfirmarCancelacion; research R6). Lo usan Mis compras y el detalle.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import React, { useCallback } from 'react';
import { Modal } from '../components/Modal';
import { useToast } from '../feedback/ToastContext';
import { useCancelarCompra } from '../hooks/useCancelarCompra';
import { cuerpoCancelacion, mensajeErrorCancelacion } from './misCompras';

/**
 * Props de {@link ConfirmarCancelacion}.
 * @typedef {Object} ConfirmarCancelacionProps
 * @property {object|null} compra Compra a cancelar; `null` cierra el diálogo.
 * @property {function(): void} alCerrar Cierra el diálogo (sin cancelar o tras responder).
 * @property {function(import('../hooks/useCancelarCompra').ResultadoCancelacion): void} [alTerminar] Tras la respuesta del servidor.
 */

/**
 * Confirma y ejecuta la cancelación de una compra.
 * @param {ConfirmarCancelacionProps} props Ver {@link ConfirmarCancelacionProps}.
 * @returns {JSX.Element} Diálogo.
 */
export function ConfirmarCancelacion({ compra, alCerrar, alTerminar }) {
	const { mostrar } = useToast();
	const terminar = useCallback(
		(resultado) => {
			if (resultado.ok) {
				mostrar({ tono: 'success', titulo: 'Compra cancelada' });
			} else {
				const m = mensajeErrorCancelacion(resultado.error);
				mostrar({
					tono: 'error',
					titulo: m.titulo,
					mensaje: m.cuerpo || undefined
				});
			}
			alCerrar();
			alTerminar?.(resultado);
		},
		[mostrar, alCerrar, alTerminar]
	);
	const { cancelar, enviando } = useCancelarCompra({ alTerminar: terminar });

	return (
		<Modal
			visible={!!compra}
			titulo="¿Cancelar esta compra?"
			cuerpo={compra ? cuerpoCancelacion(compra) : undefined}
			icono="TriangleAlert"
			destructivo
			etiquetaConfirmar="Sí, cancelar compra"
			etiquetaCancelar="No, conservar entradas"
			cargando={enviando}
			alConfirmar={() => compra && cancelar(compra)}
			alCancelar={alCerrar}
		/>
	);
}
