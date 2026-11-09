import { z } from 'zod';

// 1. Esquema para CREAR una Categoría
export const crearCategoriaSchema = z.object({
	nombre: z
		.string({
			required_error: 'El nombre de la categoría es obligatorio.',
			invalid_type_error: 'El nombre debe ser un texto.'
		})
		.trim()
		.min(1, 'El nombre de la categoría no puede estar vacío.'),

	descripcion: z
		.string({
			required_error: 'La descripción de la categoría es obligatoria.',
			invalid_type_error: 'La descripción debe ser un texto.'
		})
		.trim()
		.min(1, 'La descripción de la categoría no puede estar vacía.')
});

// 2. Esquema para ACTUALIZAR una Categoría
// Reutilizamos el esquema base y hacemos que todos los campos sean opcionales
export const actualizarCategoriaSchema = crearCategoriaSchema.partial();
