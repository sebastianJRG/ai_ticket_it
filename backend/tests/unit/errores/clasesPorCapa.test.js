/**
 * Tests unitarios que fijan la clase de error que lanza cada servicio y modelo en
 * los casos que antes usaban `Error` a secas o `error.status = N`. Los servicios
 * no conocen códigos HTTP: aquí solo se afirma la clase.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
	BadRequestError,
	UnauthorizedError,
	NotFoundError,
	ConflictError
} from '../../../src/errors/index.js';
import CategoriaRepository from '../../../src/repositories/categoriaRepository.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import TipoEntradaRepository from '../../../src/repositories/tipoEntradaRepository.js';
import UsuarioRepository from '../../../src/repositories/usuarioRepository.js';
import CategoriaService from '../../../src/services/categoriaService.js';
import EventoService from '../../../src/services/eventoService.js';
import UsuarioService from '../../../src/services/usuarioService.js';
import LoginService from '../../../src/services/loginService.js';
import RefreshService from '../../../src/services/refreshService.js';
import LogoutService from '../../../src/services/logoutService.js';
import Compra from '../../../src/models/compra.js';
import EstadoCompra from '../../../src/models/estadoCompra.js';

const loggerMudo = { info() {}, warn() {}, error() {} };

const DATOS_USUARIO = {
	nombre: 'Ana',
	apellido: 'Prueba',
	nombreUsuario: 'ana.errores',
	contrasenia: 'Clave123!',
	rol: 'ORGANIZADOR'
};

let usuarioRepo;
let categoriaRepo;
let eventoRepo;
let usuarioService;
let categoriaService;
let eventoService;

beforeEach(() => {
	usuarioRepo = new UsuarioRepository();
	categoriaRepo = new CategoriaRepository();
	eventoRepo = new EventoRepository();
	usuarioService = new UsuarioService(usuarioRepo, eventoRepo, loggerMudo);
	categoriaService = new CategoriaService(categoriaRepo);
	eventoService = new EventoService(
		eventoRepo,
		categoriaRepo,
		usuarioRepo,
		new TipoEntradaRepository()
	);
});

describe('UsuarioService', () => {
	it('lanza ConflictError si el nombre de usuario ya está en uso', async () => {
		await usuarioService.crearUsuario(DATOS_USUARIO);

		await expect(usuarioService.crearUsuario(DATOS_USUARIO)).rejects.toThrow(
			ConflictError
		);
	});

	it('lanza BadRequestError con datos de registro inválidos', async () => {
		await expect(usuarioService.crearUsuario({})).rejects.toThrow(
			BadRequestError
		);
	});

	it('lanza NotFoundError en obtenerPorId si el usuario no existe', async () => {
		await expect(usuarioService.obtenerPorId('no-existe')).rejects.toThrow(
			NotFoundError
		);
	});

	it('lanza NotFoundError en actualizarUsuario si el usuario no existe', async () => {
		await expect(
			usuarioService.actualizarUsuario('no-existe', { nombre: 'X' })
		).rejects.toThrow(NotFoundError);
	});

	it('lanza BadRequestError si se intenta modificar el nombre de usuario', async () => {
		const creado = await usuarioService.crearUsuario(DATOS_USUARIO);

		await expect(
			usuarioService.actualizarUsuario(creado.id, { nombreUsuario: 'otro' })
		).rejects.toThrow(BadRequestError);
	});
});

describe('CategoriaService', () => {
	it('lanza NotFoundError en obtenerPorId si la categoría no existe', async () => {
		await expect(categoriaService.obtenerPorId('no-existe')).rejects.toThrow(
			NotFoundError
		);
	});

	it('lanza BadRequestError con datos de categoría inválidos', async () => {
		await expect(categoriaService.crearCategoria({})).rejects.toThrow(
			BadRequestError
		);
	});

	it('lanza NotFoundError en actualizarCategoria si la categoría no existe', async () => {
		await expect(
			categoriaService.actualizarCategoria('no-existe', { nombre: 'X' })
		).rejects.toThrow(NotFoundError);
	});
});

describe('EventoService', () => {
	/**
	 * Datos válidos de evento para un organizador y una categoría dados.
	 * @param {string} organizadorId - ID del organizador
	 * @param {string} categoriaId - ID de la categoría
	 * @returns {object} Datos de creación
	 */
	function datosEvento(organizadorId, categoriaId) {
		return {
			nombre: 'Evento',
			descripcion: 'Descripción del evento',
			organizadorId,
			categoriaId,
			fecha: new Date('2100-01-01').toISOString(),
			tiposEntrada: [
				{ nombre: 'General', descripcion: 'X', precio: 100, cupo: 10 }
			],
			multimedia: []
		};
	}

	it('lanza NotFoundError si la categoría no existe', async () => {
		const organizador = await usuarioService.crearUsuario(DATOS_USUARIO);

		await expect(
			eventoService.crearEvento(datosEvento(organizador.id, 'no-existe'))
		).rejects.toThrow(NotFoundError);
	});

	it('lanza NotFoundError si el organizador no existe', async () => {
		const categoria = await categoriaRepo.crear({
			nombre: 'Rock',
			descripcion: 'Recitales'
		});

		await expect(
			eventoService.crearEvento(datosEvento('no-existe', categoria.id))
		).rejects.toThrow(NotFoundError);
	});

	it('lanza BadRequestError con datos de evento inválidos', async () => {
		await expect(eventoService.crearEvento({})).rejects.toThrow(
			BadRequestError
		);
	});

	it('lanza BadRequestError con parámetros de búsqueda inválidos', async () => {
		await expect(
			eventoService.buscarEventos({ sortBy: 'invalido' })
		).rejects.toThrow(BadRequestError);
	});

	it('lanza NotFoundError en actualizarEvento si el evento no existe', async () => {
		await expect(
			eventoService.actualizarEvento('no-existe', { nombre: 'X' })
		).rejects.toThrow(NotFoundError);
	});
});

describe('Servicios de autenticación', () => {
	it('LoginService lanza BadRequestError con datos inválidos', async () => {
		await expect(
			new LoginService(usuarioRepo).iniciarSesion({})
		).rejects.toThrow(BadRequestError);
	});

	it('LoginService lanza UnauthorizedError con credenciales inválidas', async () => {
		await expect(
			new LoginService(usuarioRepo).iniciarSesion({
				nombreUsuario: 'nadie',
				contrasenia: 'Clave123!'
			})
		).rejects.toThrow(UnauthorizedError);
	});

	it('RefreshService lanza BadRequestError con datos inválidos', async () => {
		await expect(new RefreshService(usuarioRepo).renovar({})).rejects.toThrow(
			BadRequestError
		);
	});

	it('LogoutService lanza BadRequestError con datos inválidos', async () => {
		await expect(
			new LogoutService(usuarioRepo).cerrarSesion({})
		).rejects.toThrow(BadRequestError);
	});
});

describe('Compra (modelo)', () => {
	it('lanza ConflictError ante una transición de estado no permitida', () => {
		const compra = new Compra('1', {}, {}, {}, 1, 100, EstadoCompra.UTILIZADA);

		expect(() => compra.actualizarEstado(EstadoCompra.PENDIENTE)).toThrow(
			ConflictError
		);
		expect(compra.estado).toBe(EstadoCompra.UTILIZADA);
	});
});
