/**
 * @file Helper de pruebas: reseñas, tipos de entrada del checkout y compras de
 *   ejemplo con el formato de la API (specs/005-detalle-evento-compra/data-model.md §2–4)
 *   y compras del listado del comprador (specs/006-mis-compras-comprador/data-model.md §1).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

import { AHORA } from './eventosEjemplo';

let secuencia = 0;

/**
 * Crea una reseña con el formato de `GET /api/usuarios/:id/resenias`.
 * @param {object} [parcial] Campos a reemplazar.
 * @returns {{id: string, comprador: object|null, eventoId: string, detalle: string, puntuacion: number}} Reseña.
 */
export function crearResenia(parcial = {}) {
	secuencia += 1;
	return {
		id: `res-${secuencia}`,
		comprador: { id: `c-${secuencia}`, nombre: 'Carla', apellido: 'Gómez' },
		eventoId: 'ev-viejo',
		detalle: `Comentario ${secuencia}`,
		puntuacion: 4,
		...parcial
	};
}

/** Comentario largo (más de 6 líneas en cualquier ancho razonable). */
export const DETALLE_LARGO = Array.from(
	{ length: 30 },
	(_, i) => `Línea ${i + 1} de una reseña muy detallada.`
).join(' ');

/** Cinco reseñas en orden de creación (la última es la más reciente). */
export const RESENIAS = [
	crearResenia({
		id: 'r1',
		comprador: { id: 'c1', nombre: 'Ana', apellido: 'López' },
		detalle: 'Primera reseña',
		puntuacion: 5
	}),
	crearResenia({
		id: 'r2',
		comprador: null,
		detalle: 'Reseña anónima',
		puntuacion: 3
	}),
	crearResenia({
		id: 'r3',
		comprador: { id: 'c3', nombre: 'Diego', apellido: 'Sosa' },
		detalle: DETALLE_LARGO,
		puntuacion: 4
	}),
	crearResenia({
		id: 'r4',
		comprador: { id: 'c4', nombre: 'Eva', apellido: 'Ruiz' },
		detalle: 'Cuarta reseña',
		puntuacion: 5
	}),
	crearResenia({
		id: 'r5',
		comprador: { id: 'c5', nombre: 'Fede', apellido: 'Torres' },
		detalle: 'Última reseña',
		puntuacion: 4
	})
];

/** Tipos de entrada del checkout: precio pago, cupo chico, gratis y agotado. */
export const TIPOS_CHECKOUT = [
	{
		id: 'te-gen',
		nombre: 'General',
		descripcion: 'Campo',
		precio: 25000,
		cupo: 100
	},
	{
		id: 'te-pla',
		nombre: 'Platea',
		descripcion: 'Sentado',
		precio: 40000,
		cupo: 2
	},
	{
		id: 'te-inv',
		nombre: 'Invitación',
		descripcion: '',
		precio: 0,
		cupo: 10
	},
	{
		id: 'te-ago',
		nombre: 'Agotada',
		descripcion: 'Sin lugar',
		precio: 30000,
		cupo: 0
	}
];

/**
 * Crea la respuesta de `POST /api/compras` (201).
 * @param {object} [parcial] Campos a reemplazar.
 * @returns {object} Compra en estado PENDIENTE.
 */
export function crearCompraRespuesta(parcial = {}) {
	return {
		id: 'compra-1',
		comprador: { id: 'u-comprador', nombre: 'Ana', apellido: 'García' },
		evento: { id: 'ev-1', nombre: 'Evento 1', fecha: '2026-12-12T21:00:00Z' },
		tipoEntrada: { id: 'te-pla', nombre: 'Platea', precio: 40000 },
		cantidad: 2,
		total: 80000,
		estado: 'PENDIENTE',
		...parcial
	};
}

const DIA = 24 * 60 * 60 * 1000;
let secuenciaListado = 0;

/**
 * Crea una compra con el formato de `GET /api/compras`
 * (specs/006-mis-compras-comprador/data-model.md §1).
 * @param {object} [parcial] Campos a reemplazar.
 * @returns {object} Compra del listado del comprador.
 */
export function crearCompraListado(parcial = {}) {
	secuenciaListado += 1;
	const estado = parcial.estado ?? 'PENDIENTE';
	return {
		id: `cl-${secuenciaListado}`,
		comprador: { id: 'u-comprador', nombre: 'Ana', apellido: 'García' },
		evento: {
			id: `ev-l-${secuenciaListado}`,
			nombre: `Evento ${secuenciaListado}`,
			fecha: new Date(Date.now() + 10 * DIA).toISOString()
		},
		tipoEntrada: { id: 'te-pla', nombre: 'Platea', precio: 40000 },
		cantidad: 2,
		total: 80000,
		estado,
		diasRestantes: estado === 'CONFIRMADA' ? 10 : null,
		...parcial
	};
}

/**
 * Siete compras en orden de creación, con fechas relativas a `ahora`:
 * PENDIENTE futura, CONFIRMADA en 3 días, CONFIRMADA de hoy (más tarde),
 * dos UTILIZADA del mismo evento pasado, CANCELADA y REEMBOLSADA.
 * Totales por pestaña: Activas 3, Pasadas 2, Canceladas 2.
 * @param {Date} ahora Momento de referencia.
 * @returns {object[]} Compras del listado.
 */
export function comprasPorEstado(ahora) {
	const en = (ms) => new Date(ahora.getTime() + ms).toISOString();
	const pasado = {
		id: 'ev-pasado',
		nombre: 'Festival pasado',
		fecha: en(-5 * DIA)
	};
	return [
		crearCompraListado({
			id: 'c-pen',
			estado: 'PENDIENTE',
			evento: { id: 'ev-pen', nombre: 'Recital pendiente', fecha: en(20 * DIA) }
		}),
		crearCompraListado({
			id: 'c-con3',
			estado: 'CONFIRMADA',
			diasRestantes: 3,
			evento: { id: 'ev-con3', nombre: 'Teatro en 3 días', fecha: en(3 * DIA) }
		}),
		crearCompraListado({
			id: 'c-con0',
			estado: 'CONFIRMADA',
			diasRestantes: 0,
			evento: {
				id: 'ev-con0',
				nombre: 'Show de hoy',
				fecha: en(60 * 60 * 1000)
			}
		}),
		crearCompraListado({
			id: 'c-uti1',
			estado: 'UTILIZADA',
			evento: pasado
		}),
		crearCompraListado({
			id: 'c-uti2',
			estado: 'UTILIZADA',
			evento: pasado,
			tipoEntrada: { id: 'te-gen', nombre: 'General', precio: 25000 },
			cantidad: 1,
			total: 25000
		}),
		crearCompraListado({
			id: 'c-can',
			estado: 'CANCELADA',
			evento: {
				id: 'ev-can',
				nombre: 'Conferencia cancelada',
				fecha: en(8 * DIA)
			}
		}),
		crearCompraListado({
			id: 'c-ree',
			estado: 'REEMBOLSADA',
			evento: {
				id: 'ev-ree',
				nombre: 'Partido reembolsado',
				fecha: en(9 * DIA)
			}
		})
	];
}

/** {@link comprasPorEstado} con `AHORA` de `eventosEjemplo.js` (pruebas puras). */
export const COMPRAS_POR_ESTADO = comprasPorEstado(AHORA);
