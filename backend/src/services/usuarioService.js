import { actualizarUsuarioSchema, crearUsuarioSchema } from '../dto/usuario.js';
import { COMPRADOR, ORGANIZADOR } from '../models/roles.js';
import Usuario from '../models/usuario.js';
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
	 */
	constructor(usuarioRepository) {
		/** @private {import('../repositories/usuarioRepository.js').default} */
		this.usuarioRepository = usuarioRepository;
	}

	/** Obtiene un usuario por su ID.
	 * @param {string} usuarioId - El ID del usuario
	 * @returns {Promise<import('../models/usuario.js').default>} El usuario encontrado
	 * @throws {Error} Si el usuario no existe
	 */
	async obtenerPorId(usuarioId) {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) {
			throw new Error(`El usuario con ID ${usuarioId} no existe.`);
		}
		return usuario;
	}

	/** Crea un nuevo usuario validando los campos mediante DTO.
	 * Los permisos se asignan automáticamente según el rol enviado.
	 * @param {object} datosUsuario - DTO con los datos del usuario
	 * @returns {Promise<import('../models/usuario.js').default>} El usuario creado
	 * @throws {Error} Si los datos son inválidos
	 */
	async crearUsuario(datosUsuario) {
		// 1️⃣ Validar el objeto plano que viene del controlador con Zod
		const resultado = crearUsuarioSchema.safeParse(datosUsuario);

		if (!resultado.success) {
			const message =
				resultado.error.issues[0]?.message || 'Error de validación';
			throw new Error(message);
		}

		// 2️⃣ Verificar unicidad del nombre de usuario
		const { nombre, apellido, nombreUsuario, contrasenia, rol } =
			resultado.data;
		const nombreUsuarioExistente =
			await this.usuarioRepository.existePorNombreUsuario(nombreUsuario);
		if (nombreUsuarioExistente) {
			throw new Error('El nombre de usuario ya está en uso.');
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
	 * @throws {Error} Si el usuario no existe
	 */
	async actualizarUsuario(usuarioId, datosActualizacion) {
		// 1. Buscar si el usuario existe
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) {
			throw new Error(`El usuario con ID ${usuarioId} no existe.`);
		}

		// 2️⃣ NUEVO: Verificar que no se intente modificar el nombre de usuario
		if (
			datosActualizacion.nombreUsuario &&
			datosActualizacion.nombreUsuario !== usuario.nombreUsuario
		) {
			throw new Error('No se puede modificar el nombre de usuario.');
		}

		// 3. Validar los datos de entrada con Zod
		const resultado = actualizarUsuarioSchema.safeParse(datosActualizacion);
		if (!resultado.success) {
			const message =
				resultado.error.issues[0]?.message || 'Error de validación';
			throw new Error(message);
		}

		const datosValidados = resultado.data;

		// 4. Verificar que hayan mandado algo para actualizar (evita consultas inútiles a la BD)
		if (Object.keys(datosValidados).length === 0) {
			throw new Error('No se enviaron datos válidos para actualizar.');
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

	/** Agrega un evento a los favoritos del usuario.
	 * @param {string} usuarioId - ID del usuario
	 * @param {string} eventoId - ID del evento a agregar
	 * @returns {Promise<import('../models/usuario.js').default>} El usuario actualizado
	 */
	async agregarAFavoritos(usuarioId, eventoId) {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) {
			throw new Error(`El usuario con ID ${usuarioId} no existe.`);
		}

		// Buscar el evento por ID (asumimos que los eventos tienen propiedad id)
		const evento = { id: eventoId };
		const idx = usuario.favoritos.findIndex((f) => f.id === eventoId);
		if (idx >= 0) {
			usuario.favoritos.splice(idx, 1);
		} else {
			usuario.favoritos.push(evento);
		}

		return await this.usuarioRepository.actualizar(usuario);
	}

	/** Remueve un evento de los favoritos del usuario.
	 * @param {string} usuarioId - ID del usuario
	 * @param {string} eventoId - ID del evento a remover
	 * @returns {Promise<import('../models/usuario.js').default>} El usuario actualizado
	 */
	async removerDeFavoritos(usuarioId, eventoId) {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) {
			throw new Error(`El usuario con ID ${usuarioId} no existe.`);
		}

		const idx = usuario.favoritos.findIndex((f) => f.id === eventoId);
		if (idx >= 0) {
			usuario.favoritos.splice(idx, 1);
		} else {
			throw new Error(
				`El evento con ID ${eventoId} no está en los favoritos del usuario.`
			);
		}

		return await this.usuarioRepository.actualizar(usuario);
	}
}
