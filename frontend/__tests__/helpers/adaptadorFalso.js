/**
 * @file Adaptador axios simulado para pruebas sin red (research R7).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { AxiosError } from 'axios';

/**
 * Respuesta programada del adaptador.
 * @typedef {(config: import('axios').InternalAxiosRequestConfig) => Promise<import('axios').AxiosResponse>} Respondedor
 */

/**
 * Arma la respuesta (o el rechazo) que devolvería axios para un status dado.
 * @param {import('axios').InternalAxiosRequestConfig} config Config final de la petición.
 * @param {number} status Código HTTP.
 * @param {any} data Cuerpo de la respuesta.
 * @returns {Promise<import('axios').AxiosResponse>} Respuesta si `status < 400`.
 * @throws {AxiosError} Si `status >= 400`, con `response` armado.
 */
function respuesta(config, status, data) {
	const response = { data, status, statusText: '', headers: {}, config };
	if (status < 400) return Promise.resolve(response);
	return Promise.reject(
		new AxiosError(
			`Request failed with status code ${status}`,
			status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
			config,
			null,
			response
		)
	);
}

/**
 * Crea un adaptador axios falso. Las respuestas se consumen en orden de cola;
 * `responderCon` define una lógica fija que se usa cuando la cola está vacía.
 * La config final de cada llamada queda en `adaptador.mock.calls[i][0]`.
 * @returns {jest.Mock & {
 *   responder: (status: number, data?: any) => void,
 *   fallarRed: () => void,
 *   agotarTiempo: () => void,
 *   responderCon: (fn: (config: object) => {status: number, data?: any} | 'red' | 'timeout') => void
 * }} Adaptador para asignar a `cliente.defaults.adapter`.
 */
export function crearAdaptadorFalso() {
	/** @type {Respondedor[]} */
	const cola = [];
	/** @type {Respondedor|null} */
	let fija = null;

	const adaptador = jest.fn((config) => {
		const siguiente = cola.shift() ?? fija;
		if (!siguiente) {
			throw new Error(
				`adaptadorFalso: sin respuesta programada para ${config.method} ${config.url}`
			);
		}
		return siguiente(config);
	});

	const falloRed = (config) =>
		Promise.reject(
			new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, null)
		);
	const falloTiempo = (config) =>
		Promise.reject(
			new AxiosError(
				'timeout of 15000ms exceeded',
				AxiosError.ECONNABORTED,
				config,
				null
			)
		);

	adaptador.responder = (status, data) =>
		cola.push((config) => respuesta(config, status, data));
	adaptador.fallarRed = () => cola.push(falloRed);
	adaptador.agotarTiempo = () => cola.push(falloTiempo);
	adaptador.responderCon = (fn) => {
		fija = (config) => {
			const r = fn(config);
			if (r === 'red') return falloRed(config);
			if (r === 'timeout') return falloTiempo(config);
			return respuesta(config, r.status, r.data);
		};
	};
	return adaptador;
}

/**
 * Prepara el cliente para pruebas de servicios: adaptador falso nuevo y,
 * opcionalmente, una sesión con access token `a1`.
 * @param {import('axios').AxiosInstance} cliente Instancia de `src/services/api`.
 * @param {(proveedor: object|null) => void} configurarSesion Registro del proveedor.
 * @param {{conSesion?: boolean}} [opciones] `conSesion` (por defecto `true`).
 * @returns {ReturnType<typeof crearAdaptadorFalso>} Adaptador asignado al cliente.
 */
export function prepararCliente(
	cliente,
	configurarSesion,
	{ conSesion = true } = {}
) {
	const adaptador = crearAdaptadorFalso();
	cliente.defaults.adapter = adaptador;
	configurarSesion(
		conSesion
			? {
					obtenerTokens: () => ({ accessToken: 'a1', refreshToken: 'r1' }),
					guardarTokens: jest.fn(),
					alExpirar: jest.fn()
				}
			: null
	);
	return adaptador;
}
