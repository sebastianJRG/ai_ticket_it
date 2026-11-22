/**
 * Tests unitarios de los favoritos en `UsuarioService`
 * (agregarAFavoritos, removerDeFavoritos, listarFavoritos).
 * Repositorios en memoria nuevos y logger falso en cada test.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import UsuarioRepository from '../../../src/repositories/usuarioRepository.js';
import UsuarioService from '../../../src/services/usuarioService.js';
import {
	construirEvento,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

/**
 * Devuelve los objetos registrados en `logger.info`, ya parseados.
 * @param {{info: import('@jest/globals').jest.Mock}} logger - Logger falso
 * @returns {object[]} Líneas de log
 */
function logs(logger) {
	return logger.info.mock.calls.map(([linea]) => JSON.parse(linea));
}

let usuarioRepo;
let eventoRepo;
let logger;
let servicio;
let comprador;

beforeEach(async () => {
	usuarioRepo = new UsuarioRepository();
	eventoRepo = new EventoRepository();
	logger = { info: jest.fn() };
	servicio = new UsuarioService(usuarioRepo, eventoRepo, logger);
	comprador = await usuarioRepo.crear(construirUsuario({ rol: 'COMPRADOR' }));
});

describe('UsuarioService.agregarAFavoritos', () => {
	it('agrega el evento y devuelve los IDs de favoritos', async () => {
		const evento = await construirEvento(eventoRepo);

		const ids = await servicio.agregarAFavoritos(comprador.id, evento.id);

		expect(ids).toEqual([evento.id]);
		const guardado = await usuarioRepo.buscarPorId(comprador.id);
		expect(guardado.favoritos).toEqual([{ id: evento.id }]);
	});

	it('agrega al final, en orden de agregado', async () => {
		const a = await construirEvento(eventoRepo, { nombre: 'A' });
		const b = await construirEvento(eventoRepo, { nombre: 'B' });

		await servicio.agregarAFavoritos(comprador.id, b.id);
		const ids = await servicio.agregarAFavoritos(comprador.id, a.id);

		expect(ids).toEqual([b.id, a.id]);
	});

	it('es idempotente: agregar dos veces deja una sola entrada en su posición', async () => {
		const a = await construirEvento(eventoRepo, { nombre: 'A' });
		const b = await construirEvento(eventoRepo, { nombre: 'B' });
		await servicio.agregarAFavoritos(comprador.id, a.id);
		await servicio.agregarAFavoritos(comprador.id, b.id);

		const ids = await servicio.agregarAFavoritos(comprador.id, a.id);

		expect(ids).toEqual([a.id, b.id]);
	});

	it('permite un evento que ya ocurrió', async () => {
		const pasado = await construirEvento(eventoRepo, {
			fecha: new Date('2000-01-01T00:00:00.000Z')
		});

		const ids = await servicio.agregarAFavoritos(comprador.id, pasado.id);

		expect(ids).toEqual([pasado.id]);
	});

	it('quita los espacios alrededor del ID', async () => {
		const evento = await construirEvento(eventoRepo);

		const ids = await servicio.agregarAFavoritos(
			comprador.id,
			`  ${evento.id}  `
		);

		expect(ids).toEqual([evento.id]);
	});

	it('lanza 404 si el evento no existe', async () => {
		await expect(
			servicio.agregarAFavoritos(comprador.id, '999')
		).rejects.toMatchObject({ name: 'NotFoundError' });
	});

	it('lanza 400 si el ID del evento queda vacío', async () => {
		await expect(
			servicio.agregarAFavoritos(comprador.id, '   ')
		).rejects.toMatchObject({ name: 'BadRequestError' });
	});

	it('lanza 404 si el usuario no existe', async () => {
		const evento = await construirEvento(eventoRepo);

		await expect(
			servicio.agregarAFavoritos('999', evento.id)
		).rejects.toMatchObject({ name: 'NotFoundError' });
	});

	it('no muta el arreglo de favoritos leído antes (persiste un arreglo nuevo)', async () => {
		const evento = await construirEvento(eventoRepo);
		const antes = await usuarioRepo.buscarPorId(comprador.id);

		await servicio.agregarAFavoritos(comprador.id, evento.id);

		expect(antes.favoritos).toEqual([]);
	});

	it('registra favorito_agregado con requestId, usuario, rol, evento y cantidad', async () => {
		const evento = await construirEvento(eventoRepo);

		await servicio.agregarAFavoritos(comprador.id, evento.id, {
			requestId: 'req-1'
		});

		expect(logs(logger)).toEqual([
			{
				evento: 'favorito_agregado',
				requestId: 'req-1',
				usuarioId: comprador.id,
				rol: 'COMPRADOR',
				eventoId: evento.id,
				cantidad: 1
			}
		]);
	});

	it('registra requestId null si no se pasa contexto', async () => {
		const evento = await construirEvento(eventoRepo);

		await servicio.agregarAFavoritos(comprador.id, evento.id);

		expect(logs(logger)[0].requestId).toBeNull();
	});

	it('falla con un error de configuración si no se inyectó eventoRepository', async () => {
		const sinEventos = new UsuarioService(usuarioRepo, undefined, logger);

		await expect(
			sinEventos.agregarAFavoritos(comprador.id, '1')
		).rejects.toThrow(/eventoRepository/);
	});
});

/**
 * Siembra favoritos directamente en el repositorio (sin pasar por el servicio).
 * @param {string[]} ids - IDs de eventos favoritos, en orden
 * @returns {Promise<void>}
 */
async function sembrarFavoritos(ids) {
	const usuario = await usuarioRepo.buscarPorId(comprador.id);
	usuario.favoritos = ids.map((id) => ({ id }));
	await usuarioRepo.actualizar(usuario);
}

describe('UsuarioService.removerDeFavoritos', () => {
	it('quita el evento y devuelve los IDs restantes en orden', async () => {
		await sembrarFavoritos(['1', '2', '3']);

		const ids = await servicio.removerDeFavoritos(comprador.id, '2');

		expect(ids).toEqual(['1', '3']);
		const guardado = await usuarioRepo.buscarPorId(comprador.id);
		expect(guardado.favoritos).toEqual([{ id: '1' }, { id: '3' }]);
	});

	it('es idempotente: quitar uno que no estaba no falla y deja la lista igual', async () => {
		await sembrarFavoritos(['1']);

		const ids = await servicio.removerDeFavoritos(comprador.id, '2');

		expect(ids).toEqual(['1']);
	});

	it('no verifica que el evento exista', async () => {
		await sembrarFavoritos(['999']);

		const ids = await servicio.removerDeFavoritos(comprador.id, '999');

		expect(ids).toEqual([]);
	});

	it('no muta el arreglo de favoritos leído antes', async () => {
		await sembrarFavoritos(['1']);
		const antes = await usuarioRepo.buscarPorId(comprador.id);

		await servicio.removerDeFavoritos(comprador.id, '1');

		expect(antes.favoritos).toEqual([{ id: '1' }]);
	});

	it('lanza 400 si el ID del evento queda vacío', async () => {
		await expect(
			servicio.removerDeFavoritos(comprador.id, '   ')
		).rejects.toMatchObject({ name: 'BadRequestError' });
	});

	it('lanza 404 si el usuario no existe', async () => {
		await expect(servicio.removerDeFavoritos('999', '1')).rejects.toMatchObject(
			{ name: 'NotFoundError' }
		);
	});

	it('registra favorito_quitado con requestId, usuario, rol, evento y cantidad', async () => {
		await sembrarFavoritos(['1', '2']);

		await servicio.removerDeFavoritos(comprador.id, '1', {
			requestId: 'req-2'
		});

		expect(logs(logger)).toEqual([
			{
				evento: 'favorito_quitado',
				requestId: 'req-2',
				usuarioId: comprador.id,
				rol: 'COMPRADOR',
				eventoId: '1',
				cantidad: 1
			}
		]);
	});

	it('registra favorito_quitado también cuando no había cambios (lista vacía)', async () => {
		await servicio.removerDeFavoritos(comprador.id, '1');

		expect(logs(logger)).toEqual([
			expect.objectContaining({ evento: 'favorito_quitado', cantidad: 0 })
		]);
	});
});

describe('UsuarioService.listarFavoritos', () => {
	it('devuelve los IDs en orden de agregado', async () => {
		await sembrarFavoritos(['3', '1', '2']);

		expect(await servicio.listarFavoritos(comprador.id)).toEqual([
			'3',
			'1',
			'2'
		]);
	});

	it('devuelve [] si no tiene favoritos', async () => {
		expect(await servicio.listarFavoritos(comprador.id)).toEqual([]);
	});

	it('lanza 404 si el usuario no existe', async () => {
		await expect(servicio.listarFavoritos('999')).rejects.toMatchObject({
			name: 'NotFoundError'
		});
	});

	it('registra favoritos_listados con requestId, usuario, rol y cantidad', async () => {
		await sembrarFavoritos(['1', '2']);

		await servicio.listarFavoritos(comprador.id, { requestId: 'req-3' });

		expect(logs(logger)).toEqual([
			{
				evento: 'favoritos_listados',
				requestId: 'req-3',
				usuarioId: comprador.id,
				rol: 'COMPRADOR',
				cantidad: 2
			}
		]);
	});
});
