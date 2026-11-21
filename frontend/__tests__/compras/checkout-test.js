import {
	ajustarCantidad,
	limitesCantidad,
	mensajeErrorCompra,
	seleccionInicial,
	textoConfirmar,
	totalEstimado
} from '../../src/compras/checkout';
import { aTipoEntradaVista } from '../../src/eventos/detalle';
import { ApiError } from '../../src/services/api';
import { TIPOS_CHECKOUT } from '../helpers/comprasEjemplo';

const [GENERAL, PLATEA, INVITACION, AGOTADA] =
	TIPOS_CHECKOUT.map(aTipoEntradaVista);

describe('seleccionInicial (data-model.md §8)', () => {
	it('un solo tipo disponible → preseleccionado con cantidad 1', () => {
		expect(seleccionInicial([PLATEA])).toEqual({
			tipoId: 'te-pla',
			cantidad: 1
		});
	});

	it('varios tipos disponibles → ninguno elegido', () => {
		expect(seleccionInicial([GENERAL, PLATEA])).toEqual({
			tipoId: null,
			cantidad: 1
		});
	});

	it('uno disponible y uno agotado → el disponible', () => {
		expect(seleccionInicial([AGOTADA, PLATEA]).tipoId).toBe('te-pla');
	});

	it('todos agotados o sin tipos → ninguno', () => {
		expect(seleccionInicial([AGOTADA]).tipoId).toBeNull();
		expect(seleccionInicial([]).tipoId).toBeNull();
	});
});

describe('limitesCantidad y ajustarCantidad (SC-002)', () => {
	it('mínimo 1, máximo el cupo del tipo', () => {
		expect(limitesCantidad(PLATEA)).toEqual({ min: 1, max: 2 });
		expect(limitesCantidad(GENERAL)).toEqual({ min: 1, max: 100 });
	});

	it('nunca supera el cupo ni baja de 1', () => {
		const l = limitesCantidad(PLATEA);
		expect(ajustarCantidad(0, l)).toBe(1);
		expect(ajustarCantidad(-3, l)).toBe(1);
		expect(ajustarCantidad(3, l)).toBe(2);
		expect(ajustarCantidad(2, l)).toBe(2);
	});

	it('trunca valores no enteros', () => {
		expect(ajustarCantidad(1.7, { min: 1, max: 5 })).toBe(1);
		expect(ajustarCantidad(Number.NaN, { min: 1, max: 5 })).toBe(1);
	});
});

describe('totalEstimado', () => {
	it('precio × cantidad', () => {
		expect(totalEstimado(PLATEA, 2)).toBe(80000);
		expect(totalEstimado(INVITACION, 3)).toBe(0);
	});

	it('sin tipo → 0', () => {
		expect(totalEstimado(null, 2)).toBe(0);
	});
});

describe('textoConfirmar', () => {
	it('sin tipo elegido', () => {
		expect(textoConfirmar({ tipo: null, cantidad: 1, finalizado: false })).toBe(
			'Elegí un tipo de entrada'
		);
	});

	it('evento finalizado tiene prioridad', () => {
		expect(
			textoConfirmar({ tipo: PLATEA, cantidad: 2, finalizado: true })
		).toBe('Evento finalizado');
	});

	it('con monto y gratis', () => {
		expect(
			textoConfirmar({ tipo: PLATEA, cantidad: 2, finalizado: false })
		).toBe('Confirmar compra · $ 80.000');
		expect(
			textoConfirmar({ tipo: INVITACION, cantidad: 2, finalizado: false })
		).toBe('Confirmar compra · Gratis');
	});
});

describe('mensajeErrorCompra (research R7)', () => {
	it('409 → título de la spec y cuerpo del servidor; reintentable', () => {
		const m = mensajeErrorCompra(
			new ApiError('Cupo insuficiente: quedan 0 entradas disponibles.', 409)
		);
		expect(m).toEqual({
			titulo: 'No quedan suficientes entradas de este tipo',
			cuerpo: 'Cupo insuficiente: quedan 0 entradas disponibles.',
			bloquea: false
		});
	});

	it('400 → "No pudimos crear la compra" con el mensaje del servidor', () => {
		const m = mensajeErrorCompra(new ApiError('El evento ya ocurrió.', 400));
		expect(m.titulo).toBe('No pudimos crear la compra');
		expect(m.cuerpo).toBe('El evento ya ocurrió.');
		expect(m.bloquea).toBe(false);
	});

	it('403 bloquea', () => {
		const m = mensajeErrorCompra(new ApiError('x', 403));
		expect(m.titulo).toBe('Solo los compradores pueden comprar entradas');
		expect(m.bloquea).toBe(true);
	});

	it('404 bloquea', () => {
		const m = mensajeErrorCompra(new ApiError('x', 404));
		expect(m.titulo).toBe('Este evento o tipo de entrada ya no existe');
		expect(m.bloquea).toBe(true);
	});

	it('0 → "Sin conexión"', () => {
		expect(mensajeErrorCompra(new ApiError('x', 0))).toEqual({
			titulo: 'Sin conexión',
			cuerpo: 'Revisá tu conexión e intentá de nuevo.',
			bloquea: false
		});
	});

	it('otro status → genérico', () => {
		expect(mensajeErrorCompra(new ApiError('x', 500))).toEqual({
			titulo: 'No pudimos crear la compra',
			cuerpo: 'Intentá de nuevo en unos segundos.',
			bloquea: false
		});
		expect(mensajeErrorCompra(null).titulo).toBe('No pudimos crear la compra');
	});
});
