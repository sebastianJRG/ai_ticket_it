import {
	PESTANAS_COMPRAS,
	agruparPorPestana,
	cuerpoCancelacion,
	esCancelable,
	mensajeErrorCancelacion,
	mensajeErrorListado,
	pasosLinea,
	pestanaDeEstado
} from '../../src/compras/misCompras';
import {
	COMPRAS_POR_ESTADO,
	crearCompraListado
} from '../helpers/comprasEjemplo';
import { AHORA } from '../helpers/eventosEjemplo';
import { formatPrice } from '../../src/theme/format';

const ids = (lista) => lista.map((c) => c.id);

describe('PESTANAS_COMPRAS (data-model.md §2)', () => {
	it('define claves, etiquetas, estados y textos de vacío', () => {
		expect(PESTANAS_COMPRAS).toEqual([
			{
				clave: 'activas',
				etiqueta: 'Activas',
				estados: ['PENDIENTE', 'CONFIRMADA'],
				vacio: 'No tenés compras activas'
			},
			{
				clave: 'pasadas',
				etiqueta: 'Pasadas',
				estados: ['UTILIZADA'],
				vacio: 'No tenés compras pasadas'
			},
			{
				clave: 'canceladas',
				etiqueta: 'Canceladas',
				estados: ['CANCELADA', 'REEMBOLSADA'],
				vacio: 'No tenés compras canceladas'
			}
		]);
	});
});

describe('pestanaDeEstado', () => {
	it.each([
		['PENDIENTE', 'activas'],
		['CONFIRMADA', 'activas'],
		['UTILIZADA', 'pasadas'],
		['CANCELADA', 'canceladas'],
		['REEMBOLSADA', 'canceladas'],
		['OTRO', null],
		[undefined, null]
	])('%s → %s', (estado, pestana) => {
		expect(pestanaDeEstado(estado)).toBe(pestana);
	});
});

describe('agruparPorPestana (SC-001)', () => {
	it('pone cada compra en exactamente una pestaña, la más reciente primero', () => {
		const g = agruparPorPestana(COMPRAS_POR_ESTADO);
		expect(ids(g.activas)).toEqual(['c-con0', 'c-con3', 'c-pen']);
		expect(ids(g.pasadas)).toEqual(['c-uti2', 'c-uti1']);
		expect(ids(g.canceladas)).toEqual(['c-ree', 'c-can']);
		const todas = [...g.activas, ...g.pasadas, ...g.canceladas];
		expect(todas).toHaveLength(COMPRAS_POR_ESTADO.length);
		expect(new Set(ids(todas)).size).toBe(COMPRAS_POR_ESTADO.length);
	});

	it('no modifica la lista recibida', () => {
		const copia = [...COMPRAS_POR_ESTADO];
		agruparPorPestana(COMPRAS_POR_ESTADO);
		expect(COMPRAS_POR_ESTADO).toEqual(copia);
	});

	it('ignora estados desconocidos', () => {
		const g = agruparPorPestana([
			crearCompraListado({ id: 'x', estado: 'RARO' })
		]);
		expect(g).toEqual({ activas: [], pasadas: [], canceladas: [] });
	});

	it.each([[[]], [null], [undefined]])(
		'con %p devuelve listas vacías',
		(entrada) => {
			expect(agruparPorPestana(entrada)).toEqual({
				activas: [],
				pasadas: [],
				canceladas: []
			});
		}
	);
});

describe('mensajeErrorListado', () => {
	it('sin conexión', () => {
		expect(mensajeErrorListado({ status: 0 })).toEqual({
			titulo: 'Sin conexión',
			cuerpo: 'Revisá tu conexión e intentá de nuevo.'
		});
	});

	it('otro error', () => {
		expect(mensajeErrorListado({ status: 500 })).toEqual({
			titulo: 'No pudimos cargar tus compras',
			cuerpo: 'Intentá de nuevo en unos segundos.'
		});
	});
});

describe('esCancelable (data-model.md §3; SC-004)', () => {
	const en = (ms) => new Date(AHORA.getTime() + ms).toISOString();
	const compra = (estado, ms) =>
		crearCompraListado({
			estado,
			evento: { id: 'e', nombre: 'E', fecha: en(ms) }
		});

	it.each(['PENDIENTE', 'CONFIRMADA'])(
		'%s con evento futuro → true',
		(estado) => {
			expect(esCancelable(compra(estado, 60 * 1000), AHORA)).toBe(true);
		}
	);

	it.each(['UTILIZADA', 'CANCELADA', 'REEMBOLSADA'])('%s → false', (estado) => {
		expect(esCancelable(compra(estado, 86400000), AHORA)).toBe(false);
	});

	it('evento ya ocurrido o exactamente ahora → false', () => {
		expect(esCancelable(compra('CONFIRMADA', -1000), AHORA)).toBe(false);
		expect(esCancelable(compra('PENDIENTE', 0), AHORA)).toBe(false);
	});

	it('sin compra o sin fecha válida → false', () => {
		expect(esCancelable(null, AHORA)).toBe(false);
		expect(
			esCancelable(
				crearCompraListado({ evento: { id: 'e', nombre: 'E', fecha: 'x' } }),
				AHORA
			)
		).toBe(false);
	});

	it('con COMPRAS_POR_ESTADO solo las activas futuras son cancelables', () => {
		const cancelables = COMPRAS_POR_ESTADO.filter((c) =>
			esCancelable(c, AHORA)
		);
		expect(cancelables.map((c) => c.id)).toEqual(['c-pen', 'c-con3', 'c-con0']);
	});
});

describe('cuerpoCancelacion', () => {
	it('explica cantidad × tipo, evento, total y reembolso', () => {
		const texto = cuerpoCancelacion(
			crearCompraListado({
				evento: { id: 'e', nombre: 'Gran recital', fecha: AHORA.toISOString() },
				cantidad: 2,
				tipoEntrada: { id: 't', nombre: 'Platea', precio: 40000 },
				total: 80000
			})
		);
		expect(texto).toBe(
			`Vas a cancelar 2 × Platea de «Gran recital» por ${formatPrice(80000)}. El organizador gestiona el reembolso.`
		);
	});
});

describe('mensajeErrorCancelacion (research R6)', () => {
	it('400 usa el mensaje del servidor', () => {
		expect(
			mensajeErrorCancelacion({ status: 400, message: 'El evento ya ocurrió.' })
		).toEqual({
			titulo: 'No se puede cancelar esta compra',
			cuerpo: 'El evento ya ocurrió.'
		});
	});

	it.each([
		[403, 'No podés cancelar esta compra'],
		[404, 'Esta compra ya no existe'],
		[0, 'Sin conexión'],
		[500, 'No pudimos cancelar la compra']
	])('%i → "%s"', (status, titulo) => {
		const m = mensajeErrorCancelacion({ status, message: 'x' });
		expect(m.titulo).toBe(titulo);
		expect(typeof m.cuerpo).toBe('string');
	});

	it('sin error usa el genérico', () => {
		expect(mensajeErrorCancelacion(null).titulo).toBe(
			'No pudimos cancelar la compra'
		);
	});
});

describe('pasosLinea (data-model.md §4 › PasoLinea)', () => {
	const P = (estado, situacion) => ({ estado, situacion });
	it.each([
		[
			'PENDIENTE',
			[
				P('PENDIENTE', 'actual'),
				P('CONFIRMADA', 'pendiente'),
				P('UTILIZADA', 'pendiente')
			]
		],
		[
			'CONFIRMADA',
			[
				P('PENDIENTE', 'hecho'),
				P('CONFIRMADA', 'actual'),
				P('UTILIZADA', 'pendiente')
			]
		],
		[
			'UTILIZADA',
			[
				P('PENDIENTE', 'hecho'),
				P('CONFIRMADA', 'hecho'),
				P('UTILIZADA', 'actual')
			]
		],
		['CANCELADA', [P('PENDIENTE', 'hecho'), P('CANCELADA', 'actual')]],
		[
			'REEMBOLSADA',
			[
				P('PENDIENTE', 'hecho'),
				P('CONFIRMADA', 'hecho'),
				P('REEMBOLSADA', 'actual')
			]
		]
	])('%s', (estado, pasos) => {
		const r = pasosLinea(estado);
		expect(r).toEqual(pasos);
		expect(r.filter((p) => p.situacion === 'actual')).toHaveLength(1);
	});

	it('estado desconocido → []', () => {
		expect(pasosLinea('RARO')).toEqual([]);
		expect(pasosLinea(undefined)).toEqual([]);
	});
});
