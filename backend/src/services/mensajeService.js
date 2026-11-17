/**
 * Servicio de mensajes: chat interno entre el comprador y el organizador de una compra.
 *
 * @module services/mensajeService
 * @license ISC
 */
import { crearMensajeSchema } from '../dto/mensaje.js';
import { idCompraSchema } from '../dto/compra.js';
import Mensaje from '../models/mensaje.js';
import { COMPRADOR, ORGANIZADOR } from '../models/roles.js';
import ErrorHttp from '../utils/errorHttp.js';

export default class MensajeService {
	/**
	 * @param {import('../repositories/mensajeRepository.js').default} mensajeRepository
	 * @param {import('../repositories/compraRepository.js').default} compraRepository
	 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository
	 * @param {() => Date} [reloj] Devuelve la fecha actual; se inyecta para poder probar sin depender de la hora real
	 */
	constructor(
		mensajeRepository,
		compraRepository,
		usuarioRepository,
		reloj = () => new Date()
	) {
		/** @private */
		this.mensajeRepository = mensajeRepository;
		/** @private */
		this.compraRepository = compraRepository;
		/** @private */
		this.usuarioRepository = usuarioRepository;
		/** @private */
		this.reloj = reloj;
	}

	/**
	 * Envía un mensaje en el chat de una compra.
	 * Pueden escribir el comprador dueño y el organizador del evento, en cualquier
	 * momento: no depende del estado de la compra ni de la fecha del evento.
	 * @param {object} datos
	 * @param {string} datos.compraId - ID de la compra (viene de la URL)
	 * @param {string} datos.usuarioId - ID del remitente (viene del token, no del cliente)
	 * @param {string} datos.mensaje - Texto de 1 a 1000 caracteres
	 * @returns {Promise<Mensaje>} El mensaje creado
	 * @throws {ErrorHttp} 400 si el ID de compra o el texto son inválidos
	 * @throws {ErrorHttp} 403 si el usuario no es el comprador ni el organizador de la compra
	 * @throws {ErrorHttp} 404 si la compra o el usuario no existen
	 */
	async crearMensaje({ compraId, usuarioId, mensaje }) {
		const id = this._validarIdCompra(compraId);
		const resultado = crearMensajeSchema.safeParse({ mensaje });
		if (!resultado.success) {
			throw new ErrorHttp(
				400,
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}

		const { compra, actor } = await this._obtenerCompraYActor(id, usuarioId);
		return this.mensajeRepository.crear(
			new Mensaje(null, actor, resultado.data.mensaje, this.reloj(), {
				id: compra.id
			})
		);
	}

	/**
	 * Lista los mensajes del chat de una compra, del más antiguo al más reciente.
	 * @param {object} datos
	 * @param {string} datos.compraId - ID de la compra (viene de la URL)
	 * @param {string} datos.usuarioId - ID del usuario que consulta (viene del token)
	 * @returns {Promise<Mensaje[]>} Mensajes de la compra (vacío si no hay)
	 * @throws {ErrorHttp} 400 si el ID de compra es inválido
	 * @throws {ErrorHttp} 403 si el usuario no es el comprador ni el organizador de la compra
	 * @throws {ErrorHttp} 404 si la compra o el usuario no existen
	 */
	async listarPorCompra({ compraId, usuarioId }) {
		const id = this._validarIdCompra(compraId);
		const { compra } = await this._obtenerCompraYActor(id, usuarioId);
		return this.mensajeRepository.buscarPorCompraId(compra.id);
	}

	/**
	 * @private
	 * @param {string} compraId
	 * @returns {string} ID de compra normalizado
	 * @throws {ErrorHttp} 400 si el ID es inválido
	 */
	_validarIdCompra(compraId) {
		const resultado = idCompraSchema.safeParse(compraId);
		if (!resultado.success) {
			throw new ErrorHttp(
				400,
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
	 * @throws {ErrorHttp} 404 si la compra o el usuario no existen
	 * @throws {ErrorHttp} 403 si el usuario no es el comprador ni el organizador del evento
	 */
	async _obtenerCompraYActor(compraId, usuarioId) {
		const compra = await this.compraRepository.buscarPorId(compraId);
		if (!compra) {
			throw new ErrorHttp(404, `La compra con ID ${compraId} no existe.`);
		}
		const actor = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!actor) {
			throw new ErrorHttp(404, `El usuario con ID ${usuarioId} no existe.`);
		}
		const esComprador =
			actor.rol === COMPRADOR.nombre && compra.comprador.id === actor.id;
		const esOrganizador =
			actor.rol === ORGANIZADOR.nombre &&
			compra.evento.organizador?.id === actor.id;
		if (!esComprador && !esOrganizador) {
			throw new ErrorHttp(
				403,
				'Solo el comprador y el organizador de la compra pueden usar su chat.'
			);
		}
		return { compra, actor };
	}
}
