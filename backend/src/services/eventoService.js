import { actualizarEventoSchema, crearEventoSchema } from '../dto/evento.js';
import Evento from '../models/evento.js';
import TipoEntrada from '../models/tipoEntrada.js';
import CategoriaRepository from '../repositories/categoriaRepository.js';
import EventoRepository from '../repositories/eventoRepository.js';
import TipoEntradaRepository from '../repositories/tipoEntradaRepository.js';
import UsuarioRepository from '../repositories/usuarioRepository.js';

export default class EventoService {
	/** Constructor del servicio de eventos.
	 * @param {EventoRepository} eventoRepository
	 * @param {CategoriaRepository} categoriaRepository
	 * @param {UsuarioRepository} usuarioRepository
	 * @param {TipoEntradaRepository} tipoEntradaRepository
	 */
	constructor(
		eventoRepository,
		categoriaRepository,
		usuarioRepository,
		tipoEntradaRepository
	) {
		/** @private */
		this.eventoRepository = eventoRepository;
		/** @private */
		this.categoriaRepository = categoriaRepository;
		/** @private */
		this.usuarioRepository = usuarioRepository;
		/** @private */
		this.tipoEntradaRepository = tipoEntradaRepository;
	}

	/** Obtiene todos los eventos disponibles.
	 * @returns {Promise<Evento[]>}
	 */
	async obtenerTodos() {
		return await this.eventoRepository.obtenerTodos();
	}

	/** Obtiene un evento por su ID.
	 * @param {string} id
	 * @returns {Promise<Evento>}
	 * @throws {Error} Si el evento no existe
	 */
	async obtenerPorId(id) {
		const evento = await this.eventoRepository.buscarPorId(id);
		if (!evento) {
			throw new Error(`El evento con ID ${id} no existe.`);
		}
		return evento;
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
