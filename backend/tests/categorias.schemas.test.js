import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { crearCategoriaSchema } from '../src/dto/categoria.js';

describe('crearCategoriaSchema', () => {
	describe('validación de datos obligatorios', () => {
		it('debe fallar cuando falta el nombre', () => {
			const resultado = crearCategoriaSchema.safeParse({ descripcion: 'Sin nombre' });
			assert.equal(resultado.success, false);
		});

		it('debe fallar cuando falta la descripción', () => {
			const resultado = crearCategoriaSchema.safeParse({ nombre: 'Sin descripcion' });
			assert.equal(resultado.success, false);
		});
	});

	describe('validación de tipos', () => {
		it('debe fallar cuando el nombre es número', () => {
			const resultado = crearCategoriaSchema.safeParse({ nombre: 123, descripcion: 'Test' });
			assert.equal(resultado.success, false);
		});

		it('debe pasar con datos válidos', () => {
			const resultado = crearCategoriaSchema.safeParse({ nombre: 'VIP', descripcion: 'Entradas VIP' });
			assert.equal(resultado.success, true);
		});
	});
});
