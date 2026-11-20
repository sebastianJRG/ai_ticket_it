import {
	API_URL,
	ApiError,
	cliente,
	configurarSesion
} from '../../src/services/api';
import { crearAdaptadorFalso } from '../helpers/adaptadorFalso';

let adaptador;

beforeEach(() => {
	adaptador = crearAdaptadorFalso();
	cliente.defaults.adapter = adaptador;
	configurarSesion(null);
});

/** Config final que recibió el adaptador en la llamada `i`. */
const enviada = (i = 0) => adaptador.mock.calls[i][0];

describe('cliente base', () => {
	it('usa API_URL como baseURL y 15 s de timeout', () => {
		expect(cliente.defaults.baseURL).toBe(API_URL);
		expect(cliente.defaults.timeout).toBe(15000);
	});

	it('envía JSON', async () => {
		adaptador.responder(200, {});
		await cliente.post('/api/x', { a: 1 });
		expect(enviada().headers['Content-Type']).toMatch(/application\/json/);
	});

	it('devuelve el cuerpo de la respuesta sin transformarlo', async () => {
		const cuerpo = { compras: [{ id: 'c1' }], disponibilidad: [] };
		adaptador.responder(200, cuerpo);
		const res = await cliente.get('/api/x');
		expect(res.data).toEqual(cuerpo);
	});
});

describe('ApiError', () => {
	it('tiene name, message y status', () => {
		const e = new ApiError('Cupo insuficiente.', 409);
		expect(e).toBeInstanceOf(Error);
		expect(e.name).toBe('ApiError');
		expect(e.message).toBe('Cupo insuficiente.');
		expect(e.status).toBe(409);
	});
});

describe('errores', () => {
	const MSG_CONEXION =
		'No pudimos conectar con el servidor. Revisá tu conexión.';
	const MSG_GENERICO = 'Ocurrió un error inesperado.';

	it('409 con mensaje del backend → ApiError 409 con ese mensaje', async () => {
		adaptador.responder(409, {
			message: 'Cupo insuficiente para el tipo de entrada.'
		});
		const error = await cliente.post('/api/compras', {}).catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({
			status: 409,
			message: 'Cupo insuficiente para el tipo de entrada.'
		});
	});

	it.each([400, 403, 404, 500])(
		'%i conserva status y mensaje del backend',
		async (status) => {
			adaptador.responder(status, { message: `falla ${status}` });
			const error = await cliente.get('/api/x').catch((e) => e);
			expect(error).toBeInstanceOf(ApiError);
			expect(error).toMatchObject({ status, message: `falla ${status}` });
		}
	);

	it('sin conexión → status 0 y mensaje de conexión', async () => {
		adaptador.fallarRed();
		const error = await cliente.get('/api/x').catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 0, message: MSG_CONEXION });
	});

	it('tiempo agotado → status 0 y mensaje de conexión', async () => {
		adaptador.agotarTiempo();
		const error = await cliente.get('/api/x').catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 0, message: MSG_CONEXION });
	});

	it.each([
		['sin cuerpo', undefined],
		['cuerpo vacío', ''],
		['message vacío', { message: '' }],
		['message no string', { message: { detalle: 'x' } }]
	])('%s → mensaje genérico con el status real', async (_caso, cuerpo) => {
		adaptador.responder(502, cuerpo);
		const error = await cliente.get('/api/x').catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 502, message: MSG_GENERICO });
	});
});

/** Header Authorization de una config enviada (o `undefined`). */
const autorizacion = (config) => config.headers?.Authorization;

/**
 * Proveedor de sesión de prueba. `guardarTokens` actualiza los tokens que
 * devuelve `obtenerTokens`, como haría AuthContext.
 */
function crearProveedor(tokens = { accessToken: 'a1', refreshToken: 'r1' }) {
	const p = {
		tokens,
		obtenerTokens: jest.fn(() => p.tokens),
		guardarTokens: jest.fn((nueva) => {
			p.tokens = {
				accessToken: nueva.accessToken,
				refreshToken: nueva.refreshToken
			};
		}),
		alExpirar: jest.fn()
	};
	return p;
}

describe('credencial', () => {
	it('adjunta Bearer con el accessToken del proveedor', async () => {
		configurarSesion(crearProveedor());
		adaptador.responder(200, []);
		await cliente.get('/api/compras');
		expect(autorizacion(enviada())).toBe('Bearer a1');
	});

	it('acepta un obtenerTokens asíncrono', async () => {
		const p = crearProveedor();
		p.obtenerTokens = jest.fn(async () => ({
			accessToken: 'async',
			refreshToken: 'r'
		}));
		configurarSesion(p);
		adaptador.responder(200, []);
		await cliente.get('/api/compras');
		expect(autorizacion(enviada())).toBe('Bearer async');
	});

	it('con sinSesion no adjunta credencial', async () => {
		configurarSesion(crearProveedor());
		adaptador.responder(200, {});
		await cliente.post('/api/login', {}, { sinSesion: true });
		expect(autorizacion(enviada())).toBeUndefined();
	});

	it('sin proveedor no adjunta credencial', async () => {
		adaptador.responder(200, []);
		await cliente.get('/api/eventos');
		expect(autorizacion(enviada())).toBeUndefined();
	});

	it('con proveedor sin sesión (null) no adjunta credencial', async () => {
		const p = crearProveedor();
		p.obtenerTokens = jest.fn(() => null);
		configurarSesion(p);
		adaptador.responder(200, []);
		await cliente.get('/api/eventos');
		expect(autorizacion(enviada())).toBeUndefined();
	});
});

describe('renovación', () => {
	const SESION_NUEVA = {
		accessToken: 'a2',
		refreshToken: 'r2',
		usuario: { id: 'u1', nombreUsuario: 'ana', rol: 'COMPRADOR' }
	};
	const MSG_401 = 'Token inválido o expirado.';

	/**
	 * Enruta: `/api/refresh` responde `refresh`; el resto da 401 con el token
	 * viejo (o sin token) y 200 con cualquier otro.
	 */
	function backend({ refresh = { status: 200, data: SESION_NUEVA } } = {}) {
		adaptador.responderCon((config) => {
			if (config.url === '/api/refresh') return refresh;
			const auth = autorizacion(config);
			if (!auth || auth === 'Bearer a1')
				return { status: 401, data: { message: MSG_401 } };
			return { status: 200, data: { ok: true, url: config.url } };
		});
	}
	const llamadasA = (url) =>
		adaptador.mock.calls.map(([c]) => c).filter((c) => c.url === url);

	it('401 → renueva una vez, guarda la sesión nueva y reintenta', async () => {
		const p = crearProveedor();
		configurarSesion(p);
		const orden = [];
		p.guardarTokens.mockImplementation((nueva) => {
			orden.push('guardar');
			p.tokens = nueva;
		});
		adaptador.responderCon((config) => {
			if (config.url === '/api/refresh')
				return { status: 200, data: SESION_NUEVA };
			orden.push(autorizacion(config));
			return autorizacion(config) === 'Bearer a1'
				? { status: 401, data: { message: MSG_401 } }
				: { status: 200, data: ['compra'] };
		});

		const res = await cliente.get('/api/compras');

		expect(res.data).toEqual(['compra']);
		const refrescos = llamadasA('/api/refresh');
		expect(refrescos).toHaveLength(1);
		expect(refrescos[0].method).toBe('post');
		expect(JSON.parse(refrescos[0].data)).toEqual({ refreshToken: 'r1' });
		expect(autorizacion(refrescos[0])).toBeUndefined();
		expect(p.guardarTokens).toHaveBeenCalledTimes(1);
		expect(p.guardarTokens).toHaveBeenCalledWith(SESION_NUEVA);
		expect(orden).toEqual(['Bearer a1', 'guardar', 'Bearer a2']);
		expect(p.alExpirar).not.toHaveBeenCalled();
	});

	it('3 peticiones concurrentes con 401 → 1 sola renovación', async () => {
		const p = crearProveedor();
		configurarSesion(p);
		backend();
		// La config se muta al reintentar: se registra el header en cada llamada.
		const enviados = [];
		const original = adaptador.getMockImplementation();
		adaptador.mockImplementation((config) => {
			enviados.push(autorizacion(config));
			return original(config);
		});

		const respuestas = await Promise.all([
			cliente.get('/api/compras'),
			cliente.get('/api/usuarios'),
			cliente.get('/api/compras/c1/mensajes')
		]);

		expect(respuestas.map((r) => r.data.ok)).toEqual([true, true, true]);
		expect(llamadasA('/api/refresh')).toHaveLength(1);
		expect(p.guardarTokens).toHaveBeenCalledTimes(1);
		expect(enviados.filter((a) => a === 'Bearer a1')).toHaveLength(3);
		expect(enviados.filter((a) => a === 'Bearer a2')).toHaveLength(3);
	});

	it('refresh rechazado → alExpirar una vez y la petición falla con 401', async () => {
		const p = crearProveedor();
		configurarSesion(p);
		backend({
			refresh: { status: 401, data: { message: 'Refresh inválido.' } }
		});

		const error = await cliente.get('/api/compras').catch((e) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 401, message: MSG_401 });
		expect(p.alExpirar).toHaveBeenCalledTimes(1);
		expect(p.guardarTokens).not.toHaveBeenCalled();
		expect(llamadasA('/api/refresh')).toHaveLength(1);
	});

	it('3 concurrentes con refresh fallido → alExpirar una vez y las 3 fallan con 401', async () => {
		const p = crearProveedor();
		configurarSesion(p);
		backend({ refresh: { status: 401, data: {} } });

		const resultados = await Promise.allSettled([
			cliente.get('/api/compras'),
			cliente.get('/api/usuarios'),
			cliente.get('/api/categorias')
		]);

		expect(resultados.map((r) => r.status)).toEqual([
			'rejected',
			'rejected',
			'rejected'
		]);
		resultados.forEach((r) => expect(r.reason.status).toBe(401));
		expect(p.alExpirar).toHaveBeenCalledTimes(1);
		expect(llamadasA('/api/refresh')).toHaveLength(1);
	});

	it('sin refreshToken → no llama a /api/refresh, avisa expiración y falla con 401', async () => {
		const p = crearProveedor({ accessToken: 'a1', refreshToken: null });
		configurarSesion(p);
		backend();

		const error = await cliente.get('/api/compras').catch((e) => e);

		expect(error.status).toBe(401);
		expect(llamadasA('/api/refresh')).toHaveLength(0);
		expect(p.alExpirar).toHaveBeenCalledTimes(1);
	});

	it('si el reintento vuelve a dar 401 no renueva otra vez', async () => {
		const p = crearProveedor();
		configurarSesion(p);
		adaptador.responderCon((config) =>
			config.url === '/api/refresh'
				? { status: 200, data: SESION_NUEVA }
				: { status: 401, data: { message: MSG_401 } }
		);

		const error = await cliente.get('/api/compras').catch((e) => e);

		expect(error).toMatchObject({ status: 401, message: MSG_401 });
		expect(llamadasA('/api/refresh')).toHaveLength(1);
		expect(llamadasA('/api/compras')).toHaveLength(2);
	});

	it('sin sesión (no salió credencial) un 401 no renueva', async () => {
		const p = crearProveedor();
		p.obtenerTokens = jest.fn(() => null);
		configurarSesion(p);
		backend();

		const error = await cliente.get('/api/compras').catch((e) => e);

		expect(error.status).toBe(401);
		expect(llamadasA('/api/refresh')).toHaveLength(0);
		expect(p.alExpirar).not.toHaveBeenCalled();
	});

	it('con sinSesion un 401 no renueva', async () => {
		const p = crearProveedor();
		configurarSesion(p);
		backend();

		const error = await cliente
			.post('/api/login', {}, { sinSesion: true })
			.catch((e) => e);

		expect(error.status).toBe(401);
		expect(llamadasA('/api/refresh')).toHaveLength(0);
		expect(p.alExpirar).not.toHaveBeenCalled();
	});

	it('403 no renueva', async () => {
		configurarSesion(crearProveedor());
		adaptador.responderCon((config) =>
			config.url === '/api/refresh'
				? { status: 200, data: SESION_NUEVA }
				: { status: 403, data: { message: 'Sin permiso.' } }
		);

		const error = await cliente.get('/api/eventos/e1/compras').catch((e) => e);

		expect(error).toMatchObject({ status: 403, message: 'Sin permiso.' });
		expect(llamadasA('/api/refresh')).toHaveLength(0);
	});

	it('tras una renovación fallida, un 401 posterior vuelve a intentar renovar', async () => {
		const p = crearProveedor();
		configurarSesion(p);
		let refreshOk = false;
		adaptador.responderCon((config) => {
			if (config.url === '/api/refresh')
				return refreshOk
					? { status: 200, data: SESION_NUEVA }
					: { status: 401, data: {} };
			return autorizacion(config) === 'Bearer a2'
				? { status: 200, data: { ok: true } }
				: { status: 401, data: { message: MSG_401 } };
		});

		await expect(cliente.get('/api/compras')).rejects.toMatchObject({
			status: 401
		});
		refreshOk = true;
		const res = await cliente.get('/api/compras');

		expect(res.data).toEqual({ ok: true });
		expect(llamadasA('/api/refresh')).toHaveLength(2);
	});
});
