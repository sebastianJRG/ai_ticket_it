/**
 * Tests unitarios de las transiciones de estado del modelo `Compra`
 * y del esquema `idCompraSchema`.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import { idCompraSchema } from '../../../src/dto/compra.js';
import Compra from '../../../src/models/compra.js';
import EstadoCompra from '../../../src/models/estadoCompra.js';

/** Compra mínima en el estado indicado. */
const compraEn = (estado) => new Compra('1', {}, {}, {}, 1, 100, estado);

/** Transiciones permitidas según la constitución (v1.2.0). */
const PERMITIDAS = [
	[EstadoCompra.PENDIENTE, EstadoCompra.CONFIRMADA],
	[EstadoCompra.PENDIENTE, EstadoCompra.CANCELADA],
	[EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA],
	[EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA],
	[EstadoCompra.CONFIRMADA, EstadoCompra.REEMBOLSADA]
];

describe('Compra: transiciones de estado', () => {
	const todos = Object.values(EstadoCompra);

	for (const origen of todos) {
		for (const destino of todos) {
			const permitida = PERMITIDAS.some(
				([o, d]) => o === origen && d === destino
			);

			it(`puedeTransicionarA: ${origen} → ${destino} es ${permitida ? 'válida' : 'inválida'}`, () => {
				expect(compraEn(origen).puedeTransicionarA(destino)).toBe(permitida);
			});
		}
	}

	it('actualizarEstado cambia el estado cuando la transición es válida', () => {
		const compra = compraEn(EstadoCompra.PENDIENTE);

		compra.actualizarEstado(EstadoCompra.CONFIRMADA);

		expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
	});

	it('actualizarEstado lanza un error y conserva el estado si la transición es inválida', () => {
		const compra = compraEn(EstadoCompra.PENDIENTE);

		expect(() => compra.actualizarEstado(EstadoCompra.REEMBOLSADA)).toThrow(
			Error
		);
		expect(compra.estado).toBe(EstadoCompra.PENDIENTE);
	});

	it.each([
		EstadoCompra.UTILIZADA,
		EstadoCompra.CANCELADA,
		EstadoCompra.REEMBOLSADA
	])('%s es un estado terminal', (terminal) => {
		const compra = compraEn(terminal);

		for (const destino of todos) {
			expect(compra.puedeTransicionarA(destino)).toBe(false);
		}
	});
});

describe('idCompraSchema', () => {
	it('acepta un texto no vacío y lo recorta', () => {
		expect(idCompraSchema.parse('  12 ')).toBe('12');
	});

	it.each([
		['vacío', ''],
		['solo espacios', '   '],
		['número', 5],
		['undefined', undefined]
	])('rechaza un ID %s', (_nombre, valor) => {
		expect(idCompraSchema.safeParse(valor).success).toBe(false);
	});
});
