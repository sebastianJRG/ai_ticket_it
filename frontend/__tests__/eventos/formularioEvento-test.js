import {
	MAX_IMAGENES,
	borradorInicial,
	agregarTipo,
	quitarTipo,
	actualizarTipo,
	agregarImagen,
	quitarImagen,
	actualizarImagen,
	enmascararFecha,
	enmascararHora,
	aFechaLocal,
	aNumeroPrecio,
	validarCampo,
	validarFormulario,
	aCuerpoEvento,
	mensajeErrorPublicar,
	validarCategoria,
	marcarTocado,
	marcarTodos
} from '../../src/eventos/formularioEvento';
import { ApiError } from '../../src/services/api';
import { AHORA } from '../helpers/eventosEjemplo';

/** Borrador válido con 2 tipos de entrada (20/12/2026 21:30, futuro respecto de AHORA). */
function borradorValido() {
	let b = borradorInicial();
	b = { ...b, nombre: '  Noche de jazz ', descripcion: ' Jazz en vivo ' };
	b = { ...b, categoriaId: 'cat-rec', fecha: '20/12/2026', hora: '21:30' };
	const [t1] = b.tiposEntrada;
	b = actualizarTipo(b, t1.clave, {
		nombre: ' General ',
		descripcion: 'De pie',
		precio: '0',
		cupo: '200'
	});
	b = agregarTipo(b);
	const t2 = b.tiposEntrada[1];
	b = actualizarTipo(b, t2.clave, {
		nombre: 'VIP',
		descripcion: 'Mesa',
		precio: '15000,50',
		cupo: '20'
	});
	b = agregarImagen(b);
	b = actualizarImagen(b, b.multimedia[0].clave, ' https://x.com/a.jpg ');
	b = agregarImagen(b);
	return b;
}

describe('borrador (data-model.md §2)', () => {
	it('borradorInicial trae un tipo vacío y campos vacíos', () => {
		const b = borradorInicial();
		expect(b.nombre).toBe('');
		expect(b.descripcion).toBe('');
		expect(b.categoriaId).toBeNull();
		expect(b.fecha).toBe('');
		expect(b.hora).toBe('');
		expect(b.multimedia).toEqual([]);
		expect(b.tiposEntrada).toHaveLength(1);
		expect(b.tiposEntrada[0]).toEqual(
			expect.objectContaining({
				nombre: '',
				descripcion: '',
				precio: '',
				cupo: ''
			})
		);
		expect(b.tocados.size).toBe(0);
	});

	it('agregarTipo usa claves nuevas que no se repiten', () => {
		let b = borradorInicial();
		b = agregarTipo(agregarTipo(b));
		const claves = b.tiposEntrada.map((t) => t.clave);
		expect(new Set(claves).size).toBe(3);
		b = quitarTipo(b, claves[2]);
		b = agregarTipo(b);
		expect(b.tiposEntrada.map((t) => t.clave)).not.toContain(claves[2]);
	});

	it('agregar un tercero y quitar el segundo deja el 1.º y el 3.º (US1-1)', () => {
		let b = agregarTipo(agregarTipo(borradorInicial()));
		const [c1, c2, c3] = b.tiposEntrada.map((t) => t.clave);
		b = quitarTipo(b, c2);
		expect(b.tiposEntrada.map((t) => t.clave)).toEqual([c1, c3]);
	});

	it('quitarTipo sobre el único tipo devuelve el mismo borrador', () => {
		const b = borradorInicial();
		expect(quitarTipo(b, b.tiposEntrada[0].clave)).toBe(b);
	});

	it('actualizarTipo no muta el borrador original', () => {
		const b = borradorInicial();
		const clave = b.tiposEntrada[0].clave;
		const b2 = actualizarTipo(b, clave, { nombre: 'VIP' });
		expect(b.tiposEntrada[0].nombre).toBe('');
		expect(b2.tiposEntrada[0].nombre).toBe('VIP');
	});

	it('agregarImagen no pasa de MAX_IMAGENES (5); quitarImagen la saca', () => {
		expect(MAX_IMAGENES).toBe(5);
		let b = borradorInicial();
		for (let i = 0; i < 7; i += 1) b = agregarImagen(b);
		expect(b.multimedia).toHaveLength(5);
		b = quitarImagen(b, b.multimedia[0].clave);
		expect(b.multimedia).toHaveLength(4);
	});

	it('marcarTocado y marcarTodos registran las rutas de campo', () => {
		let b = borradorInicial();
		b = marcarTocado(b, 'nombre');
		expect(b.tocados.has('nombre')).toBe(true);
		const clave = b.tiposEntrada[0].clave;
		b = marcarTodos(b);
		expect(b.tocados.has(`tiposEntrada.${clave}.cupo`)).toBe(true);
		expect(b.tocados.has('fecha')).toBe(true);
	});
});

describe('máscaras y conversión (research R4, R5)', () => {
	it('enmascara fecha y hora mientras se escribe', () => {
		expect(enmascararFecha('20122026')).toBe('20/12/2026');
		expect(enmascararFecha('201')).toBe('20/1');
		expect(enmascararFecha('20/12/20269')).toBe('20/12/2026');
		expect(enmascararHora('2130')).toBe('21:30');
		expect(enmascararHora('9')).toBe('9');
		expect(enmascararHora('21:305')).toBe('21:30');
	});

	it('aFechaLocal arma la fecha local o devuelve null', () => {
		expect(aFechaLocal('20/12/2026', '21:30')).toEqual(
			new Date(2026, 11, 20, 21, 30)
		);
		expect(aFechaLocal('31/02/2027', '10:00')).toBeNull();
		expect(aFechaLocal('2026-12-20', '10:00')).toBeNull();
		expect(aFechaLocal('20/12/2026', '25:00')).toBeNull();
		expect(aFechaLocal('20/12/2026', '')).toBeNull();
	});

	it('aNumeroPrecio acepta enteros y hasta 2 decimales, sin puntos de miles', () => {
		expect(aNumeroPrecio('0')).toBe(0);
		expect(aNumeroPrecio('1500,50')).toBe(1500.5);
		expect(aNumeroPrecio('1500.50')).toBe(1500.5);
		expect(aNumeroPrecio(' 1500 ')).toBe(1500);
		expect(aNumeroPrecio('-1')).toBe(-1);
		expect(aNumeroPrecio('abc')).toBeNull();
		expect(aNumeroPrecio('1.500,00')).toBeNull();
		expect(aNumeroPrecio('1.500')).toBeNull();
		expect(aNumeroPrecio('1500,505')).toBeNull();
		expect(aNumeroPrecio('')).toBeNull();
	});
});

describe('validarCampo: paridad con backend/src/dto/evento.js (research R5)', () => {
	const conCampo = (cambios) => ({ ...borradorValido(), ...cambios });
	const tipoCon = (cambios) => {
		const b = borradorValido();
		const clave = b.tiposEntrada[0].clave;
		return [actualizarTipo(b, clave, cambios), clave];
	};

	it.each([
		['nombre', { nombre: '' }, 'Escribí el nombre del evento.'],
		['nombre', { nombre: '   ' }, 'Escribí el nombre del evento.'],
		['descripcion', { descripcion: ' ' }, 'Contá de qué se trata el evento.'],
		[
			'categoriaId',
			{ categoriaId: null },
			'Elegí una categoría o creá una nueva.'
		],
		['fecha', { fecha: '2026-12-20' }, 'Usá el formato DD/MM/AAAA.'],
		['fecha', { fecha: '31/02/2027' }, 'La fecha no existe.'],
		[
			'fecha',
			{ fecha: '02/12/2026', hora: '12:00' },
			'Elegí una fecha y hora futuras.'
		],
		['fecha', { fecha: '01/01/2020' }, 'Elegí una fecha y hora futuras.'],
		['hora', { hora: '9' }, 'Usá el formato HH:MM (24 h).'],
		['hora', { hora: '24:00' }, 'Usá el formato HH:MM (24 h).']
	])('%s inválido %o → mensaje', (ruta, cambios, mensaje) => {
		expect(validarCampo(conCampo(cambios), ruta, AHORA)).toBe(mensaje);
	});

	it('con hora de formato inválido no marca la fecha como pasada', () => {
		expect(validarCampo(conCampo({ hora: 'x' }), 'fecha', AHORA)).toBeNull();
	});

	it.each([
		['nombre', { nombre: ' ' }, 'Poné un nombre, por ejemplo General o VIP.'],
		['descripcion', { descripcion: '' }, 'Describí qué incluye esta entrada.'],
		['precio', { precio: '' }, 'Ingresá un precio (0 si es gratis).'],
		['precio', { precio: '-1' }, 'El precio no puede ser negativo.'],
		[
			'precio',
			{ precio: '1.500' },
			'Escribí el precio solo con números, sin puntos de miles (por ejemplo 1500 o 1500,50).'
		],
		[
			'cupo',
			{ cupo: '0' },
			'El cupo tiene que ser un número entero mayor a 0.'
		],
		[
			'cupo',
			{ cupo: '1,5' },
			'El cupo tiene que ser un número entero mayor a 0.'
		],
		[
			'cupo',
			{ cupo: 'abc' },
			'El cupo tiene que ser un número entero mayor a 0.'
		],
		['cupo', { cupo: '' }, 'El cupo tiene que ser un número entero mayor a 0.']
	])('tipo.%s inválido %o → mensaje', (campo, cambios, mensaje) => {
		const [b, clave] = tipoCon(cambios);
		expect(validarCampo(b, `tiposEntrada.${clave}.${campo}`, AHORA)).toBe(
			mensaje
		);
	});

	it('precio 0 y cupo 1 son válidos', () => {
		const [b, clave] = tipoCon({ precio: '0', cupo: '1' });
		expect(validarCampo(b, `tiposEntrada.${clave}.precio`, AHORA)).toBeNull();
		expect(validarCampo(b, `tiposEntrada.${clave}.cupo`, AHORA)).toBeNull();
	});

	it('URL de imagen: vacía se ignora, ftp:// es inválida', () => {
		const b = borradorValido();
		const [conUrl, vacia] = b.multimedia;
		expect(validarCampo(b, `multimedia.${conUrl.clave}`, AHORA)).toBeNull();
		expect(validarCampo(b, `multimedia.${vacia.clave}`, AHORA)).toBeNull();
		const mala = actualizarImagen(b, vacia.clave, 'ftp://x');
		expect(validarCampo(mala, `multimedia.${vacia.clave}`, AHORA)).toBe(
			'Pegá una dirección que empiece con https://'
		);
	});
});

describe('validarFormulario', () => {
	it('borrador válido → valido sin errores', () => {
		expect(validarFormulario(borradorValido(), AHORA)).toEqual({
			valido: true,
			errores: {}
		});
	});

	it('borrador inicial → error en cada campo obligatorio', () => {
		const b = borradorInicial();
		const clave = b.tiposEntrada[0].clave;
		const { valido, errores } = validarFormulario(b, AHORA);
		expect(valido).toBe(false);
		expect(Object.keys(errores).sort()).toEqual(
			[
				'nombre',
				'descripcion',
				'categoriaId',
				'fecha',
				'hora',
				`tiposEntrada.${clave}.nombre`,
				`tiposEntrada.${clave}.descripcion`,
				`tiposEntrada.${clave}.precio`,
				`tiposEntrada.${clave}.cupo`
			].sort()
		);
	});
});

describe('aCuerpoEvento', () => {
	it('arma el cuerpo exacto de crearEvento', () => {
		const cuerpo = aCuerpoEvento(borradorValido());
		expect(cuerpo).toEqual({
			nombre: 'Noche de jazz',
			descripcion: 'Jazz en vivo',
			categoriaId: 'cat-rec',
			fecha: new Date(2026, 11, 20, 21, 30).toISOString(),
			tiposEntrada: [
				{ nombre: 'General', descripcion: 'De pie', precio: 0, cupo: 200 },
				{ nombre: 'VIP', descripcion: 'Mesa', precio: 15000.5, cupo: 20 }
			],
			multimedia: ['https://x.com/a.jpg']
		});
		expect(cuerpo.fecha.endsWith('Z')).toBe(true);
		expect(JSON.stringify(cuerpo)).not.toMatch(/clave|organizadorId|tocados/);
	});
});

describe('mensajes', () => {
	it('mensajeErrorPublicar por estado (research R13)', () => {
		expect(
			mensajeErrorPublicar(
				new ApiError('La fecha del evento debe ser en el futuro.', 400)
			)
		).toBe('Revisá los datos: La fecha del evento debe ser en el futuro.');
		expect(mensajeErrorPublicar(new ApiError('No existe', 404))).toBe(
			'La categoría elegida ya no existe. Elegí otra.'
		);
		expect(mensajeErrorPublicar(new ApiError('', 0))).toBe(
			'Sin conexión. Tus datos siguen acá.'
		);
		expect(mensajeErrorPublicar(new ApiError('x', 500))).toBe(
			'No pudimos publicar el evento. Intentá de nuevo.'
		);
	});

	it('validarCategoria: nombre y descripción obligatorios', () => {
		expect(validarCategoria({ nombre: ' ', descripcion: '' })).toEqual({
			nombre: 'Escribí el nombre de la categoría.',
			descripcion: 'Escribí una descripción de la categoría.'
		});
		expect(validarCategoria({ nombre: 'Jazz', descripcion: 'Música' })).toEqual(
			{}
		);
	});
});
