// Formatos es-AR sin depender de Intl (Hermes en Android puede no traer locales completos).

const thousands = (n) =>
	String(Math.trunc(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** 25000 → "$ 25.000" · 1250.5 → "$ 1.250,50" · 0 → "Gratis" */
export function formatPrice(value, { free = 'Gratis' } = {}) {
	if (value === 0 && free) return free;
	const sign = value < 0 ? '−' : '';
	const cents = Math.round(Math.abs(value) * 100) % 100;
	return `${sign}$ ${thousands(value)}${cents ? ',' + String(cents).padStart(2, '0') : ''}`;
}

/** Rango para cards: "Desde $ 25.000" (o el precio único si min === max). */
export function formatPriceFrom(min, max) {
	if (min === max || max == null) return formatPrice(min);
	return `Desde ${formatPrice(min)}`;
}

/** Rango completo: "$ 25.000 – $ 80.000" */
export function formatPriceRange(min, max) {
	return min === max
		? formatPrice(min)
		: `${formatPrice(min)} – ${formatPrice(max)}`;
}

export const DAYS = [
	'domingo',
	'lunes',
	'martes',
	'miércoles',
	'jueves',
	'viernes',
	'sábado'
];
export const DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre'
];
export const MONTHS_SHORT = [
	'ene',
	'feb',
	'mar',
	'abr',
	'may',
	'jun',
	'jul',
	'ago',
	'sep',
	'oct',
	'nov',
	'dic'
];
const pad = (n) => String(n).padStart(2, '0');
const toDate = (d) => (d instanceof Date ? d : new Date(d));

/**
 * style: 'short'  → "sáb 14 dic · 21:00"
 *        'long'   → "Sábado 14 de diciembre de 2026 · 21:00 h"
 *        'day'    → "14 dic"
 *        'numeric'→ "14/12/2026"
 *        'time'   → "21:00"
 */
export function formatDate(date, style = 'short') {
	const d = toDate(date);
	const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
	switch (style) {
		case 'time':
			return time;
		case 'day':
			return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
		case 'numeric':
			return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
		case 'long': {
			const s = `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()} · ${time} h`;
			return s[0].toUpperCase() + s.slice(1);
		}
		default:
			return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} · ${time}`;
	}
}

/** Días enteros entre hoy y el evento (por fecha calendario, no por horas). */
export function daysUntil(date, now = new Date()) {
	const a = toDate(date),
		b = toDate(now);
	const A = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
	const B = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
	return Math.round((A - B) / 86400000);
}

/** 0 → "Es hoy" · 1 → "Es mañana" · 5 → "Faltan 5 días" */
export function formatDaysLeft(n) {
	if (n <= 0) return 'Es hoy';
	if (n === 1) return 'Es mañana';
	return `Faltan ${n} días`;
}

/** 4.6 → "4,6" */
export const formatRating = (v) => v.toFixed(1).replace('.', ',');
/** 1234 → "1.234" */
export const formatCount = (n) => thousands(n);
/** Cantidad de entradas: 1 → "1 entrada", 3 → "3 entradas" */
export const formatTickets = (n) => `${n} ${n === 1 ? 'entrada' : 'entradas'}`;
