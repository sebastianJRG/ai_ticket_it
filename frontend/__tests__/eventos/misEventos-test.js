import { separarMisEventos } from '../../src/eventos/misEventos';
import {
	AHORA,
	EVENTOS_ORGANIZADOR,
	crearEventoDe
} from '../helpers/eventosEjemplo';

const ids = (lista) => lista.map((e) => e.id);

describe('separarMisEventos (data-model.md §3)', () => {
	it('deja solo los propios: próximos ascendentes y finalizados descendentes', () => {
		const { proximos, finalizados } = separarMisEventos(
			EVENTOS_ORGANIZADOR,
			'u-organizador',
			AHORA
		);
		expect(ids(proximos)).toEqual(['ev-prop-fut-1', 'ev-prop-fut-2']);
		expect(ids(finalizados)).toEqual(['ev-prop-pas-2', 'ev-prop-pas-1']);
	});

	it('un evento con fecha igual a AHORA cuenta como finalizado', () => {
		const ev = crearEventoDe(
			{ id: 'u-organizador' },
			{
				id: 'ev-ahora',
				fecha: AHORA.toISOString()
			}
		);
		const r = separarMisEventos([ev], 'u-organizador', AHORA);
		expect(ids(r.proximos)).toEqual([]);
		expect(ids(r.finalizados)).toEqual(['ev-ahora']);
	});

	it('una fecha inválida va a finalizados', () => {
		const ev = crearEventoDe(
			{ id: 'u-organizador' },
			{
				id: 'ev-roto',
				fecha: 'no-es-fecha'
			}
		);
		const r = separarMisEventos([ev], 'u-organizador', AHORA);
		expect(ids(r.finalizados)).toEqual(['ev-roto']);
	});

	it('entradas null, sin organizador o lista ausente no lanzan', () => {
		const sinOrg = { id: 'x', fecha: AHORA.toISOString(), organizador: null };
		expect(separarMisEventos([null, sinOrg], 'u-organizador', AHORA)).toEqual({
			proximos: [],
			finalizados: []
		});
		expect(separarMisEventos(null, 'u-organizador', AHORA)).toEqual({
			proximos: [],
			finalizados: []
		});
	});
});
