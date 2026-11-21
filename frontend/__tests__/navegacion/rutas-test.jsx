/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen,
	testRouter,
	within
} from 'expo-router/testing-library';
import { crearAuthFalso, COMPRADOR, ORGANIZADOR } from '../helpers/authFalso';
import { TABS_COMPRADOR, TABS_ORGANIZADOR } from '../../src/navegacion/reglas';

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
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarReseniasOrganizador: jest.fn(() => Promise.resolve([])),
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(() => Promise.resolve([])),
	quitarFavorito: jest.fn(() => Promise.resolve([]))
}));
// Explorar y Buscar (feature 004) consultan eventos y categorías al montar.
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(() => Promise.resolve([])),
	obtenerEvento: jest.fn((id) =>
		Promise.resolve({
			id,
			nombre: `Evento ${id}`,
			descripcion: 'Descripción',
			categoria: { id: 'cat', nombre: 'Recitales', descripcion: '' },
			fecha: new Date(Date.now() + 7 * 86400000).toISOString(),
			tiposEntrada: [
				{ id: 'te', nombre: 'General', descripcion: '', precio: 1000, cupo: 10 }
			],
			multimedia: [],
			organizador: { id: 'org', nombre: 'Bruno', apellido: 'Pérez' },
			puntajeOrganizador: null
		})
	)
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(() => Promise.resolve([]))
}));

const APP = path.resolve(__dirname, '../../src/app');

/**
 * Monta la app real en `url` con el estado de sesión dado.
 * @param {string} url Ruta inicial.
 * @param {object} [estado] Opciones de `crearAuthFalso`.
 * @returns {Promise<any>} Resultado de renderRouter.
 */
async function abrir(url, estado) {
	mockSesion.oyentes.clear();
	mockSesion.valor = crearAuthFalso(estado);
	return renderRouter(APP, { initialUrl: url });
}

/** Pestañas de la barra inferior (los chips de categoría también son `tab`). */
const pestanasBarra = () =>
	within(screen.getByTestId('bottom-nav')).getAllByRole('tab');

const etiquetasVisibles = (tabs) =>
	tabs.every((t) => screen.queryByRole('tab', { name: t.etiqueta }));

describe('Navegación por rol y sesión — US1', () => {
	it('mientras restaura la sesión muestra la carga y no el login (US1-3)', async () => {
		await abrir('/', { cargando: true });
		expect(screen.getByLabelText('Cargando sesión')).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).toBeNull();
	});

	it('COMPRADOR abre en Explorar con su barra de 5 pestañas (US1-1)', async () => {
		await abrir('/', { usuario: COMPRADOR });
		expect(screen).toHavePathname('/explorar');
		expect(pestanasBarra()).toHaveLength(5);
		expect(etiquetasVisibles(TABS_COMPRADOR)).toBe(true);
	});

	it('ORGANIZADOR abre en Mis eventos con su barra de 4 pestañas (US1-2)', async () => {
		await abrir('/', { usuario: ORGANIZADOR });
		expect(screen).toHavePathname('/organizador/eventos');
		expect(pestanasBarra()).toHaveLength(4);
		expect(etiquetasVisibles(TABS_ORGANIZADOR)).toBe(true);
	});

	it.each(['/compras', '/explorar', '/perfil', '/buscar', '/favoritos'])(
		'ORGANIZADOR en %s vuelve a su sección (US1-4)',
		async (url) => {
			await abrir(url, { usuario: ORGANIZADOR });
			expect(screen).toHavePathname('/organizador/eventos');
		}
	);

	it.each([
		'/organizador/crear',
		'/organizador/eventos',
		'/organizador/perfil'
	])('COMPRADOR en %s vuelve a Explorar (US1-4)', async (url) => {
		await abrir(url, { usuario: COMPRADOR });
		expect(screen).toHavePathname('/explorar');
	});

	it.each([
		[COMPRADOR, '/explorar'],
		[ORGANIZADOR, '/organizador/eventos']
	])(
		'con sesión, /login lleva a la ruta inicial del rol',
		async (usuario, destino) => {
			await abrir('/login', { usuario });
			expect(screen).toHavePathname(destino);
		}
	);

	it('COMPRADOR navega por cada pestaña', async () => {
		await abrir('/explorar', { usuario: COMPRADOR });
		for (const t of TABS_COMPRADOR) {
			await act(async () => {
				fireEvent.press(screen.getByRole('tab', { name: t.etiqueta }));
			});
			expect(screen).toHavePathname(`/${t.clave}`);
		}
	});

	it('ORGANIZADOR navega por cada pestaña', async () => {
		await abrir('/organizador/eventos', { usuario: ORGANIZADOR });
		for (const t of TABS_ORGANIZADOR) {
			await act(async () => {
				fireEvent.press(screen.getByRole('tab', { name: t.etiqueta }));
			});
			expect(screen).toHavePathname(`/organizador/${t.clave}`);
		}
	});

	it('ORGANIZADOR ve el estado vacío provisorio en Mensajes', async () => {
		await abrir('/organizador/mensajes', { usuario: ORGANIZADOR });
		expect(
			screen.getByRole('header', { name: 'Los mensajes viven en cada compra' })
		).toBeTruthy();
	});
});

describe('Navegación del visitante — US2', () => {
	it('abre en Explorar (SC-001)', async () => {
		await abrir('/');
		expect(screen).toHavePathname('/explorar');
		expect(pestanasBarra()).toHaveLength(5);
	});

	it('puede ver Buscar y el detalle de un evento (FR-003)', async () => {
		await abrir('/buscar');
		expect(screen).toHavePathname('/buscar');
		expect(screen.getByRole('header', { name: 'Buscar' })).toBeTruthy();
		await testRouter.push('/evento/abc123');
		expect(
			await screen.findByRole('header', { name: 'Evento abc123' })
		).toBeTruthy();
	});

	it.each([
		['Favoritos', '/favoritos'],
		['Compras', '/compras'],
		['Perfil', '/perfil']
	])(
		'tocar %s lleva a login con volverA y atrás vuelve a Explorar (R4)',
		async (etiqueta, ruta) => {
			await abrir('/explorar');
			await act(async () => {
				fireEvent.press(screen.getByRole('tab', { name: etiqueta }));
			});
			expect(screen).toHavePathname('/login');
			expect(screen).toHaveSearchParams({ volverA: ruta });
			await testRouter.back('/explorar');
		}
	);

	it.each([
		'/compras',
		'/favoritos',
		'/perfil',
		'/organizador/crear',
		'/organizador/eventos'
	])('un enlace profundo a %s termina en login con volverA', async (ruta) => {
		await abrir(ruta);
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: ruta });
	});

	it.each([
		['ana', COMPRADOR, '/compras'],
		['bruno', ORGANIZADOR, '/organizador/eventos']
	])(
		'tras iniciar sesión desde Compras, %s termina en %s (SC-003, US2-3)',
		async (nombre, usuario, destino) => {
			await abrir('/explorar');
			mockSesion.valor.iniciarSesion.mockImplementation(async () => {
				mockSesion.set({ ...mockSesion.valor, usuario, accessToken: 'token' });
				return usuario;
			});
			await act(async () => {
				fireEvent.press(screen.getByRole('tab', { name: 'Compras' }));
			});
			await act(async () => {
				fireEvent.changeText(
					screen.getByLabelText('Nombre de usuario'),
					nombre
				);
				fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1!');
			});
			await act(async () => {
				fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
			});
			expect(screen).toHavePathname(destino);
		}
	);
});

describe('Perfil y expiración — US3', () => {
	it.each([
		[COMPRADOR, '/perfil'],
		[ORGANIZADOR, '/organizador/perfil']
	])('%o ve su perfil en %s', async (usuario, ruta) => {
		await abrir(ruta, { usuario });
		expect(screen).toHavePathname(ruta);
		expect(screen.getByRole('header', { name: 'Perfil' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
	});

	it('si la sesión expira en una pestaña protegida, va a login con volverA', async () => {
		await abrir('/compras', { usuario: COMPRADOR });
		await act(async () => mockSesion.set(crearAuthFalso()));
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/compras' });
	});

	it('si la sesión expira en Explorar, se queda como visitante', async () => {
		await abrir('/explorar', { usuario: COMPRADOR });
		await act(async () => mockSesion.set(crearAuthFalso()));
		expect(screen).toHavePathname('/explorar');
		expect(pestanasBarra()).toHaveLength(5);
	});
});

describe('Detalle y checkout — feature 005', () => {
	it('visitante: "Comprar entradas" → login y, como COMPRADOR, vuelve al checkout (US3-5)', async () => {
		await abrir('/evento/ev-9');
		mockSesion.valor.iniciarSesion.mockImplementation(async () => {
			mockSesion.set({
				...mockSesion.valor,
				usuario: COMPRADOR,
				accessToken: 'token'
			});
			return COMPRADOR;
		});
		await act(async () => {
			fireEvent.press(
				await screen.findByRole('button', { name: /^Comprar entradas/ })
			);
		});
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/evento/ev-9/comprar' });
		await act(async () => {
			fireEvent.changeText(screen.getByLabelText('Nombre de usuario'), 'ana');
			fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Abcdef1!');
		});
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
		});
		expect(screen).toHavePathname('/evento/ev-9/comprar');
		expect(
			await screen.findByRole('header', { name: 'Comprar entradas' })
		).toBeTruthy();
	});

	it('un ORGANIZADOR que abre el checkout termina en el detalle', async () => {
		await abrir('/evento/ev-9/comprar', { usuario: ORGANIZADOR });
		expect(screen).toHavePathname('/evento/ev-9');
	});

	it('un visitante que abre el checkout por enlace termina en login con volverA', async () => {
		await abrir('/evento/ev-9/comprar');
		expect(screen).toHavePathname('/login');
		expect(screen).toHaveSearchParams({ volverA: '/evento/ev-9/comprar' });
	});
});
