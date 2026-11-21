/**
 * @file Lógica pura del formulario Crear evento: borrador con tipos de entrada
 *   repetibles e imágenes por URL, máscaras de fecha y hora, validación con
 *   las mismas reglas que `backend/src/dto/evento.js` y armado del cuerpo de
 *   `POST /api/eventos` (specs/007-organizador-eventos/data-model.md §2;
 *   research R4–R7, R13). Sin React ni servicios.
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/** Máximo de imágenes por evento (data-model.md › BorradorEvento.multimedia). */
export const MAX_IMAGENES = 5;

/**
 * Tipo de entrada en edición (data-model.md › TipoEntradaBorrador).
 * @typedef {Object} TipoEntradaBorrador
 * @property {string} clave Clave local estable (`t1`, `t2`…); nunca se reutiliza.
 * @property {string} nombre Nombre tal como se escribió.
 * @property {string} descripcion Descripción tal como se escribió.
 * @property {string} precio Precio como texto (ver {@link aNumeroPrecio}).
 * @property {string} cupo Cupo como texto (solo dígitos).
 */

/**
 * Imagen en edición.
 * @typedef {Object} ImagenBorrador
 * @property {string} clave Clave local estable (`i1`, `i2`…).
 * @property {string} url URL tal como se escribió.
 */

/**
 * Borrador del evento (data-model.md › BorradorEvento).
 * @typedef {Object} BorradorEvento
 * @property {string} nombre Nombre del evento.
 * @property {string} descripcion Descripción del evento.
 * @property {string|null} categoriaId Categoría elegida, o `null`.
 * @property {string} fecha Fecha `DD/MM/AAAA` (hora local).
 * @property {string} hora Hora `HH:MM` (24 h, local).
 * @property {ImagenBorrador[]} multimedia Imágenes (máximo {@link MAX_IMAGENES}).
 * @property {TipoEntradaBorrador[]} tiposEntrada Tipos de entrada (mínimo 1).
 * @property {Set<string>} tocados Rutas de campo tocadas (perdieron el foco o se publicó).
 * @property {number} secuencia Próximo número para claves locales.
 */

/**
 * Cuerpo de `crearEvento` (data-model.md §1 › Cuerpo de POST /api/eventos).
 * @typedef {Object} CuerpoCrearEvento
 * @property {string} nombre Nombre sin espacios sobrantes.
 * @property {string} descripcion Descripción sin espacios sobrantes.
 * @property {string} categoriaId ID de la categoría.
 * @property {string} fecha Fecha ISO en UTC (termina en `Z`).
 * @property {{nombre: string, descripcion: string, precio: number, cupo: number}[]} tiposEntrada Tipos de entrada.
 * @property {string[]} multimedia URLs no vacías.
 */

const RE_FECHA = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const RE_HORA = /^(\d{2}):(\d{2})$/;
const RE_PRECIO = /^-?\d+([.,]\d{1,2})?$/;
const RE_CUPO = /^\d+$/;
const RE_URL = /^https?:\/\/\S+$/i;
const CAMPOS_TIPO = ['nombre', 'descripcion', 'precio', 'cupo'];

/**
 * Tipo de entrada vacío.
 * @param {string} clave Clave local.
 * @returns {TipoEntradaBorrador} Tipo vacío.
 */
const tipoVacio = (clave) => ({
	clave,
	nombre: '',
	descripcion: '',
	precio: '',
	cupo: ''
});

/**
 * Borrador inicial: campos vacíos y un tipo de entrada vacío.
 * @returns {BorradorEvento} Borrador nuevo.
 */
export function borradorInicial() {
	return {
		nombre: '',
		descripcion: '',
		categoriaId: null,
		fecha: '',
		hora: '',
		multimedia: [],
		tiposEntrada: [tipoVacio('t1')],
		tocados: new Set(),
		secuencia: 2
	};
}

/**
 * Agrega un tipo de entrada vacío al final.
 * @param {BorradorEvento} borrador Borrador actual.
 * @returns {BorradorEvento} Borrador nuevo.
 */
export function agregarTipo(borrador) {
	return {
		...borrador,
		tiposEntrada: [
			...borrador.tiposEntrada,
			tipoVacio(`t${borrador.secuencia}`)
		],
		secuencia: borrador.secuencia + 1
	};
}

/**
 * Quita un tipo de entrada; si es el único, devuelve el mismo borrador.
 * @param {BorradorEvento} borrador Borrador actual.
 * @param {string} clave Clave del tipo.
 * @returns {BorradorEvento} Borrador nuevo (o el mismo).
 */
export function quitarTipo(borrador, clave) {
	if (borrador.tiposEntrada.length <= 1) return borrador;
	return {
		...borrador,
		tiposEntrada: borrador.tiposEntrada.filter((t) => t.clave !== clave)
	};
}

/**
 * Actualiza campos de un tipo de entrada.
 * @param {BorradorEvento} borrador Borrador actual.
 * @param {string} clave Clave del tipo.
 * @param {Partial<TipoEntradaBorrador>} cambios Campos a reemplazar.
 * @returns {BorradorEvento} Borrador nuevo.
 */
export function actualizarTipo(borrador, clave, cambios) {
	return {
		...borrador,
		tiposEntrada: borrador.tiposEntrada.map((t) =>
			t.clave === clave ? { ...t, ...cambios, clave } : t
		)
	};
}

/**
 * Agrega un campo de imagen vacío (hasta {@link MAX_IMAGENES}).
 * @param {BorradorEvento} borrador Borrador actual.
 * @returns {BorradorEvento} Borrador nuevo (o el mismo si ya hay 5).
 */
export function agregarImagen(borrador) {
	if (borrador.multimedia.length >= MAX_IMAGENES) return borrador;
	return {
		...borrador,
		multimedia: [
			...borrador.multimedia,
			{ clave: `i${borrador.secuencia}`, url: '' }
		],
		secuencia: borrador.secuencia + 1
	};
}

/**
 * Quita una imagen.
 * @param {BorradorEvento} borrador Borrador actual.
 * @param {string} clave Clave de la imagen.
 * @returns {BorradorEvento} Borrador nuevo.
 */
export function quitarImagen(borrador, clave) {
	return {
		...borrador,
		multimedia: borrador.multimedia.filter((i) => i.clave !== clave)
	};
}

/**
 * Cambia la URL de una imagen.
 * @param {BorradorEvento} borrador Borrador actual.
 * @param {string} clave Clave de la imagen.
 * @param {string} url URL escrita.
 * @returns {BorradorEvento} Borrador nuevo.
 */
export function actualizarImagen(borrador, clave, url) {
	return {
		...borrador,
		multimedia: borrador.multimedia.map((i) =>
			i.clave === clave ? { ...i, url } : i
		)
	};
}

/**
 * Rutas de todos los campos validables del borrador.
 * @param {BorradorEvento} borrador Borrador actual.
 * @returns {string[]} Rutas (`nombre`, `tiposEntrada.<clave>.precio`, …).
 */
export function rutasCampos(borrador) {
	return [
		'nombre',
		'descripcion',
		'categoriaId',
		'fecha',
		'hora',
		...borrador.multimedia.map((i) => `multimedia.${i.clave}`),
		...borrador.tiposEntrada.flatMap((t) =>
			CAMPOS_TIPO.map((campo) => `tiposEntrada.${t.clave}.${campo}`)
		)
	];
}

/**
 * Marca un campo como tocado (ya se puede mostrar su error).
 * @param {BorradorEvento} borrador Borrador actual.
 * @param {string} ruta Ruta del campo.
 * @returns {BorradorEvento} Borrador nuevo.
 */
export function marcarTocado(borrador, ruta) {
	if (borrador.tocados.has(ruta)) return borrador;
	const tocados = new Set(borrador.tocados);
	tocados.add(ruta);
	return { ...borrador, tocados };
}

/**
 * Marca todos los campos como tocados (al publicar).
 * @param {BorradorEvento} borrador Borrador actual.
 * @returns {BorradorEvento} Borrador nuevo.
 */
export function marcarTodos(borrador) {
	return { ...borrador, tocados: new Set(rutasCampos(borrador)) };
}

/**
 * Inserta las barras de `DD/MM/AAAA` mientras se escribe.
 * @param {string} texto Texto escrito.
 * @returns {string} Texto con máscara (máximo 8 dígitos).
 */
export function enmascararFecha(texto) {
	const d = String(texto ?? '')
		.replace(/\D/g, '')
		.slice(0, 8);
	if (d.length <= 2) return d;
	if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
	return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * Inserta los dos puntos de `HH:MM` mientras se escribe.
 * @param {string} texto Texto escrito.
 * @returns {string} Texto con máscara (máximo 4 dígitos).
 */
export function enmascararHora(texto) {
	const d = String(texto ?? '')
		.replace(/\D/g, '')
		.slice(0, 4);
	return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

/**
 * Indica si la fecha tiene el formato `DD/MM/AAAA` y existe en el calendario.
 * @param {string} fecha Fecha escrita.
 * @returns {'formato'|'inexistente'|null} Tipo de error, o `null` si es válida.
 */
function errorFecha(fecha) {
	const m = RE_FECHA.exec(fecha);
	if (!m) return 'formato';
	const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const f = new Date(a, mes - 1, d);
	return f.getFullYear() === a && f.getMonth() === mes - 1 && f.getDate() === d
		? null
		: 'inexistente';
}

/**
 * Indica si la hora tiene el formato `HH:MM` en 24 h.
 * @param {string} hora Hora escrita.
 * @returns {boolean} `true` si es válida.
 */
function horaValida(hora) {
	const m = RE_HORA.exec(hora);
	return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

/**
 * Arma la fecha local de `DD/MM/AAAA` + `HH:MM` (research R4).
 * @param {string} fecha Fecha escrita.
 * @param {string} hora Hora escrita.
 * @returns {Date|null} Fecha local, o `null` si el formato o el calendario son inválidos.
 */
export function aFechaLocal(fecha, hora) {
	if (errorFecha(fecha) || !horaValida(hora)) return null;
	const [d, mes, a] = fecha.split('/').map(Number);
	const [hh, mm] = hora.split(':').map(Number);
	return new Date(a, mes - 1, d, hh, mm);
}

/**
 * Convierte el precio escrito en número: dígitos con hasta 2 decimales
 * separados por coma o punto. Nunca interpreta puntos de miles (research R5).
 * @param {string} texto Precio escrito.
 * @returns {number|null} Precio, o `null` si el formato no es válido.
 */
export function aNumeroPrecio(texto) {
	const s = String(texto ?? '').trim();
	if (!RE_PRECIO.test(s)) return null;
	return Number(s.replace(',', '.'));
}

/**
 * Valida un campo del tipo de entrada.
 * @param {TipoEntradaBorrador} tipo Tipo de entrada.
 * @param {string} campo `nombre`, `descripcion`, `precio` o `cupo`.
 * @returns {string|null} Mensaje accionable, o `null`.
 */
function validarCampoTipo(tipo, campo) {
	switch (campo) {
		case 'nombre':
			return tipo.nombre.trim()
				? null
				: 'Poné un nombre, por ejemplo General o VIP.';
		case 'descripcion':
			return tipo.descripcion.trim()
				? null
				: 'Describí qué incluye esta entrada.';
		case 'precio': {
			if (!tipo.precio.trim()) return 'Ingresá un precio (0 si es gratis).';
			const n = aNumeroPrecio(tipo.precio);
			if (n === null)
				return 'Escribí el precio solo con números, sin puntos de miles (por ejemplo 1500 o 1500,50).';
			return n < 0 ? 'El precio no puede ser negativo.' : null;
		}
		case 'cupo': {
			const s = tipo.cupo.trim();
			return RE_CUPO.test(s) && Number(s) > 0
				? null
				: 'El cupo tiene que ser un número entero mayor a 0.';
		}
		default:
			return null;
	}
}

/**
 * Valida un campo del borrador con las reglas del servidor (research R5).
 * @param {BorradorEvento} borrador Borrador actual.
 * @param {string} ruta Ruta del campo (ver {@link rutasCampos}).
 * @param {Date} [ahora] Momento de referencia para "en el futuro".
 * @returns {string|null} Mensaje que explica cómo corregirlo, o `null`.
 */
export function validarCampo(borrador, ruta, ahora = new Date()) {
	const [raiz, clave, campo] = ruta.split('.');
	switch (raiz) {
		case 'nombre':
			return borrador.nombre.trim() ? null : 'Escribí el nombre del evento.';
		case 'descripcion':
			return borrador.descripcion.trim()
				? null
				: 'Contá de qué se trata el evento.';
		case 'categoriaId':
			return borrador.categoriaId
				? null
				: 'Elegí una categoría o creá una nueva.';
		case 'fecha': {
			const e = errorFecha(borrador.fecha);
			if (e === 'formato') return 'Usá el formato DD/MM/AAAA.';
			if (e === 'inexistente') return 'La fecha no existe.';
			const f = aFechaLocal(borrador.fecha, borrador.hora);
			if (f && f.getTime() <= ahora.getTime())
				return 'Elegí una fecha y hora futuras.';
			return null;
		}
		case 'hora':
			return horaValida(borrador.hora) ? null : 'Usá el formato HH:MM (24 h).';
		case 'multimedia': {
			const img = borrador.multimedia.find((i) => i.clave === clave);
			const url = img?.url.trim() ?? '';
			return !url || RE_URL.test(url)
				? null
				: 'Pegá una dirección que empiece con https://';
		}
		case 'tiposEntrada': {
			const tipo = borrador.tiposEntrada.find((t) => t.clave === clave);
			return tipo ? validarCampoTipo(tipo, campo) : null;
		}
		default:
			return null;
	}
}

/**
 * Valida todo el borrador.
 * @param {BorradorEvento} borrador Borrador actual.
 * @param {Date} [ahora] Momento de referencia.
 * @returns {{valido: boolean, errores: Record<string, string>}} Resultado y mensajes por ruta.
 */
export function validarFormulario(borrador, ahora = new Date()) {
	const errores = {};
	for (const ruta of rutasCampos(borrador)) {
		const error = validarCampo(borrador, ruta, ahora);
		if (error) errores[ruta] = error;
	}
	return { valido: Object.keys(errores).length === 0, errores };
}

/**
 * Arma el cuerpo de `crearEvento` (data-model.md §1). Requiere un borrador válido.
 * @param {BorradorEvento} borrador Borrador validado.
 * @returns {CuerpoCrearEvento} Cuerpo JSON (sin claves locales ni organizador).
 */
export function aCuerpoEvento(borrador) {
	return {
		nombre: borrador.nombre.trim(),
		descripcion: borrador.descripcion.trim(),
		categoriaId: borrador.categoriaId,
		fecha: aFechaLocal(borrador.fecha, borrador.hora).toISOString(),
		tiposEntrada: borrador.tiposEntrada.map((t) => ({
			nombre: t.nombre.trim(),
			descripcion: t.descripcion.trim(),
			precio: aNumeroPrecio(t.precio),
			cupo: Number(t.cupo.trim())
		})),
		multimedia: borrador.multimedia
			.map((i) => i.url.trim())
			.filter((url) => url !== '')
	};
}

/**
 * Mensaje del banner cuando falla la publicación (research R13). El 401 lo
 * maneja la capa de servicios.
 * @param {{status?: number, message?: string}|null} error `ApiError` recibido.
 * @returns {string} Mensaje accionable.
 */
export function mensajeErrorPublicar(error) {
	switch (error?.status) {
		case 400:
			return `Revisá los datos: ${error.message ?? ''}`.trim();
		case 404:
			return 'La categoría elegida ya no existe. Elegí otra.';
		case 0:
			return 'Sin conexión. Tus datos siguen acá.';
		default:
			return 'No pudimos publicar el evento. Intentá de nuevo.';
	}
}

/**
 * Valida el alta rápida de categoría (reglas de `backend/src/dto/categoria.js`).
 * @param {{nombre: string, descripcion: string}} datos Datos escritos.
 * @returns {{nombre?: string, descripcion?: string}} Mensajes por campo (`{}` si es válida).
 */
export function validarCategoria({ nombre, descripcion }) {
	const errores = {};
	if (!String(nombre ?? '').trim())
		errores.nombre = 'Escribí el nombre de la categoría.';
	if (!String(descripcion ?? '').trim())
		errores.descripcion = 'Escribí una descripción de la categoría.';
	return errores;
}
