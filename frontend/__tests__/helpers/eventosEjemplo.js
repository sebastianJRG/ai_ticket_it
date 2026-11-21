/**
 * @file Helper de pruebas: categorías y eventos de ejemplo con el formato de
 *   `GET /api/eventos` (specs/004-explorar-busqueda-favoritos/data-model.md §1–2)
 *   y eventos propios y ajenos del organizador de la sesión
 *   (specs/007-organizador-eventos/data-model.md §1, §3).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/** "Ahora" fijo de las pruebas: miércoles 2 de diciembre de 2026, 12:00 local. */
export const AHORA = new Date(2026, 11, 2, 12, 0, 0);

/** Categorías de ejemplo (una con nombre libre, para el arte por hash). */
export const CATEGORIAS = [
	{ id: 'cat-rec', nombre: 'Recitales', descripcion: 'Música en vivo' },
	{ id: 'cat-tea', nombre: 'Teatro', descripcion: 'Obras' },
	{ id: 'cat-std', nombre: 'Stand-up', descripcion: 'Humor' }
];

/** Organizador público de ejemplo. */
export const ORGANIZADOR_PUBLICO = {
	id: 'org-1',
	nombre: 'Bruno',
	apellido: 'Pérez',
	rol: 'ORGANIZADOR'
};

let secuencia = 0;

/**
 * Crea un evento con todos los campos del listado; `parcial` pisa los valores.
 * @param {object} [parcial] Campos a reemplazar.
 * @returns {object} Evento con el formato de la API.
 */
export function crearEvento(parcial = {}) {
	secuencia += 1;
	return {
		id: `ev-${secuencia}`,
		nombre: `Evento ${secuencia}`,
		descripcion: 'Descripción',
		categoria: CATEGORIAS[0],
		fecha: new Date(2026, 11, 12, 21, 0, 0).toISOString(),
		tiposEntrada: [
			{
				id: `te-${secuencia}-a`,
				nombre: 'General',
				descripcion: 'Campo',
				precio: 32000,
				cupo: 100
			},
			{
				id: `te-${secuencia}-b`,
				nombre: 'VIP',
				descripcion: 'Platea',
				precio: 85000,
				cupo: 20
			}
		],
		multimedia: [],
		organizador: ORGANIZADOR_PUBLICO,
		puntajeOrganizador: null,
		...parcial
	};
}

/** Eventos de ejemplo, ordenados por fecha ascendente. */
export const EVENTOS = [
	crearEvento({
		id: 'ev-pasado',
		nombre: 'Concierto pasado',
		fecha: new Date(2026, 10, 20, 21, 0).toISOString()
	}),
	crearEvento({
		id: 'ev-jazz',
		nombre: 'Noche de jazz',
		fecha: new Date(2026, 11, 5, 21, 0).toISOString(),
		puntajeOrganizador: 4.666
	}),
	crearEvento({
		id: 'ev-hamlet',
		nombre: 'Hamlet',
		categoria: CATEGORIAS[1],
		fecha: new Date(2026, 11, 8, 20, 30).toISOString(),
		multimedia: ['https://ejemplo.com/hamlet.jpg']
	}),
	crearEvento({
		id: 'ev-gratis',
		nombre: 'Feria gratis',
		categoria: CATEGORIAS[2],
		fecha: new Date(2026, 11, 10, 18, 0).toISOString(),
		tiposEntrada: [
			{
				id: 'te-g',
				nombre: 'Libre',
				descripcion: 'Libre',
				precio: 0,
				cupo: 500
			}
		]
	}),
	crearEvento({
		id: 'ev-rock',
		nombre: 'Rock nacional',
		fecha: new Date(2026, 11, 14, 22, 0).toISOString()
	}),
	crearEvento({
		id: 'ev-obra',
		nombre: 'Obra de verano',
		categoria: CATEGORIAS[1],
		fecha: new Date(2026, 11, 20, 21, 0).toISOString()
	}),
	crearEvento({
		id: 'ev-festi',
		nombre: 'Festival de fin de año',
		fecha: new Date(2026, 11, 28, 16, 0).toISOString()
	}),
	crearEvento({
		id: 'ev-anio',
		nombre: 'Recital de año nuevo',
		fecha: new Date(2027, 0, 3, 21, 0).toISOString()
	})
];

/**
 * Crea un evento de un organizador dado (feature 007).
 * @param {{id: string, nombre?: string, apellido?: string}} organizador Organizador dueño (versión pública).
 * @param {object} [parcial] Campos a reemplazar.
 * @returns {object} Evento con el formato de la API.
 */
export function crearEventoDe(organizador, parcial = {}) {
	return crearEvento({
		...parcial,
		organizador: { rol: 'ORGANIZADOR', ...organizador }
	});
}

/** Organizador de la sesión en las pruebas (mismo `id` que `ORGANIZADOR` de authFalso). */
const ORGANIZADOR_SESION = {
	id: 'u-organizador',
	nombre: 'Bruno',
	apellido: 'Pérez'
};

/**
 * Eventos para Mis eventos, relativos a `AHORA` (2/12/2026 12:00):
 * 2 futuros propios (fechas desordenadas), 2 pasados propios y 2 de `org-1`.
 */
export const EVENTOS_ORGANIZADOR = [
	crearEventoDe(ORGANIZADOR_SESION, {
		id: 'ev-prop-fut-2',
		nombre: 'Festival propio',
		fecha: new Date(2026, 11, 20, 18, 0).toISOString()
	}),
	crearEventoDe(ORGANIZADOR_SESION, {
		id: 'ev-prop-pas-1',
		nombre: 'Recital viejo',
		fecha: new Date(2026, 10, 1, 21, 0).toISOString()
	}),
	crearEvento({
		id: 'ev-ajeno-1',
		nombre: 'Evento ajeno futuro',
		fecha: new Date(2026, 11, 10, 21, 0).toISOString()
	}),
	crearEventoDe(ORGANIZADOR_SESION, {
		id: 'ev-prop-fut-1',
		nombre: 'Obra propia',
		fecha: new Date(2026, 11, 5, 20, 0).toISOString()
	}),
	crearEventoDe(ORGANIZADOR_SESION, {
		id: 'ev-prop-pas-2',
		nombre: 'Charla reciente',
		fecha: new Date(2026, 10, 25, 19, 0).toISOString()
	}),
	crearEvento({
		id: 'ev-ajeno-2',
		nombre: 'Evento ajeno pasado',
		fecha: new Date(2026, 10, 15, 21, 0).toISOString()
	})
];
