import {
	actualizarEventoSchema,
	crearEventoSchema,
	listarEventosSchema
} from '../dto/evento.js';
import { idEventoSchema } from '../dto/resenia.js';
import Evento from '../models/evento.js';
import TipoEntrada from '../models/tipoEntrada.js';
import CategoriaRepository from '../repositories/categoriaRepository.js';
import EventoRepository from '../repositories/eventoRepository.js';
import TipoEntradaRepository from '../repositories/tipoEntradaRepository.js';
import UsuarioRepository from '../repositories/usuarioRepository.js';
import ErrorHttp from '../utils/errorHttp.js';

export default class EventoService {
	/** Constructor del servicio de eventos.
	 * @param {EventoRepository} eventoRepository
	 * @param {CategoriaRepository} categoriaRepository
	 * @param {UsuarioRepository} usuarioRepository
	 * @param {TipoEntradaRepository} tipoEntradaRepository
	 * @param {import('../repositories/reseniaRepository.js').default} [reseniaRepository] Necesario para ordenar por puntaje
	 * @param {{info: (linea: string) => void}} [logger=console] Destino de los logs estructurados (JSON)
	 */
	constructor(
		eventoRepository,
		categoriaRepository,
		usuarioRepository,
		tipoEntradaRepository,
		reseniaRepository,
		logger = console
	) {
		/** @private */
		this.logger = logger;
		/** @private */
		this.eventoRepository = eventoRepository;
		/** @private */
		this.categoriaRepository = categoriaRepository;
		/** @private */
		this.usuarioRepository = usuarioRepository;
		/** @private */
		this.tipoEntradaRepository = tipoEntradaRepository;
		/** @private */
		this.reseniaRepository = reseniaRepository;
	}

	/** Busca eventos con búsqueda textual, filtro por categoría y ordenamiento opcional.
	 *
	 * Cada evento devuelto incluye `puntajeOrganizador`: promedio de las reseñas de todos los
	 * eventos de su organizador (null si no tiene). `sortBy=puntaje` ordena por ese valor.
	 * Orden por defecto cuando no se indica `order`: precio ascendente, fecha ascendente
	 * y puntaje descendente. Los eventos de organizadores sin reseñas siempre quedan al final
	 * al ordenar por puntaje.
	 * @param {object} [query] Parámetros de consulta (típicamente req.query)
	 * @param {string} [query.q] Texto a buscar en nombre o descripción
	 * @param {string} [query.categoriaId] ID de categoría por el cual filtrar
	 * @param {'precio'|'fecha'|'puntaje'} [query.sortBy] Criterio de ordenamiento
	 * @param {'asc'|'desc'} [query.order] Sentido del ordenamiento
	 * @returns {Promise<Array<Evento & {puntajeOrganizador: number|null}>>} Eventos que cumplen los criterios (puede ser vacío)
	 * @throws {Error} Si algún parámetro de consulta es inválido
	 */
	async buscarEventos(query = {}) {
		const resultado = listarEventosSchema.safeParse(query);
		if (!resultado.success) {
			const message =
				resultado.error.issues[0]?.message || 'Error de validación';
			throw new Error(message);
		}

		const { q, categoriaId, sortBy, order } = resultado.data;
		const encontrados = await this.eventoRepository.buscarEventos({
			texto: q,
			categoriaId
		});
		const puntajes = await this._puntajesPorOrganizador();
		const eventos = encontrados.map((e) => this._conPuntaje(e, puntajes));

		if (!sortBy) return eventos;

		if (sortBy === 'puntaje') {
			const factor = (order ?? 'desc') === 'asc' ? 1 : -1;
			return eventos.sort((a, b) => {
				const pa = a.puntajeOrganizador;
				const pb = b.puntajeOrganizador;
				// Sin reseñas siempre al final, sin importar el sentido
				if (pa === null && pb === null) return 0;
				if (pa === null) return 1;
				if (pb === null) return -1;
				return (pa - pb) * factor;
			});
		}

		const factor = (order ?? 'asc') === 'asc' ? 1 : -1;
		const valor =
			sortBy === 'precio'
				? (e) => this._precioDesde(e)
				: (e) => new Date(e.fecha).getTime();
		return eventos.sort((a, b) => (valor(a) - valor(b)) * factor);
	}

	/** Precio mínimo entre los tipos de entrada de un evento.
	 * @private
	 * @param {Evento} evento
	 * @returns {number} Precio más bajo, o Infinity si no tiene tipos de entrada
	 */
	_precioDesde(evento) {
		return Math.min(...evento.tiposEntrada.map((t) => t.precio));
	}

	/** Calcula el puntaje promedio de las reseñas de todos los eventos de cada organizador.
	 * @private
	 * @returns {Promise<Map<string, number>>} Mapa de ID de organizador a promedio; los organizadores sin reseñas no aparecen
	 */
	async _puntajesPorOrganizador() {
		const resenias = this.reseniaRepository
			? await this.reseniaRepository.obtenerTodos()
			: [];
		const acumulado = new Map();
		for (const r of resenias) {
			const organizadorId = r.evento?.organizador?.id;
			if (organizadorId === undefined || organizadorId === null) continue;
			const actual = acumulado.get(organizadorId) ?? { suma: 0, cantidad: 0 };
			actual.suma += r.puntuacion;
			actual.cantidad += 1;
			acumulado.set(organizadorId, actual);
		}
		return new Map(
			[...acumulado].map(([id, { suma, cantidad }]) => [id, suma / cantidad])
		);
	}

	/** Agrega al evento el puntaje de su organizador (sin modificar el original).
	 * @private
	 * @param {Evento} evento
	 * @param {Map<string, number>} puntajes - Resultado de `_puntajesPorOrganizador`
	 * @returns {Evento & {puntajeOrganizador: number|null}} Copia del evento con `puntajeOrganizador`
	 */
	_conPuntaje(evento, puntajes) {
		const copia = Object.assign(
			Object.create(Object.getPrototypeOf(evento)),
			evento
		);
		copia.puntajeOrganizador = puntajes.get(evento.organizador?.id) ?? null;
		return copia;
	}

	/** Obtiene todos los eventos disponibles.
	 * @returns {Promise<Evento[]>}
	 */
	async obtenerTodos() {
		return await this.eventoRepository.obtenerTodos();
	}

	/** Obtiene un evento por su ID.
	 * @param {string} id - ID del evento (texto no vacío)
	 * @returns {Promise<Evento & {puntajeOrganizador: number|null}>} El evento con el puntaje de su organizador
	 * @throws {ErrorHttp} 400 si el ID es vacío o no es un texto
	 * @throws {ErrorHttp} 404 si el evento no existe
	 */
	async obtenerPorId(id) {
		const resultado = idEventoSchema.safeParse(id);
		if (!resultado.success) {
			throw new ErrorHttp(
				400,
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		const evento = await this.eventoRepository.buscarPorId(resultado.data);
		if (!evento) {
			throw new ErrorHttp(404, `El evento con ID ${resultado.data} no existe.`);
		}
		return this._conPuntaje(evento, await this._puntajesPorOrganizador());
	}

	/** Resuelve una lista de IDs a eventos (por ejemplo, los favoritos de un comprador).
	 * Respeta el orden recibido y omite los IDs que ya no corresponden a un evento.
	 * @param {string[]} ids - IDs de eventos, en el orden deseado
	 * @param {{requestId?: string}} [contexto={}] - Datos de la petición para el log
	 * @returns {Promise<Array<Evento & {puntajeOrganizador: number|null}>>} Eventos encontrados, con el puntaje de su organizador
	 */
	async obtenerPorIds(ids, contexto = {}) {
		const encontrados = [];
		for (const id of ids) {
			const evento = await this.eventoRepository.buscarPorId(id);
			if (evento) encontrados.push(evento);
		}
		const puntajes =
			encontrados.length > 0 ? await this._puntajesPorOrganizador() : new Map();

		this.logger.info(
			JSON.stringify({
				evento: 'eventos_resueltos',
				requestId: contexto.requestId ?? null,
				solicitados: ids.length,
				encontrados: encontrados.length
			})
		);
		return encontrados.map((e) => this._conPuntaje(e, puntajes));
	}

	/** Crea un nuevo evento validando los campos y dependencias requeridas (categoría, organizador, tipos de entrada).
	 * @param {object} datosEvento
	 * @returns {Promise<Evento>}
	 */
	async crearEvento(datosEvento) {
		// 1. Validación estructural y de tipos con Zod (reemplaza todos tus IFs manuales)
		const resultado = crearEventoSchema.safeParse(datosEvento);
		if (!resultado.success) {
			const message =
				resultado.error.issues[0]?.message || 'Error de validación';
			throw new Error(message);
		}

		const datosValidados = resultado.data;

		// 2. Validaciones de Reglas de Negocio (Consultas a BD)
		const categoria = await this.categoriaRepository.buscarPorId(
			datosValidados.categoriaId
		);
		if (!categoria) {
			throw new Error(
				`La categoría con ID ${datosValidados.categoriaId} no existe.`
			);
		}

		const organizador = await this.usuarioRepository.buscarPorId(
			datosValidados.organizadorId
		);
		if (!organizador) {
			throw new Error(
				`El organizador con ID ${datosValidados.organizadorId} no existe.`
			);
		}

		// 3. Crear y persistir las instancias de Tipos de Entrada
		const tiposEntradaInstancias = [];
		for (const te of datosValidados.tiposEntrada) {
			// Los datos (te.nombre, te.precio, etc.) ya están validados y formateados por Zod
			const nuevoTipoEntrada = new TipoEntrada(
				null,
				te.nombre,
				te.descripcion,
				te.precio,
				te.cupo
			);

			const tipoEntradaPersistido =
				await this.tipoEntradaRepository.crear(nuevoTipoEntrada);
			tiposEntradaInstancias.push(tipoEntradaPersistido);
		}

		// 4. Instanciar el Evento
		const nuevoEvento = new Evento(
			null,
			datosValidados.nombre,
			datosValidados.descripcion,
			categoria, // Tu constructor usa la entidad completa
			datosValidados.fecha, // Ya es un objeto Date gracias a z.coerce.date()
			tiposEntradaInstancias, // Entidades persistidas
			datosValidados.multimedia, // Ya limpiado por Zod
			organizador // Tu constructor usa la entidad completa
		);

		return await this.eventoRepository.crear(nuevoEvento);
	}

	/** Actualiza un evento existente.
	 * @param {string} eventoId
	 * @param {object} datosActualizacion
	 * @returns {Promise<Evento>}
	 */
	async actualizarEvento(eventoId, datosActualizacion) {
		// 1. Buscar el evento existente
		const evento = await this.eventoRepository.buscarPorId(eventoId);
		if (!evento) {
			throw new Error(`El evento con ID ${eventoId} no existe.`);
		}

		// 2. Validar con Zod (ignora organizadorId y hace todo opcional)
		const resultado = actualizarEventoSchema.safeParse(datosActualizacion);
		if (!resultado.success) {
			const message =
				resultado.error.issues[0]?.message || 'Error de validación';
			throw new Error(message);
		}

		const datosValidados = resultado.data;

		// Verificar si se enviaron datos
		if (Object.keys(datosValidados).length === 0) {
			throw new Error('No se enviaron datos válidos para actualizar.');
		}

		// 3. Actualizar campos simples si vienen en la petición
		if (datosValidados.nombre) evento.nombre = datosValidados.nombre;
		if (datosValidados.descripcion)
			evento.descripcion = datosValidados.descripcion;
		if (datosValidados.fecha) evento.fecha = datosValidados.fecha;
		if (datosValidados.multimedia)
			evento.multimedia = datosValidados.multimedia;

		// 5. Actualizar Tipos de Entrada
		// OJO: Esta lógica reemplaza los tickets viejos por los nuevos.
		if (datosValidados.tiposEntrada) {
			const nuevosTiposEntrada = [];
			for (const te of datosValidados.tiposEntrada) {
				const nuevoTipo = new TipoEntrada(
					null,
					te.nombre,
					te.descripcion,
					te.precio,
					te.cupo
				);
				const tipoPersistido =
					await this.tipoEntradaRepository.crear(nuevoTipo);
				nuevosTiposEntrada.push(tipoPersistido);
			}
			const tipoViejos = evento.tiposEntrada;
			if (tipoViejos.every((tipo) => nuevosTiposEntrada.includes(tipo))) {
				evento.tiposEntrada = nuevosTiposEntrada;
			} else {
				throw new Error(
					'No puede modificar tipos de entrada existentes, solo agregar'
				);
			}
		}

		// 6. Guardar cambios
		return await this.eventoRepository.actualizar(evento);
	}
}
