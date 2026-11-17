import { z } from 'zod';
import { aUsuarioPublico } from './usuarioPublico.js';

// 1. Esquema base para los Tipos de Entrada (Reemplaza a CrearTipoEntradaDTO)
const tipoEntradaSchema = z.object({
	nombre: z
		.string({
			required_error: 'El nombre de la entrada es obligatorio.',
			invalid_type_error: 'El nombre debe ser un texto.'
		})
		.trim()
		.min(1, 'El nombre de la entrada no puede estar vacío.'),

	descripcion: z
		.string({
			required_error: 'La descripción de la entrada es obligatoria.'
		})
		.trim()
		.min(1, 'La descripción no puede estar vacía.'),

	precio: z
		.number({
			required_error: 'El precio es obligatorio.',
			invalid_type_error: 'El precio debe ser un número.'
		})
		.min(0, 'El precio no puede ser negativo.'), // Permite 0 para entradas gratuitas

	cupo: z
		.number({
			required_error: 'El cupo es obligatorio.',
			invalid_type_error: 'El cupo debe ser un número.'
		})
		.int('El cupo debe ser un número entero.')
		.positive('El cupo debe ser mayor a 0.')
});

// 2. Esquema para CREAR un Evento (Reemplaza a CrearEventoDTO)
export const crearEventoSchema = z.object({
	nombre: z
		.string({ required_error: 'El nombre del evento es obligatorio.' })
		.trim()
		.min(1, 'El nombre no puede estar vacío.'),

	descripcion: z
		.string({ required_error: 'La descripción es obligatoria.' })
		.trim()
		.min(1, 'La descripción no puede estar vacía.'),

	categoriaId: z
		.string({ required_error: 'La categoría es obligatoria.' })
		.trim()
		.min(1, 'La categoría no puede estar vacía.'),

	// z.coerce.date() es mágico: toma un string ("2026-12-01") y lo convierte en un objeto Date automáticamente
	fecha: z.coerce
		.date({
			required_error: 'La fecha del evento es obligatoria.',
			invalid_type_error: 'Formato de fecha inválido.'
		})
		.refine((fecha) => fecha > new Date(), {
			message: 'La fecha del evento debe ser en el futuro.'
		}),

	// Requerimos que envíen un arreglo y que tenga al menos 1 tipo de entrada
	tiposEntrada: z
		.array(tipoEntradaSchema, {
			required_error: 'Los tipos de entrada son obligatorios.',
			invalid_type_error: 'Los tipos de entrada deben ser un arreglo.'
		})
		.min(1, 'Debes incluir al menos un tipo de entrada.'),

	multimedia: z
		.array(z.string(), {
			invalid_type_error: 'Multimedia debe ser un arreglo de textos/URLs.'
		})
		.optional()
		.default([]), // Si no lo envían, se asigna []

	organizadorId: z
		.string({ required_error: 'El ID del organizador es obligatorio.' })
		.trim()
		.min(1, 'El ID del organizador no puede estar vacío.')
});

// 3. Esquema para ACTUALIZAR un Evento
// Clonamos el esquema de creación, omitimos el organizadorId (por seguridad no debería poder cambiarse)
// y hacemos que todos los demás campos sean opcionales.
export const actualizarEventoSchema = crearEventoSchema
	.omit({ organizadorId: true, categoriaId: true }) // Evita que se pueda transferir el evento a otro organizador por error
	.partial();

// 4. Esquema para LISTAR/BUSCAR eventos (query params de GET /api/eventos)
// Todos los parámetros son opcionales; los vacíos se tratan como ausentes.
export const listarEventosSchema = z.object({
	q: z
		.string({ message: 'El parámetro q debe ser un texto.' })
		.trim()
		.optional(),
	categoriaId: z
		.string({ message: 'El parámetro categoriaId debe ser un texto.' })
		.trim()
		.optional(),
	sortBy: z
		.enum(['precio', 'fecha', 'puntaje'], {
			message: 'sortBy debe ser uno de: precio, fecha, puntaje.'
		})
		.optional(),
	order: z
		.enum(['asc', 'desc'], { message: 'order debe ser asc o desc.' })
		.optional()
});

/**
 * Convierte un evento de dominio en su representación para respuestas HTTP.
 * Reemplaza al organizador por su versión pública para no filtrar hashes.
 * @param {import('../models/evento.js').default} evento
 * @returns {object} Copia del evento con `organizador` público (o null si no tiene)
 */
export function aEventoRespuesta(evento) {
	return { ...evento, organizador: aUsuarioPublico(evento.organizador) };
}
