/**
 * Esquema de validación y serializador de mensajes de una compra.
 *
 * @module dto/mensaje
 * @license ISC
 */
import { z } from 'zod';
import { aUsuarioPublico } from './usuarioPublico.js';

/**
 * Esquema para CREAR un mensaje.
 * Nota: el remitente y la compra NO los envía el cliente; salen del token JWT y de la URL.
 */
export const crearMensajeSchema = z.object({
	mensaje: z
		.string({ message: 'El mensaje es obligatorio y debe ser un texto.' })
		.trim()
		.min(1, 'El mensaje no puede estar vacío.')
		.max(1000, 'El mensaje no puede superar los 1000 caracteres.')
});

/**
 * Convierte un mensaje de dominio en su representación para respuestas HTTP.
 * Expone solo datos públicos del remitente.
 * @param {import('../models/mensaje.js').default} mensaje
 * @returns {{id: string, compraId: string, usuario: {id: string, nombre: string, apellido: string, rol: string}|null, mensaje: string, enviado: Date}}
 */
export function aMensajeRespuesta(mensaje) {
	return {
		id: mensaje.id,
		compraId: mensaje.compra?.id,
		usuario: aUsuarioPublico(mensaje.usuario),
		mensaje: mensaje.mensaje,
		enviado: mensaje.enviado
	};
}
