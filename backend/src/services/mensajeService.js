/**
 * Servicio de mensajes: chat interno entre el comprador y el organizador de una compra.
 * Cada operación exitosa emite un log estructurado (JSON) con el ID de petición,
 * el rol del usuario y el estado de la compra; nunca el texto del mensaje.
 *
 * @module services/mensajeService
 * @license ISC
 */
import { crearMensajeSchema } from '../dto/mensaje.js';
import { idCompraSchema } from '../dto/compra.js';
import Mensaje from '../models/mensaje.js';
import { COMPRADOR, ORGANIZADOR } from '../models/roles.js';
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError
} from '../errors/index.js';

export default class MensajeService {
	/**
	 * @param {import('../repositories/mensajeRepository.js').default} mensajeRepository
	 * @param {import('../repositories/compraRepository.js').default} compraRepository
	 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository
	 * @param {() => Date} [reloj] Devuelve la fecha actual; se inyecta para poder probar sin depender de la hora real
	 * @param {{info: (linea: string) => void}} [logger=console] Destino de los logs estructurados (JSON)
	 */
	constructor(
		mensajeRepository,
		compraRepository,
		usuarioRepository,
		reloj = () => new Date(),
		logger = console
	) {
		/** @private */
		this.mensajeRepository = mensajeRepository;
		/** @private */
		this.compraRepository = compraRepository;
		/** @private */
		this.usuarioRepository = usuarioRepository;
		/** @private */
		this.reloj = reloj;
		/** @private */
		this.logger = logger;
	}

	/** Escribe una línea de log estructurado (JSON).
	 * @private
	 * @param {string} evento - Nombre de la operación registrada
	 * @param {{requestId?: string}} contexto - Datos de la petición
	 * @param {object} datos - Campos propios de la operación
	 * @returns {void}
	 */
	_log(evento, contexto, datos) {
		this.logger.info(
			JSON.stringify({
				evento,
				requestId: contexto.requestId ?? null,
				...datos
			})
		);
	}

	/**
	 * Envía un mensaje en el chat de una compra.
	 * Pueden escribir el comprador dueño y el organizador del evento, en cualquier
	 * momento: no depende del estado de la compra ni de la fecha del evento.
	 * @param {object} datos
	 * @param {string} datos.compraId - ID de la compra (viene de la URL)
	 * @param {string} datos.usuarioId - ID del remitente (viene del token, no del cliente)
	 * @param {string} datos.mensaje - Texto de 1 a 1000 caracteres
	 * @param {{requestId?: string}} [contexto={}] - Datos de la petición para el log (`mensaje_creado`)
	 * @returns {Promise<Mensaje>} El mensaje creado
	 * @throws {BadRequestError} Si el ID de compra o el texto son inválidos
	 * @throws {ForbiddenError} Si el usuario no es el comprador ni el organizador de la compra
	 * @throws {NotFoundError} Si la compra o el usuario no existen
	 */
	async crearMensaje({ compraId, usuarioId, mensaje }, contexto = {}) {
		const id = this._validarIdCompra(compraId);
		const resultado = crearMensajeSchema.safeParse({ mensaje });
		if (!resultado.success) {
			throw new BadRequestError(
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}

		const { compra, actor } = await this._obtenerCompraYActor(id, usuarioId);
		const creado = await this.mensajeRepository.crear(
			new Mensaje(null, actor, resultado.data.mensaje, this.reloj(), {
				id: compra.id
			})
		);
		this._log('mensaje_creado', contexto, {
			usuarioId: actor.id,
			rol: actor.rol,
			compraId: compra.id,
			estadoCompra: compra.estado,
			mensajeId: creado.id,
			largo: resultado.data.mensaje.length
		});
		return creado;
	}

	/**
	 * Lista los mensajes del chat de una compra, del más antiguo al más reciente.
	 * @param {object} datos
	 * @param {string} datos.compraId - ID de la compra (viene de la URL)
	 * @param {string} datos.usuarioId - ID del usuario que consulta (viene del token)
	 * @param {{requestId?: string}} [contexto={}] - Datos de la petición para el log (`mensajes_listados`)
	 * @returns {Promise<Mensaje[]>} Mensajes de la compra (vacío si no hay)
	 * @throws {BadRequestError} Si el ID de compra es inválido
	 * @throws {ForbiddenError} Si el usuario no es el comprador ni el organizador de la compra
	 * @throws {NotFoundError} Si la compra o el usuario no existen
	 */
	async listarPorCompra({ compraId, usuarioId }, contexto = {}) {
		const id = this._validarIdCompra(compraId);
		const { compra, actor } = await this._obtenerCompraYActor(id, usuarioId);
		const mensajes = await this.mensajeRepository.buscarPorCompraId(compra.id);
		this._log('mensajes_listados', contexto, {
			usuarioId: actor.id,
			rol: actor.rol,
			compraId: compra.id,
			estadoCompra: compra.estado,
			cantidad: mensajes.length
		});
		return mensajes;
	}

	/**
	 * @private
	 * @param {string} compraId
	 * @returns {string} ID de compra normalizado
	 * @throws {BadRequestError} Si el ID es inválido
	 */
	_validarIdCompra(compraId) {
		const resultado = idCompraSchema.safeParse(compraId);
		if (!resultado.success) {
			throw new BadRequestError(
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		return resultado.data;
	}

	/**
	 * Busca la compra y el usuario, y exige que el usuario participe en ella.
	 * @private
	 * @param {string} compraId
	 * @param {string} usuarioId
	 * @returns {Promise<{compra: import('../models/compra.js').default, actor: import('../models/usuario.js').default}>}
	 * @throws {NotFoundError} Si la compra o el usuario no existen
	 * @throws {ForbiddenError} Si el usuario no es el comprador ni el organizador del evento
	 */
	async _obtenerCompraYActor(compraId, usuarioId) {
		const compra = await this.compraRepository.buscarPorId(compraId);
		if (!compra) {
			throw new NotFoundError(`La compra con ID ${compraId} no existe.`);
		}
		const actor = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!actor) {
			throw new NotFoundError(`El usuario con ID ${usuarioId} no existe.`);
		}
		const esComprador =
			actor.rol === COMPRADOR.nombre && compra.comprador.id === actor.id;
		const esOrganizador =
			actor.rol === ORGANIZADOR.nombre &&
			compra.evento.organizador?.id === actor.id;
		if (!esComprador && !esOrganizador) {
			throw new ForbiddenError(
				'Solo el comprador y el organizador de la compra pueden usar su chat.'
			);
		}
		return { compra, actor };
	}
}
