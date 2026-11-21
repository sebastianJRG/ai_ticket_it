import {
	aTarjeta,
	esPasado,
	iconoCategoria,
	modoFavorito,
	paletaCategoria,
	precioDesde,
	separarExplorar
} from '../../src/eventos/presentacion';
import {
	AHORA,
	CATEGORIAS,
	EVENTOS,
	crearEvento
} from '../helpers/eventosEjemplo';

/** Espacio duro de los precios (format.js). */
const NBSP = /\u00a0/g;

const conPrecios = (...precios) =>
	crearEvento({
		tiposEntrada: precios.map((precio, i) => ({
			id: `t${i}`,
			nombre: `T${i}`,
			descripcion: 'd',
			precio,
			cupo: 10
		}))
	});

describe('precioDesde', () => {
	it('devuelve el mínimo de los tipos de entrada', () => {
		expect(precioDesde(conPrecios(5000, 1200, 9000))).toBe(1200);
	});
	it('con un solo tipo devuelve su precio', () => {
		expect(precioDesde(conPrecios(25000))).toBe(25000);
	});
	it('sin tipos devuelve null', () => {
		expect(precioDesde(crearEvento({ tiposEntrada: [] }))).toBeNull();
	});
});

describe('aTarjeta (data-model §3)', () => {
	const evento = crearEvento({
		id: 'e1',
		nombre: 'Noche de jazz',
		fecha: new Date(2026, 11, 12, 21, 0).toISOString(),
		puntajeOrganizador: 4.5
	});

	it('copia id y nombre y toma el nombre de la categoría', () => {
		const t = aTarjeta(evento, { ahora: AHORA });
		expect(t.id).toBe('e1');
		expect(t.nombre).toBe('Noche de jazz');
		expect(t.categoria).toBe('Recitales');
	});

	it('formatea la fecha corta y el bloque día/mes', () => {
		const t = aTarjeta(evento, { ahora: AHORA });
		expect(t.fechaCorta).toBe('sáb 12 dic · 21:00');
		expect(t.dia).toBe('12');
		expect(t.mes).toBe('DIC');
	});

	it('calcula precio mínimo, máximo y texto "Desde"', () => {
		const t = aTarjeta(evento, { ahora: AHORA });
		expect(t.precioMin).toBe(32000);
		expect(t.precioMax).toBe(85000);
		expect(t.precioTexto.replace(NBSP, ' ')).toBe('Desde $ 32.000');
	});

	it('precio único sin "Desde" y 0 como "Gratis"', () => {
		expect(
			aTarjeta(conPrecios(25000), { ahora: AHORA }).precioTexto.replace(
				NBSP,
				' '
			)
		).toBe('$ 25.000');
		expect(
			aTarjeta(conPrecios(0), { ahora: AHORA }).precioTexto.replace(NBSP, ' ')
		).toBe('Gratis');
	});

	it('rango que empieza en 0 no dice "Desde Gratis"', () => {
		expect(
			aTarjeta(conPrecios(0, 5000), { ahora: AHORA }).precioTexto.replace(
				NBSP,
				' '
			)
		).toBe('Desde $ 0');
	});

	it('sin tipos de entrada el texto de precio queda vacío y no lanza', () => {
		const t = aTarjeta(crearEvento({ tiposEntrada: [] }), { ahora: AHORA });
		expect(t.precioTexto.replace(NBSP, ' ')).toBe('');
		expect(t.precioMin).toBeNull();
	});

	it('imagen: primera de multimedia o null', () => {
		expect(
			aTarjeta(crearEvento({ multimedia: ['https://x/a.jpg', 'b'] }), {
				ahora: AHORA
			}).imagen
		).toBe('https://x/a.jpg');
		expect(
			aTarjeta(crearEvento({ multimedia: [] }), { ahora: AHORA }).imagen
		).toBeNull();
		expect(
			aTarjeta(crearEvento({ multimedia: [''] }), { ahora: AHORA }).imagen
		).toBeNull();
	});

	it('puntaje y nombre del organizador', () => {
		const t = aTarjeta(evento, { ahora: AHORA });
		expect(t.puntaje).toBe(4.5);
		expect(t.organizadorNombre).toBe('Bruno Pérez');
		expect(
			aTarjeta(crearEvento({ organizador: null }), { ahora: AHORA })
				.organizadorNombre
		).toBe('');
		expect(aTarjeta(crearEvento(), { ahora: AHORA }).puntaje).toBeNull();
	});

	it('finalizado si la fecha es igual o anterior a ahora', () => {
		expect(aTarjeta(evento, { ahora: AHORA }).finalizado).toBe(false);
		expect(
			aTarjeta(crearEvento({ fecha: AHORA.toISOString() }), { ahora: AHORA })
				.finalizado
		).toBe(true);
	});

	it('etiqueta accesible con nombre, fecha, precio y estado', () => {
		expect(
			aTarjeta(evento, { ahora: AHORA }).etiquetaAccesible.replace(NBSP, ' ')
		).toBe('Noche de jazz, sáb 12 dic · 21:00, Desde $ 32.000');
		const pasado = crearEvento({
			nombre: 'Viejo',
			fecha: new Date(2026, 10, 1, 20, 0).toISOString(),
			tiposEntrada: [
				{ id: 'a', nombre: 'a', descripcion: 'a', precio: 0, cupo: 1 }
			]
		});
		expect(
			aTarjeta(pasado, { ahora: AHORA }).etiquetaAccesible.replace(NBSP, ' ')
		).toBe('Viejo, dom 1 nov · 20:00, Gratis, finalizado');
	});

	it('incluye una paleta', () => {
		expect(aTarjeta(evento, { ahora: AHORA }).paleta).toEqual(
			paletaCategoria(evento.categoria)
		);
	});
});

describe('esPasado', () => {
	it('compara contra ahora', () => {
		expect(
			esPasado(crearEvento({ fecha: '2026-01-01T00:00:00Z' }), AHORA)
		).toBe(true);
		expect(
			esPasado(crearEvento({ fecha: '2027-01-01T00:00:00Z' }), AHORA)
		).toBe(false);
	});
});

describe('iconoCategoria', () => {
	it('mismo ícono sin importar mayúsculas ni acentos', () => {
		expect(iconoCategoria('Recitales')).toBe('Music');
		expect(iconoCategoria('recitales')).toBe('Music');
		expect(iconoCategoria('Recitáles')).toBe('Music');
		expect(iconoCategoria('Teatro')).toBe('Drama');
	});
	it('desconocido o vacío → Tag', () => {
		expect(iconoCategoria('Stand-up')).toBe('Tag');
		expect(iconoCategoria(undefined)).toBe('Tag');
	});
});

describe('paletaCategoria', () => {
	it('nombre conocido → su paleta', () => {
		expect(paletaCategoria({ id: 'x', nombre: 'Teatro' })).toEqual(
			paletaCategoria({ id: 'y', nombre: 'teatro' })
		);
	});
	it('desconocido → paleta estable por id, una de las 5', () => {
		const a = paletaCategoria(CATEGORIAS[2]);
		expect(paletaCategoria(CATEGORIAS[2])).toEqual(a);
		const conocidas = [
			'Recitales',
			'Teatro',
			'Festivales',
			'Conferencias',
			'Deportes'
		].map((nombre) => paletaCategoria({ id: nombre, nombre }));
		expect(conocidas).toContainEqual(a);
		expect(a).toEqual(
			expect.objectContaining({
				fondo: expect.any(String),
				a: expect.any(String),
				b: expect.any(String)
			})
		);
	});
	it('sin categoría no lanza', () => {
		expect(() => paletaCategoria(undefined)).not.toThrow();
	});
});

describe('separarExplorar (data-model §4)', () => {
	it('descarta finalizados y conserva el orden recibido en muyPronto', () => {
		const { muyPronto } = separarExplorar(EVENTOS, { ahora: AHORA });
		expect(muyPronto.map((e) => e.id)).toEqual(
			EVENTOS.filter((e) => e.id !== 'ev-pasado').map((e) => e.id)
		);
	});

	it('destacados son los primeros 5 futuros', () => {
		const { destacados, muyPronto } = separarExplorar(EVENTOS, {
			ahora: AHORA
		});
		expect(destacados).toEqual(muyPronto.slice(0, 5));
		expect(destacados).toHaveLength(5);
	});

	it('con menos de 5 futuros, destacados tiene los que haya', () => {
		const { destacados } = separarExplorar(EVENTOS.slice(0, 3), {
			ahora: AHORA,
			maxDestacados: 5
		});
		expect(destacados.map((e) => e.id)).toEqual(['ev-jazz', 'ev-hamlet']);
	});

	it('lista vacía o inválida → ambos vacíos', () => {
		expect(separarExplorar([], { ahora: AHORA })).toEqual({
			destacados: [],
			muyPronto: []
		});
		expect(separarExplorar(null, { ahora: AHORA })).toEqual({
			destacados: [],
			muyPronto: []
		});
	});
});

describe('modoFavorito (data-model §9)', () => {
	it('COMPRADOR alterna, visitante pide sesión, ORGANIZADOR oculto', () => {
		expect(modoFavorito({ rol: 'COMPRADOR' })).toBe('alternar');
		expect(modoFavorito(null)).toBe('pedirSesion');
		expect(modoFavorito(undefined)).toBe('pedirSesion');
		expect(modoFavorito({ rol: 'ORGANIZADOR' })).toBe('oculto');
	});
});
