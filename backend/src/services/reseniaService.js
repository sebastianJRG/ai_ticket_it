/**
 * Servicio de reseñas: reglas de negocio para opinar sobre eventos.
 *
 * @module services/reseniaService
 * @license ISC
 */
import { crearReseniaSchema, idEventoSchema } from '../dto/resenia.js';
import EstadoCompra from '../models/estadoCompra.js';
import Resenia from '../models/resenia.js';
import { COMPRADOR } from '../models/roles.js';
import ErrorHttp from '../utils/errorHttp.js';
import ExclusionMutua from '../utils/exclusionMutua.js';

/** Estados de compra que habilitan a reseñar el evento. */
const ESTADOS_QUE_HABILITAN = new Set([
	EstadoCompra.CONFIRMADA,
	EstadoCompra.UTILIZADA
]);

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
	 * CONFIRMADA o UTILIZADA de ese evento y que no lo haya reseñado antes.
	 * @param {object} datosResenia
	 * @param {string} datosResenia.compradorId - ID del comprador (viene del token, no del cliente)
	 * @param {string} datosResenia.eventoId
	 * @param {string} datosResenia.detalle
	 * @param {number} datosResenia.puntuacion - Entero de 1 a 5
	 * @returns {Promise<Resenia>} La reseña creada
	 * @throws {ErrorHttp} 400 si los datos son inválidos o el evento aún no ocurrió
	 * @throws {ErrorHttp} 403 si el usuario no es COMPRADOR o no tiene una compra elegible del evento
	 * @throws {ErrorHttp} 404 si el comprador o el evento no existen
	 * @throws {ErrorHttp} 409 si el comprador ya reseñó el evento
	 */
	async crearResenia(datosResenia) {
		const resultado = crearReseniaSchema.safeParse(datosResenia);
		if (!resultado.success) {
			throw new ErrorHttp(
				400,
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		const { compradorId, eventoId, detalle, puntuacion } = resultado.data;

		const comprador = await this.usuarioRepository.buscarPorId(compradorId);
		if (!comprador) {
			throw new ErrorHttp(404, `El comprador con ID ${compradorId} no existe.`);
		}
		if (comprador.rol !== COMPRADOR.nombre) {
			throw new ErrorHttp(403, 'Solo los compradores pueden reseñar eventos.');
		}

		const evento = await this.eventoRepository.buscarPorId(eventoId);
		if (!evento) {
			throw new ErrorHttp(404, `El evento con ID ${eventoId} no existe.`);
		}
		if (new Date(evento.fecha) > this.reloj()) {
			throw new ErrorHttp(400, 'El evento aún no ha ocurrido.');
		}

		return this.exclusion.ejecutar(async () => {
			const compras = await this.compraRepository.buscarPorCompradorYEvento(
				comprador.id,
				evento.id
			);
			if (!compras.some((c) => ESTADOS_QUE_HABILITAN.has(c.estado))) {
				throw new ErrorHttp(
					403,
					'Solo puedes reseñar eventos en los que tengas una compra confirmada.'
				);
			}
			const existente = await this.reseniaRepository.buscarPorCompradorYEvento(
				comprador.id,
				evento.id
			);
			if (existente) {
				throw new ErrorHttp(409, 'Ya reseñaste este evento.');
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
	 * @throws {ErrorHttp} 400 si el ID es inválido
	 * @throws {ErrorHttp} 404 si el evento no existe
	 */
	async listarPorEvento(idEvento) {
		const resultado = idEventoSchema.safeParse(idEvento);
		if (!resultado.success) {
			throw new ErrorHttp(
				400,
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		const id = resultado.data;

		const evento = await this.eventoRepository.buscarPorId(id);
		if (!evento) {
			throw new ErrorHttp(404, `El evento con ID ${id} no existe.`);
		}
		return this.reseniaRepository.buscarPorEventoId(evento.id);
	}
}
