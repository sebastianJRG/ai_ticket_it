import {
	login,
	registrar,
	refrescar,
	cerrarSesion,
	ApiError
} from '../../src/services/authService';
import { cliente, configurarSesion } from '../../src/services/api';
import { crearAdaptadorFalso } from '../helpers/adaptadorFalso';

let adaptador;
const enviada = (i = 0) => adaptador.mock.calls[i][0];
const cuerpo = (i = 0) => JSON.parse(enviada(i).data);

describe('authService', () => {
	beforeEach(() => {
		adaptador = crearAdaptadorFalso();
		cliente.defaults.adapter = adaptador;
		configurarSesion(null);
	});

	it('login hace POST /api/login con nombreUsuario y contrasenia', async () => {
		adaptador.responder(200, {
			accessToken: 'a',
			refreshToken: 'r',
			usuario: { id: '1' }
		});
		const r = await login({ nombreUsuario: 'ana', contrasenia: 'x' });
		expect(enviada().url).toMatch(/\/api\/login$/);
		expect(enviada().method).toBe('post');
		expect(cuerpo()).toEqual({ nombreUsuario: 'ana', contrasenia: 'x' });
		expect(r.accessToken).toBe('a');
	});

	it('login con 401 lanza ApiError con status y mensaje del backend', async () => {
		adaptador.responder(401, { message: 'Credenciales inválidas.' });
		adaptador.responder(401, { message: 'Credenciales inválidas.' });
		await expect(
			login({ nombreUsuario: 'a', contrasenia: 'b' })
		).rejects.toMatchObject({
			status: 401,
			message: 'Credenciales inválidas.'
		});
		await expect(login({})).rejects.toBeInstanceOf(ApiError);
	});

	it('registrar hace POST /api/usuarios con el rol', async () => {
		adaptador.responder(201, { id: '1' });
		await registrar({
			nombre: 'Ana',
			apellido: 'Paz',
			nombreUsuario: 'ana',
			contrasenia: 'Abcdef1!',
			rol: 'COMPRADOR'
		});
		expect(enviada().url).toMatch(/\/api\/usuarios$/);
		expect(enviada().method).toBe('post');
		expect(cuerpo().rol).toBe('COMPRADOR');
	});

	it('sin red lanza ApiError de conexión', async () => {
		adaptador.fallarRed();
		await expect(login({})).rejects.toMatchObject({ status: 0 });
	});

	it('refrescar hace POST /api/refresh con el refreshToken', async () => {
		const sesion = { accessToken: 'a2', refreshToken: 'r2', usuario: {} };
		adaptador.responder(200, sesion);
		await expect(refrescar('r')).resolves.toEqual(sesion);
		expect(enviada().url).toBe('/api/refresh');
		expect(enviada().method).toBe('post');
		expect(cuerpo()).toEqual({ refreshToken: 'r' });
	});

	it('cerrarSesion hace POST /api/logout con el refreshToken', async () => {
		adaptador.responder(200, { message: 'ok' });
		await cerrarSesion('r');
		expect(enviada().url).toBe('/api/logout');
		expect(enviada().method).toBe('post');
		expect(cuerpo()).toEqual({ refreshToken: 'r' });
	});

	it('ninguna operación de autenticación envía credencial aunque haya sesión', async () => {
		configurarSesion({
			obtenerTokens: () => ({ accessToken: 'a1', refreshToken: 'r1' }),
			guardarTokens: jest.fn(),
			alExpirar: jest.fn()
		});
		for (let i = 0; i < 4; i++) adaptador.responder(200, {});
		await login({ nombreUsuario: 'ana', contrasenia: 'x' });
		await registrar({ nombreUsuario: 'ana' });
		await refrescar('r');
		await cerrarSesion('r');
		for (let i = 0; i < 4; i++) {
			expect(enviada(i).headers.Authorization).toBeUndefined();
		}
	});

	it('login con 401 no intenta renovar la sesión ni avisa expiración', async () => {
		const alExpirar = jest.fn();
		configurarSesion({
			obtenerTokens: () => ({ accessToken: 'a1', refreshToken: 'r1' }),
			guardarTokens: jest.fn(),
			alExpirar
		});
		adaptador.responderCon(() => ({
			status: 401,
			data: { message: 'Credenciales inválidas.' }
		}));
		await expect(
			login({ nombreUsuario: 'ana', contrasenia: 'mal' })
		).rejects.toMatchObject({
			status: 401,
			message: 'Credenciales inválidas.'
		});
		const urls = adaptador.mock.calls.map(([c]) => c.url);
		expect(urls).toEqual(['/api/login']);
		expect(alExpirar).not.toHaveBeenCalled();
	});
});
