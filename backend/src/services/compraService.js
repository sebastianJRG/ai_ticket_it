/**
 * Servicio de compras: reglas de negocio para comprar entradas.
 *
 * @module services/compraService
 * @license ISC
 */
import { crearCompraSchema } from '../dto/compra.js';
import CambioEstadoCompra from '../models/cambioEstadoCompra.js';
import Compra from '../models/compra.js';
import EstadoCompra from '../models/estadoCompra.js';
import { COMPRADOR } from '../models/roles.js';
import ErrorHttp from '../utils/errorHttp.js';
import ExclusionMutua from '../utils/exclusionMutua.js';

/** Estados en los que una compra ocupa cupo. CANCELADA y REEMBOLSADA lo liberan. */
const ESTADOS_QUE_RESERVAN = new Set([
	EstadoCompra.PENDIENTE,
	EstadoCompra.CONFIRMADA,
	EstadoCompra.UTILIZADA
]);

export default class CompraService {
	/**
	 * @param {import('../repositories/compraRepository.js').default} compraRepository
	 * @param {import('../repositories/eventoRepository.js').default} eventoRepository
	 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository
	 * @param {import('../repositories/cambioEstadoCompraRepository.js').default} cambioEstadoCompraRepository
	 * @param {() => Date} [reloj] Devuelve la fecha actual; se inyecta para poder probar sin depender de la hora real
	 */
	constructor(
		compraRepository,
		eventoRepository,
		usuarioRepository,
		cambioEstadoCompraRepository,
		reloj = () => new Date()
	) {
		/** @private */
		this.compraRepository = compraRepository;
		/** @private */
		this.eventoRepository = eventoRepository;
		/** @private */
		this.usuarioRepository = usuarioRepository;
		/** @private */
		this.cambioEstadoCompraRepository = cambioEstadoCompraRepository;
		/** @private */
		this.reloj = reloj;
		/**
		 * Serializa la validación de cupo y el guardado de la compra.
		 * @private
		 */
		this.exclusion = new ExclusionMutua();
	}

	/**
	 * Crea una compra en estado PENDIENTE reservando cupo del tipo de entrada.
	 * La validación del cupo y el guardado se hacen en exclusión mutua, de modo que
	 * compras simultáneas nunca superen la capacidad del tipo de entrada.
	 * El total lo calcula el servidor (precio × cantidad).
	 * @param {object} datosCompra
	 * @param {string} datosCompra.compradorId - ID del comprador (viene del token, no del cliente)
	 * @param {string} datosCompra.eventoId
	 * @param {string} datosCompra.tipoEntradaId
	 * @param {number} datosCompra.cantidad
	 * @returns {Promise<Compra>} La compra creada
	 * @throws {ErrorHttp} 400 si los datos son inválidos o el evento ya ocurrió
	 * @throws {ErrorHttp} 403 si el usuario no es COMPRADOR
	 * @throws {ErrorHttp} 404 si el comprador, el evento o el tipo de entrada no existen
	 * @throws {ErrorHttp} 409 si no hay cupo suficiente
	 */
	async crearCompra(datosCompra) {
		const resultado = crearCompraSchema.safeParse(datosCompra);
		if (!resultado.success) {
			throw new ErrorHttp(
				400,
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		const { compradorId, eventoId, tipoEntradaId, cantidad } = resultado.data;

		const comprador = await this.usuarioRepository.buscarPorId(compradorId);
		if (!comprador) {
			throw new ErrorHttp(404, `El comprador con ID ${compradorId} no existe.`);
		}
		if (comprador.rol !== COMPRADOR.nombre) {
			throw new ErrorHttp(403, 'Solo los compradores pueden realizar compras.');
		}

		const evento = await this.eventoRepository.buscarPorId(eventoId);
		if (!evento) {
			throw new ErrorHttp(404, `El evento con ID ${eventoId} no existe.`);
		}
		if (new Date(evento.fecha) <= this.reloj()) {
			throw new ErrorHttp(400, 'El evento ya ocurrió.');
		}

		const tipoEntrada = evento.tiposEntrada.find((t) => t.id === tipoEntradaId);
		if (!tipoEntrada) {
			throw new ErrorHttp(
				404,
				`El tipo de entrada con ID ${tipoEntradaId} no pertenece al evento.`
			);
		}

		return this.exclusion.ejecutar(async () => {
			const disponibles =
				tipoEntrada.cupo - (await this._cantidadReservada(evento, tipoEntrada));
			if (cantidad > disponibles) {
				throw new ErrorHttp(409, this._mensajeCupo(disponibles));
			}

			const compra = await this.compraRepository.crear(
				new Compra(
					null,
					comprador,
					evento,
					tipoEntrada,
					cantidad,
					tipoEntrada.precio * cantidad,
					EstadoCompra.PENDIENTE
				)
			);
			await this.cambioEstadoCompraRepository.crear(
				new CambioEstadoCompra(
					null,
					compra,
					EstadoCompra.PENDIENTE,
					comprador,
					this.reloj()
				)
			);
			return compra;
		});
	}

	/**
	 * Suma las entradas ya reservadas de un tipo de entrada de un evento.
	 * @private
	 * @param {import('../models/evento.js').default} evento
	 * @param {import('../models/tipoEntrada.js').default} tipoEntrada
	 * @returns {Promise<number>} Cantidad en compras PENDIENTE, CONFIRMADA o UTILIZADA
	 */
	async _cantidadReservada(evento, tipoEntrada) {
		const compras = await this.compraRepository.obtenerTodos();
		return compras
			.filter(
				(c) =>
					c.evento.id === evento.id &&
					c.tipoEntrada.id === tipoEntrada.id &&
					ESTADOS_QUE_RESERVAN.has(c.estado)
			)
			.reduce((suma, c) => suma + c.cantidad, 0);
	}

	/**
	 * Arma el mensaje de cupo insuficiente.
	 * @private
	 * @param {number} disponibles
	 * @returns {string}
	 */
	_mensajeCupo(disponibles) {
		return disponibles === 1
			? 'Cupo insuficiente: queda 1 entrada disponible.'
			: `Cupo insuficiente: quedan ${disponibles} entradas disponibles.`;
	}
}
