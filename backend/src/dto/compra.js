import { z } from 'zod';
import { aUsuarioPublico } from './usuarioPublico.js';

// Esquema para CREAR una Compra.
// Nota: `compradorId` NO lo envía el cliente; el controlador lo toma del token JWT.
export const crearCompraSchema = z.object({
	compradorId: z
		.string({ message: 'El ID del comprador es obligatorio y debe ser un texto.' })
		.trim()
		.min(1, 'El ID del comprador no puede estar vacío.'),

	eventoId: z
		.string({ message: 'El ID del evento es obligatorio y debe ser un texto.' })
		.trim()
		.min(1, 'El ID del evento no puede estar vacío.'),

	tipoEntradaId: z
		.string({
			message: 'El ID del tipo de entrada es obligatorio y debe ser un texto.'
		})
		.trim()
		.min(1, 'El ID del tipo de entrada no puede estar vacío.'),

	cantidad: z
		.number({ message: 'La cantidad es obligatoria y debe ser un número.' })
		.int('La cantidad debe ser un número entero.')
		.positive('La cantidad debe ser mayor a 0.') // Mínimo 1 entrada
});

/**
 * Convierte una compra de dominio en su representación para respuestas HTTP.
 * Reduce el evento y el tipo de entrada a lo necesario y expone solo datos públicos
 * del comprador, de modo que no se filtren hashes ni el organizador del evento.
 * @param {import('../models/compra.js').default} compra
 * @returns {{id: string, comprador: object, evento: {id: string, nombre: string, fecha: Date}, tipoEntrada: {id: string, nombre: string, precio: number}, cantidad: number, total: number, estado: string}}
 */
export function aCompraRespuesta(compra) {
	const comprador = aUsuarioPublico(compra.comprador);
	return {
		id: compra.id,
		comprador: comprador && {
			id: comprador.id,
			nombre: comprador.nombre,
			apellido: comprador.apellido
		},
		evento: {
			id: compra.evento.id,
			nombre: compra.evento.nombre,
			fecha: compra.evento.fecha
		},
		tipoEntrada: {
			id: compra.tipoEntrada.id,
			nombre: compra.tipoEntrada.nombre,
			precio: compra.tipoEntrada.precio
		},
		cantidad: compra.cantidad,
		total: compra.total,
		estado: compra.estado
	};
}
