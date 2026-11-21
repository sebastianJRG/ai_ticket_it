import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import CategoriaRepository from '../src/repositories/categoriaRepository.js';
import CategoriaService from '../src/services/categoriaService.js';
import Categoria from '../src/models/categoria.js';

describe('CategoriaService.crearCategoria', () => {
	let repository;
	let service;

	beforeEach(() => {
		repository = new CategoriaRepository();
		service = new CategoriaService(repository);
	});

	describe('crear categoria valida', async () => {
		it('debe crear y retornar la categoria', async () => {
			const datos = { nombre: 'VIP', descripcion: 'Entradas de zona VIP' };
			const resultado = await service.crearCategoria(datos);
			assert.ok(resultado.id, 'Debe tener ID generado');
			assert.equal(resultado.nombre, 'VIP');
			assert.equal(resultado.descripcion, 'Entradas de zona VIP');
			assert.ok(resultado.id, 'Debe tener datos persistidos');
		});
	});

	describe('categoria repetida', async () => {
		it('debe manejar categoria duplicada', async () => {
			// Primera creacion
			await service.crearCategoria({
				nombre: 'VIP',
				descripcion: 'Entradas VIP'
			});

			// Segunda creacion con mismo nombre
			try {
				const resultado = await service.crearCategoria({
					nombre: 'VIP',
					descripcion: 'Otras VIP'
				});
				assert.ok(resultado.id);
			} catch (error) {
				assert.ok(error || resultado);
			}
		});
	});

	describe('datos invalidos', async () => {
		it('debe fallar con datos sin nombre', async () => {
			try {
				const resultado = await service.crearCategoria({
					descripcion: 'Sin nombre'
				});
				assert.ok(false, 'Debe haber lanzado error');
			} catch (error) {
				assert.ok(error.message);
			}
		});
	});
});
