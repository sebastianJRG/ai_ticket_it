/**
 * @file Hook de debounce: devuelve el valor recién cuando dejó de cambiar
 *   durante `ms` (specs/004-explorar-busqueda-favoritos/research.md R3).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */
import { useEffect, useState } from 'react';

/**
 * Valor demorado: el inicial se devuelve de inmediato; los cambios, tras `ms` sin cambios.
 * @template T
 * @param {T} valor Valor que cambia (p. ej. el texto de búsqueda).
 * @param {number} [ms] Espera en milisegundos (300 por defecto).
 * @returns {T} Último valor estable.
 */
export function useDebounce(valor, ms = 300) {
	const [estable, setEstable] = useState(valor);
	useEffect(() => {
		const timer = setTimeout(() => setEstable(valor), ms);
		return () => clearTimeout(timer);
	}, [valor, ms]);
	return estable;
}
