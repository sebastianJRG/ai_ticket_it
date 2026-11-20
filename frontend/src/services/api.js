/**
 * @file Cliente HTTP único hacia el backend de Al Ticket It (instancia axios),
 *   error tipado de la API y registro del proveedor de sesión.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Host por defecto: el emulador de Android no alcanza el `localhost` del PC y
 * usa `10.0.2.2`; en el resto de plataformas basta `localhost`.
 */
const HOST_POR_DEFECTO = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

/** URL base del backend; en el celular debe ser la IP LAN del PC (ver .env.example). */
export const API_URL =
	process.env.EXPO_PUBLIC_API_URL || `http://${HOST_POR_DEFECTO}:3000`;

/** Error de la API: `status` 0 significa que no hubo conexión. */
export class ApiError extends Error {
	/**
	 * @param {string} message Mensaje legible (del backend cuando existe).
	 * @param {number} status Código HTTP, o 0 sin conexión.
	 */
	constructor(message, status) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

/** Tiempo máximo de espera por petición, en milisegundos. */
const TIMEOUT_MS = 15000;

/**
 * Instancia axios por la que pasan todas las llamadas al backend.
 * @type {import('axios').AxiosInstance}
 */
export const cliente = axios.create({
	baseURL: API_URL,
	timeout: TIMEOUT_MS,
	headers: { 'Content-Type': 'application/json' }
});

/** Mensaje cuando no hubo respuesta (red caída o tiempo agotado). */
const MSG_CONEXION = 'No pudimos conectar con el servidor. Revisá tu conexión.';

/** Mensaje cuando el backend no envía un `message` utilizable. */
const MSG_GENERICO = 'Ocurrió un error inesperado.';

/**
 * Convierte cualquier error de axios en un `ApiError` (research R6).
 * @param {import('axios').AxiosError} error Error recibido por el interceptor.
 * @returns {ApiError} Error con `message` legible y `status` (0 sin respuesta).
 */
function aApiError(error) {
	const response = error?.response;
	if (!response) return new ApiError(MSG_CONEXION, 0);
	const mensaje = response.data?.message;
	return new ApiError(
		typeof mensaje === 'string' && mensaje.trim() !== ''
			? mensaje
			: MSG_GENERICO,
		response.status
	);
}

/**
 * Sesión del usuario tal como la entrega el backend en login y refresh.
 * @typedef {Object} Sesion
 * @property {string} accessToken JWT corto; se envía como `Authorization: Bearer`.
 * @property {string} refreshToken Credencial larga; el backend la rota en cada renovación.
 * @property {object} usuario Usuario autenticado (`id`, `nombreUsuario`, `rol`, …).
 */

/**
 * Contrato que conecta el cliente con el contexto de sesión (data-model.md).
 * @typedef {Object} ProveedorSesion
 * @property {() => ({accessToken: string, refreshToken: string}|null|Promise<{accessToken: string, refreshToken: string}|null>)} obtenerTokens
 *   Devuelve las credenciales vigentes, o `null` sin sesión. Se consulta en cada petición.
 * @property {(sesion: Sesion) => (void|Promise<void>)} guardarTokens
 *   Persiste la sesión renovada; se llama una vez por renovación exitosa, antes de reintentar.
 * @property {() => (void|Promise<void>)} alExpirar
 *   Avisa que la sesión no se pudo renovar; se llama una vez por renovación fallida.
 */

/**
 * Proveedor de sesión registrado (data-model.md `EstadoCliente.proveedor`).
 * @type {ProveedorSesion|null}
 */
let proveedor = null;

/**
 * Renovación en curso compartida por todas las peticiones que recibieron 401
 * (data-model.md `EstadoCliente.renovacionEnCurso`).
 * @type {Promise<string>|null}
 */
let renovacionEnCurso = null;

/**
 * Registra (o quita, con `null`) el proveedor de sesión del que el cliente
 * obtiene y guarda las credenciales.
 * @param {ProveedorSesion|null} nuevo Proveedor de sesión, o `null` para operar sin sesión.
 * @returns {void}
 */
export function configurarSesion(nuevo) {
	proveedor = nuevo;
}

/**
 * Adjunta la credencial vigente salvo en peticiones marcadas `sinSesion`.
 * Marca la config con `_conSesion` cuando salió con credencial.
 * @param {import('axios').InternalAxiosRequestConfig} config Config de la petición.
 * @returns {Promise<import('axios').InternalAxiosRequestConfig>} Config, con `Authorization` si corresponde.
 */
async function adjuntarCredencial(config) {
	// El reintento ya trae el token nuevo de la renovación.
	if (config.sinSesion || config._reintentado || !proveedor) return config;
	const tokens = await proveedor.obtenerTokens();
	if (tokens?.accessToken) {
		config.headers.Authorization = `Bearer ${tokens.accessToken}`;
		config._conSesion = true;
	}
	return config;
}

/**
 * Avisa la expiración al proveedor sin dejar que un error suyo tape el 401.
 * @returns {Promise<void>}
 */
async function avisarExpiracion() {
	try {
		await proveedor?.alExpirar();
	} catch {
		// El cierre local es responsabilidad del proveedor; acá solo se notifica.
	}
}

/**
 * Renueva la sesión una sola vez aunque la pidan varias peticiones a la vez
 * (research R5). Si falla, avisa la expiración una única vez.
 * @returns {Promise<string>} Nuevo access token.
 * @throws {ApiError} Si no hay refresh token o el backend rechaza la renovación.
 */
function renovar() {
	if (!renovacionEnCurso) {
		renovacionEnCurso = (async () => {
			try {
				const tokens = await proveedor?.obtenerTokens();
				if (!tokens?.refreshToken) {
					throw new ApiError('No hay sesión para renovar.', 401);
				}
				const { data } = await cliente.post(
					'/api/refresh',
					{ refreshToken: tokens.refreshToken },
					{ sinSesion: true }
				);
				await proveedor?.guardarTokens(data);
				return data.accessToken;
			} catch (error) {
				await avisarExpiracion();
				throw error;
			}
		})().finally(() => {
			renovacionEnCurso = null;
		});
	}
	return renovacionEnCurso;
}

/**
 * Rama de error del cliente: ante un 401 de una petición que llevaba credencial
 * renueva y reintenta una vez; en cualquier otro caso rechaza con `ApiError`.
 * @param {import('axios').AxiosError} error Error de axios.
 * @returns {Promise<import('axios').AxiosResponse>} Respuesta del reintento.
 * @throws {ApiError} Siempre que no haya reintento exitoso.
 */
async function manejarError(error) {
	const config = error?.config;
	const debeRenovar =
		error?.response?.status === 401 &&
		config?._conSesion &&
		!config._reintentado &&
		!config.sinSesion;
	if (!debeRenovar) throw aApiError(error);

	let accessToken;
	try {
		accessToken = await renovar();
	} catch {
		throw aApiError(error);
	}
	config._reintentado = true;
	config.headers.Authorization = `Bearer ${accessToken}`;
	return cliente(config);
}

cliente.interceptors.request.use(adjuntarCredencial);
cliente.interceptors.response.use((respuesta) => respuesta, manejarError);
