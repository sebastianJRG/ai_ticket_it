import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
	borrarSesion,
	guardarSesion,
	leerSesion
} from '../../src/auth/almacenSesion';

jest.mock('expo-secure-store', () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn()
}));

const OS_ORIGINAL = Platform.OS;
const LOCAL_ORIGINAL = globalThis.localStorage;

/** `localStorage` falso en memoria. */
function localStorageFalso() {
	const datos = new Map();
	return {
		getItem: jest.fn((k) => (datos.has(k) ? datos.get(k) : null)),
		setItem: jest.fn((k, v) => datos.set(k, String(v))),
		removeItem: jest.fn((k) => datos.delete(k))
	};
}

afterEach(() => {
	Platform.OS = OS_ORIGINAL;
	globalThis.localStorage = LOCAL_ORIGINAL;
	jest.clearAllMocks();
});

describe('almacenSesion — nativo (SecureStore)', () => {
	it('delega en SecureStore', async () => {
		SecureStore.getItemAsync.mockResolvedValue('{"a":1}');
		await guardarSesion('sesion', '{"a":1}');
		expect(SecureStore.setItemAsync).toHaveBeenCalledWith('sesion', '{"a":1}');
		expect(await leerSesion('sesion')).toBe('{"a":1}');
		expect(SecureStore.getItemAsync).toHaveBeenCalledWith('sesion');
		await borrarSesion('sesion');
		expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sesion');
	});
});

describe('almacenSesion — web (localStorage)', () => {
	beforeEach(() => {
		Platform.OS = 'web';
	});

	it('guarda, lee y borra en localStorage sin usar SecureStore', async () => {
		globalThis.localStorage = localStorageFalso();
		await guardarSesion('sesion', '{"a":1}');
		expect(await leerSesion('sesion')).toBe('{"a":1}');
		await borrarSesion('sesion');
		expect(await leerSesion('sesion')).toBeNull();
		expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
		expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
		expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
	});

	it('si setItem lanza, guardarSesion no rechaza', async () => {
		globalThis.localStorage = {
			...localStorageFalso(),
			setItem: () => {
				throw new Error('QuotaExceeded');
			}
		};
		await expect(guardarSesion('sesion', 'x')).resolves.toBeUndefined();
	});

	it('si getItem lanza, leerSesion devuelve null', async () => {
		globalThis.localStorage = {
			...localStorageFalso(),
			getItem: () => {
				throw new Error('SecurityError');
			}
		};
		expect(await leerSesion('sesion')).toBeNull();
	});

	it('sin localStorage no falla', async () => {
		globalThis.localStorage = undefined;
		await expect(guardarSesion('sesion', 'x')).resolves.toBeUndefined();
		expect(await leerSesion('sesion')).toBeNull();
		await expect(borrarSesion('sesion')).resolves.toBeUndefined();
	});
});
