import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import CategoriaRepository from '../src/repositories/categoriaRepository.js';
import EventoRepository from '../src/repositories/eventoRepository.js';
import TipoEntradaRepository from '../src/repositories/tipoEntradaRepository.js';
import UsuarioRepository from '../src/repositories/usuarioRepository.js';
import EventoService from '../src/services/eventoService.js';
import UsuarioService from '../src/services/usuarioService.js';

let usuarioRepo;
let usuarioService;
let eventoRepo;
let eventoService;
let categoriaRepo;
let tipoEntradaRepo;

before(async () => {
	usuarioRepo = new UsuarioRepository();
	eventoRepo = new EventoRepository();
	categoriaRepo = new CategoriaRepository();
	tipoEntradaRepo = new TipoEntradaRepository();

	usuarioService = new UsuarioService(usuarioRepo);
	eventoService = new EventoService(
		eventoRepo,
		categoriaRepo,
		usuarioRepo,
		tipoEntradaRepo
	);
});

after(async () => {
	// No hay server que cerrar, todo está en memoria
});

describe('UsuarioService - crearUsuario', () => {
	it('crea un usuario organizador con password hasheado', async () => {
		const usuario = await usuarioService.crearUsuario({
			nombre: 'Org Test',
			apellido: 'Usuario',
			nombreUsuario: 'org.test',
			contrasenia: 'Clave123!',
			rol: 'ORGANIZADOR'
		});

		assert.ok(usuario.id, 'Debe tener ID generado');
		assert.equal(usuario.rol, 'ORGANIZADOR');
		assert.ok(usuario.contraseniaHash, 'Password debe estar hasheado');
	});

	it('crea un usuario comprador con password hasheado', async () => {
		const usuario = await usuarioService.crearUsuario({
			nombre: 'Comp Test',
			apellido: 'Usuario',
			nombreUsuario: 'comp.test',
			contrasenia: 'Clave123!',
			rol: 'COMPRADOR'
		});

		assert.equal(usuario.rol, 'COMPRADOR');
		assert.ok(usuario.contraseniaHash, 'Password debe estar hasheado');
	});
});

describe('EventoService - crearEvento', () => {
	beforeEach(async () => {
		await eventoRepo.eliminarTodos();
		await usuarioRepo.eliminarTodos();
	});

	it('organizador crea evento exitosamente', async () => {
		const organizador = await usuarioService.crearUsuario({
			nombre: 'Org Test',
			apellido: 'Usuario',
			nombreUsuario: 'org.test',
			contrasenia: 'Clave123!',
			rol: 'ORGANIZADOR'
		});

		const categoria = await categoriaRepo.crear({
			nombre: 'Conciertos',
			descripcion: 'Eventos musicales'
		});

		const tipoEntrada = await tipoEntradaRepo.crear({
			nombre: 'Entrada General',
			descripcion: 'Entrada al evento',
			precio: 500,
			cupo: 100
		});

		const evento = await eventoService.crearEvento({
			nombre: 'Concierto Rock',
			descripcion: 'Un gran concierto de rock',
			organizadorId: organizador.id,
			categoriaId: categoria.id,
			tiposEntrada: [tipoEntrada],
			fecha: new Date('2025-12-25').toISOString(),
			multimedia: ['img1.jpg', 'img2.jpg']
		});

		assert.ok(evento.id, 'Debe tener ID generado');
		assert.equal(evento.nombre, 'Concierto Rock');
		assert.equal(
			evento.organizador.id,
			organizador.id,
			'El organizador debe ser el creado arriba'
		);
		assert.equal(evento.organizador.rol, 'ORGANIZADOR');
		assert.equal(evento.estado, 'PENDIENTE', 'Estado por defecto es PENDIENTE');
		assert.ok(evento.tiposEntrada.length > 0, 'Debe tener tipos de entrada');
	});

	it('comprador intentando crear evento falla por permisos', async () => {
		const comprador = await usuarioService.crearUsuario({
			nombre: 'Comp Test',
			apellido: 'Usuario',
			nombreUsuario: 'comp.test',
			contrasenia: 'Clave123!',
			rol: 'COMPRADOR'
		});

		let errorLanzado = false;
		try {
			await eventoService.crearEvento({
				nombre: 'Evento Prohibido',
				organizadorId: comprador.id,
				categoriaId: '1',
				tiposEntrada: [
					{ nombre: 'Entrada', descripcion: 'X', precio: 100, cupo: 10 }
				],
				fecha: new Date().toISOString()
			});
		} catch (error) {
			errorLanzado = true;
			assert.ok(
				error.message.includes('permisos') ||
					error.message.includes('organizador'),
				'Error debe referirse a permisos u organizador'
			);
		}

		assert.ok(errorLanzado, 'Debería haber lanzado error de permisos');
	});

	it('evento creado tiene estado PENDIENTE por defecto', async () => {
		const usuario = await usuarioService.crearUsuario({
			nombre: 'Test',
			apellido: 'User',
			nombreUsuario: 'test.user',
			contrasenia: 'Clave123!',
			rol: 'ORGANIZADOR'
		});

		const evento = await eventoService.crearEvento({
			nombre: 'Evento Test',
			organizadorId: usuario.id,
			categoriaId: '1',
			tiposEntrada: [
				{ nombre: 'Entrada', descripcion: 'X', precio: 100, cupo: 10 }
			],
			fecha: new Date().toISOString()
		});

		assert.equal(
			evento.estado,
			'PENDIENTE',
			'Estado inicial debe ser PENDIENTE'
		);
	});
});
