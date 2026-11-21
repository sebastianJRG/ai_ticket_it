import React from 'react';
import { FlatList, Text } from 'react-native';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { ChatCompra } from '../../src/mensajes/ChatCompra';
import * as mensajeService from '../../src/services/mensajeService';
import { ApiError } from '../../src/services/api';
import { formatDate } from '../../src/theme/format';
import { renderConTema } from '../helpers/renderConTema';
import { diferido } from '../helpers/diferido';
import { COMPRADOR, ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { AHORA } from '../helpers/eventosEjemplo';
import {
	CONVERSACION,
	TEXTO_1001,
	crearMensaje
} from '../helpers/mensajesEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth
}));
jest.mock('../../src/services/mensajeService', () => ({
	listarMensajes: jest.fn(),
	enviarMensaje: jest.fn()
}));

/** Monta el chat con un encabezado de prueba. */
async function montar(props = {}) {
	await renderConTema(
		<ChatCompra
			idCompra="c-1"
			activo
			rolOtro="organizador"
			encabezado={<Text>Encabezado de prueba</Text>}
			{...props}
		/>
	);
	await act(async () => {});
}

const campo = () => screen.getByPlaceholderText('Escribí un mensaje');
const botonEnviar = () =>
	screen.getByRole('button', { name: 'Enviar mensaje' });

/** Falsea solo `Date` (los timers siguen reales) para fijar "hoy" en `AHORA`. */
function fijarHoy() {
	jest.useFakeTimers({
		doNotFake: [
			'hrtime',
			'nextTick',
			'performance',
			'queueMicrotask',
			'requestAnimationFrame',
			'cancelAnimationFrame',
			'requestIdleCallback',
			'cancelIdleCallback',
			'setImmediate',
			'clearImmediate',
			'setInterval',
			'clearInterval',
			'setTimeout',
			'clearTimeout'
		]
	});
	jest.setSystemTime(AHORA);
}

afterEach(() => jest.useRealTimers());

beforeEach(() => {
	fijarHoy();
	jest.clearAllMocks();
	mockAuth = crearAuthFalso({ usuario: COMPRADOR });
	mensajeService.listarMensajes.mockResolvedValue([]);
});

describe('ChatCompra — US1 (contracts/componentes.md › ChatCompra)', () => {
	it('cargando: encabezado, esqueletos y composer deshabilitado', async () => {
		mensajeService.listarMensajes.mockReturnValue(new Promise(() => {}));
		await renderConTema(
			<ChatCompra
				idCompra="c-1"
				activo
				rolOtro="organizador"
				encabezado={<Text>Encabezado de prueba</Text>}
			/>
		);
		expect(screen.getByText('Encabezado de prueba')).toBeTruthy();
		expect(screen.getByLabelText('Cargando mensajes')).toBeTruthy();
		expect(botonEnviar().props.accessibilityState).toEqual(
			expect.objectContaining({ disabled: true })
		);
	});

	it('vacío: invita a escribir y el composer está habilitado (US1-4)', async () => {
		await montar();
		expect(
			screen.getByRole('header', { name: 'Todavía no hay mensajes' })
		).toBeTruthy();
		expect(
			screen.getByText(
				'Escribile al organizador si tenés dudas sobre tu compra.'
			)
		).toBeTruthy();
		await fireEvent.changeText(campo(), 'hola');
		expect(botonEnviar().props.accessibilityState).toEqual(
			expect.objectContaining({ disabled: false })
		);
	});

	it('muestra la conversación en orden con separadores (US1-1)', async () => {
		mensajeService.listarMensajes.mockResolvedValue(CONVERSACION);
		await montar();
		const hora = (i) => formatDate(CONVERSACION[i].enviado, 'time');
		expect(screen.getByText('Ayer')).toBeTruthy();
		expect(screen.getByText('Hoy')).toBeTruthy();
		const etiquetas = screen
			.getAllByTestId('chat-bubble')
			.map((n) => n.props.accessibilityLabel);
		expect(etiquetas).toEqual([
			`Vos, ${hora(0)}: ${CONVERSACION[0].mensaje}`,
			`Vos, ${hora(1)}: ${CONVERSACION[1].mensaje}`,
			`Bruno Pérez, ${hora(2)}: ${CONVERSACION[2].mensaje}`,
			`Bruno Pérez, ${hora(3)}: ${CONVERSACION[3].mensaje}`
		]);
		expect(screen.getAllByText('Bruno Pérez')).toHaveLength(1);
	});

	it('enviar: vacía el composer, muestra "Enviando…" y luego la hora (US1-2)', async () => {
		const d = diferido();
		mensajeService.enviarMensaje.mockReturnValue(d.promesa);
		await montar();
		await fireEvent.changeText(campo(), '¿Hay estacionamiento?');
		await fireEvent.press(botonEnviar());
		expect(campo().props.value).toBe('');
		expect(screen.getByText('¿Hay estacionamiento?')).toBeTruthy();
		expect(screen.getByText('Enviando…')).toBeTruthy();
		const servidor = crearMensaje({
			id: 'm-9',
			mensaje: '¿Hay estacionamiento?'
		});
		await act(async () => d.resolver(servidor));
		expect(screen.queryByText('Enviando…')).toBeNull();
		expect(
			screen.getByLabelText(
				`Vos, ${formatDate(servidor.enviado, 'time')}: ¿Hay estacionamiento?`
			)
		).toBeTruthy();
	});

	it('fallo: "No se envió" con "Reintentar", que reenvía (US1-3)', async () => {
		mensajeService.enviarMensaje
			.mockRejectedValueOnce(new ApiError('x', 0))
			.mockResolvedValueOnce(crearMensaje({ id: 'm-9', mensaje: 'hola' }));
		await montar();
		await fireEvent.changeText(campo(), 'hola');
		await act(async () => {
			fireEvent.press(botonEnviar());
		});
		expect(screen.getByText('No se envió')).toBeTruthy();
		expect(
			screen.getByText('Revisá tu conexión e intentá de nuevo.')
		).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		expect(mensajeService.enviarMensaje).toHaveBeenCalledTimes(2);
		expect(mensajeService.enviarMensaje).toHaveBeenLastCalledWith(
			'c-1',
			'hola'
		);
		expect(screen.queryByText('No se envió')).toBeNull();
	});

	it('validación: solo espacios deshabilita; 1001 muestra contador y error', async () => {
		await montar();
		await fireEvent.changeText(campo(), '   ');
		expect(botonEnviar().props.accessibilityState).toEqual(
			expect.objectContaining({ disabled: true })
		);
		expect(screen.getByText('Escribí un mensaje para enviar')).toBeTruthy();
		await fireEvent.changeText(campo(), TEXTO_1001);
		expect(screen.getByText('1001/1000')).toBeTruthy();
		expect(
			screen.getByText('El mensaje no puede superar los 1000 caracteres.')
		).toBeTruthy();
		expect(botonEnviar().props.accessibilityState).toEqual(
			expect.objectContaining({ disabled: true })
		);
	});

	it('error inicial de red: EmptyState con "Reintentar"', async () => {
		mensajeService.listarMensajes.mockRejectedValueOnce(new ApiError('x', 0));
		await montar();
		expect(screen.getByRole('header', { name: 'Sin conexión' })).toBeTruthy();
		expect(screen.queryByPlaceholderText('Escribí un mensaje')).toBeNull();
		mensajeService.listarMensajes.mockResolvedValue(CONVERSACION);
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
		});
		expect(screen.getByText('Hoy')).toBeTruthy();
	});
});

describe('ChatCompra — US2 organizador y acceso', () => {
	it('desde el organizador, los del comprador son ajenos y con su nombre', async () => {
		mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
		mensajeService.listarMensajes.mockResolvedValue(CONVERSACION);
		await montar({ rolOtro: 'comprador' });
		const hora = (i) => formatDate(CONVERSACION[i].enviado, 'time');
		const etiquetas = screen
			.getAllByTestId('chat-bubble')
			.map((n) => n.props.accessibilityLabel);
		expect(etiquetas).toEqual([
			`Ana García, ${hora(0)}: ${CONVERSACION[0].mensaje}`,
			`Ana García, ${hora(1)}: ${CONVERSACION[1].mensaje}`,
			`Vos, ${hora(2)}: ${CONVERSACION[2].mensaje}`,
			`Vos, ${hora(3)}: ${CONVERSACION[3].mensaje}`
		]);
		expect(screen.getAllByText('Ana García')).toHaveLength(1);
	});

	it('vacío con rolOtro="comprador"', async () => {
		mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
		await montar({ rolOtro: 'comprador' });
		expect(
			screen.getByText('Escribile al comprador sobre esta compra.')
		).toBeTruthy();
	});

	it('403 al cargar: sin acceso, sin reintentar ni composer', async () => {
		mensajeService.listarMensajes.mockRejectedValue(new ApiError('No', 403));
		await montar();
		expect(
			screen.getByRole('header', {
				name: 'No tenés acceso a esta conversación'
			})
		).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
		expect(screen.queryByPlaceholderText('Escribí un mensaje')).toBeNull();
	});

	it('403 al enviar: el chat pasa al mismo estado', async () => {
		mensajeService.enviarMensaje.mockRejectedValue(new ApiError('No', 403));
		await montar();
		await fireEvent.changeText(campo(), 'hola');
		await act(async () => {
			fireEvent.press(botonEnviar());
		});
		expect(
			screen.getByRole('header', {
				name: 'No tenés acceso a esta conversación'
			})
		).toBeTruthy();
		expect(screen.queryByPlaceholderText('Escribí un mensaje')).toBeNull();
	});

	it('404 al cargar: la compra ya no existe, sin reintentar ni composer', async () => {
		mensajeService.listarMensajes.mockRejectedValue(new ApiError('No', 404));
		await montar();
		expect(
			screen.getByRole('header', { name: 'Esta compra ya no existe' })
		).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
		expect(screen.queryByPlaceholderText('Escribí un mensaje')).toBeNull();
	});
});

describe('ChatCompra — US3 mensajes nuevos y scroll (research R8)', () => {
	const NUEVO = crearMensaje({
		id: 'm-5',
		mensaje: 'Te esperamos.',
		usuario: {
			id: ORGANIZADOR.id,
			nombre: ORGANIZADOR.nombre,
			apellido: ORGANIZADOR.apellido,
			rol: ORGANIZADOR.rol
		},
		enviado: new Date(AHORA.getTime() + 60 * 1000).toISOString()
	});
	const avanzar = (ms) =>
		act(async () => {
			await jest.advanceTimersByTimeAsync(ms);
		});
	const desplazar = (y) =>
		fireEvent.scroll(screen.getByTestId('chat-lista'), {
			nativeEvent: {
				contentOffset: { y },
				contentSize: { height: 2000 },
				layoutMeasurement: { height: 600 }
			}
		});
	let scrollToEnd;

	beforeEach(() => {
		jest.useFakeTimers({ now: AHORA });
		scrollToEnd = jest
			.spyOn(FlatList.prototype, 'scrollToEnd')
			.mockImplementation(() => {});
		mensajeService.listarMensajes
			.mockResolvedValueOnce(CONVERSACION)
			.mockResolvedValue([...CONVERSACION, NUEVO]);
	});

	afterEach(() => scrollToEnd.mockRestore());

	it('un mensaje nuevo del otro participante aparece a los 5 s', async () => {
		await montar();
		expect(screen.queryByText('Te esperamos.')).toBeNull();
		await avanzar(5000);
		expect(screen.getByText('Te esperamos.')).toBeTruthy();
	});

	it('si estaba al final, baja', async () => {
		await montar();
		await desplazar(1400);
		scrollToEnd.mockClear();
		await avanzar(5000);
		expect(scrollToEnd).toHaveBeenCalled();
		expect(
			screen.queryByRole('button', { name: 'Mensajes nuevos' })
		).toBeNull();
	});

	it('si había subido, no baja y ofrece "Mensajes nuevos"', async () => {
		await montar();
		await desplazar(0);
		scrollToEnd.mockClear();
		await avanzar(5000);
		expect(scrollToEnd).not.toHaveBeenCalled();
		await act(async () => {
			fireEvent.press(screen.getByRole('button', { name: 'Mensajes nuevos' }));
		});
		expect(scrollToEnd).toHaveBeenCalledTimes(1);
		expect(
			screen.queryByRole('button', { name: 'Mensajes nuevos' })
		).toBeNull();
	});

	it('con activo=false no consulta', async () => {
		mensajeService.listarMensajes.mockReset();
		await montar({ activo: false });
		await avanzar(20000);
		expect(mensajeService.listarMensajes).not.toHaveBeenCalled();
	});
});
