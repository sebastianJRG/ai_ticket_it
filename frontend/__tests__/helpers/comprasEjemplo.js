/**
 * @file Helper de pruebas: reseñas, tipos de entrada del checkout y compras de
 *   ejemplo con el formato de la API (specs/005-detalle-evento-compra/data-model.md §2–4).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

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
