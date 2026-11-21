/**
 * Tests unitarios de la regla de carácter especial de la contraseña en los DTO de usuario.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import {
	crearUsuarioSchema,
	actualizarUsuarioSchema
} from '../../../src/dto/usuario.js';

const datosBase = {
	nombre: 'Ana',
	apellido: 'Pérez',
	nombreUsuario: 'ana.perez',
	rol: 'COMPRADOR'
};

describe('contraseña: carácter especial', () => {
	it.each(['Clave!segura9', 'Clave_segura9', 'Mi-clave2025'])(
		'crearUsuarioSchema acepta %s',
		(contrasenia) => {
			const resultado = crearUsuarioSchema.safeParse({
				...datosBase,
				contrasenia
			});
			expect(resultado.success).toBe(true);
		}
	);

	it.each(['Clave_segura9', 'Mi-clave2025'])(
		'actualizarUsuarioSchema acepta %s',
		(contrasenia) => {
			expect(actualizarUsuarioSchema.safeParse({ contrasenia }).success).toBe(
				true
			);
		}
	);

	it('rechaza una contraseña sin ningún carácter especial', () => {
		const resultado = crearUsuarioSchema.safeParse({
			...datosBase,
			contrasenia: 'Clave1234'
		});
		expect(resultado.success).toBe(false);
	});
});
