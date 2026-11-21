import {
	LIMITE_MENSAJE,
	agruparMensajes,
	estaAlFinal,
	fusionarMensajes,
	mensajeErrorChat,
	textoErrorEnvio,
	validarMensaje
} from '../../src/mensajes/chat';
import { ApiError } from '../../src/services/api';
import { formatDate } from '../../src/theme/format';
import { COMPRADOR, ORGANIZADOR } from '../helpers/authFalso';
import { AHORA } from '../helpers/eventosEjemplo';
import {
	CONVERSACION,
	TEXTO_1000,
	TEXTO_1001,
	crearMensaje,
	remitentePublico
} from '../helpers/mensajesEjemplo';

/** Mensaje local de ejemplo (data-model.md §2 › MensajeLocal). */
const local = (parcial = {}) => ({
	claveLocal: 'l-1',
	mensaje: 'hola',
	estado: 'enviando',
	creado: AHORA,
	...parcial
});

describe('validarMensaje (data-model.md §4)', () => {
	it('el límite es 1000', () => {
		expect(LIMITE_MENSAJE).toBe(1000);
	});

	it.each(['', '   '])('%p no es válido y no muestra error', (texto) => {
		expect(validarMensaje(texto)).toEqual({
			valido: false,
			largo: 0,
			error: null
		});
	});

	it.each([
		['a', 1],
		[TEXTO_1000, 1000]
	])('largo válido', (texto, largo) => {
		expect(validarMensaje(texto)).toEqual({ valido: true, largo, error: null });
	});

	it('1001 caracteres no es válido', () => {
		expect(validarMensaje(TEXTO_1001)).toEqual({
			valido: false,
			largo: 1001,
			error: 'El mensaje no puede superar los 1000 caracteres.'
		});
	});

	it('recorta antes de medir el máximo', () => {
		expect(validarMensaje(`  ${TEXTO_1000}  `)).toEqual({
			valido: true,
			largo: 1000,
			error: null
		});
	});

	it('tolera undefined', () => {
		expect(validarMensaje(undefined).valido).toBe(false);
	});
});

describe('fusionarMensajes (research R4, reglas 1, 2 y 4)', () => {
	it('ordena el servidor por enviado y luego por id', () => {
		const a = crearMensaje({ id: 'b', enviado: '2026-12-02T10:00:00.000Z' });
		const b = crearMensaje({ id: 'a', enviado: '2026-12-02T10:00:00.000Z' });
		const c = crearMensaje({ id: 'c', enviado: '2026-12-01T10:00:00.000Z' });
		expect(
			fusionarMensajes([a, b, c], [], COMPRADOR.id).map((m) => m.id)
		).toEqual(['c', 'a', 'b']);
	});

	it('un confirmado cuyo id ya llegó del servidor aparece una sola vez', () => {
		const servidor = [crearMensaje({ id: 'm-9', mensaje: 'hola' })];
		const confirmado = local({
			estado: 'confirmado',
			id: 'm-9',
			enviado: servidor[0].enviado
		});
		const resultado = fusionarMensajes(servidor, [confirmado], COMPRADOR.id);
		expect(resultado).toHaveLength(1);
		expect(resultado[0].id).toBe('m-9');
	});

	it('un confirmado que todavía no llegó del servidor se conserva', () => {
		const confirmado = local({
			estado: 'confirmado',
			id: 'm-9',
			enviado: AHORA.toISOString()
		});
		expect(fusionarMensajes([], [confirmado], COMPRADOR.id)).toEqual([
			confirmado
		]);
	});

	it('los locales enviando y error van al final, en orden de creado', () => {
		const servidor = [crearMensaje({ id: 'm-1' })];
		const segundo = local({
			claveLocal: 'l-2',
			estado: 'error',
			creado: new Date(AHORA.getTime() + 1000)
		});
		const primero = local({ claveLocal: 'l-1' });
		const resultado = fusionarMensajes(
			servidor,
			[segundo, primero],
			COMPRADOR.id
		);
		expect(resultado.map((m) => m.id ?? m.claveLocal)).toEqual([
			'm-1',
			'l-1',
			'l-2'
		]);
	});

	it('no muta sus entradas', () => {
		const servidor = Object.freeze([
			Object.freeze(crearMensaje({ id: 'z' })),
			Object.freeze(crearMensaje({ id: 'a' }))
		]);
		const locales = Object.freeze([Object.freeze(local())]);
		expect(() =>
			fusionarMensajes(servidor, locales, COMPRADOR.id)
		).not.toThrow();
		expect(servidor.map((m) => m.id)).toEqual(['z', 'a']);
	});
});

describe('agruparMensajes (data-model.md §3 › ItemChat)', () => {
	const items = agruparMensajes(CONVERSACION, COMPRADOR.id, AHORA);
	const mensajes = items.filter((i) => i.tipo === 'mensaje');

	it('intercala los separadores Ayer y Hoy', () => {
		expect(items.map((i) => (i.tipo === 'dia' ? i.etiqueta : i.clave))).toEqual(
			['Ayer', 'm-1', 'm-2', 'Hoy', 'm-3', 'm-4']
		);
	});

	it('un día anterior usa formatDate(..., "day")', () => {
		const viejo = crearMensaje({
			id: 'v',
			enviado: '2026-11-20T15:00:00.000Z'
		});
		const [dia] = agruparMensajes([viejo], COMPRADOR.id, AHORA);
		expect(dia).toEqual(
			expect.objectContaining({
				tipo: 'dia',
				etiqueta: formatDate(viejo.enviado, 'day')
			})
		);
	});

	it('propio, autor y hora', () => {
		expect(mensajes.map((m) => m.propio)).toEqual([true, true, false, false]);
		expect(mensajes[0].autor).toBe('Vos');
		expect(mensajes[2].autor).toBe('Bruno Pérez');
		expect(mensajes[2].hora).toBe(formatDate(CONVERSACION[2].enviado, 'time'));
		expect(mensajes[0].texto).toBe(CONVERSACION[0].mensaje);
		expect(mensajes.every((m) => m.estado === 'enviado')).toBe(true);
	});

	it('mostrarAutor solo en el primer mensaje ajeno del grupo', () => {
		expect(mensajes.map((m) => m.mostrarAutor)).toEqual([
			false,
			false,
			true,
			false
		]);
	});

	it('desde el organizador, los del comprador son ajenos', () => {
		const delOrg = agruparMensajes(CONVERSACION, ORGANIZADOR.id, AHORA).filter(
			(i) => i.tipo === 'mensaje'
		);
		expect(delOrg.map((m) => m.mostrarAutor)).toEqual([
			true,
			false,
			false,
			false
		]);
		expect(delOrg[0].autor).toBe('Ana García');
	});

	it('un local sin enviado usa creado, con estado y claveLocal', () => {
		const enviando = local({ creado: AHORA });
		const fallido = local({
			claveLocal: 'l-2',
			estado: 'error',
			error: new ApiError('No', 0)
		});
		const resultado = agruparMensajes([enviando, fallido], COMPRADOR.id, AHORA);
		expect(resultado[0]).toEqual(
			expect.objectContaining({ tipo: 'dia', etiqueta: 'Hoy' })
		);
		expect(resultado[1]).toEqual(
			expect.objectContaining({
				clave: 'l-1',
				propio: true,
				estado: 'enviando',
				hora: formatDate(AHORA, 'time'),
				texto: 'hola'
			})
		);
		expect(resultado[2]).toEqual(
			expect.objectContaining({
				clave: 'l-2',
				estado: 'error',
				error: 'Revisá tu conexión e intentá de nuevo.'
			})
		);
	});

	it('un local confirmado se muestra como enviado con su id', () => {
		const [, item] = agruparMensajes(
			[
				local({
					estado: 'confirmado',
					id: 'm-7',
					enviado: AHORA.toISOString()
				})
			],
			COMPRADOR.id,
			AHORA
		);
		expect(item).toEqual(
			expect.objectContaining({ clave: 'm-7', estado: 'enviado' })
		);
	});

	it('un mensaje del servidor de otro remitente no es propio', () => {
		const ajeno = crearMensaje({ usuario: remitentePublico(ORGANIZADOR) });
		const [, item] = agruparMensajes([ajeno], COMPRADOR.id, AHORA);
		expect(item.propio).toBe(false);
	});
});

describe('mensajeErrorChat (research R6)', () => {
	it('403', () => {
		expect(mensajeErrorChat(new ApiError('x', 403))).toEqual({
			titulo: 'No tenés acceso a esta conversación',
			cuerpo:
				'Solo el comprador y el organizador del evento pueden usar este chat.',
			reintentable: false
		});
	});

	it('404', () => {
		expect(mensajeErrorChat(new ApiError('x', 404))).toEqual(
			expect.objectContaining({
				titulo: 'Esta compra ya no existe',
				reintentable: false
			})
		);
	});

	it('400', () => {
		expect(mensajeErrorChat(new ApiError('x', 400))).toEqual(
			expect.objectContaining({
				titulo: 'No pudimos abrir esta conversación',
				reintentable: true
			})
		);
	});

	it('sin conexión usa mensajeError', () => {
		expect(mensajeErrorChat(new ApiError('x', 0))).toEqual({
			titulo: 'Sin conexión',
			cuerpo: 'Revisá tu conexión e intentá de nuevo.',
			reintentable: true
		});
	});

	it('otro error del servidor es reintentable', () => {
		expect(mensajeErrorChat(new ApiError('x', 500)).reintentable).toBe(true);
	});
});

describe('textoErrorEnvio (research R3)', () => {
	it('400 → el mensaje del servidor', () => {
		expect(
			textoErrorEnvio(new ApiError('El mensaje no puede estar vacío.', 400))
		).toBe('El mensaje no puede estar vacío.');
	});

	it.each([0, 500, 403, 404])('%p → texto genérico', (status) => {
		expect(textoErrorEnvio(new ApiError('x', status))).toBe(
			'Revisá tu conexión e intentá de nuevo.'
		);
	});
});

describe('fusionarMensajes — regla 3 (research R4, US3)', () => {
	const propio = (parcial) =>
		crearMensaje({ usuario: remitentePublico(COMPRADOR), ...parcial });

	it('oculta un enviando si el servidor ya trae su gemelo propio', () => {
		const gemelo = propio({
			id: 'g',
			mensaje: 'hola',
			enviado: AHORA.toISOString()
		});
		const resultado = fusionarMensajes([gemelo], [local()], COMPRADOR.id);
		expect(resultado.map((m) => m.id ?? m.claveLocal)).toEqual(['g']);
	});

	it('dos locales iguales con un solo gemelo dejan visible uno', () => {
		const gemelo = propio({
			id: 'g',
			mensaje: 'hola',
			enviado: AHORA.toISOString()
		});
		const resultado = fusionarMensajes(
			[gemelo],
			[
				local(),
				local({ claveLocal: 'l-2', creado: new Date(AHORA.getTime() + 10) })
			],
			COMPRADOR.id
		);
		expect(resultado.map((m) => m.id ?? m.claveLocal)).toEqual(['g', 'l-2']);
	});

	it('un mensaje ajeno con el mismo texto no reclama', () => {
		const ajeno = crearMensaje({
			id: 'a',
			mensaje: 'hola',
			usuario: remitentePublico(ORGANIZADOR),
			enviado: AHORA.toISOString()
		});
		expect(fusionarMensajes([ajeno], [local()], COMPRADOR.id)).toHaveLength(2);
	});

	it('un gemelo más viejo que la tolerancia de 60 s no reclama', () => {
		const viejo = propio({
			id: 'v',
			mensaje: 'hola',
			enviado: new Date(AHORA.getTime() - 61 * 1000).toISOString()
		});
		expect(fusionarMensajes([viejo], [local()], COMPRADOR.id)).toHaveLength(2);
	});

	it('un gemelo ya reclamado por un confirmado no oculta otro enviando', () => {
		const g = propio({
			id: 'g',
			mensaje: 'hola',
			enviado: AHORA.toISOString()
		});
		const confirmado = local({
			claveLocal: 'l-0',
			estado: 'confirmado',
			id: 'g'
		});
		const resultado = fusionarMensajes(
			[g],
			[confirmado, local()],
			COMPRADOR.id
		);
		expect(resultado.map((m) => m.id ?? m.claveLocal)).toEqual(['g', 'l-1']);
	});

	it('un local en error no se oculta', () => {
		const g = propio({
			id: 'g',
			mensaje: 'hola',
			enviado: AHORA.toISOString()
		});
		expect(
			fusionarMensajes([g], [local({ estado: 'error' })], COMPRADOR.id)
		).toHaveLength(2);
	});
});

describe('estaAlFinal (research R8)', () => {
	const evento = (y, alto = 1000, visible = 400) => ({
		contentOffset: { y },
		contentSize: { height: alto },
		layoutMeasurement: { height: visible }
	});

	it('true dentro del margen de 48', () => {
		expect(estaAlFinal(evento(600))).toBe(true);
		expect(estaAlFinal(evento(552))).toBe(true);
	});

	it('false fuera del margen', () => {
		expect(estaAlFinal(evento(551))).toBe(false);
		expect(estaAlFinal(evento(0))).toBe(false);
	});

	it('acepta un margen personalizado', () => {
		expect(estaAlFinal(evento(500), 100)).toBe(true);
		expect(estaAlFinal(evento(499), 100)).toBe(false);
	});
});
