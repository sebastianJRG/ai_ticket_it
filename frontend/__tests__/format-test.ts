import {
	formatPrice,
	formatPriceFrom,
	formatPriceRange,
	formatDate,
	daysUntil,
	formatDaysLeft,
	formatRating,
	formatCount,
	formatTickets
} from '../src/theme/format';

const NBSP = ' ';

describe('formatPrice', () => {
	it('usa $ + espacio duro y miles con punto', () => {
		expect(formatPrice(25000)).toBe(`$${NBSP}25.000`);
	});
	it('muestra centavos solo si existen', () => {
		expect(formatPrice(1250.5)).toBe(`$${NBSP}1.250,50`);
	});
	it('devuelve Gratis para 0', () => {
		expect(formatPrice(0)).toBe('Gratis');
	});
	it('usa signo menos real en negativos', () => {
		expect(formatPrice(-6400)).toBe(`−$${NBSP}6.400`);
	});
});

describe('rangos de precio', () => {
	it('"Desde" con mínimo en cards', () => {
		expect(formatPriceFrom(32000, 85000)).toBe(`Desde $${NBSP}32.000`);
	});
	it('rango completo con en dash', () => {
		expect(formatPriceRange(32000, 85000)).toBe(
			`$${NBSP}32.000 – $${NBSP}85.000`
		);
	});
});

describe('fechas', () => {
	const d = new Date(2026, 11, 12, 21, 0);
	it('short', () => expect(formatDate(d)).toBe('sáb 12 dic · 21:00'));
	it('long', () =>
		expect(formatDate(d, 'long')).toBe(
			'Sábado 12 de diciembre de 2026 · 21:00 h'
		));
	it('numeric', () => expect(formatDate(d, 'numeric')).toBe('12/12/2026'));
	it('daysUntil cuenta días calendario', () => {
		const now = new Date(2026, 10, 17, 23, 0);
		expect(daysUntil(new Date(2026, 10, 18, 0, 30), now)).toBe(1);
	});
});

describe('cuenta regresiva y números', () => {
	it('formatDaysLeft', () => {
		expect(formatDaysLeft(0)).toBe('Es hoy');
		expect(formatDaysLeft(1)).toBe('Es mañana');
		expect(formatDaysLeft(25)).toBe('Faltan 25 días');
	});
	it('puntaje con coma', () => expect(formatRating(4.7)).toBe('4,7'));
	it('miles con punto', () => expect(formatCount(1284)).toBe('1.284'));
	it('plurales de entradas', () => {
		expect(formatTickets(1)).toBe('1 entrada');
		expect(formatTickets(2)).toBe('2 entradas');
	});
});
