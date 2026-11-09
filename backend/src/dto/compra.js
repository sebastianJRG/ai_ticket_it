import { z } from 'zod';

export const crearCompraSchema = z.object({
	compradorId: z
		.string({
			required_error: 'El ID del comprador es obligatorio.',
			invalid_type_error: 'El ID del comprador debe ser un texto.'
		})
		.trim()
		.min(1, 'El ID del comprador no puede estar vacío.'),

	eventoId: z
		.string({
			required_error: 'El ID del evento es obligatorio.',
			invalid_type_error: 'El ID del evento debe ser un texto.'
		})
		.trim()
		.min(1, 'El ID del evento no puede estar vacío.'),

	tipoEntradaId: z
		.string({
			required_error: 'El ID del tipo de entrada es obligatorio.',
			invalid_type_error: 'El ID del tipo de entrada debe ser un texto.'
		})
		.trim()
		.min(1, 'El ID del tipo de entrada no puede estar vacío.'),

	cantidad: z
		.number({
			required_error: 'La cantidad es obligatoria.',
			invalid_type_error: 'La cantidad debe ser un número.'
		})
		.int('La cantidad debe ser un número entero.')
		.positive('La cantidad debe ser mayor a 0.') // Mínimo 1 entrada
});
