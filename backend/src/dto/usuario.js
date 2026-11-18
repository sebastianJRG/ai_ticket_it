import { z } from 'zod';
import { COMPRADOR, ORGANIZADOR } from '../models/roles.js';

const rolesPermitidos = [COMPRADOR.nombre, ORGANIZADOR.nombre];

export const crearUsuarioSchema = z.object({
	nombre: z
		.string({
			required_error: 'El nombre del usuario es obligatorio.',
			invalid_type_error: 'El nombre debe ser un texto válido.'
		})
		.trim()
		.min(1, 'El nombre del usuario no puede estar vacío.'),

	apellido: z
		.string({
			required_error: 'El apellido del usuario es obligatorio.',
			invalid_type_error: 'El apellido debe ser un texto válido.'
		})
		.trim()
		.min(1, 'El apellido no puede estar vacío.'),

	nombreUsuario: z
		.string({
			required_error: 'El nombreUsuario del usuario es obligatorio.',
			invalid_type_error: 'El nombreUsuario debe ser un texto válido.'
		})
		.trim()
		.min(1, 'El nombreUsuario no puede estar vacío.'),

	contrasenia: z
		.string({
			required_error: 'La contraseña es obligatoria.',
			invalid_type_error: 'La contraseña debe ser un texto.'
		})
		.min(8, 'La contraseña debe tener al menos 8 caracteres.')
		.max(32, 'La contraseña no puede tener más de 32 caracteres.')
		.regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula.')
		.regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula.')
		.regex(/[0-9]/, 'La contraseña debe contener al menos un número.')
		.regex(
			/[!@#$%^&*_-]/,
			'La contraseña debe contener al menos un carácter especial (ej: !@#$%^&*_-).'
		),

	rol: z.string().refine((val) => rolesPermitidos.includes(val), {
		message: 'Rol no válido'
	})
});

export const actualizarUsuarioSchema = z.object({
	nombre: z
		.string({
			invalid_type_error: 'El nombre debe ser un texto válido.'
		})
		.trim()
		.min(1, 'El nombre no puede quedar vacío.')
		.optional(),

	apellido: z
		.string({
			invalid_type_error: 'El apellido debe ser un texto válido.'
		})
		.trim()
		.min(1, 'El apellido no puede quedar vacío.')
		.optional(),

	contrasenia: z
		.string({
			invalid_type_error: 'La contraseña debe ser un texto.'
		})
		.min(8, 'La contraseña debe tener al menos 8 caracteres.')
		.max(32, 'La contraseña no puede tener más de 32 caracteres.')
		.regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula.')
		.regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula.')
		.regex(/[0-9]/, 'La contraseña debe contener al menos un número.')
		.regex(
			/[!@#$%^&*_-]/,
			'La contraseña debe contener al menos un carácter especial (ej: !@#$%^&*_-).'
		)
		.optional()
});

export const loginUsuarioSchema = z.object({
	nombreUsuario: z
		.string({
			required_error: 'El nombre de usuario es obligatorio.',
			invalid_type_error: 'El nombre de usuario debe ser un texto.'
		})
		.trim()
		.min(1, 'El nombre de usuario no puede estar vacío.'),

	contrasenia: z
		.string({
			required_error: 'La contraseña es obligatoria.',
			invalid_type_error: 'La contraseña debe ser un texto.'
		})
		.min(1, 'La contraseña es obligatoria.')
});

export const refreshUsuarioSchema = z.object({
	refreshToken: z
		.string({
			required_error: 'El refresh token es obligatorio.',
			invalid_type_error: 'El refresh token debe ser un texto.'
		})
		.min(1, 'El refresh token es obligatorio.')
});

export const logoutUsuarioSchema = z.object({
	refreshToken: z
		.string({
			required_error: 'El refresh token es obligatorio.',
			invalid_type_error: 'El refresh token debe ser un texto.'
		})
		.min(1, 'El refresh token es obligatorio.')
});
