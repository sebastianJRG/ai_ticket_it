import React from 'react';
import { Text } from 'react-native';
import { act, renderRouter, screen } from 'expo-router/testing-library';
import { RutaProtegida } from '../../src/navegacion/RutaProtegida';
import { COMPRADOR, ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';

/** Sesión simulada reactiva: `mockSesion.set` re-renderiza a quien use `useAuth`. */
const mockSesion = {
	valor: null,
	oyentes: new Set(),
	get: () => mockSesion.valor,
	set(v) {
		mockSesion.valor = v;
		mockSesion.oyentes.forEach((f) => f());
	},
	subscribe(f) {
		mockSesion.oyentes.add(f);
		return () => mockSesion.oyentes.delete(f);
	}
};
jest.mock('../../src/auth/AuthContext', () => {
	const { useSyncExternalStore } = jest.requireActual('react');
	return {
		useAuth: () =>
			useSyncExternalStore(
				mockSesion.subscribe,
				mockSesion.get,
				mockSesion.get
			),
		AuthProvider: ({ children }) => children
	};
});

const RUTAS = {
	login: () => <Text>Pantalla login</Text>,
	'evento/[idEvento]/index': () => <Text>Pantalla detalle</Text>,
	'evento/[idEvento]/comprar': () => (
		<RutaProtegida>
			<Text>Pantalla checkout</Text>
		</RutaProtegida>
	)
};

/**
 * Monta el mapa de rutas en el checkout con la sesión dada.
 * @param {object|null} usuario Usuario de la sesión.
 * @returns {Promise<void>}
 */
async function abrir(usuario) {
	mockSesion.oyentes.clear();
	mockSesion.valor = crearAuthFalso({ usuario });
	await renderRouter(RUTAS, { initialUrl: '/evento/x/comprar' });
}

describe('RutaProtegida (contracts/componentes.md)', () => {
	it('COMPRADOR ve el contenido', async () => {
		await abrir(COMPRADOR);
		expect(screen.getByText('Pantalla checkout')).toBeTruthy();
		expect(screen).toHavePathname('/evento/x/comprar');
	});

	it('visitante va a login con volverA', async () => {
		await abrir(null);
		expect(await screen.findByText('Pantalla login')).toBeTruthy();
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/evento/x/comprar' });
	});

	it('ORGANIZADOR va al detalle del evento', async () => {
		await abrir(ORGANIZADOR);
		expect(await screen.findByText('Pantalla detalle')).toBeTruthy();
		expect(screen).toHavePathname('/evento/x');
	});

	it('si la sesión se pierde con la pantalla montada, va a login', async () => {
		await abrir(COMPRADOR);
		expect(screen.getByText('Pantalla checkout')).toBeTruthy();
		await act(async () => mockSesion.set(crearAuthFalso({ usuario: null })));
		expect(await screen.findByText('Pantalla login')).toBeTruthy();
		expect(screen).toHavePathname('/login');
	});
});
