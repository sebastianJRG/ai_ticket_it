import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import UsuarioService from '../src/services/usuarioService.js';
import UsuarioRepository from '../src/repositories/usuarioRepository.js';

const COMPRADOR_PERMISSIONS = [
	'cancelar:compra',
	'escribir:mensaje',
	'crear:resenia'
];
const ORGANIZADOR_PERMISSIONS = [
	'crear:evento',
	'cancelar:compra',
	'confirmar:compra',
	'responder:mensaje'
];

let server;
let baseUrl;

before(async () => {
	const app = createApp();
	server = app.listen(0);
	await new Promise((resolve) => {
		server.once('listening', resolve);
	});
	baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
	return new Promise((resolve) => {
		server.close(resolve);
	});
});

describe('POST /api/usuarios', () => {
	it('crea un usuario COMPRADOR y asigna los permisos correctos', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: 'Prueba',
				apellido: 'Usuario',
				nombreUsuario: 'prueba.usuario',
				contrasenia: 'Clave123!',
				rol: 'COMPRADOR'
			})
		});

		assert.equal(res.status, 201);
		const body = await res.json();

		assert.equal(body.rol, 'COMPRADOR');
		assert.deepEqual(body.permissions, COMPRADOR_PERMISSIONS);
		assert.equal(body.contraseniaHash, undefined);
		assert.ok(body.id);
		assert.equal(body.nombre, 'Prueba');
		assert.equal(body.apellido, 'Usuario');
		assert.equal(body.nombreUsuario, 'prueba.usuario');
	});

	it('crea un usuario ORGANIZADOR y asigna los permisos correctos', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: 'Organizador',
				apellido: 'Ejemplo',
				nombreUsuario: 'organizador.ejemplo',
				contrasenia: 'Clave123!',
				rol: 'ORGANIZADOR'
			})
		});

		assert.equal(res.status, 201);
		const body = await res.json();

		assert.equal(body.rol, 'ORGANIZADOR');
		assert.deepEqual(body.permissions, ORGANIZADOR_PERMISSIONS);
		assert.ok(body.id);
	});

	it('devuelve 400 cuando faltan campos obligatorios', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: 'Sin apellido',
				nombreUsuario: 'sin.apellido',
				contrasenia: 'Clave123!',
				rol: 'COMPRADOR'
			})
		});

		assert.equal(res.status, 400);
		const body = await res.json();
		assert.ok(body.message);
	});

	it('devuelve 400 cuando el rol es inválido', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: 'Rol Inválido',
				apellido: 'Prueba',
				nombreUsuario: 'rol.inválido',
				contrasenia: 'Clave123!',
				rol: 'INVÁLIDO'
			})
		});

		assert.equal(res.status, 400);
		const body = await res.json();
		assert.ok(body.message);
	});

	it('devuelve 400 cuando la contraseña no cumple la política', async () => {
		const res = await fetch(`${baseUrl}/api/usuarios`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nombre: 'Clave Débil',
				apellido: 'Prueba',
				nombreUsuario: 'clave.débil',
				contrasenia: 'clave123',
				rol: 'COMPRADOR'
			})
		});

		assert.equal(res.status, 400);
		const body = await res.json();
		assert.ok(body.message);
	});
});

describe('UsuarioService.crearUsuario', () => {
	it('asigna los permisos de ORGANIZADOR según el rol', async () => {
		const repository = new UsuarioRepository();
		const service = new UsuarioService(repository);

		const usuario = await service.crearUsuario({
			nombre: 'Org',
			apellido: 'Prueba',
			nombreUsuario: 'org.prueba',
			contrasenia: 'Clave123!',
			rol: 'ORGANIZADOR'
		});

		assert.equal(usuario.rol, 'ORGANIZADOR');
		assert.deepEqual(usuario.permissions, ORGANIZADOR_PERMISSIONS);
	});

	it('asigna los permisos de COMPRADOR según el rol', async () => {
		const repository = new UsuarioRepository();
		const service = new UsuarioService(repository);

		const usuario = await service.crearUsuario({
			nombre: 'Comprador',
			apellido: 'Prueba',
			nombreUsuario: 'comprador.prueba',
			contrasenia: 'Clave123!',
			rol: 'COMPRADOR'
		});

		assert.equal(usuario.rol, 'COMPRADOR');
		assert.deepEqual(usuario.permissions, COMPRADOR_PERMISSIONS);
	});
});
