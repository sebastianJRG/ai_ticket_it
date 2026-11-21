/**
 * Tests unitarios de `MensajeService`.
 * Repositorios en memoria nuevos en cada test, reloj inyectado y logger falso
 * (logs estructurados: specs/008-chat-compra/research.md R11).
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import EstadoCompra from '../../../src/models/estadoCompra.js';
import CompraRepository from '../../../src/repositories/compraRepository.js';
import EventoRepository from '../../../src/repositories/eventoRepository.js';
import MensajeRepository from '../../../src/repositories/mensajeRepository.js';
import UsuarioRepository from '../../../src/repositories/usuarioRepository.js';
import MensajeService from '../../../src/services/mensajeService.js';
import {
	construirCompra,
	construirEvento,
	construirUsuario
} from '../../helpers/eventosFixtures.js';

const AHORA = new Date('2030-03-01T12:00:00.000Z');

/**
 * Devuelve los objetos registrados en `logger.info`, ya parseados.
 * @param {{info: import('@jest/globals').jest.Mock}} logger - Logger falso
 * @returns {object[]} Líneas de log parseadas
 */
function logs(logger) {
	return logger.info.mock.calls.map(([linea]) => JSON.parse(linea));
}

describe('MensajeService', () => {
	let logger;
	let mensajeRepo;
	let compraRepo;
	let usuarioRepo;
	let eventoRepo;
	let ahora;
	let servicio;
	let comprador;
	let otroComprador;
	let organizador;
	let otroOrganizador;
	let evento;
	let compra;

	const enviar = (usuario, mensaje = 'Hola', c = compra) =>
		servicio.crearMensaje({ compraId: c.id, usuarioId: usuario.id, mensaje });
	const listar = (usuario, c = compra) =>
		servicio.listarPorCompra({ compraId: c.id, usuarioId: usuario.id });

	beforeEach(async () => {
		mensajeRepo = new MensajeRepository();
		compraRepo = new CompraRepository();
		usuarioRepo = new UsuarioRepository();
		eventoRepo = new EventoRepository();
		ahora = AHORA;
		logger = { info: jest.fn() };
		servicio = new MensajeService(
			mensajeRepo,
			compraRepo,
			usuarioRepo,
			() => ahora,
			logger
		);

		comprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comprador.uno' })
		);
		otroComprador = await usuarioRepo.crear(
			construirUsuario({ rol: 'COMPRADOR', nombreUsuario: 'comprador.dos' })
		);
		organizador = await usuarioRepo.crear(
			construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.uno' })
		);
		otroOrganizador = await usuarioRepo.crear(
			construirUsuario({ rol: 'ORGANIZADOR', nombreUsuario: 'org.dos' })
		);
		evento = await construirEvento(eventoRepo, { organizador });
		compra = await construirCompra(compraRepo, {
			comprador,
			evento,
			tipoEntrada: evento.tiposEntrada[0]
		});
	});

	describe('crearMensaje', () => {
		it('el comprador dueño envía un mensaje', async () => {
			const mensaje = await enviar(comprador, 'Hola, tengo una duda');

			expect(mensaje.id).toBeTruthy();
			expect(mensaje.usuario.id).toBe(comprador.id);
			expect(mensaje.compra.id).toBe(compra.id);
			expect(mensaje.mensaje).toBe('Hola, tengo una duda');
			expect(mensaje.enviado).toEqual(AHORA);
		});

		it('el organizador del evento puede responder', async () => {
			await enviar(comprador, 'Pregunta');

			const respuesta = await enviar(organizador, 'Respuesta');

			expect(respuesta.usuario.id).toBe(organizador.id);
		});

		it('el organizador puede escribir primero', async () => {
			const mensaje = await enviar(organizador, 'Bienvenido');

			expect(mensaje.id).toBeTruthy();
		});

		it('recorta los espacios del texto', async () => {
			expect((await enviar(comprador, '  Hola  ')).mensaje).toBe('Hola');
		});

		it('persiste el mensaje', async () => {
			await enviar(comprador);

			expect(await mensajeRepo.buscarPorCompraId(compra.id)).toHaveLength(1);
		});

		it.each([
			EstadoCompra.PENDIENTE,
			EstadoCompra.CONFIRMADA,
			EstadoCompra.UTILIZADA,
			EstadoCompra.CANCELADA,
			EstadoCompra.REEMBOLSADA
		])('permite mensajes con la compra en estado %s', async (estado) => {
			const c = await construirCompra(compraRepo, {
				comprador,
				evento,
				tipoEntrada: evento.tiposEntrada[0],
				estado
			});

			expect((await enviar(comprador, 'Hola', c)).id).toBeTruthy();
		});

		it('permite mensajes aunque el evento ya haya ocurrido', async () => {
			ahora = new Date('2031-01-01T00:00:00.000Z');

			expect((await enviar(comprador)).id).toBeTruthy();
		});

		it('rechaza con 403 a otro comprador', async () => {
			await expect(enviar(otroComprador)).rejects.toMatchObject({
				status: 403
			});
		});

		it('rechaza con 403 a un organizador que no es del evento', async () => {
			await expect(enviar(otroOrganizador)).rejects.toMatchObject({
				status: 403
			});
		});

		it('rechaza con 404 si la compra no existe', async () => {
			await expect(
				servicio.crearMensaje({
					compraId: '999',
					usuarioId: comprador.id,
					mensaje: 'Hola'
				})
			).rejects.toMatchObject({ status: 404 });
		});

		it('rechaza con 404 si el usuario no existe', async () => {
			await expect(
				servicio.crearMensaje({
					compraId: compra.id,
					usuarioId: '999',
					mensaje: 'Hola'
				})
			).rejects.toMatchObject({ status: 404 });
		});

		it.each([
			['ID de compra vacío', { compraId: '  ' }],
			['mensaje vacío', { mensaje: '' }],
			['mensaje solo espacios', { mensaje: '   ' }],
			['mensaje demasiado largo', { mensaje: 'a'.repeat(1001) }],
			['mensaje que no es texto', { mensaje: 5 }]
		])('rechaza con 400: %s', async (_nombre, cambios) => {
			await expect(
				servicio.crearMensaje({
					compraId: compra.id,
					usuarioId: comprador.id,
					mensaje: 'Hola',
					...cambios
				})
			).rejects.toMatchObject({ status: 400 });
			expect(await mensajeRepo.obtenerTodos()).toHaveLength(0);
		});
	});

	describe('listarPorCompra', () => {
		it('devuelve vacío si no hay mensajes', async () => {
			expect(await listar(comprador)).toEqual([]);
		});

		it('comprador y organizador ven el mismo hilo, en orden cronológico', async () => {
			await enviar(comprador, 'uno');
			await enviar(organizador, 'dos');
			await enviar(comprador, 'tres');

			const paraComprador = await listar(comprador);
			const paraOrganizador = await listar(organizador);

			expect(paraComprador.map((m) => m.mensaje)).toEqual([
				'uno',
				'dos',
				'tres'
			]);
			expect(paraOrganizador.map((m) => m.mensaje)).toEqual([
				'uno',
				'dos',
				'tres'
			]);
		});

		it('no mezcla mensajes de otras compras', async () => {
			const otra = await construirCompra(compraRepo, {
				comprador: otroComprador,
				evento,
				tipoEntrada: evento.tiposEntrada[0]
			});
			await enviar(comprador, 'mío');
			await enviar(otroComprador, 'ajeno', otra);

			expect((await listar(comprador)).map((m) => m.mensaje)).toEqual(['mío']);
		});

		it('rechaza con 403 a otro comprador', async () => {
			await expect(listar(otroComprador)).rejects.toMatchObject({
				status: 403
			});
		});

		it('rechaza con 403 a un organizador que no es del evento', async () => {
			await expect(listar(otroOrganizador)).rejects.toMatchObject({
				status: 403
			});
		});

		it('rechaza con 404 si la compra no existe', async () => {
			await expect(
				servicio.listarPorCompra({ compraId: '999', usuarioId: comprador.id })
			).rejects.toMatchObject({ status: 404 });
		});

		it('rechaza con 400 si el ID de compra es inválido', async () => {
			await expect(
				servicio.listarPorCompra({ compraId: ' ', usuarioId: comprador.id })
			).rejects.toMatchObject({ status: 400 });
		});
	});

	describe('logs estructurados (principio 5)', () => {
		it('crearMensaje emite un único mensaje_creado sin el texto', async () => {
			const texto = 'Texto privado del chat';

			const mensaje = await servicio.crearMensaje(
				{
					compraId: compra.id,
					usuarioId: comprador.id,
					mensaje: `  ${texto}  `
				},
				{ requestId: 'req-1' }
			);

			expect(logs(logger)).toEqual([
				{
					evento: 'mensaje_creado',
					requestId: 'req-1',
					usuarioId: comprador.id,
					rol: 'COMPRADOR',
					compraId: compra.id,
					estadoCompra: EstadoCompra.PENDIENTE,
					mensajeId: mensaje.id,
					largo: texto.length
				}
			]);
			for (const [linea] of logger.info.mock.calls) {
				expect(linea).not.toContain(texto);
			}
		});

		it('registra el rol y el estado de la compra del organizador', async () => {
			const confirmada = await construirCompra(compraRepo, {
				comprador,
				evento,
				tipoEntrada: evento.tiposEntrada[0],
				estado: EstadoCompra.CONFIRMADA
			});

			await servicio.crearMensaje(
				{ compraId: confirmada.id, usuarioId: organizador.id, mensaje: 'Hola' },
				{ requestId: 'req-3' }
			);

			expect(logs(logger)[0]).toMatchObject({
				evento: 'mensaje_creado',
				rol: 'ORGANIZADOR',
				usuarioId: organizador.id,
				estadoCompra: EstadoCompra.CONFIRMADA
			});
		});

		it('listarPorCompra emite mensajes_listados con la cantidad', async () => {
			await enviar(comprador, 'uno');
			await enviar(organizador, 'dos');
			logger.info.mockClear();

			await servicio.listarPorCompra(
				{ compraId: compra.id, usuarioId: organizador.id },
				{ requestId: 'req-2' }
			);

			expect(logs(logger)).toEqual([
				{
					evento: 'mensajes_listados',
					requestId: 'req-2',
					usuarioId: organizador.id,
					rol: 'ORGANIZADOR',
					compraId: compra.id,
					estadoCompra: EstadoCompra.PENDIENTE,
					cantidad: 2
				}
			]);
		});

		it('sin contexto, requestId es null', async () => {
			await enviar(comprador);
			await listar(comprador);

			expect(logs(logger).map((l) => l.requestId)).toEqual([null, null]);
		});

		it.each([
			[
				'400 (texto vacío)',
				() =>
					servicio.crearMensaje(
						{ compraId: compra.id, usuarioId: comprador.id, mensaje: '' },
						{ requestId: 'r' }
					)
			],
			[
				'400 (ID inválido)',
				() =>
					servicio.listarPorCompra(
						{ compraId: ' ', usuarioId: comprador.id },
						{ requestId: 'r' }
					)
			],
			['403 al enviar', () => enviar(otroComprador)],
			['403 al listar', () => listar(otroOrganizador)],
			[
				'404 (la compra no existe)',
				() =>
					servicio.listarPorCompra(
						{ compraId: '999', usuarioId: comprador.id },
						{ requestId: 'r' }
					)
			]
		])('no emite logs ante un error: %s', async (_nombre, operar) => {
			await expect(operar()).rejects.toBeTruthy();

			expect(logger.info).not.toHaveBeenCalled();
		});

		it('sin logger usa console por defecto y no falla', async () => {
			const espia = jest.spyOn(console, 'info').mockImplementation(() => {});
			try {
				const porDefecto = new MensajeService(
					mensajeRepo,
					compraRepo,
					usuarioRepo,
					() => ahora
				);

				await porDefecto.crearMensaje({
					compraId: compra.id,
					usuarioId: comprador.id,
					mensaje: 'Hola'
				});

				expect(espia).toHaveBeenCalledTimes(1);
				expect(JSON.parse(espia.mock.calls[0][0]).evento).toBe(
					'mensaje_creado'
				);
			} finally {
				espia.mockRestore();
			}
		});
	});
});
