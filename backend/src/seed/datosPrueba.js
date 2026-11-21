/**
 * @file Seed de datos de prueba para desarrollo: 2 compradores, 2 organizadores,
 *   5 categorías, 3 eventos futuros y 3 ya ocurridos por organizador, y 2 compras
 *   UTILIZADA (una de cada comprador, en eventos de organizadores distintos), y un
 *   evento futuro "Sin cupo" con su cupo de 5 entradas vendido en una compra. Se carga solo si el
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
		categoria: 'Conferencias',
		enDias: 15,
		hora: 19,
		nombre: 'Sin cupo',
		descripcion:
			'Taller con entradas agotadas: sirve para probar el cupo insuficiente.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'General',
				descripcion: 'Cupo único',
				precio: 10000,
				cupo: 5
			}
		],
		compra: {
			comprador: 'lucas.comprador',
			tipoEntrada: 'General',
			cantidad: 5
		}
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
 * Eventos que ya ocurrieron (`haceDias` y `hora` arman una fecha pasada).
 * `compra` marca los que llevan una compra UTILIZADA de ese comprador.
 */
const EVENTOS_PASADOS_PRUEBA = Object.freeze([
	{
		organizador: 'bruno.organizador',
		categoria: 'Recitales',
		haceDias: 10,
		hora: 21,
		nombre: 'Noche de blues en el Abasto',
		descripcion:
			'Trío de blues con armonicista invitado, en un bar con escenario.',
		multimedia: [
			'https://images.unsplash.com/photo-1501386761578-eaa54b5ccb7c?w=1200'
		],
		tiposEntrada: [
			{ nombre: 'General', descripcion: 'De pie', precio: 14000, cupo: 100 }
		],
		compra: { comprador: 'ana.comprador', tipoEntrada: 'General', cantidad: 2 }
	},
	{
		organizador: 'bruno.organizador',
		categoria: 'Teatro',
		haceDias: 25,
		hora: 20,
		nombre: 'La casa de Bernarda Alba',
		descripcion:
			'Clásico de García Lorca con puesta contemporánea. 1 h 50 min.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'Platea',
				descripcion: 'Planta baja',
				precio: 18000,
				cupo: 120
			},
			{ nombre: 'Pullman', descripcion: 'Primer piso', precio: 12000, cupo: 60 }
		]
	},
	{
		organizador: 'bruno.organizador',
		categoria: 'Conferencias',
		haceDias: 40,
		hora: 18,
		nombre: 'Meetup de desarrollo web',
		descripcion: 'Tres charlas cortas sobre frontend y rendimiento. Gratuito.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'Entrada libre',
				descripcion: 'Con inscripción previa',
				precio: 0,
				cupo: 150
			}
		]
	},
	{
		organizador: 'sofia.organizadora',
		categoria: 'Festivales',
		haceDias: 15,
		hora: 15,
		nombre: 'Festival de música electrónica',
		descripcion: 'Una jornada con ocho DJs en un predio al aire libre.',
		multimedia: [
			'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200'
		],
		tiposEntrada: [
			{
				nombre: 'Campo',
				descripcion: 'Acceso general',
				precio: 38000,
				cupo: 1500
			},
			{
				nombre: 'VIP',
				descripcion: 'Sector con barra',
				precio: 80000,
				cupo: 100
			}
		],
		compra: { comprador: 'lucas.comprador', tipoEntrada: 'VIP', cantidad: 1 }
	},
	{
		organizador: 'sofia.organizadora',
		categoria: 'Deportes',
		haceDias: 30,
		hora: 16,
		nombre: 'Maratón de la ciudad',
		descripcion: 'Circuito de 10 km por el centro. Incluye kit de corredor.',
		multimedia: [],
		tiposEntrada: [
			{ nombre: 'Inscripción', descripcion: '10 km', precio: 12000, cupo: 800 }
		]
	},
	{
		organizador: 'sofia.organizadora',
		categoria: 'Recitales',
		haceDias: 60,
		hora: 21,
		nombre: 'Concierto sinfónico de verano',
		descripcion: 'Orquesta sinfónica con obras de Beethoven y Dvořák.',
		multimedia: [],
		tiposEntrada: [
			{
				nombre: 'General',
				descripcion: 'Butacas sin numerar',
				precio: 16000,
				cupo: 300
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
 * @property {import('../services/compraService.js').default} compraService
 * @property {import('../repositories/eventoRepository.js').default} eventoRepository
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
 * Fecha `dias` días antes de `ahora`, a la hora indicada.
 * @param {Date} ahora - Momento de referencia
 * @param {number} dias - Días hacia atrás
 * @param {number} hora - Hora local (0–23)
 * @returns {Date} Fecha pasada
 */
function fechaPasada(ahora, dias, hora) {
	return fechaFutura(ahora, -dias, hora);
}

/**
 * Carga los datos de prueba por medio de los servicios. Pensada para un
 * backend recién creado: si ya existen los usuarios, falla por nombre repetido.
 * @param {ServiciosSeed} servicios - Servicios de la app
 * @param {{logger?: {info: (linea: string) => void}, ahora?: Date}} [opciones] - Destino del log y momento de referencia para las fechas
 * @returns {Promise<{usuarios: object[], categorias: object[], eventos: object[], compras: object[]}>} Entidades creadas (`eventos` incluye los futuros y los pasados; `compras` son las 2 UTILIZADA y la CONFIRMADA que agota el cupo)
 * @throws {Error} Si algún servicio rechaza los datos (p. ej. nombre de usuario en uso)
 */
export async function cargarDatosPrueba(
	{
		usuarioService,
		categoriaService,
		eventoService,
		compraService,
		eventoRepository
	},
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
	const agotan = [];
	for (const {
		organizador,
		categoria,
		enDias,
		hora,
		compra,
		...datos
	} of EVENTOS_PRUEBA) {
		const evento = await eventoService.crearEvento({
			...datos,
			fecha: fechaFutura(ahora, enDias, hora),
			organizadorId: idUsuario.get(organizador),
			categoriaId: idCategoria.get(categoria)
		});
		eventos.push(evento);
		if (compra) agotan.push({ evento, compra, organizador });
	}

	// Compras que agotan el cupo de un evento futuro: con el reloj real alcanza.
	// Quedan CONFIRMADA (con `diasRestantes`), no PENDIENTE.
	const comprasAgotan = [];
	for (const { evento, compra, organizador } of agotan) {
		const tipo = evento.tiposEntrada.find(
			(t) => t.nombre === compra.tipoEntrada
		);
		const { id } = await compraService.crearCompra({
			compradorId: idUsuario.get(compra.comprador),
			eventoId: evento.id,
			tipoEntradaId: tipo.id,
			cantidad: compra.cantidad
		});
		comprasAgotan.push(
			await compraService.confirmarCompra({
				compraId: id,
				usuarioId: idUsuario.get(organizador)
			})
		);
	}

	// Eventos ya ocurridos: el servicio exige fecha futura, así que se crean con
	// una fecha temporal y se mueven al pasado en el repositorio. Esto debe pasar
	// antes de comprar, porque la compra guarda una copia del evento.
	const eventosPasados = [];
	for (const {
		organizador,
		categoria,
		haceDias,
		hora,
		compra,
		...datos
	} of EVENTOS_PASADOS_PRUEBA) {
		const creado = await eventoService.crearEvento({
			...datos,
			fecha: fechaFutura(ahora, 1, hora),
			organizadorId: idUsuario.get(organizador),
			categoriaId: idCategoria.get(categoria)
		});
		creado.fecha = fechaPasada(ahora, haceDias, hora);
		const evento = await eventoRepository.actualizar(creado);
		eventos.push(evento);
		eventosPasados.push({ evento, compra, organizador });
	}

	// Compras UTILIZADA: se crean y confirman "antes del evento" (reloj del
	// servicio fijado un día antes) y luego la tarea del sistema las marca.
	const relojReal = compraService.reloj;
	try {
		for (const { evento, compra, organizador } of eventosPasados) {
			if (!compra) continue;
			compraService.reloj = () =>
				new Date(evento.fecha.getTime() - 24 * 3600_000);
			const tipo = evento.tiposEntrada.find(
				(t) => t.nombre === compra.tipoEntrada
			);
			const { id } = await compraService.crearCompra({
				compradorId: idUsuario.get(compra.comprador),
				eventoId: evento.id,
				tipoEntradaId: tipo.id,
				cantidad: compra.cantidad
			});
			await compraService.confirmarCompra({
				compraId: id,
				usuarioId: idUsuario.get(organizador)
			});
		}
	} finally {
		compraService.reloj = relojReal;
	}
	await compraService.marcarComprasUtilizadas();
	const comprasUtilizadas = [];
	for (const { evento, compra, organizador } of eventosPasados) {
		if (!compra) continue;
		const delEvento = await compraService.listarComprasDeEvento({
			eventoId: evento.id,
			usuarioId: idUsuario.get(organizador)
		});
		comprasUtilizadas.push(...delEvento.compras);
	}

	logger.info(
		JSON.stringify({
			evento: 'seed_cargada',
			usuarios: usuarios.length,
			categorias: categorias.length,
			eventos: eventos.length,
			eventosPasados: eventosPasados.length,
			comprasUtilizadas: comprasUtilizadas.length,
			comprasAgotanCupo: comprasAgotan.length
		})
	);
	const compras = [...comprasUtilizadas, ...comprasAgotan];
	return { usuarios, categorias, eventos, compras };
}
