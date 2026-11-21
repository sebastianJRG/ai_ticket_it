import {
	PESTANAS_ORGANIZADOR,
	agruparPorEstado,
	resumenDisponibilidad,
	nombreComprador,
	inicialesComprador,
	accionesDisponibles,
	cuerpoAccion,
	mensajeErrorAccion,
	agruparComprasPorEvento
} from '../../src/compras/gestionCompras';
import { ApiError } from '../../src/services/api';
import { formatPrice } from '../../src/theme/format';
import { AHORA } from '../helpers/eventosEjemplo';
import {
	COMPRAS_ORGANIZADOR,
	DISPONIBILIDAD_EJEMPLO,
	crearCompraOrganizador
} from '../helpers/comprasEjemplo';

const ids = (lista) => lista.map((c) => c.id);

describe('PESTANAS_ORGANIZADOR (data-model.md §4)', () => {
	it('tiene 4 pestañas en orden con sus estados y textos de vacío', () => {
		expect(
			PESTANAS_ORGANIZADOR.map((p) => [p.clave, p.etiqueta, p.estados])
		).toEqual([
			['pendientes', 'Pendientes', ['PENDIENTE']],
			['confirmadas', 'Confirmadas', ['CONFIRMADA']],
			['utilizadas', 'Utilizadas', ['UTILIZADA']],
			['canceladas', 'Canceladas', ['CANCELADA', 'REEMBOLSADA']]
		]);
		expect(PESTANAS_ORGANIZADOR.map((p) => p.vacio)).toEqual([
			'No hay compras pendientes de confirmar',
			'No hay compras confirmadas',
			'Todavía no se usaron entradas',
			'No hay compras canceladas ni reembolsadas'
		]);
	});
});

describe('agruparPorEstado', () => {
	it('cada estado cae en su pestaña, la más reciente primero', () => {
		const g = agruparPorEstado(COMPRAS_ORGANIZADOR);
		expect(ids(g.pendientes)).toEqual(['co-pen-2', 'co-pen-1']);
		expect(ids(g.confirmadas)).toEqual(['co-con']);
		expect(ids(g.utilizadas)).toEqual(['co-uti']);
		expect(ids(g.canceladas)).toEqual(['co-ree', 'co-can']);
	});

	it('ignora estados desconocidos y tolera null', () => {
		const rara = crearCompraOrganizador({ id: 'rara', estado: 'OTRO' });
		const g = agruparPorEstado([rara]);
		expect(Object.values(g).flat()).toEqual([]);
		expect(agruparPorEstado(null)).toEqual({
			pendientes: [],
			confirmadas: [],
			utilizadas: [],
			canceladas: []
		});
	});
});

describe('resumenDisponibilidad (números del servidor, SC-003)', () => {
	it('calcula totales y niveles por tipo', () => {
		const r = resumenDisponibilidad(DISPONIBILIDAD_EJEMPLO);
		expect(r.totalVendidas).toBe(199);
		expect(r.totalCupo).toBe(220);
		expect(r.porcentaje).toBe(90);
		const [gen, pla, vip] = r.tipos;
		expect(gen).toEqual(
			expect.objectContaining({
				nombre: 'General',
				vendidas: 89,
				cupo: 100,
				disponibles: 11,
				porcentaje: 89,
				nivel: 'normal',
				textoRestantes: 'Quedan 11'
			})
		);
		expect(pla.nivel).toBe('casi');
		expect(pla.textoRestantes).toBe('Quedan 10');
		expect(vip.nivel).toBe('agotado');
		expect(vip.textoRestantes).toBe('Agotado');
		expect(vip.porcentaje).toBe(100);
	});

	it('con cupo 0 no divide por cero; sin datos devuelve ceros', () => {
		const r = resumenDisponibilidad([
			{
				tipoEntradaId: 'x',
				nombre: 'X',
				precio: 0,
				cupo: 0,
				vendidas: 0,
				disponibles: 0
			}
		]);
		expect(r.porcentaje).toBe(0);
		expect(r.tipos[0].porcentaje).toBe(0);
		expect(resumenDisponibilidad(null)).toEqual({
			totalVendidas: 0,
			totalCupo: 0,
			porcentaje: 0,
			tipos: []
		});
	});
});

describe('nombreComprador e inicialesComprador', () => {
	it('arma el nombre completo o "Comprador"', () => {
		expect(nombreComprador(crearCompraOrganizador())).toBe('Ana García');
		expect(nombreComprador({ comprador: null })).toBe('Comprador');
		expect(inicialesComprador(crearCompraOrganizador())).toBe('AG');
		expect(inicialesComprador({ comprador: null })).toBe('C');
	});
});

describe('accionesDisponibles (data-model.md §4 › AccionCompra; SC-004)', () => {
	const DIA = 24 * 60 * 60 * 1000;
	const futuro = new Date(AHORA.getTime() + DIA).toISOString();
	const pasado = new Date(AHORA.getTime() - DIA).toISOString();
	const ahora = AHORA.toISOString();
	const compra = (estado) => crearCompraOrganizador({ estado });

	it.each([
		['PENDIENTE', ['confirmar', 'cancelar']],
		['CONFIRMADA', ['reembolsar', 'cancelar']],
		['UTILIZADA', []],
		['CANCELADA', []],
		['REEMBOLSADA', []]
	])('%s con evento futuro → %p', (estado, esperado) => {
		expect(accionesDisponibles(compra(estado), futuro, AHORA)).toEqual(
			esperado
		);
	});

	it.each(['PENDIENTE', 'CONFIRMADA', 'UTILIZADA', 'CANCELADA', 'REEMBOLSADA'])(
		'%s con evento pasado, igual a ahora o fecha inválida → []',
		(estado) => {
			expect(accionesDisponibles(compra(estado), pasado, AHORA)).toEqual([]);
			expect(accionesDisponibles(compra(estado), ahora, AHORA)).toEqual([]);
			expect(accionesDisponibles(compra(estado), 'x', AHORA)).toEqual([]);
			expect(accionesDisponibles(compra(estado), undefined, AHORA)).toEqual([]);
		}
	);

	it('compra null → []', () => {
		expect(accionesDisponibles(null, futuro, AHORA)).toEqual([]);
	});
});

describe('cuerpoAccion y mensajeErrorAccion (research R11)', () => {
	const COMPRA = crearCompraOrganizador();

	it('describe el impacto concreto de reembolsar y cancelar', () => {
		expect(cuerpoAccion('reembolsar', COMPRA)).toBe(
			`Vas a reembolsar 2 × Platea a Ana García por ${formatPrice(80000)}. No se puede deshacer.`
		);
		expect(cuerpoAccion('cancelar', COMPRA)).toBe(
			`Vas a cancelar 2 × Platea de Ana García por ${formatPrice(80000)}. Se libera el cupo y no se puede deshacer.`
		);
	});

	it.each([
		['confirmar', 'No se pudo confirmar la compra'],
		['reembolsar', 'No se pudo reembolsar la compra'],
		['cancelar', 'No se pudo cancelar la compra']
	])('400 en %s incluye el mensaje del servidor', (accion, titulo) => {
		expect(
			mensajeErrorAccion(accion, new ApiError('El evento ya ocurrió.', 400))
		).toEqual({ titulo, cuerpo: 'El evento ya ocurrió.' });
	});

	it('403, 404, 0 y genérico', () => {
		expect(mensajeErrorAccion('confirmar', new ApiError('x', 403))).toEqual({
			titulo: 'No podés gestionar esta compra',
			cuerpo: ''
		});
		expect(mensajeErrorAccion('cancelar', new ApiError('x', 404))).toEqual({
			titulo: 'Esta compra ya no existe',
			cuerpo: ''
		});
		expect(mensajeErrorAccion('reembolsar', new ApiError('', 0))).toEqual({
			titulo: 'Sin conexión',
			cuerpo: 'Revisá tu conexión e intentá de nuevo.'
		});
		expect(mensajeErrorAccion('confirmar', new ApiError('x', 500))).toEqual({
			titulo: 'Algo salió mal',
			cuerpo: 'Intentá de nuevo en unos segundos.'
		});
	});
});

describe('agruparComprasPorEvento (data-model.md §4 › Agrupación de Mensajes)', () => {
	const ev = (id) => ({
		id,
		nombre: `Evento ${id}`,
		fecha: '2030-01-01T00:00:00Z',
		extra: 1
	});
	const c = (id, eventoId) =>
		crearCompraOrganizador({ id, evento: { id: eventoId } });

	it('sigue el orden de los eventos, invierte las compras y omite los vacíos', () => {
		const eventos = [ev('a'), ev('b'), ev('c')];
		const resultados = [
			{
				status: 'fulfilled',
				value: { compras: [c('a1', 'a'), c('a2', 'a')], disponibilidad: [] }
			},
			{ status: 'fulfilled', value: { compras: [], disponibilidad: [] } },
			{
				status: 'fulfilled',
				value: { compras: [c('c1', 'c')], disponibilidad: [] }
			}
		];
		const r = agruparComprasPorEvento(eventos, resultados);
		expect(r.fallidos).toBe(0);
		expect(r.secciones.map((s) => s.evento)).toEqual([
			{ id: 'a', nombre: 'Evento a', fecha: '2030-01-01T00:00:00Z' },
			{ id: 'c', nombre: 'Evento c', fecha: '2030-01-01T00:00:00Z' }
		]);
		expect(r.secciones[0].compras.map((x) => x.id)).toEqual(['a2', 'a1']);
	});

	it('un resultado rechazado suma a fallidos sin lanzar', () => {
		const r = agruparComprasPorEvento(
			[ev('a'), ev('b')],
			[
				{ status: 'rejected', reason: new Error('x') },
				{
					status: 'fulfilled',
					value: { compras: [c('b1', 'b')], disponibilidad: [] }
				}
			]
		);
		expect(r.fallidos).toBe(1);
		expect(r.secciones).toHaveLength(1);
		expect(agruparComprasPorEvento(null, null)).toEqual({
			secciones: [],
			fallidos: 0
		});
	});
});
