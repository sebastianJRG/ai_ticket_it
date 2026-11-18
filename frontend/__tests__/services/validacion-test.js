import {
	validarContrasenia,
	validarNombreUsuario,
	validarTexto
} from '../../src/services/validacion';

describe('validarContrasenia', () => {
	it('acepta una contraseña que cumple todo', () => {
		expect(validarContrasenia('Abcdef1!')).toBeNull();
	});
	it.each([
		['Ab1!', /8 caracteres/],
		['abcdefg1!', /mayúscula/],
		['ABCDEFG1!', /minúscula/],
		['Abcdefgh!', /número/],
		['Abcdefg12', /especial/],
		['Abcdef1!' + 'x'.repeat(30), /32/]
	])('rechaza %s', (valor, patron) => {
		expect(validarContrasenia(valor)).toMatch(patron);
	});
});

describe('validarNombreUsuario / validarTexto', () => {
	it('rechaza vacío', () => {
		expect(validarNombreUsuario('  ')).toBeTruthy();
		expect(validarTexto('', 'El nombre')).toBe(
			'El nombre no puede estar vacío.'
		);
	});
	it('acepta valores con contenido', () => {
		expect(validarNombreUsuario('ana')).toBeNull();
		expect(validarTexto('Ana', 'El nombre')).toBeNull();
	});
});
