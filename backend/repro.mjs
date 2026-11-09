import { createApp } from './src/app.js';
const app = createApp();
const server = app.listen(0);
await new Promise(r => server.once('listening', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
console.log('BASE', base);

async function call(method, path, body) {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  console.log(method, path, '->', res.status, text.slice(0, 200));
  return { status: res.status, body: JSON.parse(text) };
}

const u = await call('POST', '/api/usuarios', { nombre: 'Login', apellido: 'Prueba', nombreUsuario: 'login.prueba', contrasenia: 'Clave123!', rol: 'COMPRADOR' });
console.log('CREATED BODY', JSON.stringify(u.body));
const l = await call('POST', '/api/login', { nombreUsuario: 'login.prueba', contrasenia: 'Clave123!' });
console.log('LOGIN', JSON.stringify(l.body));
server.close();
