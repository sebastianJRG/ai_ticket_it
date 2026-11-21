/**
 * @file Persistencia de la sesión según la plataforma. En Android e iOS usa
 *   `expo-secure-store` (cifrado). En web, `expo-secure-store` no tiene
 *   implementación, así que se usa `localStorage`: persiste entre recargas
 *   pero **no** está cifrado (cualquier script de la página puede leerlo).
 *   En web nunca lanza: si el almacenamiento no está disponible, la sesión
 *   queda solo en memoria.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * `localStorage` del navegador, si existe.
 * @returns {Storage|null} Almacenamiento web, o `null`.
 */
const almacenWeb = () => globalThis.localStorage ?? null;

/**
 * Indica si corre en web.
 * @returns {boolean} Si `Platform.OS` es `web`.
 */
const esWeb = () => Platform.OS === 'web';

/**
 * Lee la sesión guardada.
 * @param {string} clave Clave de la sesión.
 * @returns {Promise<string|null>} Valor guardado, o `null`.
 * @throws {Error} En nativo, si falla `SecureStore` (en web nunca lanza).
 */
export async function leerSesion(clave) {
	if (!esWeb()) return SecureStore.getItemAsync(clave);
	try {
		return almacenWeb()?.getItem(clave) ?? null;
	} catch {
		return null;
	}
}

/**
 * Guarda la sesión.
 * @param {string} clave Clave de la sesión.
 * @param {string} valor Sesión serializada.
 * @returns {Promise<void>}
 * @throws {Error} En nativo, si falla `SecureStore` (en web nunca lanza).
 */
export async function guardarSesion(clave, valor) {
	if (!esWeb()) {
		await SecureStore.setItemAsync(clave, valor);
		return;
	}
	try {
		almacenWeb()?.setItem(clave, valor);
	} catch {
		// Sin almacenamiento disponible: la sesión queda solo en memoria.
	}
}

/**
 * Borra la sesión guardada.
 * @param {string} clave Clave de la sesión.
 * @returns {Promise<void>}
 * @throws {Error} En nativo, si falla `SecureStore` (en web nunca lanza).
 */
export async function borrarSesion(clave) {
	if (!esWeb()) {
		await SecureStore.deleteItemAsync(clave);
		return;
	}
	try {
		almacenWeb()?.removeItem(clave);
	} catch {
		// Nada que borrar o almacenamiento bloqueado.
	}
}
