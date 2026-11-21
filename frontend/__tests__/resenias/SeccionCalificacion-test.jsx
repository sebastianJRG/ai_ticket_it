import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { SeccionCalificacion } from '../../src/resenias/SeccionCalificacion';
import { ToastProvider } from '../../src/feedback/ToastContext';
import * as reseniaService from '../../src/services/reseniaService';
import { ApiError } from '../../src/services/api';
import { renderConTema } from '../helpers/renderConTema';
import { COMPRADOR, crearAuthFalso } from '../helpers/authFalso';
import { crearResenia } from '../helpers/comprasEjemplo';

let mockAuth;
jest.mock('../../src/auth/AuthContext', () => ({
	useAuth: () => mockAuth
}));
jest.mock('../../src/services/reseniaService', () => ({
	listarReseniasEvento: jest.fn(),
	crearResenia: jest.fn()
}));

async function montar() {
	mockAuth = crearAuthFalso({ usuario: COMPRADOR });
	await renderConTema(
		<ToastProvider>
			<SeccionCalificacion eventoId="ev" />
		</ToastProvider>
	);
	await act(async () => {});
}

async function abrirFormulario() {
	await montar();
	await act(async () => {
		fireEvent.press(screen.getByRole('button', { name: 'Calificar evento' }));
	});
}

const enviar = async () =>
	act(async () => {
		fireEvent.press(screen.getByRole('button', { name: 'Enviar reseña' }));
	});

describe('SeccionCalificacion (contracts/pantallas.md › SeccionCalificacion)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		reseniaService.listarReseniasEvento.mockResolvedValue([]);
	});

	it('mientras verifica muestra un esqueleto', async () => {
		reseniaService.listarReseniasEvento.mockReturnValue(new Promise(() => {}));
		mockAuth = crearAuthFalso({ usuario: COMPRADOR });
		await renderConTema(
			<ToastProvider>
				<SeccionCalificacion eventoId="ev" />
			</ToastProvider>
		);
		expect(screen.getByLabelText('Verificando tu reseña')).toBeTruthy();
		expect(
			screen.queryByRole('button', { name: 'Calificar evento' })
		).toBeNull();
	});

	it('si ya calificó no ofrece la acción', async () => {
		reseniaService.listarReseniasEvento.mockResolvedValue([
			crearResenia({
				comprador: { id: COMPRADOR.id, nombre: 'Ana', apellido: 'G' }
			})
		]);
		await montar();
		expect(screen.getByText('Ya calificaste este evento')).toBeTruthy();
		expect(
			screen.queryByRole('button', { name: 'Calificar evento' })
		).toBeNull();
	});

	it('"Calificar evento" muestra estrellas, comentario y enviar (US4-1)', async () => {
		await abrirFormulario();
		expect(screen.getAllByRole('radio')).toHaveLength(5);
		expect(screen.getByLabelText('Comentario')).toBeTruthy();
		expect(screen.getByText('0/1000')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Enviar reseña' })).toBeTruthy();
	});

	it('sin estrellas → error y sin petición (US4-2)', async () => {
		await abrirFormulario();
		await act(async () => {
			fireEvent.changeText(screen.getByLabelText('Comentario'), 'Muy bueno');
		});
		await enviar();
		expect(screen.getByText('Elegí de 1 a 5 estrellas')).toBeTruthy();
		expect(reseniaService.crearResenia).not.toHaveBeenCalled();
	});

	it('comentario con solo espacios → "Escribí un comentario"', async () => {
		await abrirFormulario();
		await act(async () => {
			fireEvent.press(screen.getByLabelText('4 estrellas, Muy bueno'));
			fireEvent.changeText(screen.getByLabelText('Comentario'), '    ');
		});
		await enviar();
		expect(screen.getByText('Escribí un comentario')).toBeTruthy();
		expect(reseniaService.crearResenia).not.toHaveBeenCalled();
	});

	it('201 → agradece y pasa a "Ya calificaste" (US4-4)', async () => {
		reseniaService.crearResenia.mockResolvedValue(crearResenia());
		await abrirFormulario();
		await act(async () => {
			fireEvent.press(screen.getByLabelText('4 estrellas, Muy bueno'));
			fireEvent.changeText(screen.getByLabelText('Comentario'), ' Muy bueno ');
		});
		await enviar();
		expect(reseniaService.crearResenia).toHaveBeenCalledWith({
			eventoId: 'ev',
			detalle: 'Muy bueno',
			puntuacion: 4
		});
		expect(screen.getByText('¡Gracias por tu reseña!')).toBeTruthy();
		expect(screen.getByText('Ya calificaste este evento')).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Enviar reseña' })).toBeNull();
	});

	it('409 → "Ya calificaste este evento" y se oculta la acción (US4-3)', async () => {
		reseniaService.crearResenia.mockRejectedValue(new ApiError('x', 409));
		await abrirFormulario();
		await act(async () => {
			fireEvent.press(screen.getByLabelText('5 estrellas, Excelente'));
			fireEvent.changeText(screen.getByLabelText('Comentario'), 'Genial');
		});
		await enviar();
		expect(screen.getByText('Ya calificaste este evento')).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Enviar reseña' })).toBeNull();
		expect(
			screen.queryByRole('button', { name: 'Calificar evento' })
		).toBeNull();
	});

	it.each([
		[403, 'Necesitás una entrada utilizada de este evento para calificarlo'],
		[400, 'No pudimos guardar tu reseña']
	])('%i → aviso en línea y se puede reintentar', async (status, titulo) => {
		reseniaService.crearResenia.mockRejectedValueOnce(
			new ApiError('Detalle', status)
		);
		await abrirFormulario();
		await act(async () => {
			fireEvent.press(screen.getByLabelText('3 estrellas, Bueno'));
			fireEvent.changeText(screen.getByLabelText('Comentario'), 'Regular');
		});
		await enviar();
		expect(screen.getByText(titulo)).toBeTruthy();
		reseniaService.crearResenia.mockResolvedValueOnce(crearResenia());
		await enviar();
		expect(reseniaService.crearResenia).toHaveBeenCalledTimes(2);
		expect(screen.getByText('¡Gracias por tu reseña!')).toBeTruthy();
	});
});
