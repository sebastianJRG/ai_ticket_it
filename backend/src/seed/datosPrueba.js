/**
 * @file Seed de datos de prueba para desarrollo: 2 compradores, 2 organizadores,
 *   5 categorías y 3 eventos futuros por organizador. Se carga solo si el
 *   backend arranca con `SEED=true` (ver `index.js`) y usa los servicios, así
 *   que pasa por las mismas validaciones, hash de contraseñas y permisos que la API.
 * @owner Equipo Al Ticket It — backend
 * @license ISC
 */

/** Contraseña común de todos los usuarios de prueba (cumple la regla de `dto/usuario.js`). */
export const CONTRASENIA_PRUEBA = 'Prueba123!';

/**
 * Usuarios de prueba (sin contraseña; se agrega al crearlos).
 * @type {ReadonlyArray<{nombre: string, apellido: string, nombreUsuario: string, rol: 'COMPRADOR'|'ORGANIZADOR'}>}
 */
export const USUARIOS_PRUEBA = Object.freeze([
	{
		nombre: 'Ana',
		apellido: 'García',
		nombreUsuario: 'ana.comprador',
		rol: 'COMPRADOR'
	},
	{
		nombre: 'Lucas',
		apellido: 'Fernández',
		nombreUsuario: 'lucas.comprador',
		rol: 'COMPRADOR'
	},
	{
		nombre: 'Bruno',
		apellido: 'Pérez',
		nombreUsuario: 'bruno.organizador',
		rol: 'ORGANIZADOR'
	},
	{
		nombre: 'Sofía',
		apellido: 'Martínez',
		nombreUsuario: 'sofia.organizadora',
		rol: 'ORGANIZADOR'
	}
]);

/** Categorías de prueba (nombres que reconoce el arte por categoría del frontend). */
const CATEGORIAS_PRUEBA = Object.freeze([
	{ nombre: 'Recitales', descripcion: 'Música en vivo' },
	{ nombre: 'Teatro', descripcion: 'Obras y espectáculos' },
	{ nombre: 'Festivales', descripcion: 'Varios artistas, uno o más días' },
	{ nombre: 'Conferencias', descripcion: 'Charlas y encuentros' },
	{ nombre: 'Deportes', descripcion: 'Partidos y competencias' }
]);

/**
 * Eventos de prueba. `organizador` y `categoria` se resuelven por nombre de
 * usuario y nombre de categoría; `enDias` y `hora` arman una fecha futura.
 */
const EVENTOS_PRUEBA = Object.freeze([
	{
		organizador: 'bruno.organizador',
		categoria: 'Recitales',
		enDias: 5,
		hora: 21,
		nombre: 'Noche de jazz en el Bajo',
		descripcion:
			'Cuarteto de jazz con invitados, en un club chico y con mesas cerca del escenario.',
		multimedia: [
			'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200'
		],
		tiposEntrada: [
			{ nombre: 'General', descripcion: 'De pie', precio: 18000, cupo: 120 },
			{
				nombre: 'Platea',
				descripcion: 'Mesa frente al escenario',
				precio: 32000,
				cupo: 2
			}
		]
	},
	{
		organizador: 'bruno.organizador',
		categoria: 'Teatro',
		enDias: 12,
		hora: 20,
		nombre: 'Hamlet en la sala mayor',
		descripcion:
			'Versión clásica de Hamlet con elenco completo. Duración: 2 h 30 min con intervalo.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'Pullman',
				descripcion: 'Primer piso',
				precio: 15000,
				cupo: 80
			},
			{
				nombre: 'Platea',
				descripcion: 'Planta baja',
				precio: 24000,
				cupo: 150
			},
			{
				nombre: 'Palco',
				descripcion: 'Palco para cuatro personas',
				precio: 60000,
				cupo: 6
			}
		]
	},
	{
		organizador: 'bruno.organizador',
		categoria: 'Conferencias',
		enDias: 20,
		hora: 18,
		nombre: 'Charla abierta: diseño de producto',
		descripcion:
			'Encuentro gratuito sobre diseño de producto digital, con preguntas al final.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'Entrada libre',
				descripcion: 'Con inscripción previa',
				precio: 0,
				cupo: 200
			}
		]
	},
	{
		organizador: 'sofia.organizadora',
		categoria: 'Festivales',
		enDias: 30,
		hora: 14,
		nombre: 'Festival de rock del río',
		descripcion:
			'Dos escenarios, doce bandas de rock nacional y patio de comidas.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'Campo',
				descripcion: 'Acceso general',
				precio: 45000,
				cupo: 2000
			},
			{
				nombre: 'VIP',
				descripcion: 'Sector con barra y baños propios',
				precio: 95000,
				cupo: 150
			}
		]
	},
	{
		organizador: 'sofia.organizadora',
		categoria: 'Deportes',
		enDias: 8,
		hora: 17,
		nombre: 'Clásico de básquet',
		descripcion: 'Final de la liga local. Abren las puertas una hora antes.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'Popular',
				descripcion: 'Tribuna detrás del aro',
				precio: 9000,
				cupo: 500
			},
			{
				nombre: 'Platea',
				descripcion: 'Lateral numerada',
				precio: 22000,
				cupo: 300
			}
		]
	},
	{
		organizador: 'sofia.organizadora',
		categoria: 'Recitales',
		enDias: 45,
		hora: 21,
		nombre: 'Orquesta de tango en vivo',
		descripcion: 'Orquesta típica con cantante invitada. Show de 90 minutos.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'General',
				descripcion: 'Butacas sin numerar',
				precio: 20000,
				cupo: 250
			}
		]
	}
]);

/**
 * Servicios que necesita la seed (los expone `createApp` en `app.locals`).
 * @typedef {Object} ServiciosSeed
 * @property {import('../services/usuarioService.js').default} usuarioService
 * @property {import('../services/categoriaService.js').default} categoriaService
 * @property {import('../services/eventoService.js').default} eventoService
 */

/**
 * Fecha `dias` días después de `ahora`, a la hora indicada.
 * @param {Date} ahora - Momento de referencia
 * @param {number} dias - Días hacia adelante
 * @param {number} hora - Hora local (0–23)
 * @returns {Date} Fecha futura
 */
function fechaFutura(ahora, dias, hora) {
	const fecha = new Date(ahora.getTime());
	fecha.setDate(fecha.getDate() + dias);
	fecha.setHours(hora, 0, 0, 0);
	return fecha;
}

/**
 * Carga los datos de prueba por medio de los servicios. Pensada para un
 * backend recién creado: si ya existen los usuarios, falla por nombre repetido.
 * @param {ServiciosSeed} servicios - Servicios de la app
 * @param {{logger?: {info: (linea: string) => void}, ahora?: Date}} [opciones] - Destino del log y momento de referencia para las fechas
 * @returns {Promise<{usuarios: object[], categorias: object[], eventos: object[]}>} Entidades creadas
 * @throws {Error} Si algún servicio rechaza los datos (p. ej. nombre de usuario en uso)
 */
export async function cargarDatosPrueba(
	{ usuarioService, categoriaService, eventoService },
	{ logger = console, ahora = new Date() } = {}
) {
	const usuarios = [];
	for (const u of USUARIOS_PRUEBA) {
		usuarios.push(
			await usuarioService.crearUsuario({
				...u,
				contrasenia: CONTRASENIA_PRUEBA
			})
		);
	}

	const categorias = [];
	for (const c of CATEGORIAS_PRUEBA) {
		categorias.push(await categoriaService.crearCategoria(c));
	}

	const idUsuario = new Map(usuarios.map((u) => [u.nombreUsuario, u.id]));
	const idCategoria = new Map(categorias.map((c) => [c.nombre, c.id]));

	const eventos = [];
	for (const {
		organizador,
		categoria,
		enDias,
		hora,
		...datos
	} of EVENTOS_PRUEBA) {
		eventos.push(
			await eventoService.crearEvento({
				...datos,
				fecha: fechaFutura(ahora, enDias, hora),
				organizadorId: idUsuario.get(organizador),
				categoriaId: idCategoria.get(categoria)
			})
		);
	}

	logger.info(
		JSON.stringify({
			evento: 'seed_cargada',
			usuarios: usuarios.length,
			categorias: categorias.length,
			eventos: eventos.length
		})
	);
	return { usuarios, categorias, eventos };
}
