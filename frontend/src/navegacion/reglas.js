/**
 * @file Reglas de navegación por sesión y rol (puras, sin React ni servicios):
 *   rutas, pestañas de cada rol, ruta inicial, decisión de acceso y destino
 *   tras iniciar sesión o registrarse (specs/003-navegacion-sesion/contracts/navegacion.md).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/**
 * Usuario de la sesión tal como lo guarda `AuthContext` (solo importa el rol).
 * @typedef {{ rol: 'COMPRADOR'|'ORGANIZADOR' }|null|undefined} UsuarioSesion
 */

/**
 * Ítem de la barra inferior (data-model.md › TabDef).
 * @typedef {Object} TabDef
 * @property {string} clave Nombre de la ruta dentro de su layout; único por lista.
 * @property {string} etiqueta Texto visible siempre.
 * @property {string} icono Nombre del ícono Lucide.
 * @property {boolean} requiereSesion Si el visitante es enviado a login al tocarla.
 */

/**
 * Resultado de {@link decidirAcceso} (data-model.md › DecisionAcceso).
 * @typedef {{ tipo: 'permitir' } | { tipo: 'redirigir', href: string }} DecisionAcceso
 */

/** Rutas de la app por área. */
export const RUTAS = Object.freeze({
	login: '/login',
	registro: '/registro',
	explorar: '/explorar',
	buscar: '/buscar',
	favoritos: '/favoritos',
	compras: '/compras',
	perfil: '/perfil',
	organizador: Object.freeze({
		eventos: '/organizador/eventos',
		crear: '/organizador/crear',
		mensajes: '/organizador/mensajes',
		perfil: '/organizador/perfil'
	})
});

/**
 * Pestañas del comprador (Explorar · Buscar · Favoritos · Compras · Perfil).
 * @type {ReadonlyArray<TabDef>}
 */
export const TABS_COMPRADOR = Object.freeze([
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
	{ clave: 'perfil', etiqueta: 'Perfil', icono: 'User', requiereSesion: true }
]);

/**
 * Pestañas del organizador (Mis eventos · Crear · Mensajes · Perfil).
 * @type {ReadonlyArray<TabDef>}
 */
export const TABS_ORGANIZADOR = Object.freeze([
	{
		clave: 'eventos',
		etiqueta: 'Mis eventos',
		icono: 'Calendar',
		requiereSesion: true
	},
	{ clave: 'crear', etiqueta: 'Crear', icono: 'Plus', requiereSesion: true },
	{
		clave: 'mensajes',
		etiqueta: 'Mensajes',
		icono: 'MessageCircle',
		requiereSesion: true
	},
	{ clave: 'perfil', etiqueta: 'Perfil', icono: 'User', requiereSesion: true }
]);

const AUTH = new Set([RUTAS.login, RUTAS.registro]);
const PUBLICAS_COMPRADOR = new Set([RUTAS.explorar, RUTAS.buscar]);
const PRIVADAS_COMPRADOR = new Set([
	RUTAS.favoritos,
	RUTAS.compras,
	RUTAS.perfil
]);
const DETALLE_EVENTO = /^\/evento\/[^/]+$/;

const PERMITIR = Object.freeze({ tipo: 'permitir' });

/**
 * Quita query, hash y barra final de una ruta.
 * @param {unknown} ruta Ruta tal como llega.
 * @returns {string} Ruta normalizada (`'/'` si no hay).
 */
function normalizar(ruta) {
	if (typeof ruta !== 'string' || ruta === '') return '/';
	const sinQuery = ruta.split(/[?#]/)[0];
	const sinBarra =
		sinQuery.length > 1 ? sinQuery.replace(/\/+$/, '') : sinQuery;
	return sinBarra || '/';
}

/**
 * @param {string} href Destino.
 * @returns {DecisionAcceso} Decisión de redirigir.
 */
const redirigir = (href) => ({ tipo: 'redirigir', href });

/**
 * Ruta en la que abre cada estado de sesión (data-model.md › EstadoSesion).
 * @param {UsuarioSesion} usuario Usuario de la sesión, o `null` (visitante).
 * @returns {string} `/organizador/eventos` para ORGANIZADOR; `/explorar` en otro caso.
 */
export function rutaInicial(usuario) {
	return usuario?.rol === 'ORGANIZADOR'
		? RUTAS.organizador.eventos
		: RUTAS.explorar;
}

/**
 * Ruta de login, con la ruta a la que volver tras iniciar sesión.
 * @param {string} [volverA] Ruta interna de origen.
 * @returns {string} `/login` o `/login?volverA=<ruta codificada>`.
 */
export function hrefLogin(volverA) {
	return typeof volverA === 'string' && volverA !== ''
		? `${RUTAS.login}?volverA=${encodeURIComponent(volverA)}`
		: RUTAS.login;
}

/**
 * Decide si el estado de sesión puede ver una ruta (data-model.md › Area).
 * Nunca redirige hacia la misma ruta y nunca lanza.
 * @param {{ usuario: UsuarioSesion, ruta?: string }} entrada Usuario y ruta pedida.
 * @returns {DecisionAcceso} `permitir`, o `redirigir` con un `href` interno.
 */
export function decidirAcceso({ usuario, ruta } = {}) {
	const r = normalizar(ruta);
	const rol = usuario?.rol ?? null;

	if (r === '/') return redirigir(rutaInicial(usuario));
	if (AUTH.has(r)) return usuario ? redirigir(rutaInicial(usuario)) : PERMITIR;
	if (DETALLE_EVENTO.test(r)) return PERMITIR;
	if (PUBLICAS_COMPRADOR.has(r)) {
		return rol === 'ORGANIZADOR'
			? redirigir(RUTAS.organizador.eventos)
			: PERMITIR;
	}
	if (PRIVADAS_COMPRADOR.has(r)) {
		if (!usuario) return redirigir(hrefLogin(r));
		return rol === 'ORGANIZADOR'
			? redirigir(RUTAS.organizador.eventos)
			: PERMITIR;
	}
	if (r === '/organizador' || r.startsWith('/organizador/')) {
		if (!usuario) return redirigir(hrefLogin(r));
		return rol === 'ORGANIZADOR' ? PERMITIR : redirigir(RUTAS.explorar);
	}
	return PERMITIR;
}

/**
 * Indica si `volverA` es una ruta interna (empieza con una sola `/`, sin `\`).
 * @param {unknown} volverA Valor recibido por parámetro.
 * @returns {boolean} `true` si es una ruta interna utilizable.
 */
function esRutaInterna(volverA) {
	return (
		typeof volverA === 'string' &&
		volverA.startsWith('/') &&
		!volverA.startsWith('//') &&
		!volverA.includes('\\')
	);
}

/**
 * Devuelve `volverA` si es interna y el usuario puede verla; si no, `respaldo`.
 * @param {UsuarioSesion} usuario Usuario recién autenticado.
 * @param {unknown} volverA Ruta pedida.
 * @param {string} respaldo Destino por defecto.
 * @returns {string} Destino final.
 */
function destino(usuario, volverA, respaldo) {
	if (
		esRutaInterna(volverA) &&
		decidirAcceso({ usuario, ruta: volverA }).tipo === 'permitir'
	) {
		return volverA;
	}
	return respaldo;
}

/**
 * Destino tras iniciar sesión (research R3, R12).
 * @param {UsuarioSesion} usuario Usuario recién autenticado.
 * @param {string} [volverA] Ruta de origen; se ignora si es externa o de otra área.
 * @returns {string} `volverA` permitido, o la ruta inicial del rol.
 */
export function destinoTrasLogin(usuario, volverA) {
	return destino(usuario, volverA, rutaInicial(usuario));
}

/**
 * Destino tras registrarse (research R12): como el login, salvo que un
 * ORGANIZADOR sin `volverA` válido va a Crear evento.
 * @param {UsuarioSesion} usuario Usuario recién registrado y autenticado.
 * @param {string} [volverA] Ruta de origen.
 * @returns {string} Destino final.
 */
export function destinoTrasRegistro(usuario, volverA) {
	const respaldo =
		usuario?.rol === 'ORGANIZADOR'
			? RUTAS.organizador.crear
			: rutaInicial(usuario);
	return destino(usuario, volverA, respaldo);
}
