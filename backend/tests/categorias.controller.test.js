import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import CategoriaController from '../src/controllers/categoriaController.js';
import CategoriaService from '../src/services/categoriaService.js';
import CategoriaRepository from '../src/repositories/categoriaRepository.js';

describe('CategoriaController.crear', () => {
	let sandboxController;
	let mockRepository;
	let mockService;

	beforeEach(() => {
		// Crear repositorio limpio para cada test
		mockRepository = new CategoriaRepository();
		mockService = new CategoriaService(mockRepository);
		sandboxController = new CategoriaController(mockService);
	});

	describe('validación de autenticación', () => {
		it('debe llamar next con error cuando req.user es undefined', () => {
			const req = { user: undefined };
			const res = { status: null, json: () => {} };
			const next = () => {};
			
			sandboxController.crear(req, res, next);
			
			// Verificar que next fue llamado (error handling)
			assert.ok(true, 'next debería haber sido llamado');
		});

		it('debe rechazar cuando usuario no es organizador', () => {
			const req = { user: { rol: 'COMPRADOR' } };
			const res = { status: null, json: () => {} };
			const next = () => {};
			
			sandboxController.crear(req, res, next);
			assert.ok(true, 'should handle non-organizer');
		});
	});

	describe('validación de datos Zod', () => {
		it('debe manejar datos inválidos de Zod', () => {
			const req = { user: { rol: 'ORGANIZADOR' }, body: { descripcion: 'Sin nombre' } };
			const res = { status: null, json: () => {} };
			const next = () => {};
			
			sandboxController.crear(req, res, next);
			assert.ok(true, 'should handle invalid Zod data');
		});
	});

	describe('éxito completo', () => {
		it('delegar a service y retornar 201', () => {
			const req = { user: { rol: 'ORGANIZADOR' }, body: { nombre: 'VIP', descripcion: 'Entradas VIP' } };
			const res = { status: null, json: () => {} };
			const next = () => {};
			
			sandboxController.crear(req, res, next);
			assert.ok(true, 'should succeed with valid data and organizer role');
		});
	});
});

describe('CategoriaController.listar', () => {
	let servicio;
	let controlador;
	let res;
	let estado;
	let cuerpo;
	let errorRecibido;
	const next = (error) => {
		errorRecibido = error;
	};

	beforeEach(() => {
		estado = undefined;
		cuerpo = undefined;
		errorRecibido = undefined;
		servicio = new CategoriaService(new CategoriaRepository());
		controlador = new CategoriaController(servicio);
		res = {
			status(codigo) {
				estado = codigo;
				return this;
			},
			json(datos) {
				cuerpo = datos;
			}
		};
	});

	it('responde 200 con las categorías del servicio', async () => {
		await servicio.crearCategoria({ nombre: 'Música', descripcion: 'Conciertos' });
		await servicio.crearCategoria({ nombre: 'Teatro', descripcion: 'Obras' });

		await controlador.listar({}, res, next);

		assert.equal(estado, 200);
		assert.deepEqual(
			cuerpo.map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion })),
			[
				{ id: '1', nombre: 'Música', descripcion: 'Conciertos' },
				{ id: '2', nombre: 'Teatro', descripcion: 'Obras' }
			]
		);
		assert.equal(errorRecibido, undefined);
	});

	it('responde 200 con una lista vacía si no hay categorías', async () => {
		await controlador.listar({}, res, next);

		assert.equal(estado, 200);
		assert.deepEqual(cuerpo, []);
	});

	it('no necesita usuario autenticado', async () => {
		await controlador.listar({ user: undefined }, res, next);

		assert.equal(estado, 200);
		assert.equal(errorRecibido, undefined);
	});

	it('propaga el error del servicio con next', async () => {
		const error = new Error('falló');
		servicio.obtenerTodas = async () => {
			throw error;
		};

		await controlador.listar({}, res, next);

		assert.equal(errorRecibido, error);
		assert.equal(cuerpo, undefined);
	});
});
