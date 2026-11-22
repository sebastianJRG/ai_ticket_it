import { idEventoSchema } from '../dto/resenia.js';
import { actualizarUsuarioSchema, crearUsuarioSchema } from '../dto/usuario.js';
import { COMPRADOR, ORGANIZADOR } from '../models/roles.js';
import Usuario from '../models/usuario.js';
import {
	BadRequestError,
	ConflictError,
	NotFoundError
} from '../errors/index.js';
import { hashContrasenia } from '../utils/hashing.js';

/** Mapeo entre roles y permisos del sistema.
 * @private
 * @type {Object<string, string[]>}
 */
const permisosPorRol = {
	[ORGANIZADOR.nombre]: ORGANIZADOR.permisos,
	[COMPRADOR.nombre]: COMPRADOR.permisos
};

export default class UsuarioService {
	/** Crea una instancia de UsuarioService.
	 * @param {import('../repositories/usuarioRepository.js').default} usuarioRepository Repositorio de usuarios
	 * @param {import('../repositories/eventoRepository.js').default} [eventoRepository] Repositorio de eventos (necesario para agregar favoritos)
	 * @param {{info: (linea: string) => void}} [logger=console] Destino de los logs estructurados (JSON)
	 */
	constructor(usuarioRepository, eventoRepository, logger = console) {
		/** @private {import('../repositories/usuarioRepository.js').default} */
		this.usuarioRepository = usuarioRepository;
		/** @private {import('../repositories/eventoRepository.js').default|undefined} */
		this.eventoRepository = eventoRepository;
		/** @private {{info: (linea: string) => void}} */
		this.logger = logger;
	}

	/** Valida el ID de un evento recibido por URL.
	 * @private
	 * @param {unknown} id - ID a validar
	 * @returns {string} ID sin espacios alrededor
	 * @throws {BadRequestError} Si no es un texto o queda vacío
	 */
	_validarIdEvento(id) {
		const resultado = idEventoSchema.safeParse(id);
		if (!resultado.success) {
			throw new BadRequestError(
				resultado.error.issues[0]?.message || 'Error de validación'
			);
		}
		return resultado.data;
	}

	/** Busca un usuario o lanza NotFoundError.
	 * @private
	 * @param {string} usuarioId - ID del usuario (tomado del token JWT)
	 * @returns {Promise<import('../models/usuario.js').default>} Usuario encontrado
	 * @throws {NotFoundError} Si el usuario no existe
	 */
	async _usuarioOFallar(usuarioId) {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) {
			throw new NotFoundError('El usuario no existe.');
		}
		return usuario;
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

	/** Obtiene un usuario por su ID.
	 * @param {string} usuarioId - El ID del usuario
	 * @returns {Promise<import('../models/usuario.js').default>} El usuario encontrado
	 * @throws {NotFoundError} Si el usuario no existe
	 */
	async obtenerPorId(usuarioId) {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) {
			throw new NotFoundError(`El usuario con ID ${usuarioId} no existe.`);
		}
		return usuario;
	}

	/** Obtiene el perfil del usuario autenticado.
	 * @param {string} usuarioId - ID del usuario (tomado del token JWT)
	 * @returns {Promise<import('../models/usuario.js').default>} El usuario encontrado
	 * @throws {NotFoundError} Si el usuario no existe
	 */
	async obtenerPerfil(usuarioId) {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) {
			throw new NotFoundError('El usuario no existe.');
		}
		return usuario;
	}

	/** Crea un nuevo usuario validando los campos mediante DTO.
	 * Los permisos se asignan automáticamente según el rol enviado.
	 * @param {object} datosUsuario - DTO con los datos del usuario
	 * @returns {Promise<import('../models/usuario.js').default>} El usuario creado
	 * @throws {BadRequestError} Si los datos son inválidos
	 * @throws {ConflictError} Si el nombre de usuario ya está en uso
	 */
	async crearUsuario(datosUsuario) {
		// 1️⃣ Validar el objeto plano que viene del controlador con Zod
		const resultado = crearUsuarioSchema.safeParse(datosUsuario);

		if (!resultado.success) {
			const message =
				resultado.error.issues[0]?.message || 'Error de validación';
			throw new BadRequestError(message);
		}

		// 2️⃣ Verificar unicidad del nombre de usuario
		const { nombre, apellido, nombreUsuario, contrasenia, rol } =
			resultado.data;
		const nombreUsuarioExistente =
			await this.usuarioRepository.existePorNombreUsuario(nombreUsuario);
		if (nombreUsuarioExistente) {
			throw new ConflictError('El nombre de usuario ya está en uso.');
		}

		// 3. Asignar permisos según el rol
		const permisos = permisosPorRol[rol] || [];

		// 4. Crear la entidad para guardar en la BD
		const hashedPassword = await hashContrasenia(contrasenia);
		const usuario = new Usuario(
			null,
			nombre,
			apellido,
			rol,
			permisos,
			[],
			nombreUsuario,
			hashedPassword
		);

		const usuarioGuardado = await this.usuarioRepository.crear(usuario);

		// Asegurar que el hash se preserve en el resultado (el cloning del repositorio
		// could losing properties, asi que lo re-aplicamos si es necesario)
		if (!usuarioGuardado.contraseniaHash && usuario.contraseniaHash) {
			usuarioGuardado.contraseniaHash = usuario.contraseniaHash;
		}
		// No exponemos la contraseña en la respuesta
		delete usuarioGuardado.contraseniaHash;
		return usuarioGuardado;
	}

	/** Actualiza un usuario validando los campos mediante DTO.
	 * @param {string} usuarioId - ID del usuario a actualizar
	 * @param {object} datosActualizacion - Datos a actualizar (nombre, apellido, contraseña)
	 * @returns {Promise<import('../models/usuario.js').default>} El usuario actualizado
	 * @throws {NotFoundError} Si el usuario no existe
	 * @throws {BadRequestError} Si los datos son inválidos, no hay nada que actualizar o se intenta cambiar el nombre de usuario
	 */
	async actualizarUsuario(usuarioId, datosActualizacion) {
		// 1. Buscar si el usuario existe
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) {
			throw new NotFoundError(`El usuario con ID ${usuarioId} no existe.`);
		}

		// 2️⃣ NUEVO: Verificar que no se intente modificar el nombre de usuario
		if (
			datosActualizacion.nombreUsuario &&
			datosActualizacion.nombreUsuario !== usuario.nombreUsuario
		) {
			throw new BadRequestError('No se puede modificar el nombre de usuario.');
		}

		// 3. Validar los datos de entrada con Zod
		const resultado = actualizarUsuarioSchema.safeParse(datosActualizacion);
		if (!resultado.success) {
			const message =
				resultado.error.issues[0]?.message || 'Error de validación';
			throw new BadRequestError(message);
		}

		const datosValidados = resultado.data;

		// 4. Verificar que hayan mandado algo para actualizar (evita consultas inútiles a la BD)
		if (Object.keys(datosValidados).length === 0) {
			throw new BadRequestError(
				'No se enviaron datos válidos para actualizar.'
			);
		}

		// 5. Mapear/Aplicar los nuevos valores a la entidad encontrada
		// Como son opcionales, solo actualizamos si el dato vino en la petición
		if (datosValidados.nombre) {
			usuario.nombre = datosValidados.nombre;
		}

		if (datosValidados.apellido) {
			usuario.apellido = datosValidados.apellido;
		}

		if (datosValidados.contrasenia) {
			usuario.contraseniaHash = await hashContrasenia(
				datosValidados.contrasenia
			);
		}

		// Nota: nombreUsuario se omite intencionalmente para mantenerlo fijo

		// 6. Guardar el usuario modificado
		return await this.usuarioRepository.actualizar(usuario);
	}

	/** Agrega un evento a los favoritos del usuario de forma idempotente.
	 * Si ya era favorito no se duplica ni cambia de posición. Se permite un evento que ya ocurrió.
	 * @param {string} usuarioId - ID del usuario (tomado del token JWT)
	 * @param {string} eventoId - ID del evento a agregar
	 * @param {{requestId?: string}} [contexto={}] - Datos de la petición para el log
	 * @returns {Promise<string[]>} IDs de los favoritos, en orden de agregado
	 * @throws {BadRequestError} Si el ID del evento es vacío o no es un texto
	 * @throws {NotFoundError} Si el usuario o el evento no existen
	 */
	async agregarAFavoritos(usuarioId, eventoId, contexto = {}) {
		const id = this._validarIdEvento(eventoId);
		const usuario = await this._usuarioOFallar(usuarioId);
		if (!this.eventoRepository) {
			throw new Error(
				'UsuarioService requiere un eventoRepository para agregar favoritos.'
			);
		}
		const evento = await this.eventoRepository.buscarPorId(id);
		if (!evento) {
			throw new NotFoundError(`El evento con ID ${id} no existe.`);
		}

		// Arreglo nuevo: el clon del repositorio es superficial y comparte el original
		if (!usuario.favoritos.some((f) => f.id === id)) {
			usuario.favoritos = [...usuario.favoritos, { id }];
			await this.usuarioRepository.actualizar(usuario);
		}

		this._log('favorito_agregado', contexto, {
			usuarioId: usuario.id,
			rol: usuario.rol,
			eventoId: id,
			cantidad: usuario.favoritos.length
		});
		return usuario.favoritos.map((f) => f.id);
	}

	/** Lista los IDs de los eventos favoritos del usuario.
	 * @param {string} usuarioId - ID del usuario (tomado del token JWT)
	 * @param {{requestId?: string}} [contexto={}] - Datos de la petición para el log
	 * @returns {Promise<string[]>} IDs de los favoritos, en orden de agregado (`[]` si no hay)
	 * @throws {NotFoundError} Si el usuario no existe
	 */
	async listarFavoritos(usuarioId, contexto = {}) {
		const usuario = await this._usuarioOFallar(usuarioId);
		const ids = usuario.favoritos.map((f) => f.id);

		this._log('favoritos_listados', contexto, {
			usuarioId: usuario.id,
			rol: usuario.rol,
			cantidad: ids.length
		});
		return ids;
	}

	/** Quita un evento de los favoritos del usuario de forma idempotente.
	 * Si no era favorito (o el evento no existe) la lista queda igual y no hay error.
	 * @param {string} usuarioId - ID del usuario (tomado del token JWT)
	 * @param {string} eventoId - ID del evento a quitar
	 * @param {{requestId?: string}} [contexto={}] - Datos de la petición para el log
	 * @returns {Promise<string[]>} IDs de los favoritos restantes, en orden de agregado
	 * @throws {BadRequestError} Si el ID del evento es vacío o no es un texto
	 * @throws {NotFoundError} Si el usuario no existe
	 */
	async removerDeFavoritos(usuarioId, eventoId, contexto = {}) {
		const id = this._validarIdEvento(eventoId);
		const usuario = await this._usuarioOFallar(usuarioId);

		// Arreglo nuevo: el clon del repositorio es superficial y comparte el original
		const restantes = usuario.favoritos.filter((f) => f.id !== id);
		if (restantes.length !== usuario.favoritos.length) {
			usuario.favoritos = restantes;
			await this.usuarioRepository.actualizar(usuario);
		}

		this._log('favorito_quitado', contexto, {
			usuarioId: usuario.id,
			rol: usuario.rol,
			eventoId: id,
			cantidad: restantes.length
		});
		return restantes.map((f) => f.id);
	}
}
