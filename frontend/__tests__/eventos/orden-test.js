import {
	OPCIONES_ORDEN,
	ORDEN_POR_DEFECTO,
	paramsOrden
} from '../../src/eventos/orden';

describe('orden (data-model §6 OpcionOrden)', () => {
	it('tiene exactamente las 6 opciones de la tabla', () => {
		expect(OPCIONES_ORDEN).toEqual([
			{
				clave: 'fecha-asc',
				etiqueta: 'Fecha más próxima',
				corta: 'Fecha ↑',
				sortBy: 'fecha',
				order: 'asc'
			},
			{
				clave: 'fecha-desc',
				etiqueta: 'Fecha más lejana',
				corta: 'Fecha ↓',
				sortBy: 'fecha',
				order: 'desc'
			},
			{
				clave: 'precio-asc',
				etiqueta: 'Precio menor a mayor',
				corta: 'Precio ↑',
				sortBy: 'precio',
				order: 'asc'
			},
			{
				clave: 'precio-desc',
				etiqueta: 'Precio mayor a menor',
				corta: 'Precio ↓',
				sortBy: 'precio',
				order: 'desc'
			},
			{
				clave: 'puntaje-desc',
				etiqueta: 'Mejor puntaje del organizador',
				corta: 'Puntaje ↓',
				sortBy: 'puntaje',
				order: 'desc'
			},
			{
				clave: 'puntaje-asc',
				etiqueta: 'Menor puntaje del organizador',
				corta: 'Puntaje ↑',
				sortBy: 'puntaje',
				order: 'asc'
			}
		]);
	});

	it('está congelado', () => {
		expect(Object.isFrozen(OPCIONES_ORDEN)).toBe(true);
		OPCIONES_ORDEN.forEach((o) => expect(Object.isFrozen(o)).toBe(true));
	});

	it('cubre las 6 combinaciones criterio × sentido una sola vez (SC-002)', () => {
		const combinaciones = OPCIONES_ORDEN.map((o) => `${o.sortBy}:${o.order}`);
		expect(new Set(combinaciones).size).toBe(6);
		for (const c of ['precio', 'fecha', 'puntaje']) {
			for (const s of ['asc', 'desc'])
				expect(combinaciones).toContain(`${c}:${s}`);
		}
	});

	it('por defecto es fecha ascendente', () => {
		expect(ORDEN_POR_DEFECTO).toBe('fecha-asc');
	});

	it('paramsOrden devuelve sortBy/order; puntaje "mejor" es descendente (US3-2)', () => {
		expect(paramsOrden('puntaje-desc')).toEqual({
			sortBy: 'puntaje',
			order: 'desc'
		});
		expect(paramsOrden('precio-asc')).toEqual({
			sortBy: 'precio',
			order: 'asc'
		});
	});

	it('clave desconocida → la de defecto', () => {
		expect(paramsOrden('nada')).toEqual({ sortBy: 'fecha', order: 'asc' });
		expect(paramsOrden(undefined)).toEqual({ sortBy: 'fecha', order: 'asc' });
	});
});
