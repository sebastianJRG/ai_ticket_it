/**
 * Fixtures puras para los tests unitarios de eventos y compras.
 * Cada función devuelve objetos nuevos y no guarda estado en el módulo,
 * de modo que ningún test pueda contaminar a otro.
 *
 * @module tests/helpers/eventosFixtures
 * @license ISC
 */
import Categoria from '../../src/models/categoria.js';
import Compra from '../../src/models/compra.js';
import EstadoCompra from '../../src/models/estadoCompra.js';
import Evento from '../../src/models/evento.js';
import Resenia from '../../src/models/resenia.js';
import TipoEntrada from '../../src/models/tipoEntrada.js';
import Usuario from '../../src/models/usuario.js';

/** Fecha fija por defecto: los tests nunca dependen del reloj. */
const FECHA_POR_DEFECTO = new Date('2030-01-10T00:00:00.000Z');

/**
 * Construye una categoría nueva.
 * @param {object} [datos]
 * @param {string} [datos.id='cat-1']
 * @param {string} [datos.nombre='Categoría']
 * @returns {Categoria}
 */
export function construirCategoria({ id = 'cat-1', nombre = 'Categoría' } = {}) {
	return new Categoria(id, nombre, `Descripción de ${nombre}`);
}

/**
 * Construye un usuario con datos sensibles (hashes) para poder comprobar
 * que no se filtran en las respuestas.
 * @param {object} [datos]
 * @param {string|null} [datos.id=null] - Si es null, el repositorio asigna uno al persistirlo
 * @param {string} [datos.rol='COMPRADOR']
 * @param {string} [datos.nombreUsuario='usuario.test']
 * @returns {Usuario}
 */
export function construirUsuario({
	id = null,
	rol = 'COMPRADOR',
	nombreUsuario = 'usuario.test'
} = {}) {
	return new Usuario(
		id,
		'Ana',
		'Pérez',
		rol,
		['permiso:uno'],
		[],
		nombreUsuario,
		'hash-secreto-de-contrasenia',
		'hash-secreto-de-refresh'
	);
}

/**
 * Construye un evento y lo persiste en el repositorio recibido.
 * Usa los modelos reales, evitando la validación de fecha futura de `crearEvento`.
 * @param {import('../../src/repositories/eventoRepository.js').default} repositorio
 * @param {object} [datos]
 * @param {string} [datos.nombre='Evento']
 * @param {string} [datos.descripcion='Descripción']
 * @param {Categoria} [datos.categoria]
 * @param {Date} [datos.fecha]
 * @param {number[]} [datos.precios=[100]] - Un tipo de entrada por cada precio
 * @param {number} [datos.cupo=10] - Cupo de cada tipo de entrada
 * @param {string} [datos.prefijoTipos='t'] - Prefijo de los IDs de tipo (evita choques entre eventos)
 * @param {object} [datos.organizador] - Organizador embebido en el evento
 * @returns {Promise<Evento>} Evento persistido (con ID asignado)
 */
export async function construirEvento(
	repositorio,
	{
		nombre = 'Evento',
		descripcion = 'Descripción',
		categoria = construirCategoria(),
		fecha = FECHA_POR_DEFECTO,
		precios = [100],
		cupo = 10,
		prefijoTipos = 't',
		organizador = { id: 'org-1', nombre: 'Organizador' }
	} = {}
) {
	const tiposEntrada = precios.map(
		(precio, i) =>
			new TipoEntrada(`${prefijoTipos}${i + 1}`, `Tipo ${i + 1}`, 'Entrada', precio, cupo)
	);
	const evento = new Evento(
		null,
		nombre,
		descripcion,
		categoria,
		fecha,
		tiposEntrada,
		[],
		organizador
	);
	return repositorio.crear(evento);
}

/**
 * Construye una reseña de un evento y la persiste en el repositorio recibido.
 * @param {import('../../src/repositories/reseniaRepository.js').default} repositorio
 * @param {Evento} evento - Evento ya persistido (debe tener ID)
 * @param {number} puntuacion
 * @param {object} [opciones]
 * @param {object} [opciones.comprador={ id: 'comp-1' }] - Autor de la reseña
 * @param {string} [opciones.detalle='Detalle']
 * @returns {Promise<Resenia>}
 */
export async function construirResenia(
	repositorio,
	evento,
	puntuacion,
	{ comprador = { id: 'comp-1' }, detalle = 'Detalle' } = {}
) {
	return repositorio.crear(
		new Resenia(null, comprador, evento, detalle, puntuacion)
	);
}

/**
 * Construye una compra y la persiste en el repositorio recibido.
 * El total se calcula como precio × cantidad.
 * @param {import('../../src/repositories/compraRepository.js').default} repositorio
 * @param {object} datos
 * @param {Usuario} datos.comprador
 * @param {Evento} datos.evento
 * @param {TipoEntrada} datos.tipoEntrada
 * @param {number} [datos.cantidad=1]
 * @param {string} [datos.estado=EstadoCompra.PENDIENTE]
 * @returns {Promise<Compra>}
 */
export async function construirCompra(
	repositorio,
	{ comprador, evento, tipoEntrada, cantidad = 1, estado = EstadoCompra.PENDIENTE }
) {
	return repositorio.crear(
		new Compra(
			null,
			comprador,
			evento,
			tipoEntrada,
			cantidad,
			tipoEntrada.precio * cantidad,
			estado
		)
	);
}
