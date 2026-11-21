import {
	RUTAS,
	TABS_COMPRADOR,
	TABS_ORGANIZADOR,
	rutaInicial,
	decidirAcceso,
	hrefLogin,
	destinoTrasLogin,
	destinoTrasRegistro,
	hrefEvento,
	hrefCheckout
} from '../../src/navegacion/reglas';
import { COMPRADOR, ORGANIZADOR } from '../helpers/authFalso';

const VISITANTE = null;
const permitir = { tipo: 'permitir' };
const redirigir = (href) => ({ tipo: 'redirigir', href });

describe('rutaInicial', () => {
	it('visitante y COMPRADOR abren en Explorar', () => {
		expect(rutaInicial(VISITANTE)).toBe('/explorar');
		expect(rutaInicial(COMPRADOR)).toBe('/explorar');
	});

	it('ORGANIZADOR abre en Mis eventos', () => {
		expect(rutaInicial(ORGANIZADOR)).toBe('/organizador/eventos');
	});
});

describe('RUTAS', () => {
	it('expone las rutas de cada área', () => {
		expect(RUTAS.login).toBe('/login');
		expect(RUTAS.registro).toBe('/registro');
		expect(RUTAS.explorar).toBe('/explorar');
		expect(RUTAS.buscar).toBe('/buscar');
		expect(RUTAS.favoritos).toBe('/favoritos');
		expect(RUTAS.compras).toBe('/compras');
		expect(RUTAS.perfil).toBe('/perfil');
		expect(RUTAS.organizador).toEqual({
			eventos: '/organizador/eventos',
			crear: '/organizador/crear',
			mensajes: '/organizador/mensajes',
			perfil: '/organizador/perfil'
		});
	});
});

describe('decidirAcceso (matriz de data-model.md › Area)', () => {
	// [ruta, visitante, COMPRADOR, ORGANIZADOR]
	const matriz = [
		// auth
		[
			'/login',
			permitir,
			redirigir('/explorar'),
			redirigir('/organizador/eventos')
		],
		[
			'/registro',
			permitir,
			redirigir('/explorar'),
			redirigir('/organizador/eventos')
		],
		// publica
		['/explorar', permitir, permitir, redirigir('/organizador/eventos')],
		['/buscar', permitir, permitir, redirigir('/organizador/eventos')],
		['/evento/abc123', permitir, permitir, permitir],
		// checkout (feature 005, research R2)
		[
			'/evento/abc123/comprar',
			redirigir('/login?volverA=%2Fevento%2Fabc123%2Fcomprar'),
			permitir,
			redirigir('/evento/abc123')
		],
		// comprador
		[
			'/favoritos',
			redirigir('/login?volverA=%2Ffavoritos'),
			permitir,
			redirigir('/organizador/eventos')
		],
		[
			'/compras',
			redirigir('/login?volverA=%2Fcompras'),
			permitir,
			redirigir('/organizador/eventos')
		],
		[
			'/perfil',
			redirigir('/login?volverA=%2Fperfil'),
			permitir,
			redirigir('/organizador/eventos')
		],
		// organizador
		[
			'/organizador/eventos',
			redirigir('/login?volverA=%2Forganizador%2Feventos'),
			redirigir('/explorar'),
			permitir
		],
		[
			'/organizador/crear',
			redirigir('/login?volverA=%2Forganizador%2Fcrear'),
			redirigir('/explorar'),
			permitir
		],
		[
			'/organizador/mensajes',
			redirigir('/login?volverA=%2Forganizador%2Fmensajes'),
			redirigir('/explorar'),
			permitir
		],
		[
			'/organizador/perfil',
			redirigir('/login?volverA=%2Forganizador%2Fperfil'),
			redirigir('/explorar'),
			permitir
		]
	];

	describe.each(matriz)('%s', (ruta, visitante, comprador, organizador) => {
		it('visitante', () => {
			expect(decidirAcceso({ usuario: VISITANTE, ruta })).toEqual(visitante);
		});
		it('COMPRADOR', () => {
			expect(decidirAcceso({ usuario: COMPRADOR, ruta })).toEqual(comprador);
		});
		it('ORGANIZADOR', () => {
			expect(decidirAcceso({ usuario: ORGANIZADOR, ruta })).toEqual(
				organizador
			);
		});
	});

	it('la raíz redirige a la ruta inicial de cada estado', () => {
		expect(decidirAcceso({ usuario: VISITANTE, ruta: '/' })).toEqual(
			redirigir('/explorar')
		);
		expect(decidirAcceso({ usuario: ORGANIZADOR, ruta: '/' })).toEqual(
			redirigir('/organizador/eventos')
		);
	});

	it('ignora query y barra final al decidir', () => {
		expect(
			decidirAcceso({ usuario: VISITANTE, ruta: '/compras/?x=1' })
		).toEqual(redirigir('/login?volverA=%2Fcompras'));
		expect(
			decidirAcceso({ usuario: COMPRADOR, ruta: '/buscar?q=rock' })
		).toEqual(permitir);
	});

	it('permite rutas desconocidas (las maneja el not found)', () => {
		expect(decidirAcceso({ usuario: VISITANTE, ruta: '/no-existe' })).toEqual(
			permitir
		);
	});

	it('nunca redirige a la misma ruta', () => {
		const rutas = [...matriz.map(([r]) => r), '/'];
		for (const usuario of [VISITANTE, COMPRADOR, ORGANIZADOR]) {
			for (const ruta of rutas) {
				const d = decidirAcceso({ usuario, ruta });
				if (d.tipo === 'redirigir') {
					expect(d.href).not.toBe(ruta);
					expect(d.href.startsWith('/')).toBe(true);
				}
			}
		}
	});

	it('acepta ruta ausente sin lanzar', () => {
		expect(() => decidirAcceso({ usuario: VISITANTE })).not.toThrow();
	});
});

describe('hrefLogin', () => {
	it('sin volverA es /login', () => {
		expect(hrefLogin()).toBe('/login');
		expect(hrefLogin('')).toBe('/login');
	});

	it('codifica volverA', () => {
		expect(hrefLogin('/compras')).toBe('/login?volverA=%2Fcompras');
	});
});

describe('destinoTrasLogin', () => {
	it('sin volverA va a la ruta inicial del rol', () => {
		expect(destinoTrasLogin(COMPRADOR)).toBe('/explorar');
		expect(destinoTrasLogin(ORGANIZADOR)).toBe('/organizador/eventos');
		expect(destinoTrasLogin(COMPRADOR, '')).toBe('/explorar');
	});

	it('vuelve a volverA si el rol lo permite', () => {
		expect(destinoTrasLogin(COMPRADOR, '/compras')).toBe('/compras');
		expect(destinoTrasLogin(ORGANIZADOR, '/organizador/crear')).toBe(
			'/organizador/crear'
		);
		expect(destinoTrasLogin(COMPRADOR, '/evento/abc123')).toBe(
			'/evento/abc123'
		);
	});

	it('ignora volverA de otra área', () => {
		expect(destinoTrasLogin(ORGANIZADOR, '/compras')).toBe(
			'/organizador/eventos'
		);
		expect(destinoTrasLogin(COMPRADOR, '/organizador/crear')).toBe('/explorar');
		expect(destinoTrasLogin(COMPRADOR, '/login')).toBe('/explorar');
	});

	it.each(['//evil.com', 'https://evil.com', 'compras', '/\\evil.com'])(
		'ignora volverA inválido %s',
		(volverA) => {
			expect(destinoTrasLogin(COMPRADOR, volverA)).toBe('/explorar');
		}
	);

	it('ignora volverA que no es string', () => {
		expect(destinoTrasLogin(COMPRADOR, ['/compras'])).toBe('/explorar');
	});
});

describe('destinoTrasRegistro', () => {
	it('COMPRADOR sin volverA va a Explorar', () => {
		expect(destinoTrasRegistro(COMPRADOR)).toBe('/explorar');
	});

	it('ORGANIZADOR sin volverA va a Crear evento', () => {
		expect(destinoTrasRegistro(ORGANIZADOR)).toBe('/organizador/crear');
	});

	it('respeta volverA permitido', () => {
		expect(destinoTrasRegistro(COMPRADOR, '/favoritos')).toBe('/favoritos');
		expect(destinoTrasRegistro(ORGANIZADOR, '/organizador/mensajes')).toBe(
			'/organizador/mensajes'
		);
	});

	it('ignora volverA de otra área o inválido', () => {
		expect(destinoTrasRegistro(ORGANIZADOR, '/favoritos')).toBe(
			'/organizador/crear'
		);
		expect(destinoTrasRegistro(COMPRADOR, 'https://evil.com')).toBe(
			'/explorar'
		);
	});
});

describe('TABS (data-model.md › TabDef)', () => {
	it('comprador: claves, etiquetas, íconos y requiereSesion', () => {
		expect(TABS_COMPRADOR).toEqual([
			{
				clave: 'explorar',
				etiqueta: 'Explorar',
				icono: 'Compass',
				requiereSesion: false
			},
			{
				clave: 'buscar',
				etiqueta: 'Buscar',
				icono: 'Search',
				requiereSesion: false
			},
			{
				clave: 'favoritos',
				etiqueta: 'Favoritos',
				icono: 'Heart',
				requiereSesion: true
			},
			{
				clave: 'compras',
				etiqueta: 'Compras',
				icono: 'Ticket',
				requiereSesion: true
			},
			{
				clave: 'perfil',
				etiqueta: 'Perfil',
				icono: 'User',
				requiereSesion: true
			}
		]);
	});

	it('organizador: claves, etiquetas, íconos y requiereSesion', () => {
		expect(TABS_ORGANIZADOR).toEqual([
			{
				clave: 'eventos',
				etiqueta: 'Mis eventos',
				icono: 'Calendar',
				requiereSesion: true
			},
			{
				clave: 'crear',
				etiqueta: 'Crear',
				icono: 'Plus',
				requiereSesion: true
			},
			{
				clave: 'mensajes',
				etiqueta: 'Mensajes',
				icono: 'MessageCircle',
				requiereSesion: true
			},
			{
				clave: 'perfil',
				etiqueta: 'Perfil',
				icono: 'User',
				requiereSesion: true
			}
		]);
	});

	it.each([
		['comprador', TABS_COMPRADOR],
		['organizador', TABS_ORGANIZADOR]
	])('claves únicas en %s', (_, tabs) => {
		const claves = tabs.map((t) => t.clave);
		expect(new Set(claves).size).toBe(claves.length);
	});
});

describe('hrefEvento y hrefCheckout (feature 005)', () => {
	it('arman la ruta del detalle y del checkout con el ID codificado', () => {
		expect(hrefEvento('abc123')).toBe('/evento/abc123');
		expect(hrefCheckout('abc123')).toBe('/evento/abc123/comprar');
		expect(hrefEvento('a b')).toBe('/evento/a%20b');
		expect(hrefCheckout('a/b')).toBe('/evento/a%2Fb/comprar');
	});
});

describe('checkout /evento/:id/comprar (feature 005)', () => {
	it('ignora query y barra final al decidir', () => {
		expect(
			decidirAcceso({ usuario: VISITANTE, ruta: '/evento/x/comprar/?q=1' })
		).toEqual(redirigir('/login?volverA=%2Fevento%2Fx%2Fcomprar'));
		expect(
			decidirAcceso({ usuario: ORGANIZADOR, ruta: '/evento/x/comprar?q=1' })
		).toEqual(redirigir('/evento/x'));
		expect(
			decidirAcceso({ usuario: COMPRADOR, ruta: '/evento/x/comprar/' })
		).toEqual(permitir);
	});

	it('tras el login, el COMPRADOR vuelve al checkout y el ORGANIZADOR no', () => {
		expect(destinoTrasLogin(COMPRADOR, '/evento/x/comprar')).toBe(
			'/evento/x/comprar'
		);
		expect(destinoTrasLogin(ORGANIZADOR, '/evento/x/comprar')).toBe(
			'/organizador/eventos'
		);
	});
});
