/**
 * Tests unitarios de `ExclusionMutua`.
 * Se controlan las tareas con promesas manuales: sin timers ni esperas reales.
 *
 * @license ISC
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import ExclusionMutua from '../../../src/utils/exclusionMutua.js';

/** Cede el turno al bucle de eventos para que avancen las promesas pendientes. */
const cederTurno = () => new Promise((resolver) => setImmediate(resolver));

/** Crea una promesa que se resuelve desde afuera. */
const diferida = () => {
	let resolver;
	const promesa = new Promise((r) => {
		resolver = r;
	});
	return { promesa, resolver };
};

describe('ExclusionMutua', () => {
	let mutex;
	let eventos;

	beforeEach(() => {
		mutex = new ExclusionMutua();
		eventos = [];
	});

	it('devuelve el resultado de la tarea', async () => {
		const resultado = await mutex.ejecutar(async () => 42);

		expect(resultado).toBe(42);
	});

	it('no ejecuta una tarea hasta que termina la anterior', async () => {
		const primera = diferida();

		const t1 = mutex.ejecutar(async () => {
			eventos.push('inicio-1');
			await primera.promesa;
			eventos.push('fin-1');
		});
		const t2 = mutex.ejecutar(async () => {
			eventos.push('inicio-2');
		});

		await cederTurno();
		expect(eventos).toEqual(['inicio-1']);

		primera.resolver();
		await Promise.all([t1, t2]);

		expect(eventos).toEqual(['inicio-1', 'fin-1', 'inicio-2']);
	});

	it('mantiene el orden de llegada', async () => {
		const tareas = [1, 2, 3].map((n) =>
			mutex.ejecutar(async () => {
				eventos.push(n);
			})
		);

		await Promise.all(tareas);

		expect(eventos).toEqual([1, 2, 3]);
	});

	it('propaga el error de la tarea que falla', async () => {
		await expect(
			mutex.ejecutar(async () => {
				throw new Error('falló');
			})
		).rejects.toThrow('falló');
	});

	it('un error no bloquea las tareas siguientes', async () => {
		const fallida = mutex.ejecutar(async () => {
			throw new Error('falló');
		});
		const siguiente = mutex.ejecutar(async () => 'ok');

		await expect(fallida).rejects.toThrow('falló');
		await expect(siguiente).resolves.toBe('ok');
	});
});
