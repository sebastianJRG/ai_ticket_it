/**
 * Tests unitarios de `programarTarea`, con temporizadores falsos.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { programarTarea } from '../../../src/utils/programador.js';

describe('programarTarea', () => {
	let tarea;
	let alError;
	let programada;

	beforeEach(() => {
		jest.useFakeTimers();
		tarea = jest.fn().mockResolvedValue(undefined);
		alError = jest.fn();
		programada = null;
	});

	afterEach(() => {
		programada?.detener();
		jest.useRealTimers();
	});

	it('no ejecuta la tarea antes de que pase el primer intervalo', async () => {
		programada = programarTarea(tarea, 1000, { alError });

		await jest.advanceTimersByTimeAsync(999);

		expect(tarea).not.toHaveBeenCalled();
	});

	it('ejecuta la tarea en cada intervalo', async () => {
		programada = programarTarea(tarea, 1000, { alError });

		await jest.advanceTimersByTimeAsync(3000);

		expect(tarea).toHaveBeenCalledTimes(3);
	});

	it('detener() cancela las ejecuciones siguientes', async () => {
		programada = programarTarea(tarea, 1000, { alError });
		await jest.advanceTimersByTimeAsync(1000);

		programada.detener();
		await jest.advanceTimersByTimeAsync(5000);

		expect(tarea).toHaveBeenCalledTimes(1);
	});

	it('informa el error con alError y sigue ejecutando la tarea', async () => {
		const error = new Error('falló');
		tarea.mockRejectedValueOnce(error);
		programada = programarTarea(tarea, 1000, { alError });

		await jest.advanceTimersByTimeAsync(2000);

		expect(alError).toHaveBeenCalledTimes(1);
		expect(alError).toHaveBeenCalledWith(error);
		expect(tarea).toHaveBeenCalledTimes(2);
	});

	it('captura también los errores lanzados de forma síncrona', async () => {
		const error = new Error('síncrono');
		tarea.mockImplementationOnce(() => {
			throw error;
		});
		programada = programarTarea(tarea, 1000, { alError });

		await jest.advanceTimersByTimeAsync(2000);

		expect(alError).toHaveBeenCalledWith(error);
		expect(tarea).toHaveBeenCalledTimes(2);
	});

	it('no solapa ejecuciones: salta el ciclo si la anterior no terminó', async () => {
		let terminar;
		tarea.mockImplementationOnce(
			() => new Promise((resolver) => (terminar = resolver))
		);
		programada = programarTarea(tarea, 1000, { alError });

		await jest.advanceTimersByTimeAsync(3000);
		expect(tarea).toHaveBeenCalledTimes(1);

		terminar();
		await jest.advanceTimersByTimeAsync(1000);
		expect(tarea).toHaveBeenCalledTimes(2);
	});

	it('funciona sin alError', async () => {
		tarea.mockRejectedValueOnce(new Error('falló'));
		programada = programarTarea(tarea, 1000);

		await jest.advanceTimersByTimeAsync(2000);

		expect(tarea).toHaveBeenCalledTimes(2);
	});
});
