/**
 * Servicio de compras: reglas de negocio para comprar entradas.
 *
 * @module services/compraService
 * @license ISC
 */
import { crearCompraSchema, idCompraSchema } from '../dto/compra.js';
import CambioEstadoCompra from '../models/cambioEstadoCompra.js';
import Compra from '../models/compra.js';
import EstadoCompra from '../models/estadoCompra.js';
import { COMPRADOR, ORGANIZADOR } from '../models/roles.js';
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
		this._exigirEventoFuturo(evento);

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
	 * Cancela una compra PENDIENTE o CONFIRMADA y libera su cupo.
	 * Pueden hacerlo el comprador dueño de la compra o el organizador del evento.
	 * @param {object} datos
	 * @param {string} datos.compraId - ID de la compra (viene de la URL)
	 * @param {string} datos.usuarioId - ID del usuario que cancela (viene del token)
	 * @returns {Promise<Compra>} La compra en estado CANCELADA
	 * @throws {ErrorHttp} 400 si el ID es inválido o el evento ya ocurrió
	 * @throws {ErrorHttp} 403 si el usuario no es el comprador ni el organizador del evento
	 * @throws {ErrorHttp} 404 si la compra o el usuario no existen
	 * @throws {ErrorHttp} 409 si la compra no está PENDIENTE ni CONFIRMADA
	 */
	cancelarCompra({ compraId, usuarioId }) {
		return this._cambiarEstado(compraId, usuarioId, EstadoCompra.CANCELADA, {
			accion: 'cancelar',
			puedeActuar: (actor, compra) =>
				this._esComprador(actor, compra) || this._esOrganizador(actor, compra)
		});
	}

	/**
	 * Confirma una compra PENDIENTE. Solo el organizador del evento puede hacerlo.
	 * @param {object} datos
	 * @param {string} datos.compraId - ID de la compra (viene de la URL)
	 * @param {string} datos.usuarioId - ID del organizador (viene del token)
	 * @returns {Promise<Compra>} La compra en estado CONFIRMADA
	 * @throws {ErrorHttp} 400 si el ID es inválido o el evento ya ocurrió
	 * @throws {ErrorHttp} 403 si el usuario no es el organizador del evento
	 * @throws {ErrorHttp} 404 si la compra o el usuario no existen
	 * @throws {ErrorHttp} 409 si la compra no está PENDIENTE
	 */
	confirmarCompra({ compraId, usuarioId }) {
		return this._cambiarEstado(compraId, usuarioId, EstadoCompra.CONFIRMADA, {
			accion: 'confirmar',
			puedeActuar: (actor, compra) => this._esOrganizador(actor, compra)
		});
	}

	/**
	 * Reembolsa una compra CONFIRMADA y libera su cupo. Solo el organizador del evento puede hacerlo.
	 * @param {object} datos
	 * @param {string} datos.compraId - ID de la compra (viene de la URL)
	 * @param {string} datos.usuarioId - ID del organizador (viene del token)
	 * @returns {Promise<Compra>} La compra en estado REEMBOLSADA
	 * @throws {ErrorHttp} 400 si el ID es inválido o el evento ya ocurrió
	 * @throws {ErrorHttp} 403 si el usuario no es el organizador del evento
	 * @throws {ErrorHttp} 404 si la compra o el usuario no existen
	 * @throws {ErrorHttp} 409 si la compra no está CONFIRMADA
	 */
	reembolsarCompra({ compraId, usuarioId }) {
		return this._cambiarEstado(compraId, usuarioId, EstadoCompra.REEMBOLSADA, {
			accion: 'reembolsar',
			puedeActuar: (actor, compra) => this._esOrganizador(actor, compra)
		});
	}

	/**
	 * Aplica una transición de estado: valida, cambia el estado, persiste y deja el historial.
	 * La lectura, la validación y la escritura se hacen en exclusión mutua para que dos
	 * peticiones simultáneas no apliquen la misma transición dos veces.
	 * @private
	 * @param {string} compraId
	 * @param {string} usuarioId
	 * @param {string} estadoDestino - Valor de `EstadoCompra`
	 * @param {object} reglas
	 * @param {string} reglas.accion - Verbo para el mensaje de error (por ejemplo, 'cancelar')
	 * @param {(actor: import('../models/usuario.js').default, compra: Compra) => boolean} reglas.puedeActuar - Regla de propiedad
	 * @returns {Promise<Compra>} La compra actualizada
	 * @throws {ErrorHttp} 400, 403, 404 o 409 según la regla incumplida
	 */
	async _cambiarEstado(compraId, usuarioId, estadoDestino, { accion, puedeActuar }) {
		const resultado = idCompraSchema.safeParse(compraId);
		if (!resultado.success) {
			throw new ErrorHttp(
				400,
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		const id = resultado.data;

		return this.exclusion.ejecutar(async () => {
			const compra = await this.compraRepository.buscarPorId(id);
			if (!compra) {
				throw new ErrorHttp(404, `La compra con ID ${id} no existe.`);
			}
			const actor = await this.usuarioRepository.buscarPorId(usuarioId);
			if (!actor) {
				throw new ErrorHttp(404, `El usuario con ID ${usuarioId} no existe.`);
			}
			if (!puedeActuar(actor, compra)) {
				throw new ErrorHttp(
					403,
					`No tienes permiso para ${accion} esta compra.`
				);
			}
			if (!compra.puedeTransicionarA(estadoDestino)) {
				throw new ErrorHttp(
					409,
					`No se puede ${accion} una compra en estado ${compra.estado}.`
				);
			}
			this._exigirEventoFuturo(compra.evento);

			compra.actualizarEstado(estadoDestino);
			const actualizada = await this.compraRepository.actualizar(compra);
			await this.cambioEstadoCompraRepository.crear(
				new CambioEstadoCompra(null, actualizada, estadoDestino, actor, this.reloj())
			);
			return actualizada;
		});
	}

	/**
	 * Exige que el evento aún no haya ocurrido.
	 * @private
	 * @param {import('../models/evento.js').default} evento
	 * @returns {void}
	 * @throws {ErrorHttp} 400 si la fecha del evento ya pasó
	 */
	_exigirEventoFuturo(evento) {
		if (new Date(evento.fecha) <= this.reloj()) {
			throw new ErrorHttp(400, 'El evento ya ocurrió.');
		}
	}

	/**
	 * @private
	 * @param {import('../models/usuario.js').default} actor
	 * @param {Compra} compra
	 * @returns {boolean} true si el actor es el comprador dueño de la compra
	 */
	_esComprador(actor, compra) {
		return actor.rol === COMPRADOR.nombre && compra.comprador.id === actor.id;
	}

	/**
	 * @private
	 * @param {import('../models/usuario.js').default} actor
	 * @param {Compra} compra
	 * @returns {boolean} true si el actor es el organizador del evento de la compra
	 */
	_esOrganizador(actor, compra) {
		return (
			actor.rol === ORGANIZADOR.nombre && compra.evento.organizador?.id === actor.id
		);
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
