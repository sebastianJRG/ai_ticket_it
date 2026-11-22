/**
 * Servicio de reseñas: reglas de negocio para opinar sobre eventos.
 *
 * @module services/reseniaService
 * @license ISC
 */
import {
	crearReseniaSchema,
	idEventoSchema,
	idUsuarioSchema
} from '../dto/resenia.js';
import EstadoCompra from '../models/estadoCompra.js';
import Resenia from '../models/resenia.js';
import { COMPRADOR, ORGANIZADOR } from '../models/roles.js';
import {
	BadRequestError,
	ConflictError,
	ForbiddenError,
	NotFoundError
} from '../errors/index.js';
import ExclusionMutua from '../utils/exclusionMutua.js';

/** Estados de compra que habilitan a reseñar el evento: solo entradas ya utilizadas. */
const ESTADOS_QUE_HABILITAN = new Set([EstadoCompra.UTILIZADA]);

export default class ReseniaService {
	/**
	 * @param {import('../repositories/reseniaRepository.js').default} reseniaRepository
	 * @param {import('../repositories/eventoRepository.js').default} eventoRepository
	 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository
	 * @param {import('../repositories/compraRepository.js').default} compraRepository
	 * @param {() => Date} [reloj] Devuelve la fecha actual; se inyecta para poder probar sin depender de la hora real
	 */
	constructor(
		reseniaRepository,
		eventoRepository,
		usuarioRepository,
		compraRepository,
		reloj = () => new Date()
	) {
		/** @private */
		this.reseniaRepository = reseniaRepository;
		/** @private */
		this.eventoRepository = eventoRepository;
		/** @private */
		this.usuarioRepository = usuarioRepository;
		/** @private */
		this.compraRepository = compraRepository;
		/** @private */
		this.reloj = reloj;
		/**
		 * Serializa la comprobación de duplicados y el guardado de la reseña.
		 * @private
		 */
		this.exclusion = new ExclusionMutua();
	}

	/**
	 * Crea la reseña de un comprador sobre un evento.
	 * Requiere que el evento ya haya ocurrido, que el comprador tenga una compra
	 * UTILIZADA de ese evento y que no lo haya reseñado antes.
	 * @param {object} datosResenia
	 * @param {string} datosResenia.compradorId - ID del comprador (viene del token, no del cliente)
	 * @param {string} datosResenia.eventoId
	 * @param {string} datosResenia.detalle
	 * @param {number} datosResenia.puntuacion - Entero de 1 a 5
	 * @returns {Promise<Resenia>} La reseña creada
	 * @throws {BadRequestError} Si los datos son inválidos o el evento aún no ocurrió
	 * @throws {ForbiddenError} Si el usuario no es COMPRADOR o no tiene una compra UTILIZADA del evento
	 * @throws {NotFoundError} Si el comprador o el evento no existen
	 * @throws {ConflictError} Si el comprador ya reseñó el evento
	 */
	async crearResenia(datosResenia) {
		const resultado = crearReseniaSchema.safeParse(datosResenia);
		if (!resultado.success) {
			throw new BadRequestError(
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		const { compradorId, eventoId, detalle, puntuacion } = resultado.data;

		const comprador = await this.usuarioRepository.buscarPorId(compradorId);
		if (!comprador) {
			throw new NotFoundError(`El comprador con ID ${compradorId} no existe.`);
		}
		if (comprador.rol !== COMPRADOR.nombre) {
			throw new ForbiddenError('Solo los compradores pueden reseñar eventos.');
		}

		const evento = await this.eventoRepository.buscarPorId(eventoId);
		if (!evento) {
			throw new NotFoundError(`El evento con ID ${eventoId} no existe.`);
		}
		if (new Date(evento.fecha) > this.reloj()) {
			throw new BadRequestError('El evento aún no ha ocurrido.');
		}

		return this.exclusion.ejecutar(async () => {
			const compras = await this.compraRepository.buscarPorCompradorYEvento(
				comprador.id,
				evento.id
			);
			if (!compras.some((c) => ESTADOS_QUE_HABILITAN.has(c.estado))) {
				throw new ForbiddenError(
					'Solo puedes reseñar eventos en los que tengas una entrada utilizada.'
				);
			}
			const existente = await this.reseniaRepository.buscarPorCompradorYEvento(
				comprador.id,
				evento.id
			);
			if (existente) {
				throw new ConflictError('Ya reseñaste este evento.');
			}

			return this.reseniaRepository.crear(
				new Resenia(null, comprador, evento, detalle, puntuacion)
			);
		});
	}

	/**
	 * Lista las reseñas de un evento, en orden de creación.
	 * @param {string} idEvento - ID del evento (viene de la URL)
	 * @returns {Promise<Resenia[]>} Reseñas del evento (vacío si no tiene)
	 * @throws {BadRequestError} Si el ID es inválido
	 * @throws {NotFoundError} Si el evento no existe
	 */
	async listarPorEvento(idEvento) {
		const resultado = idEventoSchema.safeParse(idEvento);
		if (!resultado.success) {
			throw new BadRequestError(
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		const id = resultado.data;

		const evento = await this.eventoRepository.buscarPorId(id);
		if (!evento) {
			throw new NotFoundError(`El evento con ID ${id} no existe.`);
		}
		return this.reseniaRepository.buscarPorEventoId(evento.id);
	}

	/**
	 * Lista las reseñas de todos los eventos de un organizador, en orden de creación.
	 * Permite mostrar en cada evento la experiencia previa con ese organizador.
	 * @param {string} idOrganizador - ID del organizador (viene de la URL)
	 * @returns {Promise<Resenia[]>} Reseñas de sus eventos (vacío si no tiene)
	 * @throws {BadRequestError} Si el ID es inválido
	 * @throws {NotFoundError} Si el usuario no existe o no es ORGANIZADOR
	 */
	async listarPorOrganizador(idOrganizador) {
		const resultado = idUsuarioSchema.safeParse(idOrganizador);
		if (!resultado.success) {
			throw new BadRequestError(
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		const id = resultado.data;

		const organizador = await this.usuarioRepository.buscarPorId(id);
		if (!organizador || organizador.rol !== ORGANIZADOR.nombre) {
			throw new NotFoundError(`El organizador con ID ${id} no existe.`);
		}
		return this.reseniaRepository.buscarPorOrganizadorId(organizador.id);
	}
}
