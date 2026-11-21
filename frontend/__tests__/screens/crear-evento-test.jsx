/* global __dirname */
import path from 'path';
import {
	act,
	fireEvent,
	renderRouter,
	screen
} from 'expo-router/testing-library';
import * as eventoService from '../../src/services/eventoService';
import * as categoriaService from '../../src/services/categoriaService';
import { ApiError } from '../../src/services/api';
import { ORGANIZADOR, crearAuthFalso } from '../helpers/authFalso';
import { CATEGORIAS } from '../helpers/eventosEjemplo';
import { diferido } from '../helpers/diferido';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }) => children
}));
jest.mock('../../src/services/eventoService', () => ({
	listarEventos: jest.fn(() => Promise.resolve([])),
	obtenerEvento: jest.fn(() => new Promise(() => {})),
	obtenerComprasEvento: jest.fn(() => new Promise(() => {})),
	crearEvento: jest.fn()
}));
jest.mock('../../src/services/categoriaService', () => ({
	listarCategorias: jest.fn(),
	crearCategoria: jest.fn()
}));
jest.mock('../../src/services/usuarioService', () => ({
	obtenerPerfil: jest.fn(() => new Promise(() => {})),
	listarFavoritos: jest.fn(() => Promise.resolve([])),
	agregarFavorito: jest.fn(),
	quitarFavorito: jest.fn()
}));

const APP = path.resolve(__dirname, '../../src/app');

/** Monta la app real en Crear evento con un ORGANIZADOR. */
async function abrir() {
	mockAuth = crearAuthFalso({ usuario: ORGANIZADOR });
	await renderRouter(APP, { initialUrl: '/organizador/crear' });
	await act(async () => {});
}

const escribir = (label, texto, indice = 0) =>
	fireEvent.changeText(screen.getAllByLabelText(label)[indice], texto);

/** Completa un evento válido con 2 tipos de entrada. */
async function completarValido() {
	await escribir('Nombre del evento', 'Noche de jazz');
	await escribir('Descripción', 'Jazz en vivo', 0);
	await escribir('Fecha', '20122030');
	await escribir('Hora', '2130');
	await fireEvent.press(
		screen.getByRole('button', { name: 'Categoría, sin elegir' })
	);
	await fireEvent.press(screen.getByRole('radio', { name: 'Recitales' }));
	await escribir('Nombre', 'General', 0);
	await escribir('Descripción', 'De pie', 1);
	await escribir('Precio', '0', 0);
	await escribir('Cupo', '100', 0);
	await fireEvent.press(
		screen.getByRole('button', { name: 'Agregar tipo de entrada' })
	);
	await escribir('Nombre', 'VIP', 1);
	await escribir('Descripción', 'Mesa', 2);
	await escribir('Precio', '15000', 1);
	await escribir('Cupo', '20', 1);
}

const CUERPO_ESPERADO = {
	nombre: 'Noche de jazz',
	descripcion: 'Jazz en vivo',
	categoriaId: 'cat-rec',
	fecha: new Date(2030, 11, 20, 21, 30).toISOString(),
	tiposEntrada: [
		{ nombre: 'General', descripcion: 'De pie', precio: 0, cupo: 100 },
		{ nombre: 'VIP', descripcion: 'Mesa', precio: 15000, cupo: 20 }
	],
	multimedia: []
};

const publicar = () =>
	fireEvent.press(screen.getByRole('button', { name: 'Publicar evento' }));

describe('Crear evento — US1 (contracts/pantallas.md › /organizador/crear)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		categoriaService.listarCategorias.mockResolvedValue(CATEGORIAS);
	});

	it('muestra todas las secciones y "Publicar evento"', async () => {
		await abrir();
		expect(screen.getAllByText('Crear evento').length).toBeGreaterThan(0);
		expect(screen.getByText('Imágenes')).toBeTruthy();
		expect(screen.getByLabelText('Nombre del evento')).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Categoría, sin elegir' })
		).toBeTruthy();
		expect(screen.getByLabelText('Fecha')).toBeTruthy();
		expect(screen.getByLabelText('Hora')).toBeTruthy();
		expect(screen.getByText('Tipos de entrada')).toBeTruthy();
		expect(screen.getByText('Tipo de entrada 1')).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Publicar evento' })
		).toBeTruthy();
	});

	it('enmascara fecha y hora mientras se escribe', async () => {
		await abrir();
		await escribir('Fecha', '20122030');
		await escribir('Hora', '2130');
		expect(screen.getByLabelText('Fecha').props.value).toBe('20/12/2030');
		expect(screen.getByLabelText('Hora').props.value).toBe('21:30');
	});

	it('agregar 2 tipos y quitar el 2.º deja "Tipo de entrada 1" y "2"; el primero sin papelera (US1-1)', async () => {
		await abrir();
		const agregar = () =>
			fireEvent.press(
				screen.getByRole('button', { name: 'Agregar tipo de entrada' })
			);
		await agregar();
		await agregar();
		await escribir('Nombre', 'Tercero', 2);
		expect(screen.getByText('Tipo de entrada 3')).toBeTruthy();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Quitar tipo de entrada 2' })
		);
		expect(screen.getByText('Tipo de entrada 1')).toBeTruthy();
		expect(screen.getByText('Tipo de entrada 2')).toBeTruthy();
		expect(screen.queryByText('Tipo de entrada 3')).toBeNull();
		expect(screen.getAllByLabelText('Nombre')[1].props.value).toBe('Tercero');
		expect(
			screen.queryByRole('button', { name: 'Quitar tipo de entrada 1' })
		).toBeNull();
	});

	it('quitar un tipo con datos pide confirmación; un tipo vacío se quita directo', async () => {
		await abrir();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Agregar tipo de entrada' })
		);
		await escribir('Nombre', 'VIP', 1);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Quitar tipo de entrada 2' })
		);
		expect(screen.getByText('¿Quitar «VIP»?')).toBeTruthy();
		expect(
			screen.getByText('Se borran los datos cargados de este tipo de entrada.')
		).toBeTruthy();
		await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
		expect(screen.getByText('Tipo de entrada 2')).toBeTruthy();
		await fireEvent.press(
			screen.getByRole('button', { name: 'Quitar tipo de entrada 2' })
		);
		await fireEvent.press(screen.getByRole('button', { name: 'Sí, quitar' }));
		expect(screen.queryByText('Tipo de entrada 2')).toBeNull();

		await fireEvent.press(
			screen.getByRole('button', { name: 'Agregar tipo de entrada' })
		);
		await fireEvent.press(
			screen.getByRole('button', { name: 'Quitar tipo de entrada 2' })
		);
		expect(screen.queryByText('Tipo de entrada 2')).toBeNull();
	});

	it('al perder el foco valida solo ese campo (US1-2)', async () => {
		await abrir();
		await fireEvent(screen.getByLabelText('Nombre del evento'), 'blur');
		expect(screen.getByText('Escribí el nombre del evento.')).toBeTruthy();
		expect(screen.queryByText('Contá de qué se trata el evento.')).toBeNull();
	});

	it('publicar con errores los marca todos y no envía nada (US1-2)', async () => {
		await abrir();
		await escribir('Precio', '-5', 0);
		await escribir('Cupo', '1,5', 0);
		await escribir('Fecha', '01012020');
		await escribir('Hora', '1000');
		await publicar();
		expect(screen.getByText('Escribí el nombre del evento.')).toBeTruthy();
		expect(screen.getByText('Contá de qué se trata el evento.')).toBeTruthy();
		expect(
			screen.getByText('Elegí una categoría o creá una nueva.')
		).toBeTruthy();
		expect(screen.getByText('Elegí una fecha y hora futuras.')).toBeTruthy();
		expect(screen.getByText('El precio no puede ser negativo.')).toBeTruthy();
		expect(
			screen.getByText('El cupo tiene que ser un número entero mayor a 0.')
		).toBeTruthy();
		expect(eventoService.crearEvento).not.toHaveBeenCalled();
	});

	it('con datos válidos publica una vez, avisa y va a Compras del evento (US1-3)', async () => {
		eventoService.crearEvento.mockResolvedValue({ id: 'ev-nuevo' });
		await abrir();
		await completarValido();
		await act(async () => {
			await publicar();
		});
		expect(eventoService.crearEvento).toHaveBeenCalledTimes(1);
		expect(eventoService.crearEvento).toHaveBeenCalledWith(CUERPO_ESPERADO);
		expect(screen.getByText('Evento publicado')).toBeTruthy();
		expect(screen).toHavePathname('/evento/ev-nuevo/compras');
	});

	it('doble toque en publicar: una sola petición', async () => {
		const d = diferido();
		eventoService.crearEvento.mockReturnValue(d.promesa);
		await abrir();
		await completarValido();
		await act(async () => {
			publicar();
			publicar();
		});
		expect(eventoService.crearEvento).toHaveBeenCalledTimes(1);
		await act(async () => d.resolver({ id: 'ev-nuevo' }));
	});

	it('400: banner con el mensaje del servidor y el borrador se conserva (US1-5)', async () => {
		eventoService.crearEvento.mockRejectedValue(
			new ApiError('La fecha del evento debe ser en el futuro.', 400)
		);
		await abrir();
		await completarValido();
		await act(async () => {
			await publicar();
		});
		expect(
			screen.getByText(
				'Revisá los datos: La fecha del evento debe ser en el futuro.'
			)
		).toBeTruthy();
		expect(screen.getByLabelText('Nombre del evento').props.value).toBe(
			'Noche de jazz'
		);
		expect(screen.getAllByLabelText('Cupo')[1].props.value).toBe('20');
		expect(screen).toHavePathname('/organizador/crear');
	});

	it('404: categoría inexistente → banner, se limpia y se recargan las categorías', async () => {
		eventoService.crearEvento.mockRejectedValue(new ApiError('No existe', 404));
		await abrir();
		await completarValido();
		expect(categoriaService.listarCategorias).toHaveBeenCalledTimes(1);
		await act(async () => {
			await publicar();
		});
		expect(
			screen.getByText('La categoría elegida ya no existe. Elegí otra.')
		).toBeTruthy();
		expect(
			screen.getByRole('button', { name: 'Categoría, sin elegir' })
		).toBeTruthy();
		expect(categoriaService.listarCategorias).toHaveBeenCalledTimes(2);
	});

	it('sin conexión: "Sin conexión. Tus datos siguen acá."', async () => {
		eventoService.crearEvento.mockRejectedValue(new ApiError('', 0));
		await abrir();
		await completarValido();
		await act(async () => {
			await publicar();
		});
		expect(
			screen.getByText('Sin conexión. Tus datos siguen acá.')
		).toBeTruthy();
		expect(screen.getByLabelText('Nombre del evento').props.value).toBe(
			'Noche de jazz'
		);
	});
});
