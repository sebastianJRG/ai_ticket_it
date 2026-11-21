import {
	aDetalle,
	aTipoEntradaVista,
	modoCta,
	textoCta,
	textoPrecioDesde
} from '../../src/eventos/detalle';
import { COMPRADOR, ORGANIZADOR } from '../helpers/authFalso';
import { AHORA, crearEvento } from '../helpers/eventosEjemplo';
import { TIPOS_CHECKOUT } from '../helpers/comprasEjemplo';

const [GENERAL, PLATEA, INVITACION, AGOTADA] = TIPOS_CHECKOUT;

describe('aTipoEntradaVista (data-model.md §6)', () => {
	it('copia los datos del tipo y formatea el precio', () => {
		expect(aTipoEntradaVista(GENERAL)).toEqual({
			id: 'te-gen',
			nombre: 'General',
			descripcion: 'Campo',
			precio: 25000,
			precioTexto: '$\u00a025.000',
			cupo: 100,
			agotado: false
		});
	});

	it('precio 0 → "Gratis"', () => {
		expect(aTipoEntradaVista(INVITACION).precioTexto).toBe('Gratis');
	});

	it('cupo 0 → agotado', () => {
		expect(aTipoEntradaVista(AGOTADA).agotado).toBe(true);
		expect(aTipoEntradaVista(PLATEA).agotado).toBe(false);
	});

	it('descripción ausente → cadena vacía', () => {
		const { descripcion, ...sinDescripcion } = GENERAL;
		expect(descripcion).toBe('Campo');
		expect(aTipoEntradaVista(sinDescripcion).descripcion).toBe('');
	});
});

describe('textoPrecioDesde', () => {
	it('mínimo de los tipos con "desde"', () => {
		expect(textoPrecioDesde([PLATEA, GENERAL])).toBe('desde $\u00a025.000');
	});

	it('todos gratis → "Gratis"', () => {
		expect(textoPrecioDesde([INVITACION, { ...INVITACION, id: 'x' }])).toBe(
			'Gratis'
		);
	});

	it('mínimo 0 con otros pagos → "desde $\u00a00"', () => {
		expect(textoPrecioDesde([GENERAL, INVITACION])).toBe('desde $\u00a00');
	});

	it('sin tipos → cadena vacía', () => {
		expect(textoPrecioDesde([])).toBe('');
		expect(textoPrecioDesde(undefined)).toBe('');
	});
});

describe('aDetalle (data-model.md §5)', () => {
	const evento = crearEvento({
		id: 'ev-det',
		nombre: 'Gran recital',
		descripcion: 'Una noche única',
		fecha: new Date(2026, 11, 12, 21, 0).toISOString(),
		tiposEntrada: [PLATEA, GENERAL],
		multimedia: ['https://ejemplo.com/a.jpg'],
		puntajeOrganizador: 4.5
	});

	it('deriva la fecha larga, la descripción y el precio desde', () => {
		const d = aDetalle(evento, { ahora: AHORA });
		expect(d.fechaLarga).toBe('Sábado 12 de diciembre de 2026 · 21:00 h');
		expect(d.descripcion).toBe('Una noche única');
		expect(d.precioDesdeTexto).toBe('desde $\u00a025.000');
		expect(d.organizadorId).toBe('org-1');
	});

	it('tipos en el orden recibido, como TipoEntradaVista', () => {
		const d = aDetalle(evento, { ahora: AHORA });
		expect(d.tipos.map((t) => t.nombre)).toEqual(['Platea', 'General']);
		expect(d.tipos[0].precioTexto).toBe('$\u00a040.000');
	});

	it('hereda los campos de la tarjeta (imagen, paleta, finalizado, puntaje)', () => {
		const d = aDetalle(evento, { ahora: AHORA });
		expect(d.id).toBe('ev-det');
		expect(d.nombre).toBe('Gran recital');
		expect(d.imagen).toBe('https://ejemplo.com/a.jpg');
		expect(d.paleta).toEqual(
			expect.objectContaining({ fondo: expect.any(String) })
		);
		expect(d.finalizado).toBe(false);
		expect(d.puntaje).toBe(4.5);
		expect(d.categoria).toBe('Recitales');
	});

	it('evento pasado → finalizado', () => {
		const pasado = { ...evento, fecha: new Date(2026, 10, 1).toISOString() };
		expect(aDetalle(pasado, { ahora: AHORA }).finalizado).toBe(true);
	});

	it('no lanza con datos incompletos', () => {
		const d = aDetalle({}, { ahora: AHORA });
		expect(d.fechaLarga).toBe('');
		expect(d.descripcion).toBe('');
		expect(d.tipos).toEqual([]);
		expect(d.precioDesdeTexto).toBe('');
		expect(d.organizadorId).toBeNull();
	});
});

describe('modoCta (data-model.md §7) — US1', () => {
	const futuro = crearEvento({ tiposEntrada: [GENERAL, PLATEA] });
	const pasado = crearEvento({
		fecha: new Date(2026, 10, 1).toISOString(),
		tiposEntrada: [GENERAL]
	});

	it('COMPRADOR con evento futuro → comprar', () => {
		expect(modoCta(futuro, COMPRADOR, AHORA)).toBe('comprar');
	});

	it('visitante con evento futuro → pedirSesion', () => {
		expect(modoCta(futuro, null, AHORA)).toBe('pedirSesion');
	});

	it('ORGANIZADOR → oculto, aunque el evento ya haya ocurrido', () => {
		expect(modoCta(futuro, ORGANIZADOR, AHORA)).toBe('oculto');
		expect(modoCta(pasado, ORGANIZADOR, AHORA)).toBe('oculto');
	});

	it('evento ya ocurrido → finalizado (antes que pedir sesión)', () => {
		expect(modoCta(pasado, null, AHORA)).toBe('finalizado');
		expect(modoCta(pasado, COMPRADOR, AHORA)).toBe('finalizado');
	});

	it('sin tipos o todos con cupo 0 → sinEntradas', () => {
		expect(modoCta(crearEvento({ tiposEntrada: [] }), COMPRADOR, AHORA)).toBe(
			'sinEntradas'
		);
		expect(modoCta(crearEvento({ tiposEntrada: [AGOTADA] }), null, AHORA)).toBe(
			'sinEntradas'
		);
	});
});

describe('textoCta — US1', () => {
	it('comprar y pedirSesion muestran el precio desde', () => {
		expect(textoCta('comprar', 'desde $\u00a025.000')).toBe(
			'Comprar entradas · desde $\u00a025.000'
		);
		expect(textoCta('pedirSesion', 'Gratis')).toBe('Comprar entradas · Gratis');
	});

	it('finalizado y sinEntradas', () => {
		expect(textoCta('finalizado', 'x')).toBe('Evento finalizado');
		expect(textoCta('sinEntradas', 'x')).toBe('Sin entradas a la venta');
	});

	it('oculto → cadena vacía', () => {
		expect(textoCta('oculto', 'x')).toBe('');
	});
});
