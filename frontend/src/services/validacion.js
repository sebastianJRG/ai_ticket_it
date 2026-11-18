/**
 * @file Validaciones de formularios que replican las reglas del backend (dto/usuario.js).
 * @owner Equipo Al Ticket It — frontend
 * @license MIT
 */

/**
 * Valida un texto obligatorio.
 * @param {string} valor Texto ingresado.
 * @param {string} nombre Nombre del campo con artículo ("El nombre").
 * @returns {string|null} Mensaje de error, o null si es válido.
 */
export function validarTexto(valor, nombre) {
	return valor.trim() ? null : `${nombre} no puede estar vacío.`;
}

/**
 * Valida el nombre de usuario.
 * @param {string} valor Texto ingresado.
 * @returns {string|null} Mensaje de error, o null si es válido.
 */
export function validarNombreUsuario(valor) {
	return validarTexto(valor, 'El nombre de usuario');
}

/**
 * Valida la contraseña: 8–32, mayúscula, minúscula, número y especial (!@#$%^&*_-).
 * @param {string} valor Contraseña ingresada.
 * @returns {string|null} Mensaje que explica cómo resolverlo, o null si es válida.
 */
export function validarContrasenia(valor) {
	if (valor.length < 8) return 'Usá al menos 8 caracteres.';
	if (valor.length > 32) return 'Usá como máximo 32 caracteres.';
	if (!/[A-Z]/.test(valor)) return 'Agregá al menos una letra mayúscula.';
	if (!/[a-z]/.test(valor)) return 'Agregá al menos una letra minúscula.';
	if (!/[0-9]/.test(valor)) return 'Agregá al menos un número.';
	if (!/[!@#$%^&*_-]/.test(valor))
		return 'Agregá un carácter especial (!@#$%^&*_-).';
	return null;
}
