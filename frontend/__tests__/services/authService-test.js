import { login, registrar, ApiError } from '../../src/services/authService';

const respuesta = (status, body) =>
	Promise.resolve({
		status,
		ok: status < 400,
		json: () => Promise.resolve(body)
	});

describe('authService', () => {
	beforeEach(() => {
		global.fetch = jest.fn();
	});

	it('login hace POST /api/login con nombreUsuario y contrasenia', async () => {
		global.fetch.mockReturnValue(
			respuesta(200, {
				accessToken: 'a',
				refreshToken: 'r',
				usuario: { id: '1' }
			})
		);
		const r = await login({ nombreUsuario: 'ana', contrasenia: 'x' });
		const [url, opts] = global.fetch.mock.calls[0];
		expect(url).toMatch(/\/api\/login$/);
		expect(opts.method).toBe('POST');
		expect(JSON.parse(opts.body)).toEqual({
			nombreUsuario: 'ana',
			contrasenia: 'x'
		});
		expect(r.accessToken).toBe('a');
	});

	it('login con 401 lanza ApiError con status y mensaje del backend', async () => {
		global.fetch.mockReturnValue(
			respuesta(401, { message: 'Credenciales inválidas.' })
		);
		await expect(
			login({ nombreUsuario: 'a', contrasenia: 'b' })
		).rejects.toMatchObject({
			status: 401,
			message: 'Credenciales inválidas.'
		});
		await expect(login({})).rejects.toBeInstanceOf(ApiError);
	});

	it('registrar hace POST /api/usuarios con el rol', async () => {
		global.fetch.mockReturnValue(respuesta(201, { id: '1' }));
		await registrar({
			nombre: 'Ana',
			apellido: 'Paz',
			nombreUsuario: 'ana',
			contrasenia: 'Abcdef1!',
			rol: 'COMPRADOR'
		});
		const [url, opts] = global.fetch.mock.calls[0];
		expect(url).toMatch(/\/api\/usuarios$/);
		expect(JSON.parse(opts.body).rol).toBe('COMPRADOR');
	});

	it('sin red lanza ApiError de conexión', async () => {
		global.fetch.mockRejectedValue(new TypeError('Network request failed'));
		await expect(login({})).rejects.toMatchObject({ status: 0 });
	});
});
