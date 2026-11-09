import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Genera un hash seguro a partir de una contraseña en texto plano.
 * @param {string} contraseniaPlana
 * @returns {Promise<string>}
 */
export async function hashContrasenia(contraseniaPlana) {
	return await bcrypt.hash(contraseniaPlana, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano con un hash almacenado.
 * @param {string} contraseniaPlana
 * @param {string} contraseniaHash
 * @returns {Promise<boolean>}
 */
export async function verifyContrasenia(contraseniaPlana, contraseniaHash) {
	return await bcrypt.compare(contraseniaPlana, contraseniaHash);
}
